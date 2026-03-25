import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/auth.css";
import { FaEnvelope, FaLock } from "react-icons/fa";
import { apiRequest, setAuth } from "../utils/api";
import logo from "../assets/sanjeevani.jpeg";

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");

  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [fpStep, setFpStep] = useState(1);
  const [fpOtp, setFpOtp] = useState("");
  const [fpNewPassword, setFpNewPassword] = useState("");

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const handleLogin = async () => {
    setError("");

    if (!email || !password) {
      setError("Email and password are required.");
      return;
    }

    if (!emailRegex.test(email)) {
      setError("Enter a valid email address.");
      return;
    }

    try {
      const data = await apiRequest("/api/auth/login", {
        method: "POST",
        body: { email, password },
      });

      // backend returns { token, email, role, mobile }
      setAuth({
        token: data.token,
        user: {
          email: data.email,
          role: data.role,
          mobile: data.mobile,
        },
      });

      if (data.role === "admin") navigate("/admin-dashboard");
      else if (data.role === "receiver") navigate("/receiver-dashboard");
      else navigate("/donor-dashboard");
    } catch (err) {
      setError(err?.message || "Login failed. Please check your credentials.");
    }
  };

  const handleForgotPasswordStep1 = async () => {
    setError("");
    setMsg("");
    if (!email) {
      setError("Please enter your email to reset password.");
      return;
    }
    try {
      const resp = await apiRequest("/api/auth/forgot-password", {
        method: "POST",
        body: { email },
      });
      setMsg(resp.message || "OTP sent to email");
      setFpStep(2);
    } catch (err) {
      setError(err?.message || "Failed to initiate password reset.");
    }
  };

  const handleForgotPasswordStep2 = async () => {
    setError("");
    setMsg("");
    if (!fpOtp || !fpNewPassword) {
      setError("Please enter OTP and new password.");
      return;
    }
    if (fpNewPassword.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    try {
      const resp = await apiRequest("/api/auth/reset-password", {
        method: "POST",
        body: { email, otp: fpOtp, newPassword: fpNewPassword },
      });
      setMsg(resp.message || "Password reset successful! You can now login.");
      setIsForgotPassword(false);
      setFpStep(1);
      setFpOtp("");
      setFpNewPassword("");
      setPassword("");
    } catch (err) {
      setError(err?.message || "Password reset failed.");
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <img
          className="logo"
          // src="https://cdn-icons-png.flaticon.com/512/1046/1046784.png"
          src={logo}
          alt="Food Value Platform"
        />

        <h2>Food Value Platform</h2>
        <p className="subtitle">
          {isForgotPassword ? "Reset your password" : "Smart Shelf-Life & Food Sharing"}
        </p>

        {error && <p className="auth-error">{error}</p>}
        {msg && <p style={{ color: "green", fontSize: "14px", marginBottom: "10px" }}>{msg}</p>}

        {!isForgotPassword ? (
          <>
            <div className="input-group">
              <FaEnvelope className="icon" />
              <input
                type="email"
                placeholder="Email Address"
                name="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="off"
              />
            </div>

            <div className="input-group">
              <FaLock className="icon" />
              <input
                type="password"
                placeholder="Password"
                name="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
              />
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", width: "100%", marginBottom: "15px" }}>
              <button
                type="button"
                className="auth-link-button"
                style={{ fontSize: "13px" }}
                onClick={() => {
                  setIsForgotPassword(true);
                  setError("");
                  setMsg("");
                }}
              >
                Forgot Password?
              </button>
            </div>

            <button className="submit-btn" onClick={handleLogin}>
              LOGIN TO YOUR ACCOUNT
            </button>

            <p className="auth-switch-text">
              Don&apos;t have an account?{" "}
              <button
                type="button"
                className="auth-link-button"
                onClick={() => navigate("/signup")}
              >
                Sign up
              </button>
            </p>
          </>
        ) : (
          <>
            <div className="input-group">
              <FaEnvelope className="icon" />
              <input
                type="email"
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={fpStep === 2}
              />
            </div>

            {fpStep === 1 ? (
              <button className="submit-btn" onClick={handleForgotPasswordStep1}>
                SEND OTP
              </button>
            ) : (
              <>
                <div className="input-group">
                  <FaLock className="icon" />
                  <input
                    type="text"
                    placeholder="Enter 6-digit OTP"
                    value={fpOtp}
                    maxLength="6"
                    onChange={(e) => setFpOtp(e.target.value.replace(/\D/g, ""))}
                  />
                </div>
                <div className="input-group">
                  <FaLock className="icon" />
                  <input
                    type="password"
                    placeholder="New Password"
                    value={fpNewPassword}
                    onChange={(e) => setFpNewPassword(e.target.value)}
                  />
                </div>
                <button className="submit-btn" onClick={handleForgotPasswordStep2}>
                  RESET PASSWORD
                </button>
              </>
            )}

            <p className="auth-switch-text" style={{ marginTop: "15px" }}>
              Remember your password?{" "}
              <button
                type="button"
                className="auth-link-button"
                onClick={() => {
                  setIsForgotPassword(false);
                  setFpStep(1);
                  setError("");
                  setMsg("");
                }}
              >
                Back to Login
              </button>
            </p>
          </>
        )}
      </div>
    </div>
  );
}

export default Login;