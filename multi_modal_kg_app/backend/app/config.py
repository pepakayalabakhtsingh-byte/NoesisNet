from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    mongodb_uri: str = "mongodb://localhost:27017"
    database_name: str = "compliance_kg"
    whisper_model_size: str = "base"
    whisper_task: str = "transcribe"
    whisper_language: str | None = None
    whisper_word_timestamps: bool = True
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

settings = Settings()
