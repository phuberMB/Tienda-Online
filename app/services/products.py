import httpx
from typing import Optional, Dict, Any
from app.core.redis import redis_client
import json

DUMMYJSON_URL = "https://dummyjson.com/products"
CACHE_TTL = 600

async def fetch_products(skip: int = 0, limit: int = 10, sort: Optional[str] = None, q: Optional[str] = None) -> Dict[str, Any]:
    params = {"skip": skip, "limit": limit}
    if sort:
        params["sort"] = sort
    if q:
        params["q"] = q
    async with httpx.AsyncClient(verify=False) as client:
        response = await client.get(DUMMYJSON_URL, params=params)
        response.raise_for_status()
        return response.json()

async def fetch_product(product_id: int) -> Dict[str, Any]:
    cache_key = f"product:{product_id}"
    cached = redis_client.get(cache_key)
    if cached:
        return json.loads(cached)
    url = f"{DUMMYJSON_URL}/{product_id}"
    async with httpx.AsyncClient(verify=False) as client:
        response = await client.get(url)
        response.raise_for_status()
        data = response.json()
        redis_client.setex(cache_key, CACHE_TTL, json.dumps(data))
        return data
