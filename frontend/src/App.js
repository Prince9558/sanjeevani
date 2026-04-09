import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { apiRequest } from "./utils/api";

import Home from "./pages/Home";
import AuthPage from "./pages/AuthPage";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import AdminDashboard from "./pages/AdminDashboard";
import ReceiverDashboard from "./pages/ReceiverDashboard";
import DonorDashboard from "./pages/DonorDashboard";
import FoodDetails from "./pages/FoodDetails";
import FeedbackPage from "./pages/FeedbackPage";

function App() {
  const [isServerAwake, setIsServerAwake] = useState(false);

  useEffect(() => {
    // Wake up the server from cold start
    const wakeUpServer = async () => {
      try {
        await apiRequest("/api/ping", { method: "GET" });
      } catch (err) {
        console.error("Server ping failed:", err);
      } finally {
        setIsServerAwake(true);
      }
    };
    wakeUpServer();

    const handleStorageChange = (e) => {
      // Sync login state properly if another tab logs out, but don't force logout otherwise.
      if (e.key === "authToken" && !e.newValue) {
        window.location.href = "/";
      }
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  if (!isServerAwake) {
    return (
      <div style={{ height: "100vh", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", backgroundColor: "#fff", color: "#000", fontFamily: "sans-serif" }}>
        <div className="ios-spinner">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="spinner-blade" style={{
              transform: `rotate(${i * 30}deg) translateY(-180%)`,
              animationDelay: `${i * 0.1 - 1.2}s`
            }}></div>
          ))}
        </div>
        <h2 style={{ marginTop: "40px", fontSize: "20px", fontWeight: "normal", letterSpacing: "3px", color: "#000" }}>LOADING...</h2>
        <style>
          {`
            .ios-spinner {
              position: relative;
              width: 40px;
              height: 40px;
            }
            .spinner-blade {
              position: absolute;
              top: 50%;
              left: 50%;
              width: 4px;
              height: 11px;
              margin-top: -5px;
              margin-left: -2px;
              border-radius: 2px;
              animation: spinner-fade 1.2s infinite linear;
            }
            @keyframes spinner-fade {
              0% { background-color: #000000; }
              100% { background-color: #e0e0e0; }
            }
          `}
        </style>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/admin-dashboard" element={<AdminDashboard />} />
        <Route path="/donor-dashboard" element={<DonorDashboard />} />
        <Route path="/receiver-dashboard" element={<ReceiverDashboard />} />
        <Route path="/item/:id" element={<FoodDetails />} />
        <Route path="/feedback" element={<FeedbackPage />} />
      </Routes>
    </Router>
  );
}

export default App;
