import React, { useEffect, useState } from "react";
import { useCart } from "../context/CartContext";

function formatDimensions(dim) {
  if (!dim) return "";
  return `${dim.width} × ${dim.height} × ${dim.depth} cm`;
}

function StarRating({ rating }) {
  const stars = Math.round(rating);
  return (
    <span style={{ color: "#FFD600", fontSize: "1.1rem" }}>
      {"★".repeat(stars)}
      {"☆".repeat(5 - stars)}
    </span>
  );
}

export default function ProductDetail({ productId, onClose }) {
  const [product, setProduct] = useState(null);
  const [selectedImg, setSelectedImg] = useState(0);
  const { addToCart } = useCart();

  useEffect(() => {
    fetch(`/products/${productId}`)
      .then(res => res.json())
      .then(data => {
        setProduct(data);
        setSelectedImg(0);
      });
  }, [productId]);

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  if (!product) return <div style={{ textAlign: "center" }}>Cargando...</div>;

  const images = product.images && product.images.length > 0
    ? product.images
    : [product.image || product.thumbnail];

  const originalPrice = product.discountPercentage
    ? (product.price / (1 - product.discountPercentage / 100))
    : product.price;

  return (
    <div className="product-detail-modal" onClick={onClose}>
      <div className="product-detail-content animate-in" onClick={e => e.stopPropagation()}>
        <button className="close-btn" onClick={onClose} title="Cerrar">×</button>
        <div className="pd-flex">
          <div className="pd-carousel">
            <div className="pd-thumbs-vertical">
              {images.map((img, i) => (
                <React.Fragment key={i}>
                  {!img ? (
                    <div className="pd-thumb-skeleton" />
                  ) : (
                    <img
                      src={img}
                      alt=""
                      className={`pd-thumb-vertical${selectedImg === i ? " selected" : ""}`}
                      onClick={() => setSelectedImg(i)}
                      style={{ opacity: img ? 1 : 0, transition: "opacity 0.3s" }}
                    />
                  )}
                </React.Fragment>
              ))}
            </div>
            <div className="pd-image-main">
              {!images[selectedImg] ? (
                <div className="pd-image-skeleton" />
              ) : (
                <img
                  src={images[selectedImg]}
                  alt={product.title}
                  className="pd-image"
                  onLoad={e => e.target.style.opacity = 1}
                  style={{ display: "block", opacity: 1, transition: "opacity 0.3s" }}
                />
              )}
            </div>
          </div>
          <div className="pd-info-col">
            <div className="pd-rating-row">
              <span className="pd-rating">
                <StarRating rating={product.rating} /> ({product.rating})
              </span>
              {product.reviews && product.reviews.length > 0 && (
                <span className="pd-reviews-count">
                  ({product.reviews.length} reseñas)
                </span>
              )}
            </div>
            <h2 className="pd-title">{product.title}</h2>
            <div className="pd-price-row">
              <span className="pd-price">{product.price.toFixed(2)} €</span>
              {product.discountPercentage > 0 && (
                <>
                  <span className="pd-discount">-{product.discountPercentage}%</span>
                  <span className="pd-original-price">{originalPrice.toFixed(2)} €</span>
                </>
              )}
            </div>
            <div className="pd-stock">
              {product.stock !== undefined && <div><b>Stock:</b> {product.stock}</div>}
              {product.brand && <div><b>Marca:</b> {product.brand}</div>}
              {product.category && <div><b>Categoría:</b> {product.category}</div>}
              {product.sku && <div><b>SKU:</b> {product.sku}</div>}
              {product.weight && <div><b>Peso:</b> {product.weight} g</div>}
              {product.dimensions && <div><b>Dimensiones:</b> {formatDimensions(product.dimensions)}</div>}
            </div>
            <button onClick={() => addToCart(product, 1)} className="product-detail-btn">Añadir al carrito</button>
            <div className="pd-extra">
              {product.availabilityStatus && <div><b>Disponibilidad:</b> {product.availabilityStatus}</div>}
              {product.shippingInformation && <div><b>Envío:</b> {product.shippingInformation}</div>}
              {product.warrantyInformation && <div><b>Garantía:</b> {product.warrantyInformation}</div>}
              {product.returnPolicy && <div><b>Devolución:</b> {product.returnPolicy}</div>}
            </div>
            {product.tags && product.tags.length > 0 && (
              <div className="product-tags" style={{ marginBottom: "1rem" }}>
                {product.tags.map(tag => (
                  <span className="product-tag-pill" key={tag}>{tag}</span>
                ))}
              </div>
            )}
          </div>
        </div>
        {product.reviews && product.reviews.length > 0 && (
          <div className="pd-reviews">
            <h3>Reseñas</h3>
            {product.reviews.map((r, i) => (
              <div key={i} className="pd-review">
                <StarRating rating={r.rating} />
                <span className="pd-review-comment">{r.comment}</span>
                <span className="pd-reviewer">{r.reviewerName}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}