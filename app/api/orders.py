from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlmodel import Session, select
from app.models.order import Order, OrderItem
from app.schemas.order import OrderCreate, OrderRead, OrderItemRead, ProductDetail
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
        db_items = session.exec(select(OrderItem).where(OrderItem.order_id == order.id)).all()
        # Adjunta detalles de producto usando fetch_product
        items = []
        for item in db_items:
            prod = await fetch_product(item.product_id)
            product_detail = ProductDetail(
                id=prod["id"],
                title=prod["title"],
                price=prod["price"],
                description=prod.get("description", ""),
                thumbnail=prod.get("thumbnail", "")
            )
            items.append(OrderItemRead(
                id=item.id,
                product_id=item.product_id,
                quantity=item.quantity,
                product=product_detail
            ))
        order_read = OrderRead(
            id=order.id,
            user_id=order.user_id,
            created_at=order.created_at,
            status=order.status,
            items=items
        )
        logger.info(f"Pedido creado: {order.id} por usuario {current_user.id}")
        return order_read
    except Exception as e:
        logger.error(f"Error al crear pedido: {e}")
        raise HTTPException(status_code=500, detail="Error al crear el pedido")

@router.get("/", response_model=List[OrderRead])
async def list_orders(session: Session = Depends(get_session), current_user: User = Depends(get_current_user)):
    if current_user.role == "admin":
        orders = session.exec(select(Order)).all()
    else:
        orders = session.exec(select(Order).where(Order.user_id == current_user.id)).all()
    result = []
    for order in orders:
        db_items = session.exec(select(OrderItem).where(OrderItem.order_id == order.id)).all()
        items = []
        for item in db_items:
            prod = await fetch_product(item.product_id)
            product_detail = ProductDetail(
                id=prod["id"],
                title=prod["title"],
                price=prod["price"],
                description=prod.get("description", ""),
                thumbnail=prod.get("thumbnail", "")
            )
            items.append(OrderItemRead(
                id=item.id,
                product_id=item.product_id,
                quantity=item.quantity,
                product=product_detail
            ))
        order_read = OrderRead(
            id=order.id,
            user_id=order.user_id,
            created_at=order.created_at,
            status=order.status,
            items=items
        )
        result.append(order_read)
    return result

@router.get("/{order_id}", response_model=OrderRead)
async def get_order(order_id: int, session: Session = Depends(get_session), current_user: User = Depends(get_current_user)):
    order = session.get(Order, order_id)
    if not order:
        logger.warning(f"Pedido no encontrado: {order_id}")
        raise HTTPException(status_code=404, detail="Order not found")
    if current_user.role != "admin" and order.user_id != current_user.id:
        logger.warning(f"Acceso denegado a pedido {order_id} para usuario {current_user.id}")
        raise HTTPException(status_code=403, detail="Not authorized")
    db_items = session.exec(select(OrderItem).where(OrderItem.order_id == order.id)).all()
    items = []
    for item in db_items:
        prod = await fetch_product(item.product_id)
        product_detail = ProductDetail(
            id=prod["id"],
            title=prod["title"],
            price=prod["price"],
            description=prod.get("description", ""),
            thumbnail=prod.get("thumbnail", "")
        )
        items.append(OrderItemRead(
            id=item.id,
            product_id=item.product_id,
            quantity=item.quantity,
            product=product_detail
        ))
    order_read = OrderRead(
        id=order.id,
        user_id=order.user_id,
        created_at=order.created_at,
        status=order.status,
        items=items
    )
    return order_read

def order_to_dict(order):
    return {
        "id": order.id,
        "user_id": order.user_id,
        "created_at": order.created_at,
        "status": order.status,
        "items": [
            {
                "id": item.id,
                "product_id": item.product_id,
                "quantity": item.quantity
            }
            for item in order.items
        ]
    }

@router.get("/export/csv")
async def export_orders_csv_endpoint(session: Session = Depends(get_session), current_user: User = Depends(get_current_user)):
    if current_user.role == "admin":
        orders = session.exec(select(Order)).all()
    else:
        orders = session.exec(select(Order).where(Order.user_id == current_user.id)).all()
    for order in orders:
        order.items = session.exec(select(OrderItem).where(OrderItem.order_id == order.id)).all()
    enriched_orders = await enrich_orders_with_product_info(orders)
    csv_bytes = export_orders_csv(enriched_orders)
    return StreamingResponse(BytesIO(csv_bytes), media_type="text/csv", headers={"Content-Disposition": "attachment; filename=orders.csv"})

@router.get("/export/excel")
async def export_orders_excel_endpoint(session: Session = Depends(get_session), current_user: User = Depends(get_current_user)):
    if current_user.role == "admin":
        orders = session.exec(select(Order)).all()
    else:
        orders = session.exec(select(Order).where(Order.user_id == current_user.id)).all()
    for order in orders:
        order.items = session.exec(select(OrderItem).where(OrderItem.order_id == order.id)).all()
    enriched_orders = await enrich_orders_with_product_info(orders)
    excel_bytes = export_orders_excel(enriched_orders)
    return StreamingResponse(BytesIO(excel_bytes), media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", headers={"Content-Disposition": "attachment; filename=orders.xlsx"})

@router.get("/export/pdf")
async def export_orders_pdf_endpoint(session: Session = Depends(get_session), current_user: User = Depends(get_current_user)):
    if current_user.role == "admin":
        orders = session.exec(select(Order)).all()
    else:
        orders = session.exec(select(Order).where(Order.user_id == current_user.id)).all()
    for order in orders:
        order.items = session.exec(select(OrderItem).where(OrderItem.order_id == order.id)).all()
    enriched_orders = await enrich_orders_with_product_info(orders)
    pdf_bytes = export_orders_pdf(enriched_orders)
    return StreamingResponse(BytesIO(pdf_bytes), media_type="application/pdf", headers={"Content-Disposition": "attachment; filename=orders.pdf"})

async def enrich_orders_with_product_info(orders):
    from app.services.products import fetch_product
    enriched_orders = []
    for order in orders:
        enriched_items = []
        for item in order.items:
            try:
                prod = await fetch_product(item.product_id)
                product = {
                    "title": prod.get("title", ""),
                    "price": prod.get("price", 0)
                }
            except Exception:
                product = {"title": "", "price": 0}
            enriched_items.append({
                "id": item.id,
                "product_id": item.product_id,
                "quantity": item.quantity,
                "product": product
            })
        enriched_orders.append({
            "id": order.id,
            "user_id": order.user_id,
            "created_at": order.created_at,
            "status": order.status,
            "items": enriched_items
        })
    return enriched_orders