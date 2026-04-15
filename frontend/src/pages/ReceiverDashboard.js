import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/dashboard.css";
import ProfilePanel from "../components/ProfilePanel";
import { apiRequest, getAuthToken, logout } from "../utils/api";

function ReceiverDashboard() {
  const navigate = useNavigate();
  const user = JSON.parse(sessionStorage.getItem("currentUser"));
  const token = getAuthToken();

  const [items, setItems] = useState([]); // Inventory & Reserved
  const [available, setAvailable] = useState([]); // Collect items pool
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState(() => sessionStorage.getItem("receiverDashView") || "overview");
  const [filterDate, setFilterDate] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    sessionStorage.setItem("receiverDashView", view);
  }, [view]);

  useEffect(() => {
    if (!user || user.role !== "receiver") {
      navigate("/");
    }
  }, [user?.email, user?.role, navigate]);

  const loadData = async () => {
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      // Unconditionally load inventory so sidebar counters and reserved tabs update immediately
      const inventoryData = await apiRequest("/api/food/receiver-inventory", { token });
      setItems(Array.isArray(inventoryData?.items) ? inventoryData.items : []);

      if (view === "collect") {
        const data = await apiRequest("/api/food/available", { token });
        setAvailable(Array.isArray(data?.items) ? data.items : []);
      }
    } catch (err) {
      setError(err?.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, view]);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  // Cancel a reservation
  const handleCancelReservation = async (foodId) => {
    if (!window.confirm("Are you sure you want to cancel this reservation?")) return;
    try {
      const res = await apiRequest("/api/food/cancel", {
        method: "POST",
        token,
        body: { foodId },
      });
      alert(res.message);
      loadData();
    } catch (err) {
      alert(err.message || "Failed to cancel reservation");
    }
  };

  const handleCollect = async (entry) => {
    setError("");
    try {
      await apiRequest("/api/food/reserve", {
        method: "POST",
        token,
        body: { foodId: entry.id },
      });

      alert("Item successfully reserved! At pickup, the donor will send a verification SMS to your registered mobile number.");

      await loadData();
    } catch (err) {
      setError(err?.message || "Failed to reserve item");
    }
  };

  const filteredItems = items.filter(item => {
    const isStatusMatch = view === "reserved" 
      ? item.status === "reserved" 
      : item.status === "collected";
    
    if (!isStatusMatch) return false;

    if (filterDate) {
      const compareDate = item.status === "collected" ? item.collectedAt : item.reservedAt;
      if (compareDate) {
        return new Date(compareDate).toISOString().slice(0, 10) === filterDate;
      }
      return false;
    }
    return true;
  });

  if (!user || user.role !== "receiver") return null;

  const reservedCount = items.filter((it) => it.status === "reserved").length;

  return (
    <div className="dash-layout" style={{ display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden" }}>
      <header className="top-header-nav">
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <h1 style={{ margin: 0, fontSize: "1.5rem", letterSpacing: "0.5px", color: "white", fontWeight: "bold" }}>Sanjeevani</h1>
        </div>
        
        {/* Desktop Navigation */}
        <div className="desktop-nav-links">
          <span>Welcome, {user?.role === 'admin' ? "Admin" : (user?.name || user?.email)}!</span>
          <button className={`desktop-nav-button ${view === "overview" ? "active" : ""}`} onClick={() => setView("overview")}>Overview</button>
          <button className={`desktop-nav-button ${view === "collect" ? "active" : ""}`} onClick={() => setView("collect")}>Collect Items</button>
          <button className={`desktop-nav-button ${view === "reserved" ? "active" : ""}`} onClick={() => setView("reserved")}>Reserved Items {reservedCount > 0 && `(${reservedCount})`}</button>
          <button className={`desktop-nav-button ${view === "inventory" ? "active" : ""}`} onClick={() => setView("inventory")}>My Inventory</button>
          
          <ProfilePanel user={user} onLogout={handleLogout} textMode={true} />
        </div>

        {/* Mobile Navigation (Hamburger 3 Lines) */}
        <div className="mobile-menu-btn" style={{ position: "relative" }}>
          <button 
            className="three-dots-btn"
            style={{ color: "white" }}
            onClick={() => setMenuOpen(!menuOpen)}
          >
            ☰
          </button>

          {menuOpen && (
            <div style={{
              position: "absolute", top: "100%", right: 0, marginTop: "8px", background: "white", borderRadius: "8px", 
              width: "220px", boxShadow: "0 8px 24px rgba(0,0,0,0.15)", padding: "12px", display: "flex", flexDirection: "column", gap: "4px", zIndex: 1000,
              border: "1px solid #edf0ee"
            }}>
              <div style={{ color: "#37474f", fontWeight: "bold", borderBottom: "1px solid #eee", paddingBottom: "10px", marginBottom: "6px", fontSize: "1rem" }}>
                Welcome, {user?.role === 'admin' ? "Admin" : (user?.name || user?.email)}!
              </div>

              <button onClick={() => { setView("overview"); setMenuOpen(false); }} style={{ textAlign: "left", background: "none", border: "none", color: view === "overview" ? "#764ba2" : "#546e7a", fontWeight: view === "overview" ? "bold" : "500", cursor: "pointer", padding: "10px 8px", fontSize: "0.95rem", borderRadius: "6px" }}>Overview</button>
              <button onClick={() => { setView("collect"); setMenuOpen(false); }} style={{ textAlign: "left", background: "none", border: "none", color: view === "collect" ? "#764ba2" : "#546e7a", fontWeight: view === "collect" ? "bold" : "500", cursor: "pointer", padding: "10px 8px", fontSize: "0.95rem", borderRadius: "6px" }}>Collect Items</button>
              <button onClick={() => { setView("reserved"); setMenuOpen(false); }} style={{ textAlign: "left", background: "none", border: "none", color: view === "reserved" ? "#764ba2" : "#546e7a", fontWeight: view === "reserved" ? "bold" : "500", cursor: "pointer", padding: "10px 8px", fontSize: "0.95rem", borderRadius: "6px" }}>Reserved Items {reservedCount > 0 && `(${reservedCount})`}</button>
              <button onClick={() => { setView("inventory"); setMenuOpen(false); }} style={{ textAlign: "left", background: "none", border: "none", color: view === "inventory" ? "#764ba2" : "#546e7a", fontWeight: view === "inventory" ? "bold" : "500", cursor: "pointer", padding: "10px 8px", fontSize: "0.95rem", borderRadius: "6px" }}>My Inventory</button>
              
              <div style={{ borderTop: "1px solid #eee", paddingTop: "12px", marginTop: "6px", display: "flex", flexDirection: "column", gap: "8px" }}>
                 <ProfilePanel user={user} onLogout={handleLogout} textMode={true} customClass="desktop-nav-button" />
              </div>
            </div>
          )}
        </div>
      </header>

      <main className="dash-main" style={{ flex: 1, overflowY: "auto", padding: "20px" }}>
        <div style={{ marginBottom: "20px" }}>
          <h1 style={{ fontSize: "1.6rem", color: "#4a148c", margin: 0, fontWeight: "600" }}>Receiver dashboard</h1>
          <p className="dash-subtitle" style={{ marginTop: "4px" }}>
            Logged in as <strong>{user?.role === 'admin' ? "Admin" : (user?.name || user?.email)}</strong>. Use this dashboard to
            browse and collect food.
          </p>
        </div>

        {error && (
          <div
            className="dash-card"
            style={{ borderLeft: "4px solid #d32f2f", background: "#fff0f0" }}
          >
            <strong>{error}</strong>
          </div>
        )}

        <section className="dash-grid">
          {view === "overview" && (
            <div className="dash-card highlight" style={{ gridColumn: "1 / -1" }}>
              <div style={{ marginBottom: "2rem" }}>
                <h2 style={{ fontSize: "1.4rem", color: "#4a148c", marginBottom: "0.5rem" }}>
                  About Food Value Platform
                </h2>
                <p style={{ lineHeight: "1.6", color: "#455a64" }}>
                  Food Value actively helps reduce food waste by connecting generous
                  donors with those in need. In a world where one-third of perfectly
                  good food is lost, your participation makes a profound impact.
                </p>
                <br />
                <p style={{ lineHeight: "1.6", color: "#455a64" }}>
                  Securely collect items using our OTP verification system for a
                  reliable handover. Don't worry about keeping track of codes – your Reserved tab strictly manages all pending pickups securely!
                </p>
              </div>
              <div>
                <h2 style={{ fontSize: "1.4rem", color: "#4a148c", marginBottom: "0.5rem" }}>
                  How it works
                </h2>
                <ul style={{ lineHeight: "1.6", color: "#455a64", paddingLeft: "1.2rem" }}>
                  <li>Browse available surplus food shared by donors nearby under the <strong>Collect Items</strong> tab.</li>
                  <li>Click <strong>Collect</strong> to securely reserve the food block.</li>
                  <li>Navigate to the donor's address. At pickup, the donor will send an SMS OTP to your registered mobile number to verify the handover.</li>
                  <li>The product effortlessly moves to your <strong>My Inventory</strong> tab once the donation is verified successfully!</li>
                </ul>
              </div>
            </div>
          )}

          {view === "collect" && (
            <div className="dash-card" style={{ gridColumn: "1 / -1" }}>
              <h2>Available near you</h2>
              <div style={{ background: "rgba(255,255,255,0.7)", padding: "12px", borderRadius: "8px", border: "1px solid rgba(0,0,0,0.1)", marginBottom: "16px", color: "#4a148c", fontWeight: "bold", textAlign: "center" }}>
                Please scan the QR code to verify the details before collecting the food.
              </div>
              {loading ? (
                <p className="dash-subtitle">Loading items…</p>
              ) : available.length === 0 ? (
                <p className="dash-subtitle">No items available right now.</p>
              ) : (
                <ul
                  style={{
                    listStyle: "none",
                    padding: 0,
                    margin: 0,
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 250px), 1fr))",
                    gap: 12,
                  }}
                >
                  {available.map((it) => (
                    <li key={it.id} className="dash-card" style={{ padding: 12 }}>
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "auto minmax(0,1fr)",
                          gap: 10,
                        }}
                      >
                        {it.imageUrl ? (
                          <img
                            src={it.imageUrl}
                            alt={it.name}
                            style={{
                              width: 72,
                              height: 72,
                              borderRadius: 10,
                              objectFit: "cover",
                              background: "#eceff1",
                            }}
                          />
                        ) : (
                          <div
                            style={{
                              width: 72,
                              height: 72,
                              borderRadius: 10,
                              background: "#eceff1",
                            }}
                          />
                        )}
                        <div>
                          <div style={{ fontWeight: 600 }}>{it.name}</div>
                          <div className="dash-subtitle" style={{ marginBottom: 2 }}>
                            Qty: {it.quantity} {it.unit}
                          </div>
                          <div className="dash-subtitle">
                            Exp: {it.expiryDate ? String(it.expiryDate).slice(0, 10) : "Not set"}
                          </div>
                        </div>
                      </div>

                      <div className="dash-subtitle" style={{ marginTop: 8, wordBreak: "break-word", whiteSpace: "pre-wrap" }}>
                        Address: {it.address}
                      </div>

                      <div style={{ display: "flex", gap: "10px", marginTop: "8px" }}>
                        {it.location && (
                          <div style={{ flex: 1, borderRadius: 12, overflow: "hidden", border: "1px solid #cfd8dc" }}>
                            <iframe
                              title="Donor location"
                              src={`https://www.google.com/maps?q=${it.location.lat},${it.location.lng}&z=15&output=embed`}
                              loading="lazy"
                              referrerPolicy="no-referrer-when-downgrade"
                              style={{ width: "100%", height: 80, border: "none" }}
                            />
                          </div>
                        )}
                        <div style={{ border: "1px dashed rgba(0,0,0,0.1)", borderRadius: 12, padding: 8, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "rgba(255,255,255,0.4)", width: 80, flexShrink: 0 }}>
                          <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(`${window.location.origin}/item/${it.id}`)}`} alt="QR Code" style={{ width: 60, height: 60, borderRadius: 6 }} />
                        </div>
                      </div>

                      <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                        <button className="chip" onClick={() => handleCollect(it)}>
                          Collect
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {(view === "reserved" || view === "inventory") && (
            <div className="dash-card" style={{ gridColumn: "1 / -1" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
                <div>
                  <h2>{view === "reserved" ? "Reserved Items" : "My Inventory"}</h2>
                  <p className="dash-subtitle">
                    {view === "reserved"
                      ? "Items you have securely reserved. The donor will send an SMS OTP to your registered number during pickup."
                      : "Items you have successfully collected from donors."}
                  </p>
                </div>
                <input 
                  type="date" 
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                  style={{ padding: "8px", borderRadius: "8px", border: "1px solid #cfd8dc" }}
                  title="Filter by date"
                />
              </div>

              {loading ? (
                <p className="dash-subtitle">Loading...</p>
              ) : filteredItems.length === 0 ? (
                <p className="dash-subtitle">No items found in this section.</p>
              ) : (
                <ul
                  style={{
                    listStyle: "none",
                    padding: 0,
                    margin: 0,
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 250px), 1fr))",
                    gap: 12,
                  }}
                >
                  {filteredItems.map((it) => (
                      <li key={it._id} className="dash-card" style={{ padding: 12 }}>
                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns: "auto minmax(0,1fr)",
                            gap: 10,
                          }}
                        >
                          {it.imageUrl ? (
                            <img
                              src={it.imageUrl}
                              alt={it.name}
                              style={{
                                width: 72,
                                height: 72,
                                borderRadius: 10,
                                objectFit: "cover",
                                background: "#eceff1",
                              }}
                            />
                          ) : (
                            <div
                              style={{
                                width: 72,
                                height: 72,
                                borderRadius: 10,
                                background: "#eceff1",
                              }}
                            />
                          )}
                          <div>
                            <div style={{ fontWeight: 600 }}>{it.name}</div>
                            <div className="dash-subtitle" style={{ marginBottom: 2 }}>
                              Qty: {it.quantity} {it.unit}
                            </div>
                            <div className="dash-subtitle">
                              Exp: {it.expiryDate ? String(it.expiryDate).slice(0, 10) : "Not set"}
                            </div>
                            {view === "reserved" && (
                              <div className="dash-subtitle" style={{ marginTop: 4 }}>
                                Donor Contact: {it.donor?.mobile || "N/A"}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="dash-subtitle" style={{ marginTop: 8, wordBreak: "break-word", whiteSpace: "pre-wrap" }}>
                          Address: {it.address || "N/A"}
                        </div>

                        <div style={{ display: "flex", gap: "10px", marginTop: "8px" }}>
                          {view === "reserved" && it.location && (
                            <div style={{ flex: 1, borderRadius: 12, overflow: "hidden", border: "1px solid #cfd8dc" }}>
                              <iframe
                                title="Donor location"
                                src={`https://www.google.com/maps?q=${it.location.lat},${it.location.lng}&z=15&output=embed`}
                                loading="lazy"
                                referrerPolicy="no-referrer-when-downgrade"
                                style={{ width: "100%", height: 80, border: "none" }}
                              />
                            </div>
                          )}
                        </div>

                        <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 6 }}>
                          <span
                            style={{
                              display: "inline-block",
                              padding: "4px 8px",
                              borderRadius: 12,
                              background: view === "reserved" ? "#fff3e0" : "#f3e5f5",
                              color: view === "reserved" ? "#e65100" : "#764ba2",
                              fontSize: "0.85rem",
                              fontWeight: 500,
                              alignSelf: "flex-start",
                            }}
                          >
                            {view === "reserved" ? "Pending Pickup" : "Collected Successfully"}
                          </span>
                          
                          {view === "reserved" && (
                            <div style={{ background: "#fff8e1", padding: "4px 10px", borderRadius: "12px", border: "1px solid #ffecb3", alignSelf: "flex-start" }}>
                              <span style={{ fontSize: "0.75rem", color: "#f57f17", fontWeight: 700, textTransform: "uppercase" }}>AWAITING SMS AT PICKUP</span>
                            </div>
                          )}
                        </div>

                        {view === "reserved" && (
                          <div style={{ marginTop: "10px" }}>
                            <button
                              style={{
                                background: "rgba(211, 47, 47, 0.9)",
                                color: "#fff",
                                padding: "6px 12px",
                                borderRadius: "8px",
                                border: "none",
                                fontSize: "0.8rem",
                                cursor: "pointer",
                                width: "100%",
                                fontWeight: "bold"
                              }}
                              onClick={() => handleCancelReservation(it._id)}
                            >
                              Cancel Reservation
                            </button>
                          </div>
                        )}

                        {view === "inventory" && (
                          <div style={{ marginTop: "10px" }}>
                            <button 
                              style={{ 
                                width: "100%", 
                                padding: "8px 12px", 
                                fontSize: "0.9rem", 
                                fontWeight: "bold",
                                borderRadius: "8px", 
                                background: (it.feedbackGiven || localStorage.getItem('feedbackGiven_' + it._id)) ? "#d32f2f" : "linear-gradient(135deg, #4a148c 0%, #764ba2 100%)",
                                border: "none",
                                color: "#fff",
                                cursor: "pointer",
                                transition: "all 0.2s",
                                boxShadow: "0 4px 12px rgba(74, 20, 140, 0.2)"
                              }}
                              onMouseOver={(e) => { e.currentTarget.style.transform = "scale(1.02)"; }}
                              onMouseOut={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
                              onClick={() => {
                                if (it.feedbackGiven || localStorage.getItem('feedbackGiven_' + it._id)) {
                                  alert("You have already provided feedback for this item.");
                                } else {
                                  window.open(`/feedback?to=${it.donor?.email || ''}&foodId=${it._id}`, '_blank');
                                }
                              }}
                            >
                              {(it.feedbackGiven || localStorage.getItem('feedbackGiven_' + it._id)) ? "Feedback Shared" : "Give Feedback"}
                            </button>
                          </div>
                        )}
                      </li>
                    ))}
                </ul>
              )}
            </div>
          )}
        </section>
      </main>

    </div>
  );
}

export default ReceiverDashboard;
