from pydantic import BaseModel, Field
from datetime import datetime
from typing import List, Optional, Any

class DocumentBase(BaseModel):
    filename: str
    path: str
    size_bytes: int
    mime_type: str
    category: str
    status: str = "pending" # pending, processing, completed, failed

class DocumentInDB(DocumentBase):
    id: str = Field(alias="_id")
    created_at: datetime
    updated_at: datetime
    text: str = ""
    language: Optional[str] = None
    segments: List[Any] = []
    duration_seconds: Optional[float] = None
    error: Optional[str] = None
    tables: Optional[List[Any]] = None
    rows: Optional[List[dict]] = None
    columns: Optional[List[str]] = None
    raw_ocr: Optional[bool] = None
    pages: Optional[int] = None
    entities: Optional[List[Any]] = None
    relations: Optional[List[Any]] = None

class JobStatus(BaseModel):
    job_id: str
    document_id: str
    status: str
    progress: Optional[int] = 0
    result: Optional[dict] = None
