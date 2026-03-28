import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaEnvelope, FaLock } from "react-icons/fa";
import "../styles/auth.css";

function AuthPage() {
  const navigate = useNavigate();

  const [tab, setTab] = useState("login");
  const [role, setRole] = useState("donor");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [error, setError] = useState("");

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const handleSignup = () => {
    setError("");

    if (email === "" || password === "" || confirmPassword === "") {
      setError("All fields are required");
      return;
    }

    if (!emailRegex.test(email)) {
      setError("Enter a valid email address");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    const users = JSON.parse(sessionStorage.getItem("users")) || [];

    const userExists = users.find((u) => u.email === email);

    if (userExists) {
      setError("User already registered");
      return;
    }

    const newUser = {
      email: email,
      password: password,
      role: role
    };

    users.push(newUser);

    sessionStorage.setItem("users", JSON.stringify(users));
    sessionStorage.setItem("currentUser", JSON.stringify(newUser));

    navigate("/dashboard");
  };

  const handleLogin = () => {
    setError("");

    if (email === "" || password === "") {
      setError("Email and password required");
      return;
    }

    if (!emailRegex.test(email)) {
      setError("Enter valid email");
      return;
    }

    const users = JSON.parse(sessionStorage.getItem("users")) || [];

    const user = users.find((u) => u.email === email);

    if (!user) {
      setError("User not registered");
      return;
    }

    if (user.password !== password) {
      setError("Wrong password");
      return;
    }

    sessionStorage.setItem("currentUser", JSON.stringify(user));

    navigate("/dashboard");
  };

  return (
    <div className="container">
      <div className="card">

        <img
          className="logo"
          src="https://cdn-icons-png.flaticon.com/512/1046/1046784.png"
          alt="logo"
        />

        <h1>Food Value Platform</h1>
        <p className="subtitle">Smart Shelf-Life & Food Sharing</p>

        <div className="tabs">
          <button
            className={tab === "login" ? "active" : ""}
            onClick={() => setTab("login")}
          >
            LOGIN
          </button>

          <button
            className={tab === "signup" ? "active" : ""}
            onClick={() => setTab("signup")}
          >
            SIGN UP
          </button>
        </div>

        {error && <p className="error">{error}</p>}

        {tab === "login" && (
          <div className="form">

            <div className="input">
              <FaEnvelope />
              <input
                type="email"
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="input">
              <FaLock />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button className="main-btn" onClick={handleLogin}>
              LOGIN TO YOUR ACCOUNT
            </button>

          </div>
        )}

        {tab === "signup" && (
          <div className="form">

            <div className="input">
              <FaEnvelope />
              <input
                type="email"
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="roles">
              <button
                className={role === "admin" ? "active" : ""}
                onClick={() => setRole("admin")}
              >
                Admin
              </button>

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

            <div className="input">
              <FaLock />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div className="input">
              <FaLock />
              <input
                type="password"
                placeholder="Confirm Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>

            <button className="main-btn" onClick={handleSignup}>
              CREATE NEW ACCOUNT
            </button>

          </div>
        )}

      </div>
    </div>
  );
}

export default AuthPage;
