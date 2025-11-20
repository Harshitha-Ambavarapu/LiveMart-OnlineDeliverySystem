// frontend/src/pages/WholesalerDashboard.jsx
import React from "react";
import ProductForm from "../components/ProductForm";
import ProductCard from "../components/ProductCard";
import productService from "../services/productService";

export default function WholesalerDashboard() {
  const rawUser = localStorage.getItem("user");
  const user = rawUser ? JSON.parse(rawUser) : null;
  const userId = user?.id || user?._id;

  const [products, setProducts] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    fetchList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchList() {
    setLoading(true);
    setError(null);
    try {
      const res = await productService.listProducts("wholesaler");
      setProducts(res.data.products || []);
    } catch (err) {
      console.error("fetchList error:", err);
      setError(err?.response?.data?.error || err.message || "Failed to load");
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }

  async function addProduct(formData) {
    try {
      await productService.createProduct(formData);
      await fetchList();
      alert("Product added");
    } catch (err) {
      console.error("addProduct error:", err);
      alert("Failed to add product: " + (err?.response?.data?.error || err.message));
    }
  }

  async function deleteProduct(id) {
    try {
      await productService.deleteProduct(id);
      await fetchList();
    } catch (err) {
      console.error("deleteProduct error:", err);
      alert("Failed to delete");
    }
  }

  return (
    <div className="container mt-3">
      <h2>Wholesaler Dashboard</h2>

      <ProductForm onSubmit={addProduct} />

      <hr />

      {loading && <div>Loading products...</div>}
      {error && <div className="text-danger">Error: {error}</div>}

      <div className="grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12 }}>
        {products.map(p => (
          <ProductCard
            key={p._id || p.id}
            product={p}
            onView={null}
            onDelete={ String(p.owner) === String(userId) ? async (id) => {
              if (!window.confirm("Delete product?")) return;
              await deleteProduct(id);
            } : null}
          />
        ))}
      </div>
    </div>
  );
}
