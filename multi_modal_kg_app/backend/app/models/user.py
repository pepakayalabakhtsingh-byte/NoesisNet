from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional

class UserInDB(BaseModel):
    id: str = Field(alias="_id", default="")
    email: str
    hashed_password: str
    full_name: str
    organization: Optional[str] = None
    created_at: datetime
    is_active: bool = True

class UserCreate(BaseModel):
    email: str
    password: str
    full_name: str
    organization: Optional[str] = None

class UserOut(BaseModel):
    id: str
    email: str
    full_name: str
    organization: Optional[str] = None
    created_at: datetime
    is_active: bool
