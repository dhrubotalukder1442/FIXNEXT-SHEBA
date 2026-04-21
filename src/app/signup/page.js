"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";


export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState("user");

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

  const handleSignup = async () => {
  if (!name || !identifier || !password) return alert("Fill all the required fields");

  setLoading(true);
  try {
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, identifier, password, role }), // ✅ role যোগ করো
    });
    const data = await res.json();
    if (data.success) {
      localStorage.setItem("user", JSON.stringify(data.user));
      // ✅ role অনুযায়ী redirect
      if (data.user.role === "serviceman") {
        router.push("/serviceman");
      } else {
        router.push("/");
      }
    } else {
      alert(data.message || "Signup failed");
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
          <div style={{ fontSize: 20, fontWeight: 700, color: "#2C2C2A", marginBottom: 4 }}>Create account</div>
          <div style={{ fontSize: 13, color: "#888780", marginBottom: "1.25rem" }}>Create a new account</div>

          <input placeholder="Your Name" value={name} onChange={(e) => setName(e.target.value)} style={inputStyle} />
          <input placeholder="Phone or Email" value={identifier} onChange={(e) => setIdentifier(e.target.value)} style={inputStyle} />
          <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} style={{ ...inputStyle, marginBottom: "1.25rem" }} />


                    {/* Role Selection */}
          <div style={{ marginBottom: "1.25rem" }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "#888780", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>
              I am a
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              {["user", "serviceman"].map((r) => (
                <div
                  key={r}
                  onClick={() => setRole(r)}
                  style={{
                    flex: 1, padding: "10px", borderRadius: 10, textAlign: "center",
                    cursor: "pointer", fontSize: 13, fontWeight: 600,
                    border: role === r ? "1.5px solid #1D9E75" : "1px solid #E5E7EB",
                    background: role === r ? "#F0FBF6" : "#FAFAFA",
                    color: role === r ? "#1D9E75" : "#888780",
                  }}
                >
                  {r === "user" ? "👤 Customer" : "🔧 Serviceman"}
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={handleSignup}
            disabled={loading}
            style={{
              width: "100%", background: loading ? "#B4B2A9" : "#1D9E75",
              color: "#fff", border: "none", borderRadius: 12,
              padding: "13px", fontSize: 14, fontWeight: 700,
              cursor: loading ? "not-allowed" : "pointer", fontFamily: "inherit",
            }}
          >
            {loading ? "Creating..." : "Create account"}
          </button>

          <div style={{ textAlign: "center", fontSize: 13, color: "#888780", marginTop: "1rem" }}>
            Already have an account?{" "}
            <span
              onClick={() => router.push("/login")}
              style={{ color: "#1D9E75", fontWeight: 700, cursor: "pointer" }}
            >
              Sign in
            </span>
          </div>
        </div>
      </div>
    </main>
  );
}