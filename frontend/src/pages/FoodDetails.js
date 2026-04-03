import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { apiRequest } from "../utils/api";
import "../styles/auth.css";
import "../styles/home.css"; // Import home.css for home-container background

const FoodDetails = () => {
  const { id } = useParams();
  const [food, setFood] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchFoodDetails = async () => {
      try {
        const data = await apiRequest(`/api/food/public-details/${id}`);
        setFood(data);
      } catch (err) {
        setError(err.message || "Food item not found.");
      } finally {
        setLoading(false);
      }
    };

    fetchFoodDetails();
  }, [id]);

  if (loading) {
    return (
      <div className="home-container" style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
        <h2 style={{ color: "#333", textShadow: "0 1px 12px rgba(255, 255, 255, 0.9)" }}>Loading details...</h2>
      </div>
    );
  }

  if (error || !food) {
    return (
      <div className="home-container" style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
        <div className="auth-card" style={{ maxWidth: "400px", textAlign: "center", background: "rgba(255, 255, 255, 0.95)" }}>
          <h2 style={{ color: "#d32f2f", marginBottom: "1rem" }}>Error</h2>
          <p style={{ color: "#555" }}>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="home-container" style={{ display: "flex", justifyContent: "center", alignItems: "center", padding: "2rem", minHeight: "100vh" }}>
      <div className="auth-card" style={{ maxWidth: "500px", width: "100%", padding: "2rem", background: "rgba(255, 255, 255, 0.96)", backdropFilter: "blur(10px)" }}>
        <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
          <h1 style={{ color: "#2e7d32", fontSize: "2rem", marginBottom: "0.5rem" }}>Food Details</h1>
          <p style={{ color: "#666", fontSize: "0.95rem" }}>Scanned via Sanjeevani QR Code</p>
        </div>

        {food.imageUrl ? (
          <img
            src={food.imageUrl}
            alt={food.name}
            style={{ width: "100%", height: "250px", objectFit: "cover", borderRadius: "12px", marginBottom: "1.5rem" }}
          />
        ) : (
          <div style={{ width: "100%", height: "200px", backgroundColor: "#f5f5f5", display: "flex", justifyContent: "center", alignItems: "center", borderRadius: "12px", marginBottom: "1.5rem", color: "#999", fontWeight: "bold" }}>
            No Image Available
          </div>
        )}

        <div style={{ display: "grid", gap: "1rem" }}>
          <div style={{ background: "#f9fbe7", padding: "1rem", borderRadius: "8px", border: "1px solid #e6ee9c" }}>
            <h3 style={{ margin: 0, color: "#33691e", fontSize: "1.2rem", marginBottom: "0.3rem" }}>{food.name}</h3>
            <span style={{ display: "inline-block", background: "#388e3c", color: "white", padding: "0.2rem 0.6rem", borderRadius: "12px", fontSize: "0.8rem", fontWeight: "bold" }}>
              {food.status.toUpperCase()}
            </span>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", background: "#f5f5f5", padding: "1rem", borderRadius: "8px" }}>
            <div>
              <p style={{ margin: 0, fontSize: "0.8rem", color: "#777" }}>Quantity</p>
              <p style={{ margin: 0, fontWeight: "bold", color: "#333" }}>{food.quantity} {food.unit}</p>
            </div>
            <div style={{ textAlign: "right" }}>
              <p style={{ margin: 0, fontSize: "0.8rem", color: "#777" }}>Expiry Date</p>
              <p style={{ margin: 0, fontWeight: "bold", color: food.expiryState === "Expired" ? "#d32f2f" : "#333" }}>
                {food.expiryDate ? new Date(food.expiryDate).toLocaleDateString() : "N/A"}
              </p>
            </div>
          </div>

          <div style={{ background: "#f5f5f5", padding: "1rem", borderRadius: "8px" }}>
            <p style={{ margin: 0, fontSize: "0.8rem", color: "#777" }}>Donor</p>
            <p style={{ margin: 0, fontWeight: "bold", color: "#333" }}>{food.donor}</p>
          </div>

          <div style={{ background: "#e3f2fd", padding: "1rem", borderRadius: "8px", border: "1px solid #bbdefb" }}>
            <p style={{ margin: 0, fontSize: "0.85rem", color: "#1976d2", fontWeight: "bold", marginBottom: "0.2rem" }}>Pickup Address</p>
            <p style={{ margin: 0, color: "#0d47a1", fontSize: "0.95rem" }}>{food.address || "N/A"}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FoodDetails;
