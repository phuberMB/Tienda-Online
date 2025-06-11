from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlmodel import Session, select
from app.models.order import Order, OrderItem
from app.schemas.order import OrderCreate, OrderRead
from app.dependencies import get_session

from app.models.user import User
from typing import List
from fastapi.security import OAuth2PasswordBearer
from app.core.security import decode_token
from app.services.products import fetch_product
from app.services.export import export_orders_csv, export_orders_excel, export_orders_pdf
from app.core.logging_config import logger
import asyncio
from fastapi.responses import StreamingResponse
from io import BytesIO

# Export endpoints (moved after router definition)

router = APIRouter(prefix="/orders", tags=["orders"])

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

# Helper to get current user from token
async def get_current_user(token: str = Depends(oauth2_scheme), session: Session = Depends(get_session)):
    try:
        payload = decode_token(token)
        user = session.get(User, int(payload["sub"]))
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid authentication")

@router.get("/export/csv")
async def export_orders_csv_endpoint(session: Session = Depends(get_session), current_user: User = Depends(get_current_user)):
    if current_user.role == "admin":
        orders = session.exec(select(Order)).all()
    else:
        orders = session.exec(select(Order).where(Order.user_id == current_user.id)).all()
    for order in orders:
        order.items = session.exec(select(OrderItem).where(OrderItem.order_id == order.id)).all()
    await asyncio.gather(*[_attach_product_details(order) for order in orders])
    csv_bytes = export_orders_csv([order.dict() for order in orders])
    return StreamingResponse(BytesIO(csv_bytes), media_type="text/csv", headers={"Content-Disposition": "attachment; filename=orders.csv"})

@router.get("/export/excel")
async def export_orders_excel_endpoint(session: Session = Depends(get_session), current_user: User = Depends(get_current_user)):
    if current_user.role == "admin":
        orders = session.exec(select(Order)).all()
    else:
        orders = session.exec(select(Order).where(Order.user_id == current_user.id)).all()
    for order in orders:
        order.items = session.exec(select(OrderItem).where(OrderItem.order_id == order.id)).all()
    await asyncio.gather(*[_attach_product_details(order) for order in orders])
    excel_bytes = export_orders_excel([order.dict() for order in orders])
    return StreamingResponse(BytesIO(excel_bytes), media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", headers={"Content-Disposition": "attachment; filename=orders.xlsx"})

@router.get("/export/pdf")
async def export_orders_pdf_endpoint(session: Session = Depends(get_session), current_user: User = Depends(get_current_user)):
    if current_user.role == "admin":
        orders = session.exec(select(Order)).all()
    else:
        orders = session.exec(select(Order).where(Order.user_id == current_user.id)).all()
    for order in orders:
        order.items = session.exec(select(OrderItem).where(OrderItem.order_id == order.id)).all()
    await asyncio.gather(*[_attach_product_details(order) for order in orders])
    pdf_bytes = export_orders_pdf([order.dict() for order in orders])
    return StreamingResponse(BytesIO(pdf_bytes), media_type="application/pdf", headers={"Content-Disposition": "attachment; filename=orders.pdf"})

router = APIRouter(prefix="/orders", tags=["orders"])

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

# Helper to get current user from token
async def get_current_user(token: str = Depends(oauth2_scheme), session: Session = Depends(get_session)):
    try:
        payload = decode_token(token)
        user = session.get(User, int(payload["sub"]))
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid authentication")

@router.post("/", response_model=OrderRead, status_code=201)
async def create_order(order_in: OrderCreate, session: Session = Depends(get_session), current_user: User = Depends(get_current_user)):
    try:
        order = Order(user_id=current_user.id)
        session.add(order)
        session.commit()
        session.refresh(order)
        for item in order_in.items:
            order_item = OrderItem(order_id=order.id, product_id=item.product_id, quantity=item.quantity)
            session.add(order_item)
        session.commit()
        session.refresh(order)
        order.items = session.exec(select(OrderItem).where(OrderItem.order_id == order.id)).all()
        # Attach product details
        await _attach_product_details(order)
        logger.info(f"Pedido creado: {order.id} por usuario {current_user.id}")
        return order
    except Exception as e:
        logger.error(f"Error al crear pedido: {e}")
        raise HTTPException(status_code=500, detail="Error al crear el pedido")

@router.get("/", response_model=List[OrderRead])
async def list_orders(session: Session = Depends(get_session), current_user: User = Depends(get_current_user)):
    if current_user.role == "admin":
        orders = session.exec(select(Order)).all()
    else:
        orders = session.exec(select(Order).where(Order.user_id == current_user.id)).all()
    for order in orders:
        order.items = session.exec(select(OrderItem).where(OrderItem.order_id == order.id)).all()
    # Attach product details to all orders
    await asyncio.gather(*[_attach_product_details(order) for order in orders])
    return orders

@router.get("/{order_id}", response_model=OrderRead)
async def get_order(order_id: int, session: Session = Depends(get_session), current_user: User = Depends(get_current_user)):
    order = session.get(Order, order_id)
    if not order:
        logger.warning(f"Pedido no encontrado: {order_id}")
        raise HTTPException(status_code=404, detail="Order not found")
    if current_user.role != "admin" and order.user_id != current_user.id:
        logger.warning(f"Acceso denegado a pedido {order_id} para usuario {current_user.id}")
        raise HTTPException(status_code=403, detail="Not authorized")
    order.items = session.exec(select(OrderItem).where(OrderItem.order_id == order.id)).all()
    await _attach_product_details(order)
    return order

# Helper to attach product details to order items
async def _attach_product_details(order):
    tasks = []
    for item in order.items:
        tasks.append(fetch_product(item.product_id))
    product_details = await asyncio.gather(*tasks, return_exceptions=True)
    for item, prod in zip(order.items, product_details):
        if isinstance(prod, dict):
            item.product = {
                "id": prod.get("id"),
                "title": prod.get("title"),
                "price": prod.get("price"),
                "description": prod.get("description", ""),
                "thumbnail": prod.get("thumbnail", "")
            }
        else:
            item.product = None
