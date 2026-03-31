import React, { useState } from "react";
import DonorLayout from "./DonorLayout";
import "../../styles/donor-dashboard.css";
import { apiRequest, getAuthToken } from "../../utils/api";

export default function DonorAddFood() {
  const user = JSON.parse(sessionStorage.getItem("currentUser"));
  const token = getAuthToken();

  const [name, setName] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [quantityValue, setQuantityValue] = useState("");
  const [quantityUnit, setQuantityUnit] = useState("kg");
  const [address, setAddress] = useState("");
  const [imagePreview, setImagePreview] = useState("");
  const [imageData, setImageData] = useState("");
  const [location, setLocation] = useState(null);
  const [isLocating, setIsLocating] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (limit: 500 KB)
    if (file.size > 500 * 1024) {
      alert("Image size should be less than 500KB.");
      e.target.value = ""; // Clear the input
      setImagePreview("");
      setImageData("");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      setImagePreview(result);
      setImageData(result);
    };
    reader.readAsDataURL(file);
  };

  const handleUseLocation = () => {
    setError("");
    if (!navigator.geolocation) {
      setError("Geolocation is not supported in this browser.");
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      () => {
        setIsLocating(false);
        setError("Unable to fetch location. Please check permissions.");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const addItem = () => {
    setError("");
    setStatus("");

    if (!name.trim() || !expiryDate || !quantityValue || !address.trim()) {
      setError("Please fill all required fields (name, expiry, quantity, address).");
      return;
    }

    const quantity = Number(quantityValue);
    if (!Number.isFinite(quantity) || quantity <= 0) {
      setError("Quantity must be greater than 0.");
      return;
    }

    if (!token) {
      setError("Please login again.");
      return;
    }

    apiRequest("/api/food/add", {
      method: "POST",
      token,
      body: {
        name: name.trim(),
        quantity,
        unit: quantityUnit,
        expiryDate,
        address: address.trim(),
        imageUrl: imageData || "",
        location,
      },
    })
      .then((data) => {
        setName("");
        setExpiryDate("");
        setQuantityValue("");
        setQuantityUnit("kg");
        setAddress("");
        setImagePreview("");
        setImageData("");
        setLocation(null);
        setStatus("Food item added successfully.");
      })
      .catch((err) => {
        setError(err?.message || "Failed to add food item");
      });

  };

  return (
    <DonorLayout user={user} active="add">
      <section className="donor-grid">
        <div className="dash-card donor-form-card" style={{ gridColumn: "1 / -1" }}>
          <h2>Add food items</h2>
          <p className="donor-section-subtitle">
            Add details manually. QR code stores full food details (name, expiry,
            quantity, address, and location).
          </p>

          {error && <p className="auth-error">{error}</p>}
          {status && (
            <p className="donor-section-subtitle" style={{ color: "#2e7d32" }}>
              <strong>{status}</strong>
            </p>
          )}

          <div className="donor-form-grid">
            <div className="donor-field-group">
              <span className="donor-label">Product name</span>
              <input
                className="donor-input"
                placeholder="e.g. Fresh milk 1L"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="donor-field-group">
              <span className="donor-label">Expiry date</span>
              <input
                className="donor-input"
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
              />
            </div>

            <div className="donor-field-group">
              <span className="donor-label">Quantity</span>
              <div className="donor-quantity-row">
                <input
                  className="donor-input"
                  type="number"
                  min="0"
                  step="0.1"
                  placeholder="Amount"
                  value={quantityValue}
                  onChange={(e) => setQuantityValue(e.target.value)}
                />
                <select
                  className="donor-select"
                  value={quantityUnit}
                  onChange={(e) => setQuantityUnit(e.target.value)}
                >
                  <option value="kg">KG</option>
                  <option value="g">Gram</option>
                  <option value="packet">Packet</option>
                  <option value="piece">Piece</option>
                </select>
              </div>
            </div>

            <div className="donor-field-group">
              <span className="donor-label">Product image</span>
              <div className="donor-upload-row">
                <input type="file" accept="image/*" onChange={handleImageChange} />
                {imagePreview && (
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="donor-upload-preview"
                  />
                )}
              </div>
            </div>

            <div className="donor-field-group" style={{ gridColumn: "1 / -1" }}>
              <span className="donor-label">Pickup address</span>
              <textarea
                className="donor-textarea"
                placeholder="Enter address where receiver will collect the food."
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>

            <div className="donor-field-group" style={{ gridColumn: "1 / -1" }}>
              <span className="donor-label">Share live location (map)</span>
              <button
                type="button"
                className="donor-secondary-btn"
                onClick={handleUseLocation}
                disabled={isLocating}
              >
                {isLocating ? "Fetching location…" : "Use my current location"}
              </button>
              {location && (
                <div className="donor-location-map">
                  <iframe
                    title="Pickup location"
                    src={`https://www.google.com/maps?q=${location.lat},${location.lng}&z=15&output=embed`}
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </div>
              )}
            </div>
          </div>

          <button type="button" className="donor-primary-btn full" onClick={addItem}>
            Add food item
          </button>
        </div>
      </section>
    </DonorLayout>
  );
}

