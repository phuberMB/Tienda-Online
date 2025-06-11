# Proyecto Final - Tienda Online

## Objetivo

Desarrollar una API REST para una tienda online donde los productos **no se almacenan en la base de datos local**. Los datos de productos se consultan en tiempo real desde la API externa DummyJSON. Los pedidos almacenan únicamente el ID del producto externo junto con la cantidad. La información del producto se obtiene en tiempo real cuando se muestra el pedido o se listan productos.

---

### Objetivos

* Construir una API RESTful con FastAPI
* Implementar autenticación y control de roles con JWT
* Modelar usuarios y pedidos con SQLModel
* Integrar consumo de API externa DummyJSON para productos
* Exportar datos a CSV, Excel y PDF
* Dockerizar la aplicación con Docker + Docker Compose
* Aplicar buenas prácticas en la estructura del proyecto y validación de datos

---

### Funcionalidades principales

* **Autenticación y gestión de usuarios:**

  * Registro de nuevos usuarios
  * Autenticación mediante JWT
  * Generación de **access token** y **refresh token**
  * **Renovación del access token** mediante el refresh token
  * **Revocación de tokens activos** (ej. cierre de sesión). Guardar en memoria temporal dicho token usando `Redis`
  * **recuperación de contraseña** 
  * Control de acceso según roles (`cliente`, `admin`)

* **Consulta de productos:**

  * Los productos se consultan directamente desde la API DummyJSON ([https://dummyjson.com/products](https://dummyjson.com/products)).
  * Soporte para **paginación, ordenación y filtrado** de resultados en las consultas.
  * No se almacenan localmente.

* **Gestión de pedidos:**

  * El **rol `cliente`** puede crear, consultar y gestionar pedidos únicamente asociados a su cuenta.
  * El **rol `admin`** tiene acceso completo a todos los recursos y operaciones de la API (usuarios, pedidos, exportaciones, etc.).
  * Los pedidos guardan únicamente el ID externo del producto y la cantidad.

* **Visualización de pedidos:**

  * Al mostrar pedidos, la aplicación consulta la API externa para obtener la información actualizada de cada producto.
  * El usuario debe poder ver sus pedidos junto con los productos que contienen, con detalles actualizados consultados en tiempo real.

* **Exportación de datos:**
  Exportar listados de pedidos a formatos CSV, Excel y PDF (el PDF debe incluir detalles de los productos que conforman el pedido y el desglose de precios individual y total).

---

### Requisitos técnicos

* Python 3.x con FastAPI
* SQLModel con SQLite o PostgreSQL
* Validaciones con Pydantic
* Autenticación con JWT (access + refresh + revocación con `Redis`)
* Docker y Docker Compose para contenerización
* Generacion de informes Excel, CSV, PDF

---

### Requisitos adicionales

* **Manejo de errores:**
  La API debe gestionar correctamente errores comunes, como autenticación fallida, producto no encontrado o entradas inválidas, y responder con mensajes claros y códigos HTTP apropiados.

* **Documentación automática:**
  La documentación generada automáticamente por FastAPI (Swagger/OpenAPI) debe estar accesible, organizada y completa para todos los endpoints.

* **Logging básico:**
  Registrar operaciones importantes en consola y fichero de logs (por ejemplo, creación de pedidos, errores, autenticaciones) para facilitar depuración y monitoreo.

* **Buenas prácticas de desarrollo:**

  * Separación clara por capas: modelos, esquemas, rutas y lógica.
  * Uso de esquemas Pydantic para validación de entrada/salida.
  * Código legible y estructurado para facilitar el mantenimiento.

---

### Entregables

* Código fuente completo en un repositorio Git
* Archivo `README.md` con:
  * Tecnologías usadas
  * Descripción general del proyecto
  * Instrucciones para instalar y ejecutar con Docker Compose
  * Explicación de los flujos principales y la integración con la API externa
  * Ejemplos para realizar peticiones a endpoints más importantes

---

### Fases Opcionales

#### 1. Panel de Administración (API)
Implementar endpoints para que el administrador pueda consultar estadísticas agregadas sobre los pedidos y productos.

- **Estadísticas agregadas**:
  - Número de pedidos por usuario.
  - Productos más solicitados.
  - Volumen de ventas (simulado por `cantidad * precio` obtenido de DummyJSON).

- **Historial de pedidos con estados**:
  - Añadir un campo de estado al pedido (ejemplo: `pendiente`, `procesado`, `enviado`).
  - Permitir que el administrador cambie el estado de los pedidos.

#### 2. Caché Temporal de Productos Externos
Implementar un sistema de caché en memoria (por ejemplo, utilizando Redis) para almacenar temporalmente los datos de productos obtenidos de la API externa.

- **TTL (Time-to-Live)**:
  - Configurar un tiempo de vida para los datos almacenados en caché (ejemplo: 10 minutos).
  - Esto evitará realizar múltiples peticiones repetidas a la API externa.

- **Beneficios**:
  - Mejora el rendimiento de la aplicación.
  - Reduce la carga en la API externa.



