from pydantic import BaseModel
from typing import List, Optional

from enum import Enum
from datetime import datetime

class OrderItemCreate(BaseModel):
    product_id: int
    quantity: int

class OrderCreate(BaseModel):
    items: List[OrderItemCreate]


class ProductDetail(BaseModel):
    id: int
    title: str
    price: float
    description: str = ""
    thumbnail: str = ""

class OrderItemRead(BaseModel):
    id: int
    product_id: int
    quantity: int
    product: ProductDetail | None = None

class OrderStatus(str, Enum):
    pendiente = "pendiente"
    procesado = "procesado"
    enviado = "enviado"

class OrderRead(BaseModel):
    id: int
    user_id: int
    created_at: datetime
    status: OrderStatus
    items: List[OrderItemRead]

class OrderStatusUpdate(BaseModel):
    status: OrderStatus
