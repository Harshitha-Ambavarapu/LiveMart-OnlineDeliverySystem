// frontend/src/services/productService.js
import API from "./api";

// Create product (FormData) — do NOT set Content-Type manually
export function createProduct(payload) {
  return API.post("/api/products", payload);
}

// List products (view = wholesaler | retailer | customer)
export function listProducts(view) {
  return API.get("/api/products", { params: { view } });
}

// Approve / Reject wholesaler product
export function updateApproval(id, action) {
  // Using PUT to update approval state
  return API.put(`/api/products/${id}/approval`, { action });
}

// Update retailer product (price, quantity, title…)
export function updateProduct(id, data) {
  return API.put(`/api/products/${id}`, data);
}

// Toggle visibility (retailer only)
export function toggleVisible(id, visible) {
  return API.put(`/api/products/${id}/visible`, { visible });
}

// Delete product (soft delete)
export function deleteProduct(id) {
  return API.delete(`/api/products/${id}`);
}

// Get single product for VIEW modal
export function getProduct(id) {
  return API.get(`/api/products/${id}`);
}

export default {
  createProduct,
  listProducts,
  updateApproval,
  updateProduct,
  toggleVisible,
  deleteProduct,
  getProduct
};
