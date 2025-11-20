import React from 'react';
import productService from '../services/productService';
import ProductCard from '../components/ProductCard';
import '../styles.css';

export default function CustomerPage(){
  const [products, setProducts] = React.useState([]);
  const [cart, setCart] = React.useState([]);

  React.useEffect(()=> { fetchProducts(); }, []);

  async function fetchProducts(){
    try {
      const res = await productService.listProducts('customer');
      setProducts(res.data.products || []);
    } catch (e) {
      console.error('fetchProducts', e);
    }
  }

  function addToCart(product){
    setCart(c => [...c, { productId: product._id, title: product.title, price: product.price, qty: 1 }]);
    alert('Added to cart');
  }

  return (
    <div style={{ maxWidth: 1100, margin: '28px auto' }}>
      <div className="card p-4 shadow-lg">
        <h2 className="mb-3">Customer — Browse Products</h2>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))', gap:16 }}>
          {products.length === 0 && <div style={{padding:20}}>No products available</div>}
          {products.map(p => (
            <ProductCard key={p._id} product={p} showAddToCart onAdd={()=>addToCart(p)} />
          ))}
        </div>

        <hr style={{margin:'20px 0'}} />
        <h4>Cart ({cart.length})</h4>
        <div>
          {cart.map((it,idx)=> <div key={idx}>{it.title} — ₹{it.price} x {it.qty}</div>)}
        </div>
      </div>
    </div>
  );
}
