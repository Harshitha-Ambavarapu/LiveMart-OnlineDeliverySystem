// frontend/src/pages/RetailerDashboard.jsx
import React from "react";
import ProductForm from "../components/ProductForm";
import ProductCard from "../components/ProductCard";
import ProductView from "../components/ProductView";
import productService from "../services/productService";

export default function RetailerDashboard() {
  const rawUser = localStorage.getItem("user");
  const user = rawUser ? JSON.parse(rawUser) : null;
  const userId = user?.id || user?._id;

  const [products, setProducts] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);

  const [viewOpen, setViewOpen] = React.useState(false);
  const [viewProduct, setViewProduct] = React.useState(null);

  React.useEffect(() => {
    fetchList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchList() {
    setLoading(true);
    setError(null);
    try {
      const res = await productService.listProducts("retailer");
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

  async function approve(id, action) {
    try {
      await productService.updateApproval(id, action);
      await fetchList();
    } catch (err) {
      console.error("approve error:", err);
      alert("Failed to update approval");
    }
  }

  async function toggleVisible(id, visible) {
    try {
      await productService.toggleVisible(id, visible);
      await fetchList();
    } catch (err) {
      console.error("toggleVisible error:", err);
      alert("Failed to change visibility");
    }
  }

  async function openView(id) {
    try {
      const res = await productService.getProduct(id);
      setViewProduct(res.data.product);
      setViewOpen(true);
    } catch (err) {
      console.error("openView error:", err);
      alert("Failed to fetch product details");
    }
  }

  async function saveChanges(id, data) {
    try {
      await productService.updateProduct(id, data);
      setViewOpen(false);
      await fetchList();
    } catch (err) {
      console.error("saveChanges error:", err);
      alert("Failed to save changes");
    }
  }

  // helper for owner check (ObjectId or string)
  function isOwner(product) {
    if (!product || !userId) return false;
    const owner = product.owner || product.owner?.toString?.() || product.owner;
    return String(owner) === String(userId);
  }

  return (
    <div className="container mt-3">
      <h2>Retailer Dashboard</h2>

      <ProductForm onSubmit={addProduct} />

      <hr />

      {loading && <div>Loading products...</div>}
      {error && <div className="text-danger">Error: {error}</div>}

      <div className="grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12 }}>
        {products.map(p => (
          <ProductCard
            key={p._id || p.id}
            product={p}
            onApprove={p.sourceWholesaler && p.status === "pending" ? approve : null}
            onToggleVisible={ isOwner(p) ? toggleVisible : null }
            onView={openView}
            onDelete={ isOwner(p) ? async (id) => { 
              if (!window.confirm("Delete this product?")) return;
              try { await productService.deleteProduct(id); await fetchList(); }
              catch (e) { console.error(e); alert("Failed to delete"); }
            } : null}
          />
        ))}
      </div>

      <ProductView
        open={viewOpen}
        product={viewProduct}
        onClose={() => setViewOpen(false)}
        onSave={saveChanges}
      />
    </div>
  );
}
