from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlmodel import Session, select
from app.models.user import User
from app.schemas.user import UserCreate, UserRead, UserLogin, Token, PasswordResetRequest, PasswordResetConfirm
from app.core.security import verify_password, get_password_hash, create_access_token, create_refresh_token, decode_token
from app.core.redis import blacklist_token, is_token_blacklisted
from app.dependencies import get_session
from typing import Any
import secrets
from datetime import datetime, timedelta

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
    user = session.exec(select(User).where(User.email == user_in.email)).first()
    if not user or not verify_password(user_in.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    access_token = create_access_token(
        str(user.id),
        extra_payload={"role": user.role, "username": user.username}
    )
    refresh_token = create_refresh_token(
        str(user.id),
        extra_payload={"role": user.role, "username": user.username}
    )
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
    jti = token
    exp = payload.get("exp")
    blacklist_token(jti, exp)
    return {"msg": "Token revoked"}

@router.post("/password-reset-request")
def password_reset_request(data: PasswordResetRequest, session: Session = Depends(get_session), background_tasks: BackgroundTasks = None):
    user = session.exec(select(User).where(User.email == data.email)).first()
    if not user:
        return {"msg": "If the email exists, a reset link has been sent."}
    token = secrets.token_urlsafe(32)
    user.reset_token = token
    user.reset_token_expiry = datetime.utcnow() + timedelta(hours=1)
    session.add(user)
    session.commit()
    return {
        "msg": "If the email exists, a reset link has been sent.",
        "token": token
    }

@router.post("/password-reset-confirm")
def password_reset_confirm(data: PasswordResetConfirm, session: Session = Depends(get_session)):
    user = session.exec(select(User).where(User.reset_token == data.token)).first()
    if not user or not user.reset_token_expiry or user.reset_token_expiry < datetime.utcnow():
        raise HTTPException(status_code=400, detail="Invalid or expired token")
    user.hashed_password = get_password_hash(data.new_password)
    user.reset_token = None
    user.reset_token_expiry = None
    session.add(user)
    session.commit()
    return {"msg": "Password has been reset successfully."}
