import React, { useState } from "react";
import DonorLayout from "./DonorLayout";
import "../../styles/donor-dashboard.css";
import { apiRequest, getAuthToken } from "../../utils/api";

export default function DonorAddFood() {
  const user = JSON.parse(sessionStorage.getItem("currentUser"));
  const token = getAuthToken();

  const [name, setName] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [foodType, setFoodType] = useState("Cooked");
  const [cookedTime, setCookedTime] = useState("");
  const [quantityValue, setQuantityValue] = useState("");
  const [quantityUnit, setQuantityUnit] = useState("kg");
  const [address, setAddress] = useState("");
  const [imagePreview, setImagePreview] = useState("");
  const [imageData, setImageData] = useState("");
  const [location, setLocation] = useState(null);
  const [isLocating, setIsLocating] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  const [imageFile, setImageFile] = useState(null); // Track the actual file object

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (limit: 5 MB for cloud uploads)
    if (file.size > 5 * 1024 * 1024) {
      alert("Image size should be less than 5MB.");
      e.target.value = ""; // Clear the input
      setImagePreview("");
      setImageFile(null);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      setImagePreview(result);
      setImageFile(file); // Store the actual file for upload
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

    if (!name.trim() || !expiryDate || !quantityValue || !address.trim() || !imageFile || !location) {
      setError("Please provide all mandatory details including image and location.");
      return;
    }

    if (foodType === "Cooked" && !cookedTime) {
      setError("Please specify the exact cooked time for cooked food.");
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

    const formData = new FormData();
    formData.append("name", name.trim());
    formData.append("foodType", foodType);
    if (foodType === "Cooked") {
      formData.append("cookedTime", cookedTime);
    }
    formData.append("quantity", quantity);
    formData.append("unit", quantityUnit);
    formData.append("expiryDate", expiryDate);
    formData.append("address", address.trim());
    
    if (location) {
      formData.append("location", JSON.stringify(location));
    }
    
    if (imageFile) {
      formData.append("image", imageFile);
    }

    apiRequest("/api/food/add", {
      method: "POST",
      token,
      body: formData, // the modified utils/api.js handles FormData properly
    })
      .then((data) => {
        setName("");
        setExpiryDate("");
        setFoodType("Cooked");
        setCookedTime("");
        setQuantityValue("");
        setQuantityUnit("kg");
        setAddress("");
        setImagePreview("");
        setImageFile(null);
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
              <span className="donor-label">Product name *</span>
              <input
                className="donor-input"
                placeholder="e.g. Fresh milk 1L"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="donor-field-group">
              <span className="donor-label">Food Type & Safety *</span>
              <div className="donor-quantity-row" style={{ marginBottom: "10px" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "5px", cursor: "pointer", fontSize: "0.9rem" }}>
                  <input type="radio" name="foodType" value="Cooked" checked={foodType === "Cooked"} onChange={() => setFoodType("Cooked")} /> Cooked
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: "5px", cursor: "pointer", fontSize: "0.9rem" }}>
                  <input type="radio" name="foodType" value="Uncooked" checked={foodType === "Uncooked"} onChange={() => setFoodType("Uncooked")} /> Packaged / Raw
                </label>
              </div>
              {foodType === "Cooked" && (
                <div style={{ marginBottom: "15px" }}>
                  <span className="donor-label" style={{ fontSize: "0.85rem", color: "#d32f2f" }}>* When was it cooked?</span>
                  <input
                    className="donor-input"
                    type="datetime-local"
                    value={cookedTime}
                    onChange={(e) => setCookedTime(e.target.value)}
                  />
                </div>
              )}
            </div>

            <div className="donor-field-group">
              <span className="donor-label">Expiry date *</span>
              <input
                className="donor-input"
                type={foodType === "Cooked" ? "datetime-local" : "date"}
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
              />
            </div>

            <div className="donor-field-group">
              <span className="donor-label">Quantity *</span>
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
                  <option value="litre">Litre</option>
                  <option value="packet">Packet</option>
                  <option value="piece">Piece</option>
                  <option value="plate">Plate</option>
                </select>
              </div>
            </div>

            <div className="donor-field-group">
              <span className="donor-label">Product image *</span>
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
              <span className="donor-label">Pickup address *</span>
              <textarea
                className="donor-textarea"
                placeholder="Enter address where receiver will collect the food."
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>

            <div className="donor-field-group" style={{ gridColumn: "1 / -1" }}>
              <span className="donor-label">Share live location (map) *</span>
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

