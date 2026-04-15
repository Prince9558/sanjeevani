import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { apiRequest } from "../utils/api";
import "../styles/auth.css";
import logo from "../assets/sanjeevani.jpeg";

function VerifyEmail() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState("verifying"); // verifying, success, error
  const [message, setMessage] = useState("");

  useEffect(() => {
    const verifyToken = async () => {
      try {
        await apiRequest("/api/auth/verify-email", {
          method: "POST",
          body: { token }
        });
        setStatus("success");
      } catch (err) {
        setStatus("error");
        setMessage(err?.message || "Verification failed. The link might be expired or invalid.");
      }
    };

    if (token) {
      verifyToken();
    }
  }, [token]);

  return (
    <div className="auth-container">
      <div className="auth-card">
        <img className="logo" src={logo} alt="Sanjeevani Logo" />
        
        <h2>Email Verification</h2>
        
        {status === "verifying" && (
          <p style={{ textAlign: "center", marginBottom: "20px" }}>
            Please wait while we verify your email address...
          </p>
        )}

        {status === "success" && (
          <div style={{ textAlign: "center" }}>
            <p className="auth-success" style={{ color: "green", fontSize: "16px", marginBottom: "20px" }}>
              Your email has been successfully verified. You can now log in using the same login credentials (email and password).
            </p>
            <button className="submit-btn" onClick={() => navigate("/login")}>
              Proceed to Login
            </button>
          </div>
        )}

        {status === "error" && (
          <div style={{ textAlign: "center" }}>
            <p className="auth-error" style={{ color: "red", marginBottom: "20px" }}>
              {message}
            </p>
            <button className="submit-btn" onClick={() => navigate("/signup")}>
              Return to Signup
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default VerifyEmail;
