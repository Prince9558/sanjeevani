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
  const [address, setAddress] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const mobileRegex = /^[0-9]{10}$/;

  const handleSignup = async () => {
    setError("");

    if (!name || !email || !mobile || !address || !password || !confirmPassword) {
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

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#]).{8,}$/;
    if (!passwordRegex.test(password)) {
      setError("Password must be at least 8 characters and include a capital letter, small letter, number, and special character.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const resp = await apiRequest("/api/auth/register", {
        method: "POST",
        body: {
          name,
          email,
          mobile,
          address,
          password,
          role,
        },
      });

      setSuccess("Your account is created! A verification link has been sent to your email.");
      setName("");
      setEmail("");
      setMobile("");
      setAddress("");
      setPassword("");
      setConfirmPassword("");
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
        {success && <p className="auth-success" style={{color: "green", marginBottom: "15px"}}>{success}</p>}

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

        <div className="input-group">
          <FaUser className="icon" />
          <input
            type="text"
            placeholder="Address / Location"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
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
          {loading ? "SENDING VERIFICATION..." : "VERIFY EMAIL"}
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
