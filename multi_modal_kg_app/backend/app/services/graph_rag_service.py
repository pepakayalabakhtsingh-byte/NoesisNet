import logging
import re
import asyncio
from app.config import settings
from app.utils.llm_client import get_llm_client, get_llm_model
from app.services.entity_service import EntityExtractor
from app.services.graph_service import GraphBuilder
from app.services.weaviate_service import WeaviateService

logger = logging.getLogger(__name__)

class GraphRAGService:
    def __init__(self):
        self.client = get_llm_client()
        self.model_name = get_llm_model()
        self.entity_extractor = EntityExtractor()
        
    def extract_question_entities(self, question: str) -> list[str]:
        nlp_result = self.entity_extractor.process(question)
        
        entities = set()
        for ent in nlp_result.get("entities", []):
            if ent.get("text"):
                entities.add(ent["text"].lower())
            
        doc = self.entity_extractor.nlp(question)
        for chunk in doc.noun_chunks:
            if len(chunk.text) > 2:
                entities.add(chunk.text.lower())
                
        return list(entities)
        
    async def retrieve_graph_context(self, entity_names: list[str], user_id: str, limit=20) -> list[dict]:
        return await asyncio.to_thread(self._retrieve_graph_context_sync, entity_names, user_id, limit)

    def _retrieve_graph_context_sync(self, entity_names: list[str], user_id: str, limit=20) -> list[dict]:
        builder = GraphBuilder()
        if not builder.driver:
            return []
            
        triples = []
        try:
            query = """
            MATCH (d:Document {user_id: $user_id})
            WITH collect(d.doc_id) AS user_doc_ids
            MATCH (e:Entity)-[r:RELATES_TO]-(other:Entity)
            WHERE (toLower(e.name) IN $names OR toLower(other.name) IN $names)
              AND r.doc_id IN user_doc_ids
            OPTIONAL MATCH (e)<-[:CONTAINS]-(doc:Document {user_id: $user_id})
            RETURN e.name AS subject, r.relation_type AS relation, other.name AS object, 
                   doc.doc_id AS doc_id, doc.filename AS document_name
            LIMIT $limit
            """
            with builder.driver.session() as session:
                result = session.run(query, names=entity_names, limit=limit, user_id=user_id)
                for rec in result:
                    triples.append({
                        "subject": rec["subject"],
                        "relation": rec["relation"],
                        "object": rec["object"],
                        "doc_id": rec["doc_id"],
                        "document_name": rec["document_name"]
                    })
        except Exception as e:
            logger.error(f"Graph retrieval failed: {e}")
            
        return triples

    def retrieve_vector_context(self, question: str, user_id: str, top_k=5) -> list[dict]:
        from app.services.embedding_service import EmbeddingService
        embed_svc = EmbeddingService()
        vector = embed_svc.embed_single(question)
        if not vector:
            return []
            
        weaviate_svc = WeaviateService()
        return weaviate_svc.search(vector, top_k=top_k, user_id=user_id)
        
    async def answer_question(self, question: str, user_id: str) -> dict:
        entity_names = self.extract_question_entities(question)
        
        graph_triples = await self.retrieve_graph_context(entity_names, user_id)
        vector_chunks = await asyncio.to_thread(self.retrieve_vector_context, question, user_id, 7)
        
        assembled_context = ""
        
        if graph_triples:
            assembled_context += "=== Knowledge Graph Context ===\n"
            for t in graph_triples:
                doc_info = f" (source doc_id: {t['doc_id']})" if t['doc_id'] else ""
                assembled_context += f"[{t['subject']}] -> {t['relation']} -> [{t['object']}]{doc_info}\n"
            assembled_context += "\n"
            
        sources_map = {}
        if vector_chunks:
            assembled_context += "=== Document Excerpts ===\n"
            for i, chunk in enumerate(vector_chunks):
                tag = f"src_{i}"
                sources_map[tag] = {
                    "tag": tag,
                    "doc_id": chunk.get("doc_id"),
                    "document_name": chunk.get("document_name"),
                    "chunk_index": chunk.get("chunk_index"),
                    "text": chunk.get("text")
                }
                assembled_context += f"[{tag}] [Source: {chunk.get('document_name')}, Chunk {chunk.get('chunk_index')}]:\n{chunk.get('text')}\n\n"
                
        system_instruction = """
        You are an elite enterprise compliance knowledge assistant. 
        Answer the user's question using ONLY the provided context.
        - If the context does not contain enough information to fully answer the question, say "I cannot answer based on the available documents."
        - For EVERY factual statement or claim you make, you MUST cite the source tags in square brackets inline (e.g., [src_0], [src_1]).
        - Do not use any outside knowledge.
        - Format your response using markdown.
        """
        
        prompt = f"Context:\n{assembled_context}\n\nUser Question: {question}\nAnswer:"
        
        answer_text = ""
        try:
            response = await asyncio.to_thread(
                self.client.chat_completion,
                model=self.model_name,
                messages=[
                    {"role": "system", "content": system_instruction},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.1,
                max_tokens=1024
            )
            answer_text = response.choices[0].message.content
        except Exception as e:
            error_str = str(e)
            logger.error(f"HuggingFace generation failed: {e}")
            if "429" in error_str or "quota" in error_str.lower():
                answer_text = "⚠️ The AI assistant is temporarily unavailable due to rate limits. Please wait a moment and try again."
            elif "401" in error_str or "invalid" in error_str.lower():
                answer_text = f"⚠️ AI model configuration error. Please check your API key."
            else:
                answer_text = f"⚠️ An error occurred while generating the answer. Please try again."
            logger.error(f"HuggingFace error detail: {error_str[:200]}")
            
        cited_tags = set(re.findall(r'\[(src_\d+)\]', answer_text))
        final_sources = [sources_map[tag] for tag in cited_tags if tag in sources_map]
        
        # If no citations were explicitly made but chunks were passed, we can gracefully provide none
        
        return {
            "question": question,
            "answer": answer_text,
            "sources": final_sources,
            "graph_entities_found": len(graph_triples),
            "vector_chunks_found": len(vector_chunks)
        }
