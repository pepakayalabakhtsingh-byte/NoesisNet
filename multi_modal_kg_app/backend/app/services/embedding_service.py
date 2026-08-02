from huggingface_hub import InferenceClient
import logging
from app.config import settings
import numpy as np

logger = logging.getLogger(__name__)

class EmbeddingService:
    _instance = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(EmbeddingService, cls).__new__(cls)
            cls._instance.client = InferenceClient(api_key=settings.hf_api_key)
            cls._instance.model_id = "sentence-transformers/all-MiniLM-L6-v2"
        return cls._instance
        
    def __init__(self):
        pass
        
    def embed(self, texts: list[str]) -> list[list[float]]:
        if not texts:
            return []
        try:
            # Note: The HF inference API expects inputs as either a single string or a list of strings
            # and returns embeddings directly. 
            embeddings_obj = self.client.feature_extraction(
                text=texts,
                model=self.model_id
            )
            # HF API returns a numpy-like object or list of lists depending on input structure
            # Ensure it's a 2D list
            if isinstance(embeddings_obj, np.ndarray):
                return embeddings_obj.tolist()
            return embeddings_obj
        except Exception as e:
            logger.error(f"Failed to fetch embeddings from HF API: {e}")
            # Fallback to zeros if API fails, matching standard 384 dimensions for all-MiniLM-L6-v2
            return [[0.0] * 384 for _ in texts]
        
    def embed_single(self, text: str) -> list[float]:
        if not text:
            return []
        result = self.embed([text])
        return result[0] if result else []
