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
  const [error, setError] = useState("");
  const [view, setView] = useState(() => sessionStorage.getItem("receiverDashView") || "overview");
  const [filterDate, setFilterDate] = useState("");

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
    <div className="dash-layout">
      <aside className="dash-sidebar">
        <div className="dash-brand">
          <span className="dot" />
          <span>Food Value</span>
        </div>

        <nav className="dash-menu">
          <button
            className={`menu-item ${view === "overview" ? "active" : ""}`}
            onClick={() => setView("overview")}
          >
            Overview
          </button>
          <button
            className={`menu-item ${view === "collect" ? "active" : ""}`}
            onClick={() => setView("collect")}
          >
            Collect Items
          </button>
          <button
            className={`menu-item ${view === "reserved" ? "active" : ""}`}
            onClick={() => setView("reserved")}
          >
            Reserved Items {reservedCount > 0 && `(${reservedCount})`}
          </button>
          <button
            className={`menu-item ${view === "inventory" ? "active" : ""}`}
            onClick={() => setView("inventory")}
          >
            My Inventory
          </button>
        </nav>

        <button className="logout-btn" onClick={handleLogout}>
          Logout
        </button>
      </aside>

      <main className="dash-main">
        <header className="dash-header" style={{ alignItems: "flex-start" }}>
          <div>
            <h1>Receiver dashboard</h1>
            <p className="dash-subtitle">
              Logged in as <strong>{user.email}</strong>. Use this dashboard to
              browse and collect food.
            </p>
          </div>
          <ProfilePanel user={user} onLogout={handleLogout} />
        </header>

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
                <h2 style={{ fontSize: "1.4rem", color: "#1b5e20", marginBottom: "0.5rem" }}>
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
                <h2 style={{ fontSize: "1.4rem", color: "#1b5e20", marginBottom: "0.5rem" }}>
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

                      {it.location && (
                        <div
                          style={{
                            marginTop: 8,
                            borderRadius: 12,
                            overflow: "hidden",
                            border: "1px solid #cfd8dc",
                          }}
                        >
                          <iframe
                            title="Donor location"
                            src={`https://www.google.com/maps?q=${it.location.lat},${it.location.lng}&z=15&output=embed`}
                            loading="lazy"
                            referrerPolicy="no-referrer-when-downgrade"
                            style={{ width: "100%", height: 140, border: "none" }}
                          />
                        </div>
                      )}

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

                        {view === "reserved" && it.location && (
                          <div
                            style={{
                              marginTop: 8,
                              borderRadius: 12,
                              overflow: "hidden",
                              border: "1px solid #cfd8dc",
                            }}
                          >
                            <iframe
                              title="Donor location"
                              src={`https://www.google.com/maps?q=${it.location.lat},${it.location.lng}&z=15&output=embed`}
                              loading="lazy"
                              referrerPolicy="no-referrer-when-downgrade"
                              style={{ width: "100%", height: 140, border: "none" }}
                            />
                          </div>
                        )}

                        <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 6 }}>
                          <span
                            style={{
                              display: "inline-block",
                              padding: "4px 8px",
                              borderRadius: 12,
                              background: view === "reserved" ? "#fff3e0" : "#e8f5e9",
                              color: view === "reserved" ? "#e65100" : "#2e7d32",
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
