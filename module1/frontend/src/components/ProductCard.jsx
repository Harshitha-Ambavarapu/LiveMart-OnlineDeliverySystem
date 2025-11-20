import React from "react";

export default function ProductCard({
  product,
  onApprove,
  onDelete,
  onView,
  onToggleVisible,
  onAddToCart   // this is enough to show Add to Cart
}) {
  return (
    <div className="card p-2 shadow-sm" style={{ borderRadius: 10 }}>
      <div style={{
        height: 140,
        display: "flex",
        justifyContent: "center",
        alignItems: "center"
      }}>
        {product.images?.[0] ? (
          <img
            src={product.images[0]}
            alt={product.title}
            style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "cover" }}
          />
        ) : (
          <div>No Image</div>
        )}
      </div>

      <h5 className="mt-2">{product.title}</h5>
      <p className="m-0 text-muted">{product.category}</p>
      <p className="fw-bold mt-1">₹ {product.price}</p>

      <div className="d-flex flex-column gap-2 mt-2">

        {onView && (
          <button
            className="btn btn-sm btn-success"
            onClick={() => onView(product._id)}
          >
            View
          </button>
        )}

        {onApprove && (
          <div className="d-flex gap-2">
            <button
              className="btn btn-sm btn-success"
              onClick={() => onApprove(product._id, "approve")}
            >
              Approve
            </button>
            <button
              className="btn btn-sm btn-outline-secondary"
              onClick={() => onApprove(product._id, "reject")}
            >
              Reject
            </button>
          </div>
        )}

        {onToggleVisible && (
          <button
            className="btn btn-sm btn-warning"
            onClick={() =>
              onToggleVisible(product._id, !product.visibleToCustomer)
            }
          >
            {product.visibleToCustomer ? "Hide from Customer" : "Show to Customer"}
          </button>
        )}

        {/* ADD TO CART BUTTON — visible if parent passes handler */}
        {onAddToCart && (
          <button
            className="btn btn-sm btn-primary"
            onClick={() => onAddToCart(product._id)}
          >
            Add to cart
          </button>
        )}

        {onDelete && (
          <button
            className="btn btn-sm btn-danger"
            onClick={() => onDelete(product._id)}
          >
            Delete
          </button>
        )}
      </div>
    </div>
  );
}
