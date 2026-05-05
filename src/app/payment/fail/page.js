"use client";
import { useRouter } from "next/navigation";

export default function PaymentFailPage() {
  const router = useRouter();
  return (
    <main style={{ fontFamily: "'Sora', sans-serif", background: "#F0F2F5", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "1.25rem" }}>
      <div style={{ background: "#fff", borderRadius: 16, padding: "2rem", maxWidth: 360, width: "100%", textAlign: "center", border: "1px solid #E5E7EB" }}>
        <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#FEE2E2", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1rem" }}>
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2.5" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </div>
        <div style={{ fontSize: 20, fontWeight: 700, color: "#2C2C2A", marginBottom: 8 }}>Payment Failed</div>
        <div style={{ fontSize: 13, color: "#888780", marginBottom: "1.5rem" }}>Something went wrong. Please try again.</div>
        <button onClick={() => router.push("/")} style={{ width: "100%", background: "#0A2540", color: "#fff", border: "none", borderRadius: 12, padding: "13px", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
          Back to Home
        </button>
      </div>
    </main>
  );
}
