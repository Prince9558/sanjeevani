import React, { useCallback, useEffect, useMemo, useState } from "react";
import DonorLayout from "./DonorLayout";
import "../../styles/donor-dashboard.css";
import { apiRequest, getAuthToken } from "../../utils/api";

export default function DonorRequests() {
  const [otpInputs, setOtpInputs] = useState({});
  const [items, setItems] = useState([]);
  const token = getAuthToken();
  const user = JSON.parse(sessionStorage.getItem("currentUser"));

  const loadItems = useCallback(async () => {
    if (!token) return;
    const data = await apiRequest("/api/food/donor-items", { token });
    setItems(Array.isArray(data?.items) ? data.items : []);
  }, [token]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        await loadItems();
      } catch {
        if (!cancelled) setItems([]);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [loadItems]);

  const requests = useMemo(
    () => items.filter((i) => i.status === "reserved"),
    [items]
  );

  const confirm = (id) => {
    const entered = (otpInputs[id] || "").trim();
    if (!entered) return;
    if (!token) return;
    apiRequest("/api/food/pickup/verify", {
      method: "POST",
      token,
      body: { foodId: id, otp: entered },
    })
      .then(() => loadItems())
      .catch(() => {});
  };

  return (
    <DonorLayout user={user} active="requests">
      <section className="dash-grid">
        <div className="dash-card highlight">
          <div>
            <h2>Requests</h2>
            <p>
              These items were requested by receivers. Receiver will share an OTP
              during pickup. Enter OTP to complete pickup.
            </p>
          </div>
          <div>
            <h2>Pending</h2>
            <ul>
              <li>{requests.length} request(s) waiting</li>
            </ul>
          </div>
        </div>

        <div className="dash-card" style={{ gridColumn: "1 / -1" }}>
          {requests.length === 0 ? (
            <p className="dash-subtitle">No requests yet.</p>
          ) : (
            <div className="donor-inventory-list" style={{ maxHeight: "unset" }}>
              {requests.map((it) => (
                <div key={it._id} className="donor-item">
                  {it.imageUrl ? (
                    <img src={it.imageUrl} alt={it.name} className="donor-item-image" />
                  ) : (
                    <div className="donor-item-image" />
                  )}
                  <div className="donor-item-main">
                    <div className="donor-item-header-row">
                      <div>
                        <div className="donor-item-name">{it.name}</div>
                        <div className="donor-item-meta">
                          Qty: {it.quantity} {it.unit} · Exp: {it.expiryDate}
                        </div>
                      </div>
                      <span className="donor-item-chip">Requested</span>
                    </div>

                    <div className="donor-item-meta">Receiver: {it.reservedBy}</div>
                    <div className="donor-item-meta">Address: {it.address}</div>

                    <div className="donor-otp-row">
                      <input
                        className="donor-otp-input"
                        placeholder="Enter OTP from receiver"
                        value={otpInputs[it._id] || ""}
                        onChange={(e) =>
                          setOtpInputs((p) => ({ ...p, [it._id]: e.target.value }))
                        }
                      />
                      <button
                        type="button"
                        className="donor-otp-btn"
                        onClick={() => confirm(it._id)}
                      >
                        Verify OTP
                      </button>
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

