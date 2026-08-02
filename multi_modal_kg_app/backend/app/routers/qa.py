from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from app.dependencies import get_current_user
from app.services.graph_rag_service import GraphRAGService
import logging

router = APIRouter(prefix="/api/qa", tags=["Q&A"])
logger = logging.getLogger(__name__)

class QuestionRequest(BaseModel):
    question: str

@router.post("/ask")
async def ask_question(request: QuestionRequest, current_user: dict = Depends(get_current_user)):
    if not request.question or not request.question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty.")
        
    try:
        service = GraphRAGService()
        result = await service.answer_question(request.question, user_id=current_user["_id"])
        return result
    except Exception as e:
        logger.error(f"Error answering question: {e}")
        raise HTTPException(status_code=500, detail=str(e))
