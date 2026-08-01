from sentence_transformers import SentenceTransformer
import logging

logger = logging.getLogger(__name__)

class EmbeddingService:
    _instance = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(EmbeddingService, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance
        
    def __init__(self):
        if self._initialized: return
        logger.info("Loading SentenceTransformer model all-MiniLM-L6-v2...")
        try:
            self.model = SentenceTransformer('all-MiniLM-L6-v2')
            self._initialized = True
            logger.info("Embedding model loaded.")
        except Exception as e:
            logger.error(f"Failed to load SentenceTransformer: {e}")
            self.model = None
        
    def embed(self, texts: list[str]) -> list[list[float]]:
        if not texts or not self.model:
            return []
        embeddings = self.model.encode(texts)
        return embeddings.tolist()
        
    def embed_single(self, text: str) -> list[float]:
        if not text or not self.model:
            return []
        return self.embed([text])[0]
