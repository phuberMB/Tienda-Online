import React, { useEffect, useState } from "react";

export default function AdminPanel({ userToken, user, onClose }) {
  const [ordersByUser, setOrdersByUser] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [productNames, setProductNames] = useState({});
  const [salesVolume, setSalesVolume] = useState(null);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (!userToken || user?.role !== "admin") {
      setMsg("Acceso restringido solo para administradores.");
      setLoading(false);
      return;
    }
    setLoading(true);
    Promise.all([
      fetch("/admin/stats/orders-by-user", {
        headers: { Authorization: `Bearer ${userToken}` },
      }).then(res => res.json()),
      fetch("/admin/stats/top-products", {
        headers: { Authorization: `Bearer ${userToken}` },
      }).then(res => res.json()),
      fetch("/admin/stats/sales-volume", {
        headers: { Authorization: `Bearer ${userToken}` },
      }).then(res => res.json()),
    ])
      .then(async ([ordersByUser, topProducts, salesVolume]) => {
        setOrdersByUser(ordersByUser);
        setTopProducts(topProducts);

        const names = {};
        await Promise.all(
          topProducts.map(async row => {
            try {
              const res = await fetch(`/products/${row.product_id}`);
              if (res.ok) {
                const prod = await res.json();
                names[row.product_id] = prod.title || `Producto ${row.product_id}`;
              } else {
                names[row.product_id] = `Producto ${row.product_id}`;
              }
            } catch {
              names[row.product_id] = `Producto ${row.product_id}`;
            }
          })
        );
        setProductNames(names);

        setSalesVolume(salesVolume.sales_volume);
        setLoading(false);
      })
      .catch(() => {
        setMsg("No se pudieron cargar las estadísticas.");
        setLoading(false);
      });
  }, [userToken, user]);

  return (
    <div className="admin-panel-modal" onClick={onClose}>
      <div className="admin-panel-content" onClick={e => e.stopPropagation()}>
        <button className="close-btn" onClick={onClose}>×</button>
        <h2>Panel de Administración</h2>
        {loading ? (
          <div>Cargando estadísticas...</div>
        ) : msg ? (
          <div style={{ color: "#d32f2f" }}>{msg}</div>
        ) : (
          <>
            <section>
              <h3>Número de pedidos por usuario</h3>
              <table>
                <thead>
                  <tr>
                    <th>ID Usuario</th>
                    <th>Pedidos</th>
                  </tr>
                </thead>
                <tbody>
                  {ordersByUser.map(row => (
                    <tr key={row.user_id}>
                      <td>{row.user_id}</td>
                      <td>{row.orders}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
            <section>
              <h3>Productos más solicitados</h3>
              <table>
                <thead>
                  <tr>
                    <th>ID Producto</th>
                    <th>Nombre</th>
                    <th>Cantidad total</th>
                  </tr>
                </thead>
                <tbody>
                  {topProducts.map(row => (
                    <tr key={row.product_id}>
                      <td>{row.product_id}</td>
                      <td>{productNames[row.product_id] || "..."}</td>
                      <td>{row.total_quantity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
            <section>
              <h3>Volumen de ventas</h3>
              <div style={{ fontSize: "1.2em", fontWeight: "bold" }}>
                {salesVolume !== null ? `${salesVolume.toFixed(2)} €` : "?"}
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}