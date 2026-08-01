import weaviate
from weaviate.auth import AuthApiKey
import logging
from app.config import settings

logger = logging.getLogger(__name__)

class WeaviateService:
    _instance = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(WeaviateService, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance
        
    def __init__(self):
        if self._initialized: return
        
        url = settings.weaviate_url
        api_key = settings.weaviate_api_key
        
        auth_config = AuthApiKey(api_key=api_key) if api_key else None
        
        try:
            self.client = weaviate.Client(
                url=url,
                auth_client_secret=auth_config
            )
            self._initialized = True
            self.create_schema()
        except Exception as e:
            logger.error(f"Failed to connect to Weaviate at {url}: {e}")
            self.client = None
            
    def create_schema(self):
        if not self.client: return
        try:
            class_obj = {
                "class": "DocumentChunk",
                "description": "A chunk of text from a compliance document",
                "vectorizer": "none", 
                "properties": [
                    {
                        "name": "doc_id",
                        "dataType": ["string"],
                        "description": "MongoDB document ID"
                    },
                    {
                        "name": "text",
                        "dataType": ["text"],
                        "description": "The chunk content"
                    },
                    {
                        "name": "document_name",
                        "dataType": ["string"],
                        "description": "Source filename"
                    },
                    {
                        "name": "chunk_index",
                        "dataType": ["int"],
                        "description": "Index of the chunk in the document"
                    },
                    {
                        "name": "category",
                        "dataType": ["string"],
                        "description": "Document category type"
                    }
                ]
            }
            if not self.client.schema.exists("DocumentChunk"):
                self.client.schema.create_class(class_obj)
                logger.info("Weaviate DocumentChunk schema created.")
        except Exception as e:
            logger.error(f"Failed to create schema: {e}")

    def add_chunks(self, doc_id: str, document_name: str, category: str, chunks: list[str], vectors: list[list[float]]):
        if not self.client or not chunks or not vectors: return
        
        try:
            with self.client.batch(batch_size=100) as batch:
                for i, (chunk, vector) in enumerate(zip(chunks, vectors)):
                    properties = {
                        "doc_id": doc_id,
                        "text": chunk,
                        "document_name": document_name,
                        "chunk_index": i,
                        "category": category
                    }
                    batch.add_data_object(
                        data_object=properties,
                        class_name="DocumentChunk",
                        vector=vector
                    )
            logger.info(f"Added {len(chunks)} chunks to Weaviate for document {doc_id}")
        except Exception as e:
            logger.error(f"Failed to add chunks to Weaviate: {e}")

    def delete_document_chunks(self, doc_id: str):
        if not self.client: return
        try:
            where_filter = {
                "path": ["doc_id"],
                "operator": "Equal",
                "valueString": doc_id
            }
            self.client.batch.delete_objects(
                class_name="DocumentChunk",
                where=where_filter
            )
            logger.info(f"Deleted existing chunks for document {doc_id}")
        except Exception as e:
            logger.warning(f"Could not delete chunks for {doc_id}: {e}")

    def search(self, query_vector: list[float], top_k: int = 5) -> list[dict]:
        if not self.client: return []
        try:
            result = (
                self.client.query
                .get("DocumentChunk", ["doc_id", "text", "document_name", "chunk_index", "category"])
                .with_near_vector({"vector": query_vector})
                .with_additional(["distance"])
                .with_limit(top_k)
                .do()
            )
            
            if "data" in result and "Get" in result["data"] and "DocumentChunk" in result["data"]["Get"]:
                chunks = result["data"]["Get"]["DocumentChunk"]
                output = []
                for c in chunks:
                    output.append({
                        "doc_id": c["doc_id"],
                        "text": c["text"],
                        "document_name": c["document_name"],
                        "chunk_index": c["chunk_index"],
                        "category": c["category"],
                        "score": 1 - c["_additional"]["distance"] 
                    })
                return output
            return []
        except Exception as e:
            logger.error(f"Weaviate search failed: {e}")
            return []
