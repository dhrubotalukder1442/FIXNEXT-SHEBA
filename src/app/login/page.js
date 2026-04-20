"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const inputStyle = {
    width: "100%",
    padding: "10px 12px",
    marginBottom: 8,
    border: "1px solid #E5E7EB",
    borderRadius: 10,
    fontSize: 13,
    fontFamily: "'Sora', sans-serif",
    color: "#2C2C2A",
    background: "#FAFAFA",
    outline: "none",
    boxSizing: "border-box",
  };

  const handleLogin = async (e) => {
  e.preventDefault();
  if (!identifier || !password) return alert("Fill all the required fields");

  setLoading(true);
  try {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier, password }),
    });
    const data = await res.json();
    if (data.success) {
      localStorage.setItem("user", JSON.stringify(data.user));
      
      if (data.user.role === "admin") {
        router.push("/admin");
      } else if (data.user.role === "serviceman") {
        router.push("/serviceman");
      } else {
        router.push("/");
      }
    } else {
      alert(data.message || "Login failed");
    }
  } catch {
    alert("Something went wrong.");
  } finally {
    setLoading(false);
  }
};

  return (
    <main style={{ fontFamily: "'Sora', sans-serif", background: "#F0F2F5", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "1.25rem" }}>
      <div style={{ width: "100%", maxWidth: 380 }}>

        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: "1.75rem", justifyContent: "center" }}>
          <div style={{ width: 40, height: 40, background: "#1D9E75", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg viewBox="0 0 24 24" fill="none" width="22" height="22">
              <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: "#2C2C2A", lineHeight: 1 }}>FixNext Sheba</div>
            <div style={{ fontSize: 11, color: "#1D9E75", textTransform: "uppercase", letterSpacing: "0.04em" }}>Home Services</div>
          </div>
        </div>

        {/* Card */}
        <div style={{ background: "#fff", borderRadius: 16, padding: "1.75rem", border: "1px solid #E5E7EB" }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: "#2C2C2A", marginBottom: 4 }}>Welcome back</div>
          <div style={{ fontSize: 13, color: "#888780", marginBottom: "1.25rem" }}>Sign in to your account</div>

          <input
            placeholder="Phone or Email"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            style={inputStyle}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ ...inputStyle, marginBottom: "1.25rem" }}
          />

          <button
            onClick={handleLogin}
            disabled={loading}
            style={{
              width: "100%", background: loading ? "#B4B2A9" : "#1D9E75",
              color: "#fff", border: "none", borderRadius: 12,
              padding: "13px", fontSize: 14, fontWeight: 700,
              cursor: loading ? "not-allowed" : "pointer", fontFamily: "inherit",
            }}
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>

          <div style={{ textAlign: "center", fontSize: 13, color: "#888780", marginTop: "1rem" }}>
            Don't have an account?{" "}
            <span
              onClick={() => router.push("/signup")}
              style={{ color: "#1D9E75", fontWeight: 700, cursor: "pointer" }}
            >
              Sign up
            </span>
          </div>
        </div>
      </div>
    </main>
  );
}