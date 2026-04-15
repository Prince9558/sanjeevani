import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/dashboard.css";
import ProfilePanel from "../components/ProfilePanel";
import { apiRequest, getAuthToken, logout } from "../utils/api";

function AdminDashboard() {
  const navigate = useNavigate();
  const user = JSON.parse(sessionStorage.getItem("currentUser"));
  const token = getAuthToken();

  const [view, setView] = useState(() => sessionStorage.getItem("adminDashView") || "overview");
  const [filterDate, setFilterDate] = useState("");

  useEffect(() => {
    sessionStorage.setItem("adminDashView", view);
  }, [view]);
  const [kpis, setKpis] = useState(null);
  const [donors, setDonors] = useState([]);
  const [receivers, setReceivers] = useState([]);
  const [allStock, setAllStock] = useState([]);
  const [logs, setLogs] = useState({ added: [], reserved: [], collected: [] });
  const [reportDate, setReportDate] = useState("");
  const [reportType, setReportType] = useState("all");
  const [reportPage, setReportPage] = useState(1);
  const [reportItemsPerPage, setReportItemsPerPage] = useState(10);
  
  const [userView, setUserView] = useState("donors");
  const [userPage, setUserPage] = useState(1);
  const [userItemsPerPage, setUserItemsPerPage] = useState(10);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setReportPage(1);
  }, [reportType, reportDate]);

  useEffect(() => {
    if (!user || user.role !== "admin") navigate("/");
  }, [user, navigate]);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const handleDeleteFood = async (id) => {
    if (!window.confirm("Are you sure you want to delete this food item?")) return;
    try {
      await apiRequest(`/api/admin/food/${id}`, { method: "DELETE", token });
      setAllStock((prev) => prev.filter((item) => item._id !== id));
      alert("Food item deleted successfully.");
    } catch (err) {
      alert(err?.message || "Failed to delete food item");
    }
  };

  const handleToggleBlock = async (id, currentStatus) => {
    if (!window.confirm(`Are you sure you want to ${currentStatus ? "unblock" : "block"} this user?`)) return;
    try {
      await apiRequest(`/api/admin/user/${id}/toggle-block`, { method: "PUT", token });
      
      const toggleFn = (prev) => prev.map(u => u._id === id ? { ...u, isBlocked: !u.isBlocked } : u);
      setDonors(toggleFn);
      setReceivers(toggleFn);
      
      alert(`User ${currentStatus ? "unblocked" : "blocked"} successfully.`);
    } catch (err) {
      alert(err?.message || "Failed to toggle block status");
    }
  };

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError("");
      try {
        const [ov, stock, logsData] = await Promise.all([
          apiRequest("/api/admin/overview", { token }),
          apiRequest("/api/admin/stock", { token }),
          apiRequest("/api/admin/logs", { token })
        ]);
        if (cancelled) return;
        setKpis(ov?.kpis || null);
        setDonors(Array.isArray(ov?.donors) ? ov.donors : []);
        setReceivers(Array.isArray(ov?.receivers) ? ov.receivers : []);
        setAllStock(Array.isArray(stock?.items) ? stock.items : []);
        setLogs({
          added: Array.isArray(logsData?.added) ? logsData.added : [],
          reserved: Array.isArray(logsData?.reserved) ? logsData.reserved : [],
          collected: Array.isArray(logsData?.collected) ? logsData.collected : []
        });
      } catch (err) {
        if (!cancelled) setError(err?.message || "Failed to load admin data");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const todayStr = new Date().toISOString().slice(0, 10);
  const yesterdayStr = (() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().slice(0, 10);
  })();

  const donatedToday = useMemo(
    () =>
      allStock.filter(
        (i) =>
          i.status === "collected" &&
          String(i.collectedAt || "").slice(0, 10) === todayStr
      ),
    [allStock, todayStr]
  );

  const donatedYesterday = useMemo(
    () =>
      allStock.filter(
        (i) =>
          i.status === "collected" &&
          String(i.collectedAt || "").slice(0, 10) === yesterdayStr
      ),
    [allStock, yesterdayStr]
  );

  const inRequests = useMemo(
    () => allStock.filter((i) => i.status === "reserved"),
    [allStock]
  );

  const pendingNotDonated = useMemo(
    () => allStock.filter((i) => i.status === "available"),
    [allStock]
  );

  const totalDonated = useMemo(
    () => allStock.filter((i) => i.status === "collected"),
    [allStock]
  );

  const reportsFilteredRows = useMemo(() => {
    let rows = [];

    if (reportType === "all" || reportType === "added") {
      logs.added.forEach(item => {
        const d = item.addedAt ? new Date(item.addedAt) : null;
        if (!reportDate || (d && d.toISOString().slice(0, 10) === reportDate)) {
          rows.push({
            type: "Available", 
            color: "#1976d2", bg: "#e3f2fd",
            name: item.foodId?.name || "Deleted Item",
            donor: item.donorId?.email || "Unknown",
            receiver: "-",
            date: d,
            ms: d ? d.getTime() : 0,
          });
        }
      });
    }

    if (reportType === "all" || reportType === "reserved") {
      logs.reserved.forEach(item => {
        const d = item.reservedAt ? new Date(item.reservedAt) : null;
        if (!reportDate || (d && d.toISOString().slice(0, 10) === reportDate)) {
          rows.push({
            type: "Reserved",
            color: "#ed6c02", bg: "#fff3e0",
            name: item.foodId?.name || "Deleted Item",
            donor: item.donorId?.email || "Unknown",
            receiver: item.receiverId?.email || "Unknown",
            date: d,
            ms: d ? d.getTime() : 0,
          });
        }
      });
    }

    if (reportType === "all" || reportType === "collected") {
      logs.collected.forEach(item => {
        const d = item.collectedAt ? new Date(item.collectedAt) : null;
        if (!reportDate || (d && d.toISOString().slice(0, 10) === reportDate)) {
          rows.push({
            type: "Delivered",
            color: "#764ba2", bg: "#f3e5f5",
            name: item.foodId?.name || "Deleted Item",
            donor: item.donorId?.email || "Unknown",
            receiver: item.receiverId?.email || "Unknown",
            date: d,
            ms: d ? d.getTime() : 0,
          });
        }
      });
    }

    rows.sort((a, b) => b.ms - a.ms);
    return rows;
  }, [logs, reportType, reportDate]);

  const reportTotalItems = reportsFilteredRows.length;
  const reportTotalPages = Math.ceil(reportTotalItems / reportItemsPerPage) || 1;
  const reportStartIdx = (reportPage - 1) * reportItemsPerPage;
  const currentReportRows = reportsFilteredRows.slice(reportStartIdx, reportStartIdx + reportItemsPerPage);

  const filteredStock = (view === "today"
    ? donatedToday
    : view === "yesterday"
      ? donatedYesterday
      : view === "pending"
        ? pendingNotDonated
        : view === "requests"
          ? inRequests
          : allStock
  ).filter(it => {
    if (!filterDate) return true;
    const compareDate = it.status === "collected" 
      ? it.collectedAt 
      : (it.createdAt || it.addedAt || it.reservedAt);
    
    if (compareDate) {
      return new Date(compareDate).toISOString().slice(0, 10) === filterDate;
    }
    return false;
  });

  const displayUsers = useMemo(() => {
    let list = [];
    if (userView === "donors") list = donors.filter(u => !u.isBlocked);
    else if (userView === "receivers") list = receivers.filter(u => !u.isBlocked);
    else list = [...donors, ...receivers].filter(u => u.isBlocked);
    return list;
  }, [donors, receivers, userView]);

  const userTotalItems = displayUsers.length;
  const userTotalPages = Math.ceil(userTotalItems / userItemsPerPage) || 1;
  const userStartIdx = (userPage - 1) * userItemsPerPage;
  const currentUserRows = displayUsers.slice(userStartIdx, userStartIdx + userItemsPerPage);

  if (!user || user.role !== "admin") return null;

  return (
    <div className="dash-layout" style={{ display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden" }}>
      <header className="top-header-nav">
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <h1 style={{ margin: 0, fontSize: "1.5rem", letterSpacing: "0.5px", color: "white", fontWeight: "bold" }}>Sanjeevani</h1>
        </div>
        
        {/* Desktop Navigation */}
        <div className="desktop-nav-links">
          <span>Welcome, {user?.role === 'admin' ? "Admin" : (user?.name || user?.email)}!</span>
          <button className={`desktop-nav-button ${view === "overview" ? "active" : ""}`} onClick={() => setView("overview")}>Admin overview</button>
          <button className={`desktop-nav-button ${view === "stock" ? "active" : ""}`} onClick={() => setView("stock")}>Stock items</button>
          <button className={`desktop-nav-button ${view === "reports" ? "active" : ""}`} onClick={() => setView("reports")}>Reports & Logs</button>
          <button className={`desktop-nav-button ${view === "users" ? "active" : ""}`} onClick={() => setView("users")}>Users management</button>
          
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

              <button onClick={() => { setView("overview"); setMenuOpen(false); }} style={{ textAlign: "left", background: "none", border: "none", color: view === "overview" ? "#764ba2" : "#546e7a", fontWeight: view === "overview" ? "bold" : "500", cursor: "pointer", padding: "10px 8px", fontSize: "0.95rem", borderRadius: "6px" }}>Admin overview</button>
              <button onClick={() => { setView("stock"); setMenuOpen(false); }} style={{ textAlign: "left", background: "none", border: "none", color: view === "stock" ? "#764ba2" : "#546e7a", fontWeight: view === "stock" ? "bold" : "500", cursor: "pointer", padding: "10px 8px", fontSize: "0.95rem", borderRadius: "6px" }}>Stock items</button>
              <button onClick={() => { setView("reports"); setMenuOpen(false); }} style={{ textAlign: "left", background: "none", border: "none", color: view === "reports" ? "#764ba2" : "#546e7a", fontWeight: view === "reports" ? "bold" : "500", cursor: "pointer", padding: "10px 8px", fontSize: "0.95rem", borderRadius: "6px" }}>Reports & Logs</button>
              <button onClick={() => { setView("users"); setMenuOpen(false); }} style={{ textAlign: "left", background: "none", border: "none", color: view === "users" ? "#764ba2" : "#546e7a", fontWeight: view === "users" ? "bold" : "500", cursor: "pointer", padding: "10px 8px", fontSize: "0.95rem", borderRadius: "6px" }}>Users management</button>
              
              <div style={{ borderTop: "1px solid #eee", paddingTop: "12px", marginTop: "6px", display: "flex", flexDirection: "column", gap: "8px" }}>
                 <ProfilePanel user={user} onLogout={handleLogout} textMode={true} customClass="mobile-nav-button" customStyle={{ textAlign: "left", background: "none", border: "none", color: "#546e7a", fontWeight: "500", cursor: "pointer", padding: "10px 8px", fontSize: "0.95rem" }} />
              </div>
            </div>
          )}
        </div>
      </header>

      <main className="dash-main" style={{ flex: 1, overflowY: "auto", padding: "20px" }}>
        <div style={{ marginBottom: "20px" }}>
          <h1 style={{ fontSize: "1.6rem", color: "#4a148c", margin: 0, fontWeight: "600" }}>Admin dashboard</h1>
          <p className="dash-subtitle" style={{ marginTop: "4px" }}>
            Monitor donors, receivers and donation flow across the platform.
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

        {loading ? (
          <p className="dash-subtitle">Loading admin data…</p>
        ) : (
          <section className="dash-grid">
            <div className="dash-card highlight">
              <div>
                <h2>Platform KPIs</h2>
                <ul>
                  <li>Total donated items: {kpis?.totalCollected ?? totalDonated.length}</li>
                  <li>Donated today: {kpis?.donatedToday ?? donatedToday.length}</li>
                  <li>In requests: {kpis?.reservedCount ?? inRequests.length}</li>
                  <li>
                    Added but not donated: {kpis?.addedNotDonated ?? pendingNotDonated.length}
                  </li>
                </ul>
              </div>
              <div>
                <h2>Explore</h2>
                <div className="chip-row">
                  <button className="chip" onClick={() => setView("today")}>
                    Donated today
                  </button>
                  <button className="chip" onClick={() => setView("yesterday")}>
                    Donated yesterday
                  </button>
                  <button className="chip" onClick={() => setView("requests")}>
                    In requests
                  </button>
                  <button className="chip" onClick={() => setView("pending")}>
                    Not donated yet
                  </button>
                </div>
              </div>
            </div>

            {view === "overview" && (
              <div className="dash-card" style={{ gridColumn: "1 / -1" }}>
                <h2 style={{ fontSize: "1.4rem", color: "#4a148c", marginBottom: "0.5rem" }}>Our Mission at Food Value Platform</h2>
                <p style={{ lineHeight: "1.6", color: "#455a64" }}>
                  Food Value reduces waste by safely matching surplus food with active receivers in the community.
                  Donors add items with pickup details. Receivers reserve items and collect using a seamless OTP verification process.
                </p>
                <div style={{ marginTop: "1rem", padding: "1rem", background: "#f3e5f5", borderRadius: "8px", borderLeft: "4px solid #667eea" }}>
                  <strong>Admin Responsibility:</strong> You oversee the health of the entire donation lifecycle to ensure zero-waste and rapid distributions. Use the side tabs and quick action chips to monitor pending inventory versus successful collections.
                </div>
              </div>
            )}


            {(view === "stock" ||
              view === "today" ||
              view === "yesterday" ||
              view === "pending" ||
              view === "requests") && (
              <div className="dash-card" style={{ gridColumn: "1 / -1" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "10px" }}>
                  <h2 style={{ margin: 0 }}>
                    {view === "today"
                      ? "Donated today"
                      : view === "yesterday"
                        ? "Donated yesterday"
                        : view === "pending"
                          ? "Added but not donated"
                          : view === "requests"
                            ? "In requests"
                            : "Stock items"}
                  </h2>
                  <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                    <input 
                      type="date" 
                      value={filterDate}
                      onChange={(e) => setFilterDate(e.target.value)}
                      style={{ padding: "8px", borderRadius: "8px", border: "1px solid #cfd8dc" }}
                      title="Filter by date"
                    />
                    {filterDate && (
                      <button 
                        type="button" 
                        onClick={() => setFilterDate("")} 
                        style={{ padding: "6px 12px", background: "#f5f5f5", border: "1px solid #ccc", borderRadius: "8px", cursor: "pointer", fontSize: "0.85rem", height: "100%" }}
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>

                <ul
                  style={{
                    listStyle: "none",
                    padding: 0,
                    margin: 0,
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(auto-fill, minmax(min(100%, 280px), 1fr))",
                    gap: 12,
                  }}
                >
                  {filteredStock.length === 0 ? (
                    <li style={{ color: "#78909c" }}>No items match the selected date filter.</li>
                  ) : filteredStock.map((it) => (
                      <li

                      key={it._id || it.barcode}
                      className="dash-card"
                      style={{ padding: 12 }}
                    >
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
                          <div style={{ fontWeight: 700 }}>{it.name}</div>
                          <div className="dash-subtitle">
                            Qty: {it.quantity} {it.unit} · Exp:{" "}
                            {it.expiryDate ? String(it.expiryDate).slice(0, 10) : "-"}
                          </div>
                          <div className="dash-subtitle" style={{ wordBreak: "break-all" }}>
                            Donor: {it.donor?.email || "-"}
                          </div>
                          <div className="dash-subtitle" style={{ wordBreak: "break-all" }}>
                            Receiver:{" "}
                            {it.collectedBy?.email ||
                              it.reservedBy?.email ||
                              "-"}
                          </div>
                          <div className="dash-subtitle">Status: {it.status}</div>
                          <button
                            onClick={() => handleDeleteFood(it._id)}
                            style={{
                              marginTop: 5,
                              padding: "4px 8px",
                              backgroundColor: "#d32f2f",
                              color: "white",
                              border: "none",
                              borderRadius: "4px",
                              cursor: "pointer",
                              fontSize: "0.8rem",
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                      <div className="dash-subtitle" style={{ marginTop: 8 }}>
                        Address: {it.address}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {view === "reports" && (
              <div className="dash-card" style={{ gridColumn: "1 / -1", padding: "2rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
                  <h2 style={{ fontSize: "1.6rem", margin: 0 }}>Database Reports & Logs</h2>
                  <div style={{ display: "flex", gap: "1rem", alignItems: "center", flexWrap: "wrap" }}>
                    <select 
                      value={reportType} 
                      onChange={(e) => setReportType(e.target.value)}
                      style={{ padding: "0.5rem 1rem", borderRadius: "8px", border: "1px solid #cfd8dc", fontSize: "0.95rem" }}
                    >
                      <option value="all">All Events</option>
                      <option value="added">Available Items Logs</option>
                      <option value="reserved">Reserved Logs</option>
                      <option value="collected">Delivered Logs</option>
                    </select>
                    <input 
                      type="date" 
                      value={reportDate} 
                      onChange={(e) => setReportDate(e.target.value)} 
                      style={{ padding: "0.5rem 1rem", borderRadius: "8px", border: "1px solid #cfd8dc", fontSize: "0.95rem" }}
                    />
                    <button 
                      onClick={() => setReportDate("")}
                      style={{ padding: "0.5rem 1rem", background: "#f5f5f5", border: "1px solid #e0e0e0", borderRadius: "8px", cursor: "pointer" }}
                    >
                      Clear Date
                    </button>
                  </div>
                </div>

                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.95rem", textAlign: "left" }}>
                    <thead>
                      <tr style={{ background: "#f8f9fa", borderBottom: "2px solid #e0e0e0" }}>
                        <th style={{ padding: "12px 16px", color: "#455a64" }}>Event Type</th>
                        <th style={{ padding: "12px 16px", color: "#455a64" }}>Item Name</th>
                        <th style={{ padding: "12px 16px", color: "#455a64" }}>Donor Email</th>
                        <th style={{ padding: "12px 16px", color: "#455a64" }}>Receiver Email</th>
                        <th style={{ padding: "12px 16px", color: "#455a64" }}>Timestamp</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportTotalItems === 0 ? (
                        <tr>
                          <td colSpan="5" style={{ padding: "2rem", textAlign: "center", color: "#90a4ae" }}>
                            No records found for the selected criteria.
                          </td>
                        </tr>
                      ) : (
                        currentReportRows.map((r, i) => (
                          <tr key={reportStartIdx + i} style={{ borderBottom: "1px solid #eceff1" }}>
                            <td style={{ padding: "12px 16px" }}>
                              <span style={{ display: "inline-block", padding: "4px 8px", background: r.bg, color: r.color, borderRadius: "6px", fontSize: "0.8rem", fontWeight: "bold" }}>
                                {r.type}
                              </span>
                            </td>
                            <td style={{ padding: "12px 16px", fontWeight: "600", color: "#37474f" }}>{r.name}</td>
                            <td style={{ padding: "12px 16px", color: "#546e7a" }}>{r.donor}</td>
                            <td style={{ padding: "12px 16px", color: "#546e7a" }}>{r.receiver}</td>
                            <td style={{ padding: "12px 16px", color: "#607d8b" }}>{r.date ? r.date.toLocaleString() : "N/A"}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {reportTotalItems > 0 && (
                  <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", flexWrap: "wrap", gap: "16px", padding: "16px 8px 0px", fontSize: "0.85rem", color: "#555" }}>
                    <div style={{ display: "flex", alignItems: "center" }}>
                      <span>Items per page:</span>
                      <select 
                        value={reportItemsPerPage} 
                        onChange={(e) => {
                          setReportItemsPerPage(Number(e.target.value));
                          setReportPage(1);
                        }}
                        style={{ marginLeft: "8px", border: "none", outline: "none", background: "transparent", color: "#555", cursor: "pointer", fontSize: "0.85rem", borderBottom: "1px solid #ccc", padding: "2px 0" }}
                      >
                        <option value={5}>5</option>
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                        <option value={50}>50</option>
                      </select>
                    </div>
                    
                    <div style={{ marginRight: "32px" }}>
                      {reportStartIdx + 1} - {Math.min(reportStartIdx + reportItemsPerPage, reportTotalItems)} of {reportTotalItems}
                    </div>
                    
                    <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
                      <button 
                        onClick={() => setReportPage(1)} 
                        disabled={reportPage === 1}
                        style={{ background: "none", border: "none", cursor: reportPage === 1 ? "default" : "pointer", opacity: reportPage === 1 ? 0.3 : 1, fontSize: "1rem", color: "#555", padding: 0 }}
                        title="First Page"
                      >
                        |&lt;&lt;
                      </button>
                      <button 
                        onClick={() => setReportPage(prev => Math.max(prev - 1, 1))} 
                        disabled={reportPage === 1}
                        style={{ background: "none", border: "none", cursor: reportPage === 1 ? "default" : "pointer", opacity: reportPage === 1 ? 0.3 : 1, fontSize: "1rem", color: "#555", padding: 0 }}
                        title="Previous Page"
                      >
                        &lt;
                      </button>
                      <button 
                        onClick={() => setReportPage(prev => Math.min(prev + 1, reportTotalPages))} 
                        disabled={reportPage === reportTotalPages}
                        style={{ background: "none", border: "none", cursor: reportPage === reportTotalPages ? "default" : "pointer", opacity: reportPage === reportTotalPages ? 0.3 : 1, fontSize: "1rem", color: "#555", padding: 0 }}
                        title="Next Page"
                      >
                        &gt;
                      </button>
                      <button 
                        onClick={() => setReportPage(reportTotalPages)} 
                        disabled={reportPage === reportTotalPages}
                        style={{ background: "none", border: "none", cursor: reportPage === reportTotalPages ? "default" : "pointer", opacity: reportPage === reportTotalPages ? 0.3 : 1, fontSize: "1rem", color: "#555", padding: 0 }}
                        title="Last Page"
                      >
                        &gt;&gt;|
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {view === "users" && (
              <div className="dash-card" style={{ gridColumn: "1 / -1", padding: "2rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
                  <div>
                    <h2 style={{ fontSize: "1.6rem", margin: 0 }}>Users Management</h2>
                    <p className="dash-subtitle" style={{ margin: "5px 0 0 0" }}>
                      Identify and block fake IDs or rule-violating users.
                    </p>
                  </div>
                  <div className="chip-row">
                     <button className={`chip ${userView === 'donors' ? 'active' : ''}`} onClick={() => { setUserView('donors'); setUserPage(1); }} style={userView==='donors'?{background:'#e0f2f1', borderColor:'#009688', color:'#00796b'}:{}}>Donors</button>
                     <button className={`chip ${userView === 'receivers' ? 'active' : ''}`} onClick={() => { setUserView('receivers'); setUserPage(1); }} style={userView==='receivers'?{background:'#e3f2fd', borderColor:'#2196f3', color:'#0d47a1'}:{}}>Receivers</button>
                     <button className={`chip ${userView === 'blocked' ? 'active' : ''}`} onClick={() => { setUserView('blocked'); setUserPage(1); }} style={userView==='blocked'?{background:'#ffebee', borderColor:'#f44336', color:'#c62828'}:{}}>Blocked Users</button>
                  </div>
                </div>

                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.95rem", textAlign: "left" }}>
                    <thead>
                      <tr style={{ background: "#f8f9fa", borderBottom: "2px solid #e0e0e0" }}>
                        <th style={{ padding: "12px 16px", color: "#455a64" }}>Name</th>
                        <th style={{ padding: "12px 16px", color: "#455a64" }}>Email</th>
                        <th style={{ padding: "12px 16px", color: "#455a64" }}>Mobile</th>
                        <th style={{ padding: "12px 16px", color: "#455a64" }}>Role</th>
                        <th style={{ padding: "12px 16px", color: "#455a64", textAlign: "right" }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {userTotalItems === 0 ? (
                        <tr>
                          <td colSpan="5" style={{ padding: "2rem", textAlign: "center", color: "#90a4ae" }}>
                            No users found in this category.
                          </td>
                        </tr>
                      ) : (
                        currentUserRows.map((u) => (
                          <tr key={u._id} style={{ borderBottom: "1px solid #eceff1" }}>
                            <td style={{ padding: "12px 16px", fontWeight: "600", color: "#37474f" }}>{u.name || "N/A"}</td>
                            <td style={{ padding: "12px 16px", color: "#546e7a" }}>{u.email}</td>
                            <td style={{ padding: "12px 16px", color: "#546e7a" }}>{u.mobile}</td>
                            <td style={{ padding: "12px 16px", color: "#607d8b", textTransform: "capitalize" }}>{u.role || (userView.replace("s", ""))}</td>
                            <td style={{ padding: "12px 16px", textAlign: "right" }}>
                              <button 
                                onClick={() => handleToggleBlock(u._id, u.isBlocked)} 
                                style={{ 
                                  padding: "6px 12px", 
                                  background: u.isBlocked ? "#667eea" : "#d32f2f", 
                                  color: "white", 
                                  border: "none", 
                                  borderRadius: "6px", 
                                  cursor: "pointer", 
                                  fontSize: "0.8rem",
                                  fontWeight: "bold"
                                }}
                              >
                                {u.isBlocked ? "Unblock" : "Block User"}
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {userTotalItems > 0 && (
                  <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", flexWrap: "wrap", gap: "16px", padding: "16px 8px 0px", fontSize: "0.85rem", color: "#555" }}>
                    <div style={{ display: "flex", alignItems: "center" }}>
                      <span>Items per page:</span>
                      <select 
                        value={userItemsPerPage} 
                        onChange={(e) => {
                          setUserItemsPerPage(Number(e.target.value));
                          setUserPage(1);
                        }}
                        style={{ marginLeft: "8px", border: "none", outline: "none", background: "transparent", color: "#555", cursor: "pointer", fontSize: "0.85rem", borderBottom: "1px solid #ccc", padding: "2px 0" }}
                      >
                        <option value={5}>5</option>
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                        <option value={50}>50</option>
                      </select>
                    </div>
                    
                    <div style={{ marginRight: "32px" }}>
                      {userStartIdx + 1} - {Math.min(userStartIdx + userItemsPerPage, userTotalItems)} of {userTotalItems}
                    </div>
                    
                    <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
                      <button 
                        onClick={() => setUserPage(1)} 
                        disabled={userPage === 1}
                        style={{ background: "none", border: "none", cursor: userPage === 1 ? "default" : "pointer", opacity: userPage === 1 ? 0.3 : 1, fontSize: "1rem", color: "#555", padding: 0 }}
                      >
                        |&lt;&lt;
                      </button>
                      <button 
                        onClick={() => setUserPage(prev => Math.max(prev - 1, 1))} 
                        disabled={userPage === 1}
                        style={{ background: "none", border: "none", cursor: userPage === 1 ? "default" : "pointer", opacity: userPage === 1 ? 0.3 : 1, fontSize: "1rem", color: "#555", padding: 0 }}
                      >
                        &lt;
                      </button>
                      <button 
                        onClick={() => setUserPage(prev => Math.min(prev + 1, userTotalPages))} 
                        disabled={userPage === userTotalPages}
                        style={{ background: "none", border: "none", cursor: userPage === userTotalPages ? "default" : "pointer", opacity: userPage === userTotalPages ? 0.3 : 1, fontSize: "1rem", color: "#555", padding: 0 }}
                      >
                        &gt;
                      </button>
                      <button 
                        onClick={() => setUserPage(userTotalPages)} 
                        disabled={userPage === userTotalPages}
                        style={{ background: "none", border: "none", cursor: userPage === userTotalPages ? "default" : "pointer", opacity: userPage === userTotalPages ? 0.3 : 1, fontSize: "1rem", color: "#555", padding: 0 }}
                      >
                        &gt;&gt;|
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
}

export default AdminDashboard;

