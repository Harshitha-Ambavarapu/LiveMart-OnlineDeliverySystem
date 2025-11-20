// frontend/src/pages/CartPage.jsx
import React from 'react';
import cartService from '../services/cartService';

export default function CartPage() {
  const [cart, setCart] = React.useState({ items: [] });
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => { fetchCart(); }, []);

  async function fetchCart() {
    setLoading(true);
    try {
      const res = await cartService.getCart();
      setCart(res.data.cart || { items: [] });
    } catch (err) {
      console.error(err);
    } finally { setLoading(false); }
  }

  async function changeQty(productId, qty) {
    try {
      await cartService.updateCartItem(productId, qty);
      await fetchCart();
    } catch (e) { console.error(e); }
  }

  async function remove(productId) {
    if (!window.confirm('Remove item?')) return;
    try {
      await cartService.removeCartItem(productId);
      await fetchCart();
    } catch (e) { console.error(e); }
  }

  function subtotal() {
    return cart.items.reduce((s, it) => s + ((it.priceAtAdd || it.product?.price || 0) * it.quantity), 0);
  }

  return (
    <div className="container mt-3">
      <h2>Your Cart</h2>
      {loading && <div>Loading...</div>}
      <div>
        {cart.items.length === 0 && <div>Your cart is empty</div>}
        {cart.items.map(it => (
          <div key={String(it.product._id || it.product)} className="d-flex align-items-center justify-content-between border p-2 mb-2">
            <div style={{display:'flex',gap:12,alignItems:'center'}}>
              <img src={it.product?.images?.[0] || ''} alt="" style={{ width: 80, height:80, objectFit:'cover', borderRadius:6 }} />
              <div>
                <div className="fw-bold">{it.product?.title || 'Product'}</div>
                <div>₹ {it.priceAtAdd}</div>
              </div>
            </div>

            <div style={{display:'flex',alignItems:'center',gap:8}}>
              <input type="number" min="1" value={it.quantity} onChange={e=>changeQty(it.product._id, Math.max(1, Number(e.target.value)))} style={{width:80}} />
              <button className="btn btn-sm btn-danger" onClick={()=>remove(it.product._id)}>Remove</button>
            </div>
          </div>
        ))}

        {cart.items.length > 0 && (
          <div className="mt-3">
            <h4>Subtotal: ₹ {subtotal()}</h4>
            <button className="btn btn-success" onClick={()=>alert('Implement checkout flow')}>Proceed to Checkout</button>
            <button className="btn btn-outline-secondary ms-2" onClick={()=>cartService.clearCart().then(fetchCart)}>Clear Cart</button>
          </div>
        )}
      </div>
    </div>
  );
}
