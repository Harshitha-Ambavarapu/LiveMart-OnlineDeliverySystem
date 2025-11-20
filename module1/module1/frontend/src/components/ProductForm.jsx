import React from "react";

export default function ProductForm({ onSubmit }) {
  const [state, setState] = React.useState({
    title: "",
    description: "",
    price: "",
    quantity: "",
    category: "",
    images: [],
    rawFiles: []
  });

  function handleFiles(e) {
    const files = Array.from(e.target.files);
    setState(s => ({
      ...s,
      rawFiles: [...s.rawFiles, ...files],
      images: [...s.images, ...files.map(f => URL.createObjectURL(f))]
    }));
  }

  async function submit(e) {
    e.preventDefault();
    const form = new FormData();

    ["title", "description", "price", "quantity", "category"].forEach(k =>
      form.append(k, state[k])
    );

    state.rawFiles.forEach(f => form.append("images", f));

    await onSubmit(form);

    // reset
    setState({
      title: "",
      description: "",
      price: "",
      quantity: "",
      category: "",
      images: [],
      rawFiles: []
    });
  }

  return (
    <form onSubmit={submit}>
      <div className="row">
        <div className="col">
          <input className="form-control"
            placeholder="Product Name"
            value={state.title}
            onChange={e => setState({ ...state, title: e.target.value })}
            required
          />
        </div>

        <div className="col">
          <input className="form-control"
            placeholder="Category"
            value={state.category}
            onChange={e => setState({ ...state, category: e.target.value })}
          />
        </div>
      </div>

      <div className="row mt-2">
        <div className="col">
          <input className="form-control"
            placeholder="Price"
            type="number"
            value={state.price}
            onChange={e => setState({ ...state, price: e.target.value })}
            required
          />
        </div>

        <div className="col">
          <input className="form-control"
            placeholder="Quantity"
            type="number"
            value={state.quantity}
            onChange={e => setState({ ...state, quantity: e.target.value })}
            required
          />
        </div>
      </div>

      <textarea className="form-control mt-2"
        placeholder="Description"
        value={state.description}
        onChange={e => setState({ ...state, description: e.target.value })}
      />

      <div className="mt-2">
        <label><b>Images</b></label>
        <input type="file" multiple accept="image/*"
          className="form-control"
          onChange={handleFiles}
        />

        <div className="d-flex gap-2 mt-2 flex-wrap">
          {state.images.map((img, i) =>
            <img key={i} src={img} alt=""
              style={{ width: 80, height: 80, objectFit: "cover", borderRadius: 6 }}
            />
          )}
        </div>
      </div>

      <button className="btn btn-dark mt-3">Add Product</button>
    </form>
  );
}
