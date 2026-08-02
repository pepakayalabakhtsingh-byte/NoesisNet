import os
os.environ.pop("NEO4J_URI", None)
os.environ.pop("NEO4J_USER", None)
os.environ.pop("NEO4J_PASSWORD", None)

from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    mongodb_uri: str = "mongodb://localhost:27017"
    database_name: str = "compliance_kg"
    frontend_url: str = "http://localhost:5173"
    whisper_model_size: str = "base"
    whisper_task: str = "transcribe"
    whisper_language: str | None = None
    whisper_word_timestamps: bool = True
    
    neo4j_uri: str = "neo4j+s://15acea53.databases.neo4j.io"
    neo4j_user: str = "15acea53"
    neo4j_password: str = "7VDJ2kganZbkQg3JhD0bZNEDUtsT8vwh2bbTb0muouA"
    
    weaviate_url: str = "https://ilddvazhqni81ojomazaaw.c0.eu-central-1.aws.weaviate.cloud"
    weaviate_api_key: str = "M1crLzd1cjlLenNISmo4Tl83blA2ZkhEL2phMXkxOXZvVUpNcU5iWGNKUlU4d0xkVWVhM2tRRXFuL2pvPV92MjAw"
    hf_api_key: str
    hf_model_name: str = "Qwen/Qwen2.5-72B-Instruct"
    
    jwt_secret: str = "f3a9c6d4e8b1a2f7c9d0e3f5a7b8c9d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7"
    jwt_algorithm: str = "HS256"
    jwt_expiration_hours: int = 24
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

settings = Settings()
