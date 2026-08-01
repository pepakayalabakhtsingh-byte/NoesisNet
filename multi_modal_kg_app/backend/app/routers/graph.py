from fastapi import APIRouter, BackgroundTasks, HTTPException, Query
from app.services.graph_service import GraphBuilder
import logging

router = APIRouter(prefix="/api/graph", tags=["Knowledge Graph"])
logger = logging.getLogger(__name__)

@router.post("/build")
async def build_full_graph(background_tasks: BackgroundTasks):
    try:
        builder = GraphBuilder()
        background_tasks.add_task(builder.build_all)
        return {"message": "Full graph build started in the background."}
    except Exception as e:
        logger.error(f"Failed to start build_all: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/build/{doc_id}")
async def build_document_graph(doc_id: str, background_tasks: BackgroundTasks):
    try:
        builder = GraphBuilder()
        background_tasks.add_task(builder.build_for_document, doc_id)
        return {"status": "building", "message": f"Graph build started for {doc_id}."}
    except Exception as e:
        logger.error(f"Failed to start build_for_document for {doc_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/graph-data")
async def get_graph_data(limit: int = Query(default=200, le=1000)):
    try:
        builder = GraphBuilder()
        data = await builder.get_graph_data(limit=limit)
        return data
    except Exception as e:
        logger.error(f"Failed to fetch graph data: {e}")
        raise HTTPException(status_code=500, detail=str(e))
