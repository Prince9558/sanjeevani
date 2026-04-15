import React, { useState } from "react";
import { apiRequest, getAuthToken } from "../utils/api";
import "../styles/dashboard.css"; // Ensure access to dash-layout and dash-card

export default function FeedbackPage() {
  const [feedback, setFeedback] = useState("");
  const [status, setStatus] = useState("idle"); // idle, submitting, success, error
  const [errorMessage, setErrorMessage] = useState("");

  const searchParams = new URLSearchParams(window.location.search);
  const toEmail = searchParams.get('to') || "";
  const foodId = searchParams.get('foodId') || "";

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!feedback.trim()) return;

    setStatus("submitting");
    setErrorMessage("");

    try {
      const token = getAuthToken();
      
      // We still submit feedback even if token is missing just as anonymous?
      // Wait, backend requires auth. We must pass token.
      if (!token) {
        setStatus("error");
        setErrorMessage("You must be logged in to send feedback.");
        return;
      }

      await apiRequest("/api/auth/feedback", {
        method: "POST",
        token,
        body: { feedback, toEmail, foodId },
      });

      setStatus("success");
      setFeedback("");
      if (foodId) {
        localStorage.setItem('feedbackGiven_' + foodId, "true");
      }
    } catch (err) {
      console.error(err);
      setStatus("error");
      setErrorMessage(err.message || "Something went wrong.");
    }
  };

  return (
    <div className="dash-layout" style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh" }}>
      <div className="dash-card" style={{ width: "90%", maxWidth: "500px", padding: "30px", textAlign: "center" }}>
        
        <h2 style={{ color: "#4a148c", marginBottom: "10px", fontSize: "1.8rem" }}>We Value Your Feedback</h2>
        <p style={{ color: "#455a64", marginBottom: "5px", fontSize: "0.95rem" }}>
          Help us improve Sanjeevani. your feedback will be sent directly to the donor.
        </p>
        {toEmail && (
          <p style={{ color: "#4a148c", fontWeight: "bold", fontSize: "0.9rem", marginBottom: "20px" }}>
            Sending feedback to: {toEmail}
          </p>
        )}

        {status === "success" ? (
          <div style={{ padding: "20px", background: "rgba(243, 229, 245, 0.7)", borderRadius: "12px", border: "1px solid rgba(225, 190, 231, 0.5)", color: "#4a148c" }}>
            <h3 style={{ margin: "0 0 10px 0" }}>✅ Submitted Successfully!</h3>
            <p style={{ margin: 0 }}>Check your inbox. A copy of your feedback has been mailed to you.</p>
            <button 
              onClick={() => window.close()} 
              style={{ marginTop: "20px", background: "#4a148c", color: "#fff", border: "none", padding: "10px 20px", borderRadius: "8px", cursor: "pointer", fontWeight: "bold" }}>
              Close Tab
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
            <textarea
              required
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Tell us about your experience..."
              style={{
                width: "100%",
                minHeight: "150px",
                padding: "15px",
                borderRadius: "12px",
                border: "1px solid rgba(255, 255, 255, 0.8)",
                background: "rgba(255, 255, 255, 0.4)",
                outline: "none",
                fontSize: "1rem",
                color: "#263238",
                resize: "vertical"
              }}
            />
            {status === "error" && <p style={{ color: "#d32f2f", margin: 0, fontSize: "0.9rem" }}>{errorMessage}</p>}
            
            <button 
              type="submit" 
              disabled={status === "submitting" || !feedback.trim()}
              style={{
                background: "#4a148c",
                color: "#fff",
                border: "none",
                padding: "12px",
                borderRadius: "999px",
                fontSize: "1.05rem",
                fontWeight: "bold",
                cursor: status === "submitting" ? "not-allowed" : "pointer",
                opacity: status === "submitting" ? 0.7 : 1,
                transition: "opacity 0.2s ease"
              }}
            >
              {status === "submitting" ? "Sending..." : "Submit Feedback"}
            </button>
          </form>
        )}

      </div>
    </div>
  );
}
