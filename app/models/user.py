from sqlmodel import SQLModel, Field
from typing import Optional
from enum import Enum
from datetime import datetime

class UserRole(str, Enum):
    cliente = "cliente"
    admin = "admin"

class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    username: str = Field(index=True, unique=True)
    email: str = Field(index=True, unique=True)
    hashed_password: str
    is_active: bool = Field(default=True)
    role: UserRole = Field(default=UserRole.cliente)
    reset_token: Optional[str] = Field(default=None, index=True)
    reset_token_expiry: Optional[datetime] = Field(default=None)
