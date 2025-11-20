// src/components/ProductView.jsx
import React from "react";
import { useParams } from "react-router-dom";
import productService from "../services/productService"; // adjust path if needed
import ProductCard from "./ProductCard"; // optional

export default function ProductView() {
  // 1) Hooks ALWAYS at top level
  const { id } = useParams();                 // route param
  const [product, setProduct] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const [qty, setQty] = React.useState(1);

  React.useEffect(() => {
    let cancelled = false;
    async function fetchProduct() {
      try {
        setLoading(true);
        const res = await productService.getProduct(id); // adapt to your api
        if (!cancelled) {
          setProduct(res.data || res); // depending on shape
          setError(null);
        }
      } catch (err) {
        if (!cancelled) setError(err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    if (id) fetchProduct();
    else setLoading(false);

    return () => {
      cancelled = true;
    };
  }, [id]);

  // 2) Now conditionally render based on state (hooks already declared)
  if (loading) return <div>Loading product...</div>;
  if (error) return <div>Error loading product.</div>;
  if (!product) return <div>Product not found.</div>;

  // 3) safe render
  return (
    <div className="product-view">
      <h2>{product.name}</h2>
      <p>Price: ₹{product.price}</p>
      <p>Stock: {product.countInStock ?? product.stock}</p>

      <div>
        <label>Qty</label>
        <select value={qty} onChange={(e) => setQty(Number(e.target.value))}>
          {Array.from({ length: Math.min(10, product.countInStock || 10) }).map((_, i) => (
            <option key={i+1} value={i+1}>{i+1}</option>
          ))}
        </select>
      </div>

      <button
        disabled={(product.countInStock || 0) === 0}
        onClick={() => {
          // Add to cart logic here (call cartService or history push)
          console.log("add to cart", product._id || product.id, qty);
        }}
      >
        Add to cart
      </button>

      {/* optional: show product card or details */}
      <ProductCard product={product} />
    </div>
  );
}
