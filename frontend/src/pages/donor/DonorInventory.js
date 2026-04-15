import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import DonorLayout from "./DonorLayout";
import "../../styles/donor-dashboard.css";
import { apiRequest, getAuthToken } from "../../utils/api";

export default function DonorInventory() {
  const user = JSON.parse(sessionStorage.getItem("currentUser"));
  const token = getAuthToken();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!token) return;
      try {
        const data = await apiRequest("/api/food/donor-items", { token });
        if (!cancelled) setItems(Array.isArray(data?.items) ? data.items : []);
      } catch {
        if (!cancelled) setItems([]);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const collected = useMemo(
    () => items.filter((i) => i.status === "collected"),
    [items]
  );

  return (
    <DonorLayout user={user} active="inventory">
      <section className="dash-grid">
        <div className="dash-card highlight">
          <div>
            <h2>Inventory</h2>
            <p>Items with successful OTP verification (pickup completed).</p>
          </div>
          <div>
            <h2>Total</h2>
            <ul>
              <li>{collected.length} item(s) collected</li>
            </ul>
          </div>
        </div>

        <div className="dash-card" style={{ gridColumn: "1 / -1" }}>
          {collected.length === 0 ? (
            <p className="dash-subtitle">No collected items yet.</p>
          ) : (
            <div className="donor-inventory-list" style={{ maxHeight: "unset" }}>
              {collected.map((it) => (
                <div 
                  key={it._id} 
                  className="donor-item" 
                  onClick={() => navigate(`/donor-item/${it._id}`, { state: { item: it } })}
                  style={{ cursor: "pointer", transition: "all 0.2s" }}
                >
                  {it.imageUrl ? (
                    <img src={it.imageUrl} alt={it.name} className="donor-item-image" />
                  ) : (
                    <div className="donor-item-image" />
                  )}
                  <div className="donor-item-main" style={{ justifyContent: "center" }}>
                    <div className="donor-item-name" style={{ fontSize: "1.1rem" }}>{it.name}</div>
                    <div className="donor-item-meta" style={{ marginTop: "6px" }}>
                      Collected At: <span style={{ fontWeight: 600, color: "#4a148c" }}>{it.collectedAt ? new Date(it.collectedAt).toLocaleDateString() : "-"}</span>
                    </div>
                    <div className="donor-item-meta" style={{ color: "#1976d2", marginTop: "4px" }}>
                      Click to view full details →
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </DonorLayout>
  );
}

