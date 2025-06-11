from sqlmodel import SQLModel, Field, Relationship
from typing import Optional, List
from datetime import datetime

from enum import Enum

class OrderStatus(str, Enum):
    pendiente = "pendiente"
    procesado = "procesado"
    enviado = "enviado"

class Order(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    status: OrderStatus = Field(default=OrderStatus.pendiente)
    items: List["OrderItem"] = Relationship(back_populates="order")

class OrderItem(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    order_id: int = Field(foreign_key="order.id")
    product_id: int  # ID externo de DummyJSON
    quantity: int
    order: Optional[Order] = Relationship(back_populates="items")
