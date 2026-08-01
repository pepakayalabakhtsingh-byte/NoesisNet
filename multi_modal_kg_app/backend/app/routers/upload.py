from fastapi import APIRouter, UploadFile, File, BackgroundTasks, HTTPException, Query
from datetime import datetime
from bson import ObjectId
import logging
import uuid

from app.database import get_db
from app.services.file_handler import FileHandler
from app.services.audio_service import AudioTranscriber

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
            # Run the heavy transcription synchronously in the threadpool if needed,
            # but background task runs it asynchronously in the fastapi threadpool.
            result = AudioTranscriber.process(file_path)
        else:
            # Dummy processing for other types
            result = {
                "text": "",
                "language": None,
                "segments": [],
                "duration_seconds": None,
                "error": None
            }
            
        # If there's an error in transcription, mark as failed, else completed
        status = "failed" if result.get("error") else "completed"
        
        await db.documents.update_one(
            {"_id": ObjectId(doc_id)},
            {
                "$set": {
                    "status": status,
                    "text": result.get("text", ""),
                    "language": result.get("language"),
                    "segments": result.get("segments", []),
                    "duration_seconds": result.get("duration_seconds"),
                    "error": result.get("error"),
                    "updated_at": datetime.utcnow()
                }
            }
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
