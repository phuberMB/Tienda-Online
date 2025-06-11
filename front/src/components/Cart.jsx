import React, { useState } from "react";
import { useCart } from "../context/CartContext";

export default function Cart({ onClose, user, onRequireLogin }) {
  const { cart, onChangeQty, onRemove, checkout } = useCart();
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);

  const handleCheckout = async () => {
    if (!user) {
      onRequireLogin && onRequireLogin();
      return;
    }
    setLoading(true);
    setMsg("");
    try {
      const token = typeof user === "string" ? user : user?.token;
      await checkout(token);
      setMsg("¡Pedido realizado con éxito!");
    } catch (e) {
      setMsg("Error al finalizar la compra.");
    }
    setLoading(false);
  };

  return (
    <div className="cart-modal" onClick={onClose}>
      <div className="cart-content" onClick={e => e.stopPropagation()}>
        <button className="close-btn" onClick={onClose}>×</button>
        <h2 style={{ marginBottom: "1.5rem" }}>Carrito</h2>
        {cart.length === 0 ? (
          <div className="cart-empty">Tu carrito está vacío.</div>
        ) : (
          <ul className="cart-list">
            {cart.map(item => (
              <li key={item.id} className="cart-item">
                <img src={item.thumbnail} alt={item.title} className="cart-thumb" />
                <div className="cart-info">
                  <div className="cart-title">{item.title}</div>
                  <div className="cart-price-row">
                    <span className="cart-price">{item.price.toFixed(2)} €</span>
                  </div>
                  <div className="cart-qty-row">
                    <button onClick={() => onChangeQty(item.id, item.qty - 1)} disabled={item.qty <= 1}>-</button>
                    <span className="cart-qty">{item.qty}</span>
                    <button onClick={() => onChangeQty(item.id, item.qty + 1)}>+</button>
                  </div>
                  <button className="cart-remove" onClick={() => onRemove(item.id)}>Eliminar</button>
                </div>
              </li>
            ))}
          </ul>
        )}
        <div className="cart-footer">
          <div className="cart-total">
            <b>Total:</b> {total.toFixed(2)} €
          </div>
          {cart.length > 0 && (
            <button
              className="cart-checkout-btn"
              onClick={handleCheckout}
              disabled={loading}
              style={{ cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1 }}
            >
              {loading ? "Procesando..." : "Finalizar compra"}
            </button>
          )}
        </div>
        {msg && (
          <div style={{ marginTop: "1rem", textAlign: "center", color: msg.startsWith("¡") ? "#1a7f37" : "#d32f2f" }}>
            {msg}
          </div>
        )}
      </div>
    </div>
  );
}