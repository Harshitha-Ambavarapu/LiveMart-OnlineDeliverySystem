// frontend/src/pages/Register.jsx
import React from "react";
import API from "../services/api";
import OTPModal from "../components/OTPModal";
import SocialButtons from "../components/SocialButtons";

export default function Register() {
  const [form, setForm] = React.useState({
    name: "",
    email: "",
    phone: "",
    role: "Customer",
    address: "",
    lat: "",
    lng: "",
    placeId: "",
  });
  const [otpState, setOtpState] = React.useState({
    open: false,
    otpId: null,
    userId: null,
  });
  const [status, setStatus] = React.useState({ type: "", text: "" });

  React.useEffect(() => {
    if (!window.google || !window.google.maps) return;
    const input = document.getElementById("address-input");
    if (!input) return;
    const autocomplete = new window.google.maps.places.Autocomplete(input, {
      types: ["geocode"],
    });
    autocomplete.addListener("place_changed", () => {
      const place = autocomplete.getPlace();
      if (!place.geometry) return;
      setForm((f) => ({
        ...f,
        address: place.formatted_address,
        lat: place.geometry.location.lat(),
        lng: place.geometry.location.lng(),
        placeId: place.place_id,
      }));
    });
  }, []);

  const buildRequestPayload = () => ({
    name: form.name ? String(form.name).trim() : undefined,
    email: form.email ? String(form.email).toLowerCase().trim() : undefined,
    phone: form.phone ? String(form.phone).trim() : undefined,
    role: form.role || "Customer",
    location: {
      address: form.address || "",
      lat: form.lat || undefined,
      lng: form.lng || undefined,
      placeId: form.placeId || "",
    },
  });

  const requestOtp = async (e) => {
    e.preventDefault();
    setStatus({ type: "info", text: "Sending OTP..." });
    try {
      const payload = buildRequestPayload();
      if (!payload.email) {
        setStatus({ type: "danger", text: "Please enter a valid email." });
        return;
      }
      const res = await API.post("/api/auth/request-otp", payload);

      localStorage.setItem(
        "signupData",
        JSON.stringify({
          name: payload.name,
          email: payload.email,
          phone: payload.phone,
          role: payload.role,
          address: payload.location,
        })
      );

      const userId = res?.data?.userId || (res?.data?.user && res.data.user._id) || null;
      const otpId = res?.data?.otpId || null;
      const devOtp = res?.data?.otp || null;
      if (devOtp) console.log("[debug] OTP from backend:", devOtp);

      setOtpState({ open: true, otpId, userId });
      setStatus({ type: "success", text: "OTP sent successfully!" });
    } catch (err) {
      console.error("[requestOtp] error:", err?.response?.data || err?.message || err);
      setStatus({
        type: "danger",
        text:
          err?.response?.data?.error ||
          err?.response?.data?.msg ||
          err?.response?.data?.message ||
          "Error sending OTP",
      });
    }
  };

  const handleVerify = async ({ otp, otpId, userId }) => {
    try {
      const signupData = JSON.parse(localStorage.getItem("signupData") || "{}");
      const email = signupData.email;
      if (!email) {
        setStatus({ type: "danger", text: "Missing signup email. Please request OTP again." });
        return;
      }

      const payload = {
        email: String(email).toLowerCase().trim(),
        code: String(otp).trim()
      };

      const res = await API.post("/api/auth/verify-otp", payload);

      if (res?.data?.token) localStorage.setItem("token", res.data.token);
      if (res?.data?.user) localStorage.setItem("user", JSON.stringify(res.data.user));

      setOtpState({ open: false, otpId: null, userId: null });
      setStatus({ type: "success", text: "Verified successfully!" });
      setTimeout(() => (window.location.href = "/"), 700);
    } catch (err) {
      console.error("[handleVerify] error:", err?.response?.data || err?.message || err);
      setStatus({
        type: "danger",
        text:
          err?.response?.data?.error ||
          err?.response?.data?.msg ||
          err?.response?.data?.message ||
          "Verification failed",
      });
    }
  };

  return (
<div
  className="d-flex align-items-center justify-content-center"
  style={{
    minHeight: "100vh",
    background: "#f2f2f2",     // Uber light grey
  }}
>
      <div
        className="card p-4 shadow-lg"
        style={{
          width: "90%",
          maxWidth: "800px",
          borderRadius: "1rem",
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.8) 100%)",
          backdropFilter: "blur(10px)",
        }}
      >
        <h2
  className="text-center mb-4 fw-bold"
  style={{
    color: "#000",      // Pure black
  }}
>
  LiveMart — Register / Sign Up
</h2>

        <form onSubmit={requestOtp} className="row g-3">
          <div className="col-md-6">
            <label className="form-label fw-semibold">Role</label>
            <select
              className="form-select"
              value={form.role}
              onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
            >
              <option>Customer</option>
              <option>Retailer</option>
              <option>Consumer</option>
            </select>
          </div>

          <div className="col-md-6">
            <label className="form-label fw-semibold">Full Name</label>
            <input
              required
              className="form-control"
              placeholder="Enter your name"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
          </div>

          <div className="col-md-6">
            <label className="form-label fw-semibold">Email Address</label>
            <input
              type="email"
              required
              className="form-control"
              placeholder="Enter your email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            />
          </div>

          <div className="col-md-6">
            <label className="form-label fw-semibold">Phone Number</label>
            <input
              className="form-control"
              placeholder="Optional"
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            />
          </div>

          <div className="col-12">
            <label className="form-label fw-semibold">Address (Optional)</label>
            <input
              id="address-input"
              className="form-control"
              placeholder="Search your address"
              value={form.address}
              onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
            />
          </div>

          <div className="d-flex justify-content-center gap-3 mt-3">
            <button className="btn btn-primary px-4">Send OTP</button>
            <button
              type="button"
              className="btn btn-outline-secondary px-4"
              onClick={() => {
                setForm({
                  name: "",
                  email: "",
                  phone: "",
                  role: "Customer",
                  address: "",
                  lat: "",
                  lng: "",
                  placeId: "",
                });
                setStatus({ type: "", text: "" });
              }}
            >
              Reset
            </button>
          </div>
        </form>

        <div className="text-center mt-4">
          <p className="mb-2 fw-semibold">Or sign up using social login:</p>
          <div className="d-flex justify-content-center gap-2">
            <SocialButtons />
          </div>
        </div>

        {status.text && (
          <div
            className={`alert mt-3 text-center alert-${status.type === "info" ? "secondary" : status.type}`}
          >
            {status.text}
          </div>
        )}

        <OTPModal
          open={otpState.open}
          otpId={otpState.otpId}
          userId={otpState.userId}
          onClose={() => setOtpState({ open: false, otpId: null, userId: null })}
          onVerify={handleVerify}
        />
      </div>
    </div>
  );
}
