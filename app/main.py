from fastapi import FastAPI
from app.api import products, orders, admin
from app.core.logging_config import logger
from sqlmodel import SQLModel
from app.dependencies import engine
from app.api.auth import router as auth_router

app = FastAPI(title="Tienda Online")

@app.on_event("startup")
def startup_event():
    logger.info("API Tienda Online iniciada")
    # Crear tablas si no existen
    SQLModel.metadata.create_all(engine)

app.include_router(auth_router)
app.include_router(products.router)
app.include_router(orders.router)
app.include_router(admin.router)

@app.get("/")
def root():
    return {"message": "API Tienda Online funcionando"}
