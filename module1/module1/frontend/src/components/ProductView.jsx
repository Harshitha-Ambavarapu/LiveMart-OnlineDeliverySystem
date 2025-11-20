import React from "react";
import productService from "../services/productService";

export default function ProductView({ open, product, onClose, onSave }) {
  if (!open || !product) return null;

  const [price, setPrice] = React.useState(product.price);
  const [quantity, setQuantity] = React.useState(product.quantity);

  async function saveChanges() {
    await onSave(product._id, { price, quantity });
  }

  return (
    <div className="modal-backdrop" style={backdrop}>
      <div className="modal-box" style={box}>
        <h3>{product.title}</h3>

        <div className="d-flex gap-2 flex-wrap mt-2">
          {product.images?.map((img, i) => (
            <img
              key={i}
              src={img}
              alt=""
              style={{ width: 140, height: 140, objectFit: "cover", borderRadius: 6 }}
            />
          ))}
        </div>

        <p className="mt-2">{product.description}</p>
        <p>Category: {product.category}</p>

        <div className="mt-3">
          <label>Price</label>
          <input
            type="number"
            className="form-control"
            value={price}
            onChange={e => setPrice(e.target.value)}
          />

          <label className="mt-2">Quantity</label>
          <input
            type="number"
            className="form-control"
            value={quantity}
            onChange={e => setQuantity(e.target.value)}
          />
        </div>

        <div className="mt-3 d-flex gap-2">
          <button className="btn btn-success" onClick={saveChanges}>
            Save
          </button>
          <button className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

const backdrop = {
  position: "fixed",
  top: 0, left: 0, width: "100%", height: "100%",
  background: "rgba(0,0,0,0.6)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 999
};

const box = {
  background: "#fff",
  padding: 20,
  borderRadius: 10,
  width: 400,
  maxHeight: "80vh",
  overflowY: "auto"
};
