
# Tienda Online - FastAPI

## Descripción
API RESTful para una tienda online. Los productos se consultan en tiempo real desde la API externa DummyJSON, los pedidos solo almacenan el ID externo y cantidad, y la información de productos se obtiene siempre actualizada. Incluye autenticación JWT, control de roles, exportación de pedidos y despliegue con Docker.

## Tecnologías usadas
- **Python 3.x**
- **FastAPI** (API REST y documentación automática)
- **SQLModel** (modelos y persistencia)
- **Pydantic** (validación de datos)
- **JWT** (autenticación y control de acceso)
- **Redis** (revocación de tokens y caché)
- **Docker & Docker Compose**
- **Pandas, Openpyxl, ReportLab** (exportación CSV, Excel, PDF)

## Instalación y ejecución

1. Clona el repositorio y entra en la carpeta del proyecto.
2. Ejecuta:
   ```sh
   docker-compose up --build
   ```
3. Accede a la API en: [http://localhost:8000/docs](http://localhost:8000/docs)

## Flujos principales y arquitectura

- **Usuarios y autenticación:** Registro, login, refresh y revocación de tokens JWT. Roles: `cliente` y `admin`.
- **Productos:** Consulta en tiempo real a DummyJSON, sin almacenamiento local. Soporte de paginación, orden y búsqueda.
- **Pedidos:** Los clientes pueden crear y consultar sus pedidos; los admins pueden ver todos. Los pedidos solo guardan el ID externo y cantidad, y al consultarlos se muestran los detalles actualizados de los productos.
- **Exportación:** Listados de pedidos exportables a CSV, Excel y PDF (incluyendo detalles y desglose de precios).


## Ejemplos de peticiones

### Registro de usuario
```http
POST /auth/register
{
  "username": "usuario1",
  "email": "usuario1@email.com",
  "password": "123456"
}
```

### Login y obtención de tokens
```http
POST /auth/login
{
  "username": "usuario1",
  "password": "123456"
}
```

### Consulta de productos
```http
GET /products/?limit=5&sort=price&q=phone
```

### Crear pedido
```http
POST /orders/
Authorization: Bearer <access_token>
{
  "items": [
    {"product_id": 1, "quantity": 2},
    {"product_id": 5, "quantity": 1}
  ]
}
```

### Exportar pedidos (CSV, Excel, PDF)
```http
GET /orders/export/csv
GET /orders/export/excel
GET /orders/export/pdf
```

### Panel de Administración (solo admin)

#### Estadísticas agregadas

- **Pedidos por usuario:**
  ```http
  GET /admin/stats/orders-by-user
  Authorization: Bearer <access_token_admin>
  ```
  Respuesta:
  ```json
  [
    {"user_id": 1, "orders": 5},
    {"user_id": 2, "orders": 2}
  ]
  ```

- **Productos más solicitados:**
  ```http
  GET /admin/stats/top-products
  Authorization: Bearer <access_token_admin>
  ```
  Respuesta:
  ```json
  [
    {"product_id": 1, "total_quantity": 7},
    {"product_id": 5, "total_quantity": 3}
  ]
  ```

- **Volumen de ventas:**
  ```http
  GET /admin/stats/sales-volume
  Authorization: Bearer <access_token_admin>
  ```
  Respuesta:
  ```json
  {"sales_volume": 1234.56}
  ```

#### Cambiar estado de pedido

```http
PATCH /admin/orders/{order_id}/status
Authorization: Bearer <access_token_admin>
{
  "status": "procesado"
}
```


## Integración con DummyJSON y caché de productos

- La API nunca almacena productos localmente en la base de datos.
- Todos los detalles de productos se obtienen en tiempo real desde [https://dummyjson.com/products](https://dummyjson.com/products) al consultar pedidos o productos.
- **Optimización:** Para cada consulta de producto por ID, la API utiliza un sistema de caché temporal en Redis:
  - Cuando se solicita un producto, primero se busca en Redis.
  - Si está en caché (TTL 10 minutos), se devuelve el dato cacheado.
  - Si no está, se consulta DummyJSON y se almacena en Redis por 10 minutos.
- Esto mejora el rendimiento y reduce la carga sobre la API externa DummyJSON.
