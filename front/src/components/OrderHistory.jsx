import React, { useEffect, useState } from "react";

export default function OrderHistory({ userToken, user, onClose }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    setLoading(true);
    fetch("/orders/", {
      headers: userToken ? { Authorization: `Bearer ${userToken}` } : {},
    })
      .then(res => res.json())
      .then(data => {
        setOrders(Array.isArray(data) ? data : data.orders || []);
        setLoading(false);
      })
      .catch(() => {
        setMsg("No se pudo cargar el historial.");
        setLoading(false);
      });
  }, [userToken]);

  const handleStatusChange = async (orderId, newStatus) => {
    await fetch(`/admin/orders/${orderId}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${userToken}`,
      },
      body: JSON.stringify({ status: newStatus }),
    });
    setOrders(orders =>
      orders.map(order =>
        order.id === orderId ? { ...order, status: newStatus } : order
      )
    );
  };

  const handleDownload = (type) => {
    const url = `/orders/export/${type}`;
    fetch(url, {
      headers: userToken ? { Authorization: `Bearer ${userToken}` } : {},
    })
      .then(res => {
        if (!res.ok) throw new Error("Error al descargar");
        return res.blob();
      })
      .then(blob => {
        const a = document.createElement("a");
        const fileType =
          type === "csv"
            ? "orders.csv"
            : type === "excel"
            ? "orders.xlsx"
            : "orders.pdf";
        a.href = window.URL.createObjectURL(blob);
        a.download = fileType;
        a.click();
      })
      .catch(() => alert("No se pudo descargar el archivo."));
  };

  const statusBadge = status => (
    <span className={`order-status-badge ${status}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );

  return (
    <div className="order-history-modal" onClick={onClose}>
      <div className="order-history-content" onClick={e => e.stopPropagation()}>
        <button className="close-btn" onClick={onClose}>×</button>
        <h2>Historial de pedidos</h2>
        {user?.role === "admin" && (
          <div className="download-btns">
            <button onClick={() => handleDownload("csv")} disabled={orders.length === 0}>Descargar CSV</button>
            <button onClick={() => handleDownload("excel")} disabled={orders.length === 0}>Descargar Excel</button>
            <button onClick={() => handleDownload("pdf")} disabled={orders.length === 0}>Descargar PDF</button>
          </div>
        )}
        {loading ? (
          <div>Cargando...</div>
        ) : msg ? (
          <div style={{ color: "#d32f2f" }}>{msg}</div>
        ) : orders.length === 0 ? (
          <div>No tienes pedidos realizados.</div>
        ) : (
          <ul className="order-list">
            {orders.map(order => {
              const total = (order.items || []).reduce(
                (sum, item) => sum + ((item.product?.price || 0) * item.quantity),
                0
              );
              return (
                <li key={order.id} className="order-item">
                  <div><b>Pedido:</b> #{order.id}</div>
                  <div><b>Fecha:</b> {order.created_at ? new Date(order.created_at).toLocaleString() : "N/A"}</div>
                  <div><b>Total:</b> {total.toFixed(2)} €</div>
                  <div>
                    <b>Productos:</b>
                    <ul className="product-list">
                      {(order.items || []).map(item => (
                        <li key={item.product_id}>
                          {item.product?.thumbnail && (
                            <img className="product-thumb" src={item.product.thumbnail} alt={item.product.title} />
                          )}
                          <span style={{ fontWeight: 600 }}>{item.product?.title || `Producto #${item.product_id}`}</span>
                          <span style={{ color: "#888", marginLeft: 4 }}>
                            {item.product?.price?.toFixed(2)} €
                          </span>
                          <span style={{ marginLeft: 4 }}>x{item.quantity}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <b>Estado:</b> {statusBadge(order.status)}
                    {user?.role === "admin" && (
                      <select
                        value={order.status}
                        onChange={e => handleStatusChange(order.id, e.target.value)}
                        style={{ marginLeft: 8 }}
                      >
                        <option value="pendiente">Pendiente</option>
                        <option value="procesado">Procesado</option>
                        <option value="enviado">Enviado</option>
                      </select>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}