from passlib.context import CryptContext
from jose import jwt, JWTError
from datetime import datetime, timedelta
from app.config import settings
from app.database import get_db
from app.models.user import UserInDB, UserCreate
from typing import Optional

pwd_context = CryptContext(schemes=["pbkdf2_sha256", "bcrypt"], deprecated="auto")

class AuthService:
    def __init__(self):
        pass

    @property
    def db(self):
        return get_db()
        
    def verify_password(self, plain_password: str, hashed_password: str) -> bool:
        try:
            return pwd_context.verify(plain_password, hashed_password)
        except Exception:
            return False
        
    def get_password_hash(self, password: str) -> str:
        return pwd_context.hash(password)
        
    async def get_user_by_email(self, email: str) -> Optional[dict]:
        user_doc = await self.db.users.find_one({"email": email})
        if user_doc:
            user_doc["_id"] = str(user_doc["_id"])
        return user_doc
        
    async def create_user(self, user_in: UserCreate) -> dict:
        user_doc = {
            "email": user_in.email,
            "hashed_password": self.get_password_hash(user_in.password),
            "full_name": user_in.full_name,
            "organization": user_in.organization,
            "created_at": datetime.utcnow(),
            "is_active": True
        }
        result = await self.db.users.insert_one(user_doc)
        user_doc["_id"] = str(result.inserted_id)
        return user_doc
        
    def create_access_token(self, subject: str) -> str:
        expire = datetime.utcnow() + timedelta(hours=settings.jwt_expiration_hours)
        to_encode = {"exp": expire, "sub": str(subject)}
        encoded_jwt = jwt.encode(to_encode, settings.jwt_secret, algorithm=settings.jwt_algorithm)
        return encoded_jwt
