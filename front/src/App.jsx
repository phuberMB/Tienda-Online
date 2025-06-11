import React, { useState, useEffect } from "react";
import ProductList from "./components/ProductList";
import ProductDetail from "./components/ProductDetail";
import Login from "./components/Login";
import Register from "./components/Register";
import { useCart } from "./context/CartContext";
import Cart from "./components/Cart";
import OrderHistory from "./components/OrderHistory";
import AdminPanel from "./components/AdminPanel";
import "./index.css";

function App() {
  const [showModal, setShowModal] = useState(false);
  const [showLogin, setShowLogin] = useState(true);
  const [user, setUser] = useState(null);
  const [detailId, setDetailId] = useState(null);
  const [showCart, setShowCart] = useState(false);
  const [showOrders, setShowOrders] = useState(false);
  const [loginMsg, setLoginMsg] = useState("");
  const [showAdmin, setShowAdmin] = useState(false);

  const { cart } = useCart();

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      const parsed = JSON.parse(savedUser);
      setUser(parsed);
    }
  }, []);

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("user");
  };

  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem("user", JSON.stringify(userData));
    setShowModal(false);
  };

  return (
    <div className="container">
      <nav className="navbar">
        <div className="navbar-title">Tienda Online</div>
        <div className="navbar-actions">
          <button className="navbar-btn" onClick={() => setShowCart(true)}>
            🛒 Carrito{" "}
            {cart.length > 0 && (
              <span className="cart-count">
                {cart.reduce((a, b) => a + b.qty, 0)}
              </span>
            )}
          </button>
          {user ? (
            <>
              <button className="navbar-btn" onClick={() => setShowOrders(true)}>
                Pedidos
              </button>
              {user?.role === "admin" && (
                <button className="navbar-btn" onClick={() => setShowAdmin(true)}>
                  Panel Admin
                </button>
              )}
              <button className="navbar-btn" onClick={handleLogout}>
                Cerrar sesión
              </button>
            </>
          ) : (
            <>
              <button
                className="navbar-btn"
                onClick={() => {
                  setShowModal(true);
                  setShowLogin(true);
                }}
              >
                Iniciar sesión
              </button>
              <button
                className="navbar-btn"
                onClick={() => {
                  setShowModal(true);
                  setShowLogin(false);
                }}
              >
                Registrarse
              </button>
            </>
          )}
        </div>
      </nav>
      <main>
        <ProductList onShowDetail={setDetailId} />
        {detailId && (
          <ProductDetail
            productId={detailId}
            onClose={() => setDetailId(null)}
          />
        )}
      </main>
      {showCart && (
        <Cart
          onClose={() => setShowCart(false)}
          user={user}
          onRequireLogin={() => {
            setShowCart(false);
            setShowModal(true);
            setShowLogin(true);
            setLoginMsg("Debes iniciar sesión o registrarte para finalizar la compra.");
          }}
        />
      )}
      {showOrders && (
        <OrderHistory
          userToken={typeof user === "string" ? user : user?.token}
          user={user}
          onClose={() => setShowOrders(false)}
        />
      )}
      {showAdmin && (
        <AdminPanel
          userToken={typeof user === "string" ? user : user?.token}
          user={user}
          onClose={() => setShowAdmin(false)}
        />
      )}
      {showModal && (
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            {loginMsg && (
              <div style={{ color: "#d32f2f", marginBottom: "1rem", textAlign: "center" }}>
                {loginMsg}
              </div>
            )}
            <div className="auth-toggle">
              <button
                className={showLogin ? "active" : ""}
                onClick={() => setShowLogin(true)}
              >
                Iniciar sesión
              </button>
              <button
                className={!showLogin ? "active" : ""}
                onClick={() => setShowLogin(false)}
              >
                Registrarse
              </button>
            </div>
            {showLogin ? (
              <Login onLogin={(userData) => {
                setUser(userData);
                localStorage.setItem("user", JSON.stringify(userData));
                setShowModal(false);
                setLoginMsg("");
              }} />
            ) : (
              <Register onRegister={(userData) => {
                setUser(userData);
                localStorage.setItem("user", JSON.stringify(userData));
                setShowModal(false);
                setLoginMsg("");
              }} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
