from huggingface_hub import InferenceClient
from app.config import settings

def get_llm_client():
    return InferenceClient(api_key=settings.hf_api_key)

def get_llm_model():
    return settings.hf_model_name
