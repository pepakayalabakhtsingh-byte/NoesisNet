from fastapi import APIRouter, UploadFile, File, BackgroundTasks, HTTPException, Query
from datetime import datetime
from bson import ObjectId
import logging
import uuid

from app.database import get_db
from app.services.file_handler import FileHandler
from app.services.audio_service import AudioTranscriber
from app.services.pdf_service import PDFExtractor
from app.services.schematic_service import SchematicExtractor
from app.services.table_service import TableExtractor
from app.services.entity_service import EntityExtractor

router = APIRouter()
logger = logging.getLogger(__name__)

async def process_document_background(doc_id: str, file_path: str, category: str):
    db = get_db()
    try:
        # Update status to processing
        await db.documents.update_one(
            {"_id": ObjectId(doc_id)},
            {"$set": {"status": "processing", "updated_at": datetime.utcnow()}}
        )
        
        result = {}
        if category == "audio":
            result = AudioTranscriber.process(file_path)
        elif category == "pdf":
            result = PDFExtractor.process(file_path)
        elif category == "schematic":
            result = SchematicExtractor.process(file_path)
        elif category == "table":
            result = TableExtractor.process(file_path)
        else:
            result = {
                "text": "",
                "error": "Unsupported category or no processing required yet."
            }
            
        status = "failed" if result.get("error") else "completed"
        
        update_payload = {
            "status": status,
            "updated_at": datetime.utcnow()
        }
        
        # Merge all result fields dynamically
        for key, value in result.items():
            update_payload[key] = value
            
        # Extract Entities if there is text
        text_to_process = ""
        if "text" in result and result["text"]:
            text_to_process = result["text"]
        elif category == "table" and "rows" in result and result["rows"]:
            text_to_process = " ".join([str(val) for row in result["rows"] for val in row.values() if val])
            
        if text_to_process:
            try:
                extractor = EntityExtractor()
                nlp_result = extractor.process(text_to_process)
                update_payload["entities"] = nlp_result.get("entities", [])
                update_payload["relations"] = nlp_result.get("relations", [])
            except Exception as e:
                logger.error(f"Entity extraction failed for {doc_id}: {e}")
                
        await db.documents.update_one(
            {"_id": ObjectId(doc_id)},
            {"$set": update_payload}
        )
        logger.info(f"Document {doc_id} processed with status {status}")

    except Exception as e:
        logger.error(f"Background processing error for {doc_id}: {e}")
        await db.documents.update_one(
            {"_id": ObjectId(doc_id)},
            {"$set": {"status": "failed", "error": str(e), "updated_at": datetime.utcnow()}}
        )


@router.post("/upload")
async def upload_document(background_tasks: BackgroundTasks, file: UploadFile = File(...)):
    try:
        # Save file
        file_path = FileHandler.save_file(file)
        
        # Get metadata
        metadata = FileHandler.get_metadata(file_path, file.filename)
        
        # Create document in DB
        db = get_db()
        doc = {
            **metadata,
            "status": "pending",
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
            "text": "",
            "language": None,
            "segments": [],
            "duration_seconds": None,
            "error": None
        }
        
        insert_result = await db.documents.insert_one(doc)
        doc_id = str(insert_result.inserted_id)
        
        # Dispatch background task
        background_tasks.add_task(process_document_background, doc_id, file_path, metadata["category"])
        
        return {"id": doc_id, "status": "pending"}
        
    except Exception as e:
        logger.error(f"Upload failed: {e}")
        raise HTTPException(status_code=500, detail="File upload failed")


@router.get("/documents")
async def get_documents(skip: int = 0, limit: int = Query(default=100, le=100)):
    db = get_db()
    cursor = db.documents.find().sort("created_at", -1).skip(skip).limit(limit)
    docs = []
    async for document in cursor:
        document["_id"] = str(document["_id"])
        docs.append(document)
    return docs

@router.get("/documents/{doc_id}")
async def get_document(doc_id: str):
    db = get_db()
    if not ObjectId.is_valid(doc_id):
        raise HTTPException(status_code=400, detail="Invalid Document ID")
        
    document = await db.documents.find_one({"_id": ObjectId(doc_id)})
    if document:
        document["_id"] = str(document["_id"])
        return document
    raise HTTPException(status_code=404, detail="Document not found")

@router.post("/documents/{doc_id}/extract-entities")
async def extract_entities_manual(doc_id: str):
    db = get_db()
    if not ObjectId.is_valid(doc_id):
        raise HTTPException(status_code=400, detail="Invalid Document ID")
        
    doc = await db.documents.find_one({"_id": ObjectId(doc_id)})
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
        
    text_to_process = ""
    if doc.get("text"):
        text_to_process = doc["text"]
    elif doc.get("category") == "table" and doc.get("rows"):
        text_to_process = " ".join([str(val) for row in doc["rows"] for val in row.values() if val])
        
    if not text_to_process:
        raise HTTPException(status_code=400, detail="No textual content found in document to extract entities.")
        
    try:
        extractor = EntityExtractor()
        nlp_result = extractor.process(text_to_process)
        
        await db.documents.update_one(
            {"_id": ObjectId(doc_id)}, 
            {"$set": {
                "entities": nlp_result.get("entities", []),
                "relations": nlp_result.get("relations", [])
            }}
        )
        
        updated_doc = await db.documents.find_one({"_id": ObjectId(doc_id)})
        updated_doc["_id"] = str(updated_doc["_id"])
        return updated_doc
    except Exception as e:
        logger.error(f"Manual entity extraction failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))
