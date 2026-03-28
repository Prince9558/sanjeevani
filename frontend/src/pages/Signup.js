import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/auth.css";
import { FaEnvelope, FaLock, FaUser } from "react-icons/fa";
import { apiRequest, setAuth } from "../utils/api";
import logo from "../assets/sanjeevani.jpeg";

function Signup() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("donor");
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const mobileRegex = /^[0-9]{10}$/;

  const handleSignup = async () => {
    setError("");

    if (!name || !email || !mobile || !password || !confirmPassword) {
      setError("All fields are required.");
      return;
    }

    if (!emailRegex.test(email)) {
      setError("Enter a valid email address.");
      return;
    }

    if (!mobileRegex.test(mobile)) {
      setError("Enter a valid 10-digit mobile number.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      await apiRequest("/api/auth/register", {
        method: "POST",
        body: {
          name,
          email,
          mobile,
          password,
          role,
        },
      });

      // Auto-login after successful signup
      const data = await apiRequest("/api/auth/login", {
        method: "POST",
        body: { email, password },
      });

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
      setError(err?.message || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <img
          className="logo"
          src={logo}
          alt="Create account"
        />

        <h2>Create Account</h2>
        <p className="subtitle">Smart Shelf-Life & Food Sharing</p>

        {error && <p className="auth-error">{error}</p>}

        <div className="input-group">
          <FaUser className="icon" />
          <input
            type="text"
            placeholder="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className="input-group">
          <FaEnvelope className="icon" />
          <input
            type="email"
            placeholder="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="input-group">
          <FaLock className="icon" />
          <input
            type="tel"
            placeholder="Mobile Number"
            value={mobile}
            maxLength="10"
            onChange={(e) => {
              const val = e.target.value.replace(/\D/g, "");
              setMobile(val);
            }}
          />
        </div>

        <div className="role-buttons">
          <button
            className={role === "donor" ? "active" : ""}
            onClick={() => setRole("donor")}
          >
            Donor
          </button>

          <button
            className={role === "receiver" ? "active" : ""}
            onClick={() => setRole("receiver")}
          >
            Receiver
          </button>
        </div>

        <div className="input-group">
          <FaLock className="icon" />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <div className="input-group">
          <FaLock className="icon" />
          <input
            type="password"
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </div>

        <button className="submit-btn" onClick={handleSignup} disabled={loading}>
          {loading ? "CREATING ACCOUNT..." : "CREATE NEW ACCOUNT"}
        </button>

        <p className="auth-switch-text">
          Already have an account?{" "}
          <button
            type="button"
            className="auth-link-button"
            onClick={() => navigate("/login")}
          >
            Login
          </button>
        </p>
      </div>
    </div>
  );
}

export default Signup;
