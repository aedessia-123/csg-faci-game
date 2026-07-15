'use client';
import { useState } from "react";
import { useSearchParams } from "next/navigation";

export default function AdminLoginPage() {
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const searchParams = useSearchParams();

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ passcode }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Something went wrong");
      return;
    }
    const dest = searchParams.get("from") || "/admin";
    window.location.href = dest;
  };

  return (
    <div className="admin-login-screen">
      <form onSubmit={submit} className="admin-login-card">
        <h1 className="admin-login-title">Admin access</h1>
        <p className="admin-sub" style={{ marginBottom: 20 }}>Enter the passcode to continue.</p>
        {error && <div className="admin-error">{error}</div>}
        <div className="admin-field">
          <input
            type="password"
            value={passcode}
            onChange={(e) => setPasscode(e.target.value)}
            placeholder="Passcode"
            autoFocus
            required
          />
        </div>
        <button type="submit" className="admin-btn" disabled={loading} style={{ width: "100%" }}>
          {loading ? "Checking…" : "Enter"}
        </button>
      </form>
    </div>
  );
}
