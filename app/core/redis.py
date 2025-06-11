import redis
import os

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")

redis_client = redis.Redis.from_url(REDIS_URL, decode_responses=True)

def blacklist_token(jti: str, exp: int):
    ttl = exp - int(__import__('time').time())
    if ttl > 0:
        redis_client.setex(f"blacklist:{jti}", ttl, "true")

def is_token_blacklisted(jti: str) -> bool:
    return redis_client.exists(f"blacklist:{jti}") == 1
