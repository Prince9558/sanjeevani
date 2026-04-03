import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Home from "./pages/Home";
import AuthPage from "./pages/AuthPage";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import AdminDashboard from "./pages/AdminDashboard";
import ReceiverDashboard from "./pages/ReceiverDashboard";
import DonorDashboard from "./pages/DonorDashboard";
import FoodDetails from "./pages/FoodDetails";

function App() {
  React.useEffect(() => {
    const handleStorageChange = (e) => {
      // Sync login state properly if another tab logs out, but don't force logout otherwise.
      if (e.key === "authToken" && !e.newValue) {
        window.location.href = "/";
      }
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

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
      </Routes>
    </Router>
  );
}

export default App;
