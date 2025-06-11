import pandas as pd
from typing import List, Dict, Any
from io import BytesIO
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from reportlab.lib.units import inch

# CSV/Excel

def orders_to_dataframe(orders: List[Dict[str, Any]]):
    rows = []
    for order in orders:
        for item in order["items"]:
            prod = item.get("product", {})
            rows.append({
                "order_id": order["id"],
                "user_id": order["user_id"],
                "created_at": order["created_at"],
                "product_id": item["product_id"],
                "product_title": prod.get("title", ""),
                "quantity": item["quantity"],
                "price": prod.get("price", 0),
                "total": item["quantity"] * prod.get("price", 0)
            })
    return pd.DataFrame(rows)

def export_orders_csv(orders: List[Dict[str, Any]]):
    df = orders_to_dataframe(orders)
    return df.to_csv(index=False).encode()

def export_orders_excel(orders: List[Dict[str, Any]]):
    df = orders_to_dataframe(orders)
    output = BytesIO()
    df.to_excel(output, index=False)
    return output.getvalue()

# PDF

def export_orders_pdf(orders: List[Dict[str, Any]]):
    buffer = BytesIO()
    c = canvas.Canvas(buffer, pagesize=letter)
    width, height = letter
    y = height - inch
    c.setFont("Helvetica-Bold", 14)
    c.drawString(1 * inch, y, "Listado de Pedidos")
    y -= 0.5 * inch
    c.setFont("Helvetica", 10)
    for order in orders:
        c.drawString(1 * inch, y, f"Pedido #{order['id']} | Usuario: {order['user_id']} | Fecha: {order['created_at']}")
        y -= 0.2 * inch
        for item in order["items"]:
            prod = item.get("product", {})
            c.drawString(1.2 * inch, y, f"Producto: {prod.get('title', '')} (ID: {item['product_id']}) | Cantidad: {item['quantity']} | Precio: {prod.get('price', 0)} | Total: {item['quantity'] * prod.get('price', 0)}")
            y -= 0.18 * inch
            if y < 1 * inch:
                c.showPage()
                y = height - inch
        y -= 0.1 * inch
    c.save()
    pdf = buffer.getvalue()
    buffer.close()
    return pdf
