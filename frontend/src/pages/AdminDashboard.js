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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
            color: "#2e7d32", bg: "#e8f5e9",
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

  if (!user || user.role !== "admin") return null;

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
            Admin overview
          </button>
          <button
            className={`menu-item ${view === "donors" ? "active" : ""}`}
            onClick={() => setView("donors")}
          >
            Donors
          </button>
          <button
            className={`menu-item ${view === "receivers" ? "active" : ""}`}
            onClick={() => setView("receivers")}
          >
            Receivers
          </button>
          <button
            className={`menu-item ${view === "stock" ? "active" : ""}`}
            onClick={() => setView("stock")}
          >
            Stock items
          </button>
          <button
            className={`menu-item ${view === "reports" ? "active" : ""}`}
            onClick={() => setView("reports")}
          >
            Reports & Logs
          </button>
        </nav>

        <button className="logout-btn" onClick={handleLogout}>
          Logout
        </button>
      </aside>

      <main className="dash-main">
        <header className="dash-header" style={{ alignItems: "flex-start" }}>
          <div>
            <h1>Admin dashboard</h1>
            <p className="dash-subtitle">
              Monitor donors, receivers and donation flow across the platform.
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
                <h2 style={{ fontSize: "1.4rem", color: "#1b5e20", marginBottom: "0.5rem" }}>Our Mission at Food Value Platform</h2>
                <p style={{ lineHeight: "1.6", color: "#455a64" }}>
                  Food Value reduces waste by safely matching surplus food with active receivers in the community.
                  Donors add items with pickup details. Receivers reserve items and collect using a seamless OTP verification process.
                </p>
                <div style={{ marginTop: "1rem", padding: "1rem", background: "#e8f5e9", borderRadius: "8px", borderLeft: "4px solid #4caf50" }}>
                  <strong>Admin Responsibility:</strong> You oversee the health of the entire donation lifecycle to ensure zero-waste and rapid distributions. Use the side tabs and quick action chips to monitor pending inventory versus successful collections.
                </div>
              </div>
            )}

            {view === "donors" && (
              <div className="dash-card" style={{ gridColumn: "1 / -1" }}>
                <h2>Donors</h2>
                <ul style={{ margin: 0, paddingLeft: 18 }}>
                  {donors.length === 0 ? (
                    <li>No donors yet.</li>
                  ) : (
                    donors.map((d) => <li key={d.email}>{d.email}</li>)
                  )}
                </ul>
              </div>
            )}

            {view === "receivers" && (
              <div className="dash-card" style={{ gridColumn: "1 / -1" }}>
                <h2>Receivers</h2>
                <ul style={{ margin: 0, paddingLeft: 18 }}>
                  {receivers.length === 0 ? (
                    <li>No receivers yet.</li>
                  ) : (
                    receivers.map((r) => <li key={r.email}>{r.email}</li>)
                  )}
                </ul>
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
                          <div className="dash-subtitle">
                            Donor: {it.donor?.email || "-"}
                          </div>
                          <div className="dash-subtitle">
                            Receiver:{" "}
                            {it.collectedBy?.email ||
                              it.reservedBy?.email ||
                              "-"}
                          </div>
                          <div className="dash-subtitle">Status: {it.status}</div>
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
          </section>
        )}
      </main>
    </div>
  );
}

export default AdminDashboard;

