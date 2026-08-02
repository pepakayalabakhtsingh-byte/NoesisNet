from fastapi import APIRouter, BackgroundTasks, HTTPException, Query, Depends
from app.dependencies import get_current_user
from app.database import get_db
from app.services.embedding_service import EmbeddingService
from app.services.weaviate_service import WeaviateService
from app.utils.text_chunker import chunk_text
import logging
import asyncio

router = APIRouter(prefix="/api/search", tags=["Semantic Search"])
logger = logging.getLogger(__name__)

@router.get("")
async def search_documents(q: str, top_k: int = Query(default=5, le=50), current_user: dict = Depends(get_current_user)):
    if not q.strip():
        return []
    
    try:
        def _do_search():
            embed_svc = EmbeddingService()
            weaviate_svc = WeaviateService()
            
            vector = embed_svc.embed_single(q)
            if not vector: return []
            
            return weaviate_svc.search(vector, top_k, user_id=current_user["_id"])
            
        results = await asyncio.to_thread(_do_search)
        return results
    except Exception as e:
        logger.error(f"Search error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/embeddings/rebuild-all")
async def rebuild_all_embeddings(background_tasks: BackgroundTasks, current_user: dict = Depends(get_current_user)):
    user_id = current_user["_id"]
    async def _rebuild():
        db = get_db()
        cursor = db.documents.find({"status": "completed", "user_id": user_id})
        docs = []
        async for doc in cursor:
            docs.append(doc)
            
        def _embed_doc(doc):
            doc_id = str(doc["_id"])
            text = doc.get("text")
            if not text and doc.get("category") == "table" and doc.get("rows"):
                text = " ".join([str(val) for row in doc["rows"] for val in row.values() if val])
            if not text: return
            chunks = chunk_text(text)
            if chunks:
                embed_svc = EmbeddingService()
                weaviate_svc = WeaviateService()
                weaviate_svc.delete_document_chunks(doc_id)
                vectors = embed_svc.embed(chunks)
                weaviate_svc.add_chunks(doc_id, doc.get("filename", "Unknown"), doc.get("category", "unknown"), chunks, vectors, user_id=user_id)
                
        for doc in docs:
            try:
                await asyncio.to_thread(_embed_doc, doc)
            except Exception as e:
                logger.error(f"Failed to embed doc {doc.get('_id')}: {e}")

    background_tasks.add_task(_rebuild)
    return {"message": "Embedding rebuild started in the background."}
