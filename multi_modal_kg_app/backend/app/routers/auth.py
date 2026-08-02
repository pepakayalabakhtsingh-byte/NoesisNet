from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from app.models.user import UserCreate, UserOut
from app.services.auth_service import AuthService
from app.dependencies import get_current_user

router = APIRouter(prefix="/api/auth", tags=["Auth"])
auth_svc = AuthService()

@router.post("/register", response_model=UserOut)
async def register(user_in: UserCreate):
    try:
        existing = await auth_svc.get_user_by_email(user_in.email)
        if existing:
            raise HTTPException(status_code=400, detail="Email already registered")
        
        user_doc = await auth_svc.create_user(user_in)
        user_doc["id"] = user_doc["_id"]
        return user_doc
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/login")
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    user = await auth_svc.get_user_by_email(form_data.username)
    if not user or not auth_svc.verify_password(form_data.password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = auth_svc.create_access_token(user["_id"])
    user["id"] = user["_id"]
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": UserOut(**user).dict()
    }

@router.get("/me", response_model=UserOut)
async def get_me(current_user: dict = Depends(get_current_user)):
    current_user["id"] = current_user["_id"]
    return current_user
