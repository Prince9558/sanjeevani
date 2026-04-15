import React, { useState } from "react";
import "../styles/profile-panel.css";
import { apiRequest, getAuthToken, CURRENT_USER_KEY } from "../utils/api";

function getInitials(user) {
  const nameToUse = user?.name || user?.email || "?";
  const first = nameToUse.trim().charAt(0).toUpperCase();
  return first || "?";
}

export default function ProfilePanel({ user, onLogout, textMode, customClass, customStyle }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [draft, setDraft] = useState({
    name: user?.name || "",
    mobile: user?.mobile || "",
    email: user?.email || "",
    address: user?.address || "",
  });

  const handleOpen = () => {
    setDraft({
      name: user?.name || "",
      mobile: user?.mobile || "",
      email: user?.email || "",
      address: user?.address || "",
    });
    setOpen(true);
  };

  const save = async () => {
    setSaving(true);
    try {
      const token = getAuthToken();
      const updatedProfile = await apiRequest("/api/auth/profile", {
        method: "PUT",
        token,
        body: {
          name: draft.name.trim(),
          mobile: draft.mobile.trim(),
          address: draft.address.trim(),
        }
      });
      
      const currentSessionStr = sessionStorage.getItem(CURRENT_USER_KEY);
      if (currentSessionStr) {
        const currentSession = JSON.parse(currentSessionStr);
        currentSession.name = updatedProfile.name;
        currentSession.mobile = updatedProfile.mobile;
        currentSession.address = updatedProfile.address;
        sessionStorage.setItem(CURRENT_USER_KEY, JSON.stringify(currentSession));
        
        user.name = updatedProfile.name;
        user.mobile = updatedProfile.mobile;
        user.address = updatedProfile.address;
      }
      setOpen(false);
    } catch (err) {
      alert("Failed to update profile: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="profile-wrap">
      {textMode ? (
        <button
          type="button"
          className={customClass || "desktop-nav-button"}
          onClick={handleOpen}
          style={{ cursor: "pointer", ...(!customClass && { color: "rgba(255, 255, 255, 0.85)", fontWeight: "500", background: "transparent", border: "none" }), ...customStyle }}
        >
          Profile
        </button>
      ) : (
        <button
          type="button"
          className="profile-icon"
          onClick={handleOpen}
          aria-label="Open profile"
          title="Profile"
        >
          {getInitials(user)}
        </button>
      )}

      {open && (
        <div className="profile-backdrop" onClick={() => setOpen(false)}>
          <div className="profile-modal" onClick={(e) => e.stopPropagation()}>
            <div className="profile-modal-header">
              <div>
                <div className="profile-modal-title">Profile</div>
                <div className="profile-modal-sub">
                  Update your details. Email cannot be changed.
                </div>
              </div>
              <button
                type="button"
                className="profile-close"
                onClick={() => setOpen(false)}
              >
                ✕
              </button>
            </div>

            <div className="profile-grid">
              <label className="profile-field">
                <span>Name</span>
                <input
                  value={draft.name}
                  onChange={(e) => setDraft((p) => ({ ...p, name: e.target.value }))}
                  placeholder="Your name"
                />
              </label>

              <label className="profile-field">
                <span>Mobile</span>
                <input
                  value={draft.mobile}
                  onChange={(e) =>
                    setDraft((p) => ({ ...p, mobile: e.target.value }))
                  }
                  placeholder="Mobile number"
                />
              </label>

              <label className="profile-field">
                <span>Email</span>
                <input value={draft.email} disabled />
              </label>

              <label className="profile-field full">
                <span>Address</span>
                <textarea
                  value={draft.address}
                  onChange={(e) =>
                    setDraft((p) => ({ ...p, address: e.target.value }))
                  }
                  placeholder="Your address"
                />
              </label>
            </div>

            <div className="profile-actions">
              <button type="button" className="profile-btn ghost" onClick={onLogout}>
                Logout
              </button>
              <button type="button" className="profile-btn" onClick={save} disabled={saving}>
                {saving ? "Saving..." : "Save changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

