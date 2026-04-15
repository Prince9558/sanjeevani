import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/dashboard.css";

function Dashboard() {
  const navigate = useNavigate();
  const user = JSON.parse(sessionStorage.getItem("currentUser"));

  useEffect(() => {
    if (!user) {
      navigate("/");
    }
  }, [user, navigate]);

  const handleLogout = () => {
    sessionStorage.removeItem("currentUser");
    navigate("/");
  };

  if (!user) return null;

  return (
    <div className="dash-layout">
      <aside className="dash-sidebar">
        <div className="dash-brand">
          <span className="dot" />
          <span>Food Value</span>
        </div>

        <nav className="dash-menu">
          <button className="menu-item active">Overview</button>
          <button className="menu-item">Donations</button>
          <button className="menu-item">Requests</button>
          <button className="menu-item">Inventory</button>
        </nav>

        <button className="logout-btn" onClick={handleLogout}>
          Logout
        </button>
      </aside>

      <main className="dash-main">
        <header className="dash-header">
          <div>
            <h1>Welcome back, {user?.role === 'admin' ? "Admin" : (user?.name || user?.email)}</h1>
            <p className="dash-subtitle">
              You are logged in as <strong>{user?.role}</strong>. Here is a quick
              overview of today&apos;s activity.
            </p>
          </div>
        </header>

        <section className="dash-grid">
          <div className="dash-card highlight">
            <h2>Today&apos;s Summary</h2>
            <ul>
              <li>3 new food donations created</li>
              <li>5 requests are waiting for approval</li>
              <li>18 items close to expiry in the next 24 hours</li>
            </ul>
          </div>

          <div className="dash-card">
            <h3>Your role</h3>
            <p>
              As a <strong>{user?.role}</strong>, you help keep food moving to where it
              is needed most. Use this dashboard to track items, manage requests, and
              reduce waste.
            </p>
          </div>

          <div className="dash-card">
            <h3>Quick actions</h3>
            <div className="chip-row">
              <button
                className="chip"
                onClick={() => {
                  if (user?.role === "admin") navigate("/admin-dashboard");
                  else if (user?.role === "receiver") navigate("/receiver-dashboard");
                  else navigate("/donor-dashboard");
                }}
              >
                Open my dashboard
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default Dashboard;
