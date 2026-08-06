import React, { useState, useEffect, useRef } from "react";
import { User, Settings, LogOut } from "lucide-react";

export default function ProfileMenu({ user, onLogout }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const close = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", close);

    return () => document.removeEventListener("mousedown", close);
  }, []);

  return (
    <div
      ref={ref}
      style={{
        position: "relative",
      }}
    >
      <div
        className="profile-avatar"
        onClick={() => setOpen(!open)}
        style={{ cursor: "pointer" }}
      >
        {user.substring(0, 2).toUpperCase()}
      </div>

      {open && (
        <div className="profile-dropdown">
          {/* User Info Header */}
          <div className="profile-dropdown-header">
            <div className="profile-dropdown-avatar">
              {user.substring(0, 2).toUpperCase()}
            </div>
            <div className="profile-dropdown-info">
              <span className="profile-dropdown-name">{user}</span>
              <span className="profile-dropdown-role">User Account</span>
            </div>
          </div>

          {/* Menu Items */}
          <div className="profile-dropdown-menu">
            <button className="profile-dropdown-item">
              <User size={14} />
              <span>Profile</span>
            </button>
            <button className="profile-dropdown-item">
              <Settings size={14} />
              <span>Settings</span>
            </button>
          </div>

          {/* Logout */}
          <div className="profile-dropdown-footer">
            <button
              className="profile-dropdown-item logout"
              onClick={() => { onLogout(); setOpen(false); }}
            >
              <LogOut size={14} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}