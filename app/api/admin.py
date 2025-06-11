from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select, func
from app.dependencies import get_session
from app.models.order import Order, OrderItem
from app.models.user import User
from app.schemas.order import OrderRead, OrderStatusUpdate, OrderStatus
from app.api.orders import get_current_user, _attach_product_details
from typing import List, Dict
import asyncio

router = APIRouter(prefix="/admin", tags=["admin"])

# Estadísticas agregadas
@router.get("/stats/orders-by-user")
def orders_by_user(session: Session = Depends(get_session), current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    result = session.exec(select(Order.user_id, func.count(Order.id)).group_by(Order.user_id)).all()
    return [{"user_id": uid, "orders": count} for uid, count in result]

@router.get("/stats/top-products")
def top_products(session: Session = Depends(get_session), current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    result = session.exec(select(OrderItem.product_id, func.sum(OrderItem.quantity)).group_by(OrderItem.product_id).order_by(func.sum(OrderItem.quantity).desc())).all()
    return [{"product_id": pid, "total_quantity": qty} for pid, qty in result]

@router.get("/stats/sales-volume")
async def sales_volume(session: Session = Depends(get_session), current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    items = session.exec(select(OrderItem)).all()
    # Obtener precios de productos en DummyJSON
    tasks = [asyncio.create_task(_get_price(item.product_id)) for item in items]
    prices = await asyncio.gather(*tasks)
    total = sum(item.quantity * price for item, price in zip(items, prices) if price is not None)
    return {"sales_volume": total}

async def _get_price(product_id: int):
    from app.services.products import fetch_product
    try:
        prod = await fetch_product(product_id)
        return prod.get("price", 0)
    except:
        return None

# Historial de pedidos con cambio de estado
@router.patch("/orders/{order_id}/status", response_model=OrderRead)
def update_order_status(order_id: int, status_update: OrderStatusUpdate, session: Session = Depends(get_session), current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    order = session.get(Order, order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    order.status = status_update.status
    session.add(order)
    session.commit()
    session.refresh(order)
    order.items = session.exec(select(OrderItem).where(OrderItem.order_id == order.id)).all()
    # Attach product details (sync workaround)
    import asyncio
    asyncio.run(_attach_product_details(order))
    return order
