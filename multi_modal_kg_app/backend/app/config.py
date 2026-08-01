from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    mongodb_uri: str = "mongodb://localhost:27017"
    database_name: str = "compliance_kg"
    whisper_model_size: str = "base"
    whisper_task: str = "transcribe"
    whisper_language: str | None = None
    whisper_word_timestamps: bool = True
    
    neo4j_uri: str = "neo4j+s://15acea53.databases.neo4j.io"
    neo4j_user: str = "15acea53"
    neo4j_password: str = "7VDJ2kganZbkQg3JhD0bZNEDUtsT8vwh2bbTb0muouA"
    
    weaviate_url: str = "https://ilddvazhqni81ojomazaaw.c0.eu-central-1.aws.weaviate.cloud"
    weaviate_api_key: str = "M1crLzd1cjlLenNISmo4Tl83blA2ZkhEL2phMXkxOXZvVUpNcU5iWGNKUlU4d0xkVWVhM2tRRXFuL2pvPV92MjAw"
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

settings = Settings()
