from fastapi import APIRouter, UploadFile, File, BackgroundTasks, HTTPException, Depends
from app.dependencies import get_current_user
from app.services.evaluation_service import EvaluationService
from app.database import get_db
import pandas as pd
import json
import logging
from bson import ObjectId

router = APIRouter(prefix="/api/evaluation", tags=["Evaluation"])
logger = logging.getLogger(__name__)

@router.post("/upload-qa")
async def upload_qa_ground_truth(file: UploadFile = File(...), current_user: dict = Depends(get_current_user)):
    db = get_db()
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Must be a CSV file")
        
    try:
        df = pd.read_csv(file.file)
        records = df.to_dict(orient="records")
        # Ensure relevant_document_ids is a list and handle NaN
        for r in records:
            docs = r.get("relevant_document_ids")
            if docs is None or (isinstance(docs, float) and pd.isna(docs)):
                r["relevant_document_ids"] = []
            elif isinstance(docs, str):
                r["relevant_document_ids"] = [x.strip() for x in docs.split(",")]
            elif not isinstance(docs, list):
                r["relevant_document_ids"] = [str(docs)]
                
            r["user_id"] = current_user["_id"]
                
        await db.ground_truth_qa.delete_many({"user_id": current_user["_id"]})  # Clear old
        if records:
            await db.ground_truth_qa.insert_many(records)
        return {"message": f"Uploaded {len(records)} Q&A pairs."}
    except Exception as e:
        import traceback
        error_msg = traceback.format_exc()
        logger.error(f"Failed to upload QA: {e}\n{error_msg}")
        with open("upload_error.txt", "a") as f:
            f.write(f"QA Upload Error: {e}\n{error_msg}\n")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/upload-entities")
async def upload_entities_ground_truth(file: UploadFile = File(...), current_user: dict = Depends(get_current_user)):
    db = get_db()
    try:
        content = await file.read()
        data = json.loads(content)
        # Expected array of objects: {doc_id: "...", entities: [...]}
        if not isinstance(data, list):
            data = [data]
        for d in data:
            d["user_id"] = current_user["_id"]
            
        await db.entity_annotations.delete_many({"user_id": current_user["_id"]})
        await db.entity_annotations.insert_many(data)
        return {"message": f"Uploaded annotations for {len(data)} documents."}
    except Exception as e:
        import traceback
        error_msg = traceback.format_exc()
        logger.error(f"Failed to upload entities: {e}\n{error_msg}")
        with open("upload_error.txt", "a") as f:
            f.write(f"Entity Upload Error: {e}\n{error_msg}\n")
        raise HTTPException(status_code=500, detail=str(e))
        
@router.get("/ground-truth")
async def get_ground_truth_stats(current_user: dict = Depends(get_current_user)):
    db = get_db()
    qa_count = await db.ground_truth_qa.count_documents({"user_id": current_user["_id"]})
    entity_count = await db.entity_annotations.count_documents({"user_id": current_user["_id"]})
    return {"qa_pairs": qa_count, "annotated_documents": entity_count}
    
@router.post("/run")
async def run_evaluation(background_tasks: BackgroundTasks, current_user: dict = Depends(get_current_user)):
    db = get_db()
    run_doc = {
        "timestamp": None,
        "retrieval_precision": 0.0,
        "entity_f1": 0.0,
        "hallucination_containment_rate": 0.0,
        "citation_traceability": 0.0,
        "status": "running",
        "user_id": current_user["_id"]
    }
    result = await db.evaluation_runs.insert_one(run_doc)
    run_id = str(result.inserted_id)
    
    async def task_runner(run_id_str, user_id):
        try:
            svc = EvaluationService()
            run_result = await svc.run_full_evaluation(user_id=user_id)
            run_result.pop("_id", None)
            await db.evaluation_runs.update_one({"_id": ObjectId(run_id_str)}, {"$set": run_result})
        except Exception as e:
            import traceback
            error_msg = traceback.format_exc()
            logger.error(f"Eval run failed: {e}\n{error_msg}")
            await db.evaluation_runs.update_one({"_id": ObjectId(run_id_str)}, {"$set": {"status": "failed", "error": error_msg}})
            
    background_tasks.add_task(task_runner, run_id, current_user["_id"])
    return {"message": "Evaluation started in background", "run_id": run_id}

@router.get("/runs")
async def get_evaluation_runs(current_user: dict = Depends(get_current_user)):
    db = get_db()
    cursor = db.evaluation_runs.find({"user_id": current_user["_id"]}).sort("timestamp", -1)
    runs = []
    async for doc in cursor:
        doc["_id"] = str(doc["_id"])
        runs.append(doc)
    return runs
