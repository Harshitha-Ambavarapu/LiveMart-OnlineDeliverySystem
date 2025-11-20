// frontend/src/services/cartService.js
import API from './api';

export function getCart() {
  return API.get('/api/cart');
}

export function addToCart(productId, quantity = 1) {
  return API.post('/api/cart/add', { productId, quantity });
}

export function updateCartItem(productId, quantity) {
  return API.put(`/api/cart/item/${productId}`, { quantity });
}

export function removeCartItem(productId) {
  return API.delete(`/api/cart/item/${productId}`);
}

export function clearCart() {
  return API.delete('/api/cart/clear');
}

export default { getCart, addToCart, updateCartItem, removeCartItem, clearCart };
