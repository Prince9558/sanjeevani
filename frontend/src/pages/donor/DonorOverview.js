import React, { useEffect, useMemo, useState } from "react";
import DonorLayout from "./DonorLayout";
import { getAuthToken, apiRequest } from "../../utils/api";

export default function DonorOverview() {
  const user = JSON.parse(sessionStorage.getItem("currentUser"));

  const [items, setItems] = useState([]);

  const token = getAuthToken();

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!token) return;
      try {
        const data = await apiRequest("/api/food/donor-items", { token });
        if (!cancelled) setItems(Array.isArray(data?.items) ? data.items : []);
      } catch {
        // ignore; UI can show empty state
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const available = useMemo(
    () => items.filter((i) => i.status === "available").length,
    [items]
  );
  const requests = useMemo(
    () => items.filter((i) => i.status === "reserved").length,
    [items]
  );
  const collected = useMemo(
    () => items.filter((i) => i.status === "collected").length,
    [items]
  );

  return (
    <DonorLayout user={user} active="overview">
      <section className="dash-grid">
        <div className="dash-card highlight">
          <div>
            <h2>About Food Value Platform</h2>
            <p>
              Food Value connects donors and receivers to reduce food waste.
              Donors add items with expiry and pickup details. Receivers request
              items and collect them securely using OTP verification.
            </p>
          </div>
          <div>
            <h2>Your today</h2>
            <ul>
              <li>{available} item(s) available</li>
              <li>{requests} request(s) pending pickup</li>
              <li>{collected} item(s) collected</li>
            </ul>
          </div>
        </div>

        <div className="dash-card">
          <h3>How pickup works</h3>
          <p>
            Receiver requests an item → receiver receives an OTP → receiver tells
            OTP to you at pickup → you confirm OTP in Requests → item moves to
            Inventory.
          </p>
        </div>
      </section>
    </DonorLayout>
  );
}

