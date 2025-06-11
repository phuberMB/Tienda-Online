import React, { useEffect, useState } from "react";

export default function ProductList({ onShowDetail }) {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [brand, setBrand] = useState("");
  const [category, setCategory] = useState("");
  const [availability, setAvailability] = useState("");
  const [tag, setTag] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [error, setError] = useState("");
  const [showFilters, setShowFilters] = useState(window.innerWidth > 900);

  useEffect(() => {
    fetch("/products/")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data.products)) setProducts(data.products);
        else if (Array.isArray(data)) setProducts(data);
        else setError("No se pudieron cargar los productos.");
      })
      .catch(() => setError("No se pudieron cargar los productos."));
  }, []);

  useEffect(() => {
    const onResize = () => setShowFilters(window.innerWidth > 900);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const brands = Array.from(new Set(products.map(p => p.brand).filter(Boolean)));
  const categories = Array.from(new Set(products.map(p => p.category).filter(Boolean)));
  const availabilities = Array.from(new Set(products.map(p => p.availabilityStatus).filter(Boolean)));
  const tags = Array.from(new Set(products.flatMap(p => p.tags || [])));

  const filtered = products.filter(p => {
    const q = search.toLowerCase();
    return (
      (!brand || p.brand === brand) &&
      (!category || p.category === category) &&
      (!availability || p.availabilityStatus === availability) &&
      (!tag || (p.tags && p.tags.includes(tag))) &&
      (!minPrice || p.price >= Number(minPrice)) &&
      (!maxPrice || p.price <= Number(maxPrice)) &&
      (
        p.title.toLowerCase().includes(q) ||
        (p.description && p.description.toLowerCase().includes(q)) ||
        (p.brand && p.brand.toLowerCase().includes(q)) ||
        (p.category && p.category.toLowerCase().includes(q))
      )
    );
  });

  if (error) return <div style={{ textAlign: "center", color: "#d32f2f" }}>{error}</div>;

  return (
    <section className="product-section">
      <button
        className="filters-toggle-btn"
        onClick={() => setShowFilters(f => !f)}
        style={{ display: window.innerWidth <= 900 ? "block" : "none" }}
      >
        {showFilters ? "Ocultar filtros" : "Mostrar filtros"}
      </button>
      {showFilters && (
        <div className="product-filters">
          <h3>Filtrar</h3>
          <label>
            Marca
            <select value={brand} onChange={e => setBrand(e.target.value)}>
              <option value="">Todas</option>
              {brands.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </label>
          <label>
            Categoría
            <select value={category} onChange={e => setCategory(e.target.value)}>
              <option value="">Todas</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </label>
          <label>
            Disponibilidad
            <select value={availability} onChange={e => setAvailability(e.target.value)}>
              <option value="">Todas</option>
              {availabilities.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </label>
          <label>
            Tag
            <select value={tag} onChange={e => setTag(e.target.value)}>
              <option value="">Todos</option>
              {tags.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </label>
          <label>
            Precio mínimo
            <input
              type="number"
              min="0"
              value={minPrice}
              onChange={e => setMinPrice(e.target.value)}
              placeholder="€"
            />
          </label>
          <label>
            Precio máximo
            <input
              type="number"
              min="0"
              value={maxPrice}
              onChange={e => setMaxPrice(e.target.value)}
              placeholder="€"
            />
          </label>
          {(brand || category || availability || tag || minPrice || maxPrice) && (
            <button
              type="button"
              className="product-filter-clear"
              onClick={() => {
                setBrand(""); setCategory(""); setAvailability(""); setTag(""); setMinPrice(""); setMaxPrice("");
              }}
            >
              Limpiar filtros
            </button>
          )}
        </div>
      )}
      <div className="product-main">
        <div className="product-search-bar">
          <span className="search-icon">🔍</span>
          <input
            className="product-search"
            type="text"
            placeholder="Buscar por nombre, marca o categoría..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="product-list">
          {filtered.map(p => {
            const hasDiscount = p.discountPercentage > 0;
            const originalPrice = hasDiscount
              ? (p.price / (1 - p.discountPercentage / 100))
              : p.price;
            return (
              <div className="product-card" key={p.id}>
                <img className="product-card-thumb" src={p.thumbnail} alt={p.title} />
                <div className="product-title">{p.title}</div>
                <div className="product-price-row">
                  <span className="product-price">{p.price.toFixed(2)} €</span>
                  {hasDiscount && (
                    <>
                      <span className="product-discount">-{p.discountPercentage}%</span>
                      <span className="product-original-price">{originalPrice.toFixed(2)} €</span>
                    </>
                  )}
                </div>
                <button
                  className="product-detail-btn"
                  onClick={() => onShowDetail(p.id)}
                >
                  Ver detalle
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}