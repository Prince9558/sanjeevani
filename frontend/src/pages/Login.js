import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/auth.css";
import { FaEnvelope, FaLock, FaEye, FaEyeSlash } from "react-icons/fa";
import { apiRequest, setAuth } from "../utils/api";
import logo from "../assets/sanjeevani.jpeg";

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [fpStep, setFpStep] = useState(1);
  const [fpOtp, setFpOtp] = useState("");
  const [fpNewPassword, setFpNewPassword] = useState("");
  const [fpConfirmPassword, setFpConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [timer, setTimer] = useState(0);
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  useEffect(() => {
    let interval;
    if (timer > 0 && fpStep === 2) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timer, fpStep]);

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

    setLoading(true);

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
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPasswordStep1 = async () => {
    setError("");
    setMsg("");
    if (!email) {
      setError("Please enter your email to reset password.");
      return;
    }
    setLoading(true);
    try {
      const resp = await apiRequest("/api/auth/forgot-password", {
        method: "POST",
        body: { email },
      });
      setMsg(resp.message || "OTP sent to email");
      setFpStep(2);
      setTimer(60);
    } catch (err) {
      setError(err?.message || "Failed to initiate password reset.");
    } finally {
      setLoading(false);
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
    if (fpNewPassword !== fpConfirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      const resp = await apiRequest("/api/auth/reset-password", {
        method: "POST",
        body: { email, otp: fpOtp, newPassword: fpNewPassword },
      });
      setMsg(resp.message || "Password reset successfully.");
      setIsForgotPassword(false);
      setFpStep(1);
      setTimer(0);
      setFpOtp("");
      setFpNewPassword("");
      setFpConfirmPassword("");
      setShowPassword(false);
      setShowConfirmPassword(false);
      setPassword("");
    } catch (err) {
      setError(err?.message || "Password reset failed.");
    } finally {
      setLoading(false);
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
                autoComplete="username"
              />
            </div>

            <div className="input-group" style={{ position: "relative", display: "flex", alignItems: "center" }}>
              <FaLock className="icon" />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                name="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                style={{ width: "100%", paddingRight: "40px" }}
              />
              <span
                className="password-toggle-icon"
                onClick={() => setShowPassword(!showPassword)}
                style={{ position: "absolute", right: "15px", cursor: "pointer", color: "#888", display: "flex", alignItems: "center", height: "100%", top: 0 }}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </span>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", width: "100%", marginBottom: "15px", fontSize: "13px" }}>
              <button
                type="button"
                className="auth-link-button"
                onClick={() => {
                  setIsForgotPassword(true);
                  setError("");
                  setMsg("");
                }}
              >
                Forgot Password?
              </button>
            </div>

            <button className="submit-btn" onClick={handleLogin} disabled={loading}>
              {loading ? "LOGGING IN..." : "LOGIN TO YOUR ACCOUNT"}
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
              <button className="submit-btn" onClick={handleForgotPasswordStep1} disabled={loading}>
                {loading ? "SENDING..." : "SEND OTP"}
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
                <div className="input-group" style={{ position: "relative", display: "flex", alignItems: "center" }}>
                  <FaLock className="icon" />
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="New Password"
                    value={fpNewPassword}
                    onChange={(e) => setFpNewPassword(e.target.value)}
                    autoComplete="new-password"
                    style={{ width: "100%", paddingRight: "40px" }}
                  />
                  <span
                    className="password-toggle-icon"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ position: "absolute", right: "15px", cursor: "pointer", color: "#888", display: "flex", alignItems: "center", height: "100%", top: 0 }}
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </span>
                </div>
                <div className="input-group" style={{ position: "relative", display: "flex", alignItems: "center" }}>
                  <FaLock className="icon" />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm New Password"
                    value={fpConfirmPassword}
                    onChange={(e) => setFpConfirmPassword(e.target.value)}
                    autoComplete="new-password"
                    style={{ width: "100%", paddingRight: "40px" }}
                  />
                  <span
                    className="password-toggle-icon"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={{ position: "absolute", right: "15px", cursor: "pointer", color: "#888", display: "flex", alignItems: "center", height: "100%", top: 0 }}
                  >
                    {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                  </span>
                </div>
                <button className="submit-btn" onClick={handleForgotPasswordStep2} disabled={loading}>
                  {loading ? "RESETTING..." : "RESET PASSWORD"}
                </button>
                <div style={{ marginTop: "12px", fontSize: "14px", color: "#555", textAlign: "right", width: "100%" }}>
                  {timer > 0 ? (
                    <span>Resend OTP in <strong style={{ color: "#764ba2" }}>{timer}s</strong></span>
                  ) : (
                    <span>
                      Didn't receive code?{" "}
                      <button
                        type="button"
                        className="auth-link-button"
                        onClick={handleForgotPasswordStep1}
                        disabled={loading}
                      >
                        {loading ? "Sending..." : "Resend"}
                      </button>
                    </span>
                  )}
                </div>
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
                  setTimer(0);
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
