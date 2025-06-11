from fastapi import APIRouter, Query, HTTPException
from typing import Optional
from app.services.products import fetch_products, fetch_product

router = APIRouter(prefix="/products", tags=["products"])

@router.get("/")
async def list_products(
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    sort: Optional[str] = Query(None),
    q: Optional[str] = Query(None)
):
    try:
        data = await fetch_products(skip=skip, limit=limit, sort=sort, q=q)
        return data
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))

@router.get("/{product_id}")
async def get_product(product_id: int):
    try:
        data = await fetch_product(product_id)
        return data
    except Exception as e:
        raise HTTPException(status_code=404, detail="Product not found")
