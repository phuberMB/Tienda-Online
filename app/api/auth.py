from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from app.models.user import User
from app.schemas.user import UserCreate, UserRead, UserLogin, Token, PasswordResetRequest, PasswordResetConfirm
from app.core.security import verify_password, get_password_hash, create_access_token, create_refresh_token, decode_token
from app.core.redis import blacklist_token, is_token_blacklisted
from app.dependencies import get_session
from typing import Any

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/register", response_model=UserRead)
def register(user_in: UserCreate, session: Session = Depends(get_session)):
    user = session.exec(select(User).where(User.username == user_in.username)).first()
    if user:
        raise HTTPException(status_code=400, detail="Username already registered")
    user = User(username=user_in.username, email=user_in.email, hashed_password=get_password_hash(user_in.password))
    session.add(user)
    session.commit()
    session.refresh(user)
    return user

@router.post("/login", response_model=Token)
def login(user_in: UserLogin, session: Session = Depends(get_session)):
    user = session.exec(select(User).where(User.username == user_in.username)).first()
    if not user or not verify_password(user_in.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Incorrect username or password")
    access_token = create_access_token(str(user.id))
    refresh_token = create_refresh_token(str(user.id))
    return Token(access_token=access_token, refresh_token=refresh_token)

@router.post("/refresh", response_model=Token)
def refresh_token_endpoint(token: str):
    payload = decode_token(token)
    if payload.get("type") != "refresh":
        raise HTTPException(status_code=400, detail="Invalid token type")
    user_id = payload.get("sub")
    access_token = create_access_token(user_id)
    refresh_token = create_refresh_token(user_id)
    return Token(access_token=access_token, refresh_token=refresh_token)

@router.post("/logout")
def logout(token: str):
    payload = decode_token(token)
    jti = token  # For simplicity, use the token string as jti
    exp = payload.get("exp")
    blacklist_token(jti, exp)
    return {"msg": "Token revoked"}
