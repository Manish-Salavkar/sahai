import React, { useState, useEffect, useRef } from "react";

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
          <div className="profile-name">
            {user}
          </div>

          <button
            className="logout-btn"
            onClick={onLogout}
          >
            Logout
          </button>
        </div>
      )}
    </div>
  );
}