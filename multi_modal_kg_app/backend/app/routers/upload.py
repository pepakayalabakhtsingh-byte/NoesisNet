from fastapi import APIRouter, UploadFile, File, BackgroundTasks, HTTPException, Query, Depends
from datetime import datetime
from bson import ObjectId
import logging
import uuid
import asyncio

from app.database import get_db, get_gridfs_bucket
from app.services.audio_service import AudioTranscriber
from app.services.pdf_service import PDFExtractor
from app.services.schematic_service import SchematicExtractor
from app.dependencies import get_current_user
from app.services.table_service import TableExtractor
from app.services.entity_service import EntityExtractor
from app.services.graph_service import GraphBuilder
from app.services.embedding_service import EmbeddingService
from app.services.weaviate_service import WeaviateService
from app.utils.text_chunker import chunk_text

router = APIRouter()
logger = logging.getLogger(__name__)

async def process_document_background(doc_id: str, gridfs_file_id: str, original_filename: str, user_id: str):
    db = get_db()
    try:
        # Update status to processing
        await db.documents.update_one(
            {"_id": ObjectId(doc_id)},
            {"$set": {"status": "processing", "updated_at": datetime.utcnow()}}
        )
        
        from app.utils.file_storage import download_to_temp, delete_temp
        from app.services.file_handler import FileHandler
        
        temp_path = await download_to_temp(gridfs_file_id)
        
        try:
            # Get metadata
            metadata = FileHandler.get_metadata(str(temp_path), original_filename)
            category = metadata["category"]
            
            # Update doc with new metadata
            await db.documents.update_one(
                {"_id": ObjectId(doc_id)},
                {"$set": {
                    "size_bytes": metadata["size_bytes"],
                    "mime_type": metadata["mime_type"],
                    "category": category,
                    "updated_at": datetime.utcnow()
                }}
            )
            
            result = {}
            if category == "audio":
                result = AudioTranscriber.process(str(temp_path))
            elif category == "pdf":
                result = PDFExtractor.process(str(temp_path))
            elif category == "schematic":
                result = SchematicExtractor.process(str(temp_path))
            elif category == "table":
                result = TableExtractor.process(str(temp_path))
            else:
                result = {
                    "text": "",
                    "error": "Unsupported category or no processing required yet."
                }
                
            status = "failed" if result.get("error") else "completed"
        finally:
            await delete_temp(temp_path)
        
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

        if status == "completed":
            try:
                builder = GraphBuilder()
                await builder.build_for_document(doc_id, user_id)
                logger.info(f"Graph auto-built for {doc_id}")
            except Exception as e:
                logger.error(f"Auto graph build failed for {doc_id}: {e}")
                
            try:
                if text_to_process:
                    doc_meta = await db.documents.find_one({"_id": ObjectId(doc_id)})
                    filename = doc_meta.get("filename", "Unknown") if doc_meta else "Document"
                    
                    def _embed_and_store():
                        chunks = chunk_text(text_to_process)
                        if chunks:
                            embed_svc = EmbeddingService()
                            weaviate_svc = WeaviateService()
                            weaviate_svc.delete_document_chunks(doc_id)
                            vectors = embed_svc.embed(chunks)
                            weaviate_svc.add_chunks(doc_id, filename, category, chunks, vectors, user_id=user_id)
                            
                    await asyncio.to_thread(_embed_and_store)
                    logger.info(f"Chunks embedded for {doc_id}")
            except Exception as e:
                logger.error(f"Embedding failed for {doc_id}: {e}")

    except Exception as e:
        logger.error(f"Background processing error for {doc_id}: {e}")
        await db.documents.update_one(
            {"_id": ObjectId(doc_id)},
            {"$set": {"status": "failed", "error": str(e), "updated_at": datetime.utcnow()}}
        )


@router.post("/api/upload")
async def upload_document(
    background_tasks: BackgroundTasks, 
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    try:
        fs = get_gridfs_bucket()
        grid_in = fs.open_upload_stream(file.filename, metadata={"content_type": file.content_type})
        while True:
            chunk = await file.read(1024 * 1024)
            if not chunk:
                break
            await grid_in.write(chunk)
        await grid_in.close()
        gridfs_file_id = str(grid_in._id)
        
        # Create document in DB with minimal metadata, actual metadata will be populated by background task
        db = get_db()
        doc = {
            "filename": file.filename,
            "path": "", # Not used with GridFS
            "gridfs_file_id": gridfs_file_id,
            "size_bytes": 0,
            "mime_type": file.content_type or "application/octet-stream",
            "category": "unknown",
            "user_id": current_user["_id"],
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
        background_tasks.add_task(process_document_background, doc_id, gridfs_file_id, file.filename, current_user["_id"])
        
        return {"id": doc_id, "status": "pending"}
        
    except Exception as e:
        logger.error(f"Upload failed: {e}")
        raise HTTPException(status_code=500, detail="File upload failed")


@router.get("/api/documents")
async def list_documents(
    skip: int = 0, 
    limit: int = Query(default=100, le=100),
    current_user: dict = Depends(get_current_user)
):
    db = get_db()
    cursor = db.documents.find({"user_id": current_user["_id"]}).sort("created_at", -1).skip(skip).limit(limit)
    docs = []
    async for document in cursor:
        document["_id"] = str(document["_id"])
        docs.append(document)
    return docs

@router.get("/api/documents/{doc_id}")
async def get_document(doc_id: str, current_user: dict = Depends(get_current_user)):
    db = get_db()
    if not ObjectId.is_valid(doc_id):
        raise HTTPException(status_code=400, detail="Invalid Document ID")
        
    document = await db.documents.find_one({"_id": ObjectId(doc_id), "user_id": current_user["_id"]})
    if document:
        document["_id"] = str(document["_id"])
        return document
    raise HTTPException(status_code=404, detail="Document not found")

@router.post("/api/documents/{doc_id}/reprocess")
async def reprocess_document(doc_id: str, background_tasks: BackgroundTasks, current_user: dict = Depends(get_current_user)):
    """Re-trigger processing for a failed or stuck document."""
    db = get_db()
    if not ObjectId.is_valid(doc_id):
        raise HTTPException(status_code=400, detail="Invalid Document ID")
        
    document = await db.documents.find_one({"_id": ObjectId(doc_id), "user_id": current_user["_id"]})
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    gridfs_file_id = document.get("gridfs_file_id")
    if not gridfs_file_id:
        raise HTTPException(status_code=400, detail="No GridFS file associated with this document. Please re-upload.")
    
    # Reset status to pending
    await db.documents.update_one(
        {"_id": ObjectId(doc_id)},
        {"$set": {"status": "pending", "error": None, "updated_at": datetime.utcnow()}}
    )
    
    # Re-dispatch background task
    background_tasks.add_task(
        process_document_background,
        doc_id,
        gridfs_file_id,
        document.get("filename", "unknown"),
        current_user["_id"]
    )
    
    return {"id": doc_id, "status": "pending", "message": "Document reprocessing started."}

@router.post("/api/documents/{doc_id}/extract-entities")
async def extract_entities_manual(doc_id: str, current_user: dict = Depends(get_current_user)):
    db = get_db()
    if not ObjectId.is_valid(doc_id):
        raise HTTPException(status_code=400, detail="Invalid Document ID")
        
    doc = await db.documents.find_one({"_id": ObjectId(doc_id), "user_id": current_user["_id"]})
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
        
        try:
            builder = GraphBuilder()
            await builder.build_for_document(doc_id)
        except Exception as e:
            logger.error(f"Manual graph build failed for {doc_id}: {e}")
            
        updated_doc = await db.documents.find_one({"_id": ObjectId(doc_id)})
        updated_doc["_id"] = str(updated_doc["_id"])
        return updated_doc
    except Exception as e:
        logger.error(f"Manual entity extraction failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))
