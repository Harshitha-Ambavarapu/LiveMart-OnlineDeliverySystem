import React, { useEffect, useState } from "react";
import axios from "axios";
import { API_BASE_URL } from "./api";
import 'bootstrap/dist/css/bootstrap.min.css';

function App() {
  // STATES
  const [searchKeyword, setSearchKeyword] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [inStock, setInStock] = useState(false);
  const [quantity, setQuantity] = useState("");

  const [searchResults, setSearchResults] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [discountedItems, setDiscountedItems] = useState([]);
  const [nearbyItems, setNearbyItems] = useState([]);

  const [userLocation, setUserLocation] = useState(null);

  // SMART SEARCH
  const searchItems = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/search`, {
        params: {
          keyword: searchKeyword || undefined,
          minPrice: minPrice || undefined,
          maxPrice: maxPrice || undefined,
          quantity: quantity || undefined,
          inStock: inStock ? "true" : undefined,
        },
      });
      setSearchResults(res.data);
    } catch (err) {
      console.log("Search error:", err);
    }
  };

  // DISCOUNTS
  const getDiscountedItems = async () => {
    const res = await axios.get(`${API_BASE_URL}/api/discounts`);
    setDiscountedItems(res.data);
  };

  // RECOMMENDATIONS
  const getRecommendations = async () => {
    const res = await axios.get(`${API_BASE_URL}/api/recommend`, {
      params: { userId: "user123" },
    });
    setRecommendations(res.data);
  };

  // NEARBY SHOPS
  const getNearbyItems = async (lat, lon) => {
    const res = await axios.get(`${API_BASE_URL}/api/nearby`, {
      params: {
        lat,
        lon,
        maxDistance: 5, // 5 km radius
      },
    });
    setNearbyItems(res.data);
  };

  // USER LOCATION
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition((pos) => {
        const { latitude, longitude } = pos.coords;
        setUserLocation({ lat: latitude, lon: longitude });
        getNearbyItems(latitude, longitude);
      });
    }
  }, []);

  // LOAD ON START
  useEffect(() => {
    getRecommendations();
    getDiscountedItems();
  }, []);

  return (
    <div className="container py-4">

      {/* HEADER */}
      <h1 className="text-center mb-4">🛒 LiveMART</h1>

      {/* SEARCH + FILTER CARD */}
      <div className="card p-4 mb-4 shadow">

        <h4>Search Items</h4>

        <div className="input-group mb-3">
          <span className="input-group-text">🔍</span>
          <input
            type="text"
            className="form-control"
            placeholder="Search for rice, oil, sugar…"
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
          />
          <button className="btn btn-primary" onClick={searchItems}>
            Search
          </button>
        </div>

        <h5 className="mt-3">Filters</h5>

        <div className="row g-3">

          <div className="col-md-3">
            <input
              type="number"
              className="form-control"
              placeholder="Min Price"
              onChange={(e) => setMinPrice(e.target.value)}
            />
          </div>

          <div className="col-md-3">
            <input
              type="number"
              className="form-control"
              placeholder="Max Price"
              onChange={(e) => setMaxPrice(e.target.value)}
            />
          </div>

          <div className="col-md-3">
            <input
              type="number"
              className="form-control"
              placeholder="Min Quantity"
              onChange={(e) => setQuantity(e.target.value)}
            />
          </div>

          <div className="col-md-3 d-flex align-items-center">
            <input
              type="checkbox"
              className="form-check-input me-2"
              onChange={(e) => setInStock(e.target.checked)}
            />
            <label>In Stock Only</label>
          </div>
        </div>
      </div>

      {/* SEARCH RESULTS */}
      <h3>🔎 Search Results</h3>
      <div className="row">
        {searchResults.map((item) => (
          <div className="col-md-4" key={item._id}>
            <div className="card p-3 mb-3 shadow-sm">
              <h5>{item.name}</h5>
              <p>{item.description}</p>
              <span className="badge bg-primary">₹{item.price}</span>
              <span className="badge bg-danger ms-2">{item.discountPercent}% off</span>
            </div>
          </div>
        ))}
      </div>

      <hr />

      {/* RECOMMENDATIONS */}
      <h3>⭐ Recommended for You</h3>
      <div className="row">
        {recommendations.map((item) => (
          <div className="col-md-4" key={item._id}>
            <div className="card p-3 mb-3 shadow-sm">
              <h5>{item.name}</h5>
              <span className="badge bg-success">₹{item.price}</span>
            </div>
          </div>
        ))}
      </div>

      <hr />

      {/* DISCOUNTED ITEMS */}
      <h3>🔥 Discounted Items</h3>
      <div className="row">
        {discountedItems.map((item) => (
          <div className="col-md-4" key={item._id}>
            <div className="card p-3 mb-3 shadow-sm border-danger">
              <h5>{item.name}</h5>
              <span className="badge bg-danger">{item.discountPercent}% OFF</span>
            </div>
          </div>
        ))}
      </div>

      <hr />

      {/* NEARBY SHOPS */}
      <h3>📍 Shops Near You (within 5 km)</h3>
      <div className="row">
        {nearbyItems.map((item) => (
          <div className="col-md-4" key={item._id}>
            <div className="card p-3 mb-3 shadow-sm border-info">
              <h5>{item.name}</h5>
              <p className="text-muted">Available nearby</p>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}

export default App;
