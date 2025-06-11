import React, { createContext, useContext, useState, useEffect } from "react";

const CartContext = createContext();

export function useCart() { return useContext(CartContext); }

export function CartProvider({ children }) {
  const [cart, setCart] = useState([]);
  useEffect(() => {
    const saved = localStorage.getItem("cart");
    if (saved) setCart(JSON.parse(saved));
  }, []);
  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cart));
  }, [cart]);
  const addToCart = (product, qty = 1) => {
    setCart(prev => {
      const idx = prev.findIndex(i => i.id === product.id);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx].qty += qty;
        return updated;
      }
      return [...prev, { ...product, qty }];
    });
  };
  const onChangeQty = (id, qty) => setCart(prev =>
    prev.map(i => i.id === id ? { ...i, qty: Math.max(1, qty) } : i)
  );
  const onRemove = id => setCart(prev => prev.filter(i => i.id !== id));
  const checkout = async (userToken) => {
    const items = cart.map(item => ({
      product_id: item.id,
      quantity: item.qty
    }));
    const res = await fetch("/orders/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(userToken ? { Authorization: `Bearer ${userToken}` } : {})
      },
      body: JSON.stringify({ items })
    });
    if (!res.ok) throw new Error("Error al procesar el pedido");
    setCart([]);
    return await res.json();
  };
  return (
    <CartContext.Provider value={{ cart, addToCart, onChangeQty, onRemove, checkout }}>
      {children}
    </CartContext.Provider>
  );
}