import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../styles/dashboard.css";
import "../styles/donor-dashboard.css";
import { apiRequest, getAuthToken, logout } from "../utils/api";
import ProfilePanel from "../components/ProfilePanel";
import { auth } from "../firebase";
import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";

function DonorDashboard() {
  const navigate = useNavigate();
  const user = JSON.parse(sessionStorage.getItem("currentUser"));
  const token = getAuthToken();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState(() => sessionStorage.getItem("donorDashView") || "overview");
  const [filterDate, setFilterDate] = useState("");

  useEffect(() => {
    sessionStorage.setItem("donorDashView", view);
  }, [view]);
  const [name, setName] = useState("");
  const [foodType, setFoodType] = useState("Cooked");
  const [cookedTime, setCookedTime] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [quantityValue, setQuantityValue] = useState("");
  const [quantityUnit, setQuantityUnit] = useState("kg");
  const [address, setAddress] = useState("");
  const [imagePreview, setImagePreview] = useState("");
  const [imageData, setImageData] = useState("");
  const [location, setLocation] = useState(null);
  const [isLocating, setIsLocating] = useState(false);
  const [error, setError] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [otpInputs, setOtpInputs] = useState({});
  const [otpSentFor, setOtpSentFor] = useState(null);
  const [confirmationResultObj, setConfirmationResultObj] = useState(null);

  useEffect(() => {
    if (!user || user.role !== "donor") {
      navigate("/");
    }
  }, [user, navigate]);

  const loadItems = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const data = await apiRequest("/api/food/donor-items", { token });
      setItems(Array.isArray(data?.items) ? data.items : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, view]);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (limit: 5 MB)
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
      setImageFile(file);
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
        setLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
      },
      () => {
        setIsLocating(false);
        setError("Unable to fetch location. Please check permissions.");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleAddItem = async () => {
    setError("");

    if (!name.trim() || !expiryDate || !quantityValue || !address.trim()) {
      setError("Please fill all required fields (name, expiry, quantity, address).");
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

    try {
      await apiRequest("/api/food/add", {
        method: "POST",
        token,
        body: formData,
      });

      alert("Item added successfully.");

      setName("");
      setFoodType("Cooked");
      setCookedTime("");
      setExpiryDate("");
      setQuantityValue("");
      setQuantityUnit("kg");
      setAddress("");
      setImagePreview("");
      setImageFile(null);

      loadItems();
      setView("requests");
    } catch (err) {
      setError(err?.message || "Failed to add food item.");
    }
  };

  const handleSendOtp = async (item) => {
    if (!item.receiver || !item.receiver.mobile) {
      alert("Receiver mobile number not found. Cannot send OTP.");
      return;
    }

    const phoneNumber = String(item.receiver.mobile).startsWith("+")
      ? String(item.receiver.mobile)
      : `+91${String(item.receiver.mobile)}`;

    try {
      if (!window.recaptchaVerifier) {
        window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
          'size': 'invisible',
        });
      }

      const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, window.recaptchaVerifier);
      setConfirmationResultObj(confirmationResult);
      setOtpSentFor(item._id);
      alert(`OTP sent successfully to ${phoneNumber}!`);
    } catch (err) {
      console.error("Firebase SMS error:", err);
      alert("Failed to send SMS via Firebase: " + err.message);
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
        window.recaptchaVerifier = null;
      }
    }
  };

  const handleConfirmOtp = async (foodId) => {
    const otp = otpInputs[foodId];
    if (!otp) return;

    if (foodId !== otpSentFor || !confirmationResultObj) {
      alert("Please send the OTP first!");
      return;
    }

    try {
      // 1. Verify with Firebase
      await confirmationResultObj.confirm(otp);

      // 2. Inform backend to mark as collected
      await apiRequest("/api/food/pickup/verify", {
        method: "POST",
        token,
        body: { foodId, otp },
      });
      alert("Donated Successfully.");
      setOtpInputs((prev) => ({ ...prev, [foodId]: "" }));
      setOtpSentFor(null);
      setConfirmationResultObj(null);
      loadItems();
    } catch (err) {
      console.error(err);
      alert("Invalid OTP or Failed to Verify");
    }
  };

  const handlePrintLabel = (item) => {
    const printWindow = window.open('', '_blank');
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(`${window.location.origin}/item/${item._id}`)}`;
    
    printWindow.document.write(`
      <html>
        <head>
          <title>Print Food Label</title>
          <style>
            body { font-family: sans-serif; text-align: center; margin: 0; padding: 20px; }
            .label-card { border: 3px solid #000; padding: 30px; width: 450px; margin: 0 auto; border-radius: 16px; }
            h2 { margin: 0 0 15px 0; font-size: 32px; }
            img { width: 250px; height: 250px; margin-bottom: 15px; }
            p { margin: 8px 0; font-size: 18px; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="label-card">
            <h2>${item.name}</h2>
            <img src="${qrUrl}" alt="QR Code" onload="window.print(); window.close();" />
            <p>ID: ${item.barcode}</p>
            <p>Scan to view details</p>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  if (!user || user.role !== "donor") return null;

  const requestsCount = items.filter(it => it.status === "reserved" || it.status === "available").length;

  const filteredItems = items.filter(item => {
    const isStatusMatch = view === "requests"
      ? (item.status === "reserved" || item.status === "available")
      : item.status === "collected";

    if (!isStatusMatch) return false;

    if (filterDate) {
      const compareDate = item.status === "collected" ? item.collectedAt : (item.createdAt || item.reservedAt);
      if (compareDate) {
        return new Date(compareDate).toISOString().slice(0, 10) === filterDate;
      }
      return false; // If there's a filterDate but no item date, hide it
    }
    return true;
  });

  return (
    <div className="dash-layout">
      <aside className="dash-sidebar">
        <div className="dash-brand">
          <span className="dot" />
          <span>Food Value</span>
        </div>

        <nav className="dash-menu">
          <button
            className={`menu-item ${view === "overview" ? "active" : ""}`}
            onClick={() => setView("overview")}>
            Overview
          </button>
          <button
            className={`menu-item ${view === "add" ? "active" : ""}`}
            onClick={() => setView("add")}>
            Add Food Items
          </button>
          <button
            className={`menu-item ${view === "requests" ? "active" : ""}`}
            onClick={() => setView("requests")}>
            Requests {requestsCount > 0 && `(${requestsCount})`}
          </button>
          <button
            className={`menu-item ${view === "inventory" ? "active" : ""}`}
            onClick={() => setView("inventory")}>
            Inventory
          </button>
        </nav>

        <button className="logout-btn" onClick={handleLogout}>
          Logout
        </button>
      </aside>

      <main className="dash-main">
        <div id="recaptcha-container"></div>
        <header className="dash-header donor-main-header" style={{ alignItems: "flex-start" }}>
          <div>
            <h1>Donor dashboard</h1>
            <p className="dash-subtitle">
              Add food items, share your location and manage your inventory.
            </p>
          </div>
          <ProfilePanel user={user} onLogout={handleLogout} />
        </header>

        <section className="donor-grid">
          {view === "overview" && (
            <div className="dash-card donor-form-card" style={{ gridColumn: "1 / -1", padding: "2.5rem" }}>
              <div style={{ textAlign: "center", marginBottom: "3rem" }}>
                <h2 style={{ fontSize: "2.5rem", color: "#1b5e20", marginBottom: "0.5rem" }}>Welcome to Food Value!</h2>
                <p style={{ fontSize: "1.1rem", color: "#455a64" }}>Empowering communities by connecting surplus nourishment with those who need it most.</p>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "2rem" }}>
                <div style={{ background: "#f1f8e9", padding: "1.5rem", borderRadius: "12px", border: "1px solid #c5e1a5" }}>
                  <h3 style={{ fontSize: "1.3rem", color: "#2e7d32", marginBottom: "1rem" }}>Our Mission</h3>
                  <p style={{ lineHeight: "1.6", color: "#37474f" }}>
                    We aim to obliterate food waste by instantly bridging the gap between generous donors and waiting receivers.
                    Every item you share makes a profound difference in your community, reducing global waste and greenhouse emissions while actively nourishing lives.
                  </p>
                </div>

                <div style={{ background: "#e8eaf6", padding: "1.5rem", borderRadius: "12px", border: "1px solid #c5cae9" }}>
                  <h3 style={{ fontSize: "1.3rem", color: "#283593", marginBottom: "1rem" }}>Why Donating is Important</h3>
                  <p style={{ lineHeight: "1.6", color: "#37474f" }}>
                    On average, one-third of all food produced globally goes to waste. When you donate, you ensure that perfectly good meals aren't discarded into landfills.
                    You help families save resources and foster a culture of local sustainability and empathy.
                  </p>
                </div>

                <div style={{ background: "#fff3e0", padding: "1.5rem", borderRadius: "12px", border: "1px solid #ffe0b2" }}>
                  <h3 style={{ fontSize: "1.3rem", color: "#e65100", marginBottom: "1rem" }}>How You Can Contribute</h3>
                  <p style={{ lineHeight: "1.6", color: "#37474f" }}>
                    1. Go to the <strong>Add Food Items</strong> tab to list your surplus food.<br />
                    2. Check your <strong>Requests</strong> tab to see if a receiver has reserved your item.<br />
                    3. Verify their <strong>OTP</strong> when they arrive for pickup to successfully complete the donation cycle!
                  </p>
                </div>

                <div style={{ background: "#e0f7fa", padding: "1.5rem", borderRadius: "12px", border: "1px solid #b2ebf2" }}>
                  <h3 style={{ fontSize: "1.3rem", color: "#006064", marginBottom: "1rem" }}>Benefits of Donating</h3>
                  <p style={{ lineHeight: "1.6", color: "#37474f" }}>
                    - <strong>Environmental Impact:</strong> Lower your carbon footprint.<br />
                    - <strong>Community Building:</strong> Directly impact local hunger.<br />
                    - <strong>Transparency:</strong> Our secure OTP and barcode system guarantees your donation safely reaches the intended receiver safely.
                  </p>
                </div>
              </div>
            </div>
          )}

          {view === "add" && (
            <div className="dash-card donor-form-card" style={{ gridColumn: "1 / -1" }}>
              <h2>Add Food Items</h2>
              <p className="donor-section-subtitle">
                Enter product details. A barcode and receiver OTP will be generated
                automatically.
              </p>

              {error && <p className="auth-error">{error}</p>}

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
                      <input type="radio" name="foodTypeForm" value="Cooked" checked={foodType === "Cooked"} onChange={() => setFoodType("Cooked")} /> Cooked
                    </label>
                    <label style={{ display: "flex", alignItems: "center", gap: "5px", cursor: "pointer", fontSize: "0.9rem" }}>
                      <input type="radio" name="foodTypeForm" value="Uncooked" checked={foodType === "Uncooked"} onChange={() => setFoodType("Uncooked")} /> Packaged / Raw
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
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                    />
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
                    placeholder="Enter address where the receiver will collect the food."
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

              <button
                type="button"
                className="donor-primary-btn full"
                onClick={handleAddItem}
              >
                Add food item
              </button>
            </div>
          )}

          {(view === "requests" || view === "inventory") && (
            <div className="dash-card" style={{ gridColumn: "1 / -1" }}>
              <div className="donor-inventory-card-header">
                <div>
                  <h2>{view === "requests" ? "Pending Requests" : "My Inventory"}</h2>
                  <p className="donor-section-subtitle">
                    {view === "requests"
                      ? "Items you have added (Available) and items waiting for receiver OTP (Reserved)."
                      : "Items you have successfully donated (Collected) will appear here."}
                  </p>
                </div>
                <div className="donor-inventory-count" style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                  <input
                    type="date"
                    value={filterDate}
                    onChange={(e) => setFilterDate(e.target.value)}
                    style={{ padding: "8px", borderRadius: "8px", border: "1px solid #cfd8dc" }}
                    title="Filter by date"
                  />
                  {loading && "Loading..."}
                </div>
              </div>

              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 250px), 1fr))", gap: 12 }}>
                {!loading && filteredItems.length === 0 && (
                  <p className="donor-section-subtitle">
                    No items found in this section.
                  </p>
                )}

                {filteredItems.map((item) => {
                  const qtyLabel = `${item.quantity} ${item.unit}`;
                  return (
                    <li key={item._id} className="dash-card" style={{ padding: 12 }}>
                      <div style={{ display: "grid", gridTemplateColumns: "auto minmax(0,1fr)", gap: 10 }}>
                        {item.imageUrl ? (
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            style={{ width: 72, height: 72, borderRadius: 10, objectFit: "cover", background: "rgba(255,255,255,0.1)" }}
                          />
                        ) : (
                          <div style={{ width: 72, height: 72, borderRadius: 10, background: "rgba(255,255,255,0.1)" }} />
                        )}
                        <div>
                          <div style={{ fontWeight: 600, color: "#263238" }}>{item.name}</div>
                          <div className="dash-subtitle" style={{ marginBottom: 2 }}>
                            Qty: {qtyLabel}
                          </div>
                          
                          {item.status !== "collected" && (
                            <>
                              <div className="dash-subtitle">
                                Exp: {item.expiryDate ? String(item.expiryDate).slice(0, 10) : "N/A"}
                              </div>
                              <div className="dash-subtitle" style={{ marginTop: 4, wordBreak: "break-word", whiteSpace: "pre-wrap" }}>
                                Pickup: {item.address || "N/A"}
                              </div>
                            </>
                          )}
                        </div>
                      </div>

                      {item.status === "collected" && (
                        <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 6 }}>
                          <span style={{ display: "inline-block", padding: "4px 8px", borderRadius: 12, background: "rgba(232, 245, 233, 0.7)", color: "#2e7d32", fontSize: "0.85rem", fontWeight: 500, alignSelf: "flex-start", border: "1px solid rgba(200, 230, 201, 0.5)" }}>
                            Collected Successfully
                          </span>
                          <div style={{ marginTop: "4px", background: "rgba(232, 245, 233, 0.4)", padding: "6px 8px", borderRadius: "8px" }}>
                            <p style={{ margin: 0, fontSize: "0.85rem", color: "#1b5e20", wordBreak: "break-all" }}>Donated to: <br/><strong>{item.receiver?.email || item.collectedBy}</strong></p>
                            {item.collectedAt && <p style={{ margin: "2px 0 0 0", fontSize: "0.75rem", color: "#388e3c" }}>{new Date(item.collectedAt).toLocaleString()}</p>}
                          </div>

                        </div>
                      )}

                      {item.status === "reserved" && (
                        <div style={{ marginTop: "10px", padding: "10px", background: "rgba(255, 243, 224, 0.7)", borderRadius: "8px", border: "1px solid rgba(255, 224, 178, 0.5)" }}>
                          <p style={{ margin: "0 0 8px 0", fontSize: "0.85rem", color: "#e65100", fontWeight: "bold" }}>OTP required (Receiver handover)</p>
                          {otpSentFor !== item._id ? (
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <span style={{ fontSize: "0.85rem", color: "#555" }}>
                                {item.receiver ? `To: ${item.receiver.mobile}` : "No receiver info"}
                              </span>
                              <button className="donor-otp-btn" style={{ background: "#e65100", color: "#fff", border: "none", borderRadius: "8px", padding: "4px 8px", cursor: "pointer", fontSize: "0.8rem" }} onClick={() => handleSendOtp(item)}>Send OTP</button>
                            </div>
                          ) : (
                            <div className="donor-otp-row" style={{ display: "flex", gap: "6px" }}>
                              <input className="donor-otp-input" style={{ flex: 1, padding: "4px 8px", borderRadius: "8px", border: "1px solid #ffcc80" }} placeholder="Enter OTP" value={otpInputs[item._id] || ""} onChange={(e) => setOtpInputs({ ...otpInputs, [item._id]: e.target.value })} />
                              <button className="donor-otp-btn" style={{ background: "#e65100", color: "#fff", border: "none", borderRadius: "8px", padding: "4px 8px", cursor: "pointer", fontSize: "0.8rem" }} onClick={() => handleConfirmOtp(item._id)}>Verify</button>
                            </div>
                          )}
                        </div>
                      )}

                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default DonorDashboard;
