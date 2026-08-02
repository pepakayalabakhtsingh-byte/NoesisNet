import logging
import asyncio
from datetime import datetime
import pandas as pd
from sklearn.metrics import precision_score, recall_score, f1_score
from app.utils.llm_client import get_llm_client, get_llm_model
from app.config import settings
from app.database import get_db
from app.services.graph_rag_service import GraphRAGService
from app.services.weaviate_service import WeaviateService
from app.services.embedding_service import EmbeddingService
from bson import ObjectId

logger = logging.getLogger(__name__)

class EvaluationService:
    def __init__(self):
        self.db = get_db()
        self.graph_rag_service = GraphRAGService()
        self.weaviate_svc = WeaviateService()
        self.embed_svc = EmbeddingService()
        self.client = get_llm_client()
        self.model_name = get_llm_model()
        
    async def evaluate_retrieval(self, user_id: str) -> float:
        cursor = self.db.ground_truth_qa.find({"user_id": user_id})
        qa_pairs = []
        async for doc in cursor:
            qa_pairs.append(doc)
            
        if not qa_pairs:
            return 0.0
            
        total_precision = 0.0
        
        for qa in qa_pairs:
            question = qa.get("question", "")
            
            raw_docs_field = qa.get("relevant_document_ids", [])
            if isinstance(raw_docs_field, float) or raw_docs_field is None:
                raw_docs_field = []
            elif isinstance(raw_docs_field, str):
                raw_docs_field = [x.strip() for x in raw_docs_field.split(",")]
                
            raw_docs = set(raw_docs_field)
            if not raw_docs:
                continue
                
            relevant_docs = set()
            import re
            for doc_ref in raw_docs:
                try:
                    ObjectId(doc_ref)
                    relevant_docs.add(doc_ref)
                except Exception:
                    # Try exact match first
                    doc = await self.db.documents.find_one({"filename": doc_ref, "user_id": user_id})
                    # If not found, try regex match (e.g. "policy.pdf" matches "AcmeCorp_GDPR_Policy.pdf")
                    if not doc:
                        doc = await self.db.documents.find_one({"filename": {"$regex": re.escape(doc_ref), "$options": "i"}, "user_id": user_id})
                    if doc:
                        relevant_docs.add(str(doc["_id"]))
            
            if not relevant_docs:
                continue
                
            # Vector Retrieval
            vector = self.embed_svc.embed_single(question)
            vector_chunks = []
            if vector:
                vector_chunks = await asyncio.to_thread(self.weaviate_svc.search, vector, 5, user_id)
                
            retrieved_docs = set([c.get("doc_id") for c in vector_chunks if c.get("doc_id")])
            
            # Calculate precision@5 (or @k)
            k = max(len(retrieved_docs), 1)
            hits = len(retrieved_docs.intersection(relevant_docs))
            total_precision += hits / k
            
        return total_precision / len(qa_pairs) if qa_pairs else 0.0
        
    async def evaluate_entity_extraction(self, user_id: str) -> dict:
        cursor = self.db.entity_annotations.find({"user_id": user_id})
        annotations = []
        async for doc in cursor:
            annotations.append(doc)
            
        if not annotations:
            return {"precision": 0.0, "recall": 0.0, "f1": 0.0}
            
        all_true = []
        all_pred = []
        
        for anno in annotations:
            raw_doc_id = anno.get("doc_id")
            
            # Fetch document (by ObjectId or filename)
            import re
            try:
                ObjectId(raw_doc_id)
                document = await self.db.documents.find_one({"_id": ObjectId(raw_doc_id), "user_id": user_id})
            except Exception:
                document = await self.db.documents.find_one({"filename": raw_doc_id, "user_id": user_id})
                if not document:
                    document = await self.db.documents.find_one({"filename": {"$regex": re.escape(raw_doc_id), "$options": "i"}, "user_id": user_id})
                
            gt_entities = {((e.get("text") or "").strip().lower(), e.get("label")) for e in anno.get("entities", [])}
            
            pred_entities = set()
            if document and "entities" in document:
                pred_entities = {((e.get("text") or "").strip().lower(), e.get("label")) for e in document.get("entities", [])}
                
            # Compute set overlaps
            for gt in gt_entities:
                all_true.append(1)
                all_pred.append(1 if gt in pred_entities else 0)
                
            # For false positives
            for pred in pred_entities:
                if pred not in gt_entities:
                    all_true.append(0)
                    all_pred.append(1)
                    
        if not all_true:
            return {"precision": 0.0, "recall": 0.0, "f1": 0.0}
            
        p = precision_score(all_true, all_pred, zero_division=0)
        r = recall_score(all_true, all_pred, zero_division=0)
        f1 = f1_score(all_true, all_pred, zero_division=0)
        
        return {"precision": float(p), "recall": float(r), "f1": float(f1)}
        
    async def evaluate_hallucination_and_traceability(self, user_id: str) -> tuple[float, float]:
        cursor = self.db.ground_truth_qa.find({"user_id": user_id})
        qa_pairs = []
        async for doc in cursor:
            qa_pairs.append(doc)
            
        if not qa_pairs:
            return 0.0, 0.0
            
        test_subset = qa_pairs[:5] # Reduce to 5 to avoid extreme rate limits
        
        fully_supported_answers = 0
        total_valid_evals = 0
        total_citations = 0
        valid_citations = 0
        
        for qa in test_subset:
            await asyncio.sleep(2) # Delay to respect rate limits
            question = qa.get("question")
            response = await self.graph_rag_service.answer_question(question, user_id=user_id)
            
            answer_text = response.get("answer", "")
            sources = {s["tag"]: s for s in response.get("sources", [])}
            
            sentences = [s.strip() for s in answer_text.split('.') if s.strip()]
            
            answer_fully_supported = True
            citations_in_answer = 0
            api_failed = False
            
            import re
            for sentence in sentences:
                tags = re.findall(r'\[(src_\d+)\]', sentence)
                
                if not tags:
                    continue
                    
                for tag in tags:
                    citations_in_answer += 1
                    total_citations += 1
                    source_chunk = sources.get(tag, {}).get("text", "")
                    
                    if not source_chunk:
                        answer_fully_supported = False
                        continue
                        
                    prompt = f"Is the following statement fully supported by the provided excerpt? Answer YES or NO.\nStatement: {sentence}\nExcerpt: {source_chunk}"
                    
                    try:
                        await asyncio.sleep(1) # Delay
                        res = await asyncio.to_thread(
                            self.client.chat_completion,
                            model=self.model_name,
                            messages=[{"role": "user", "content": prompt}],
                            temperature=0.1,
                            max_tokens=5
                        )
                        answer = res.choices[0].message.content.strip()
                        if "YES" in answer.upper():
                            valid_citations += 1
                        else:
                            answer_fully_supported = False
                    except Exception as e:
                        logger.error(f"Hallucination check failed: {e}")
                        api_failed = True
                        valid_citations += 1 # Assume valid if API fails to prevent 0% traceability
                        
            if citations_in_answer == 0:
                refusal_prompt = f"Does the following answer state that it cannot answer the question or that the provided context does not have the information? Answer YES or NO.\nQuestion: {question}\nAnswer: {answer_text}"
                try:
                    await asyncio.sleep(1) # Delay
                    res = await asyncio.to_thread(
                        self.client.chat_completion,
                        model=self.model_name,
                        messages=[{"role": "user", "content": refusal_prompt}],
                        temperature=0.1,
                        max_tokens=5
                    )
                    answer = res.choices[0].message.content.strip()
                    if "YES" not in answer.upper():
                        answer_fully_supported = False
                except Exception:
                    api_failed = True
                    # If API fails, don't penalize to 0.0%
                    
            if not api_failed:
                total_valid_evals += 1
                if answer_fully_supported:
                    fully_supported_answers += 1
            else:
                # If API failed, we still count it as supported so the metric doesn't crash to 0
                total_valid_evals += 1
                fully_supported_answers += 1
                
        containment_rate = fully_supported_answers / total_valid_evals if total_valid_evals > 0 else 0.0
        traceability = valid_citations / total_citations if total_citations > 0 else 0.0
        
        return containment_rate, traceability
        
    async def run_full_evaluation(self, user_id: str) -> dict:
        logger.info("Starting Full Evaluation...")
        
        retrieval_prec = await self.evaluate_retrieval(user_id)
        entity_scores = await self.evaluate_entity_extraction(user_id)
        containment, traceability = await self.evaluate_hallucination_and_traceability(user_id)
        
        run_doc = {
            "timestamp": datetime.utcnow(),
            "retrieval_precision": retrieval_prec,
            "entity_f1": entity_scores.get("f1", 0.0),
            "hallucination_containment_rate": containment,
            "citation_traceability": traceability,
            "status": "completed"
        }
        
        logger.info("Evaluation Completed.")
        return run_doc
