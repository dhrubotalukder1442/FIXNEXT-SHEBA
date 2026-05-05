"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

function SuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tran_id = searchParams.get("tran_id");

  return (
    <main style={{ fontFamily: "'Sora', sans-serif", background: "#F0F2F5", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "1.25rem" }}>
      <div style={{ background: "#fff", borderRadius: 16, padding: "2rem", maxWidth: 360, width: "100%", textAlign: "center", border: "1px solid #E5E7EB" }}>
        <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#DCFCE7", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1rem" }}>
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2.5" strokeLinecap="round">
            <path d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div style={{ fontSize: 20, fontWeight: 700, color: "#2C2C2A", marginBottom: 8 }}>Payment Successful!</div>
        <div style={{ fontSize: 13, color: "#888780", marginBottom: 6 }}>Your payment has been confirmed.</div>
        {tran_id && (
          <div style={{ background: "#F9FAFB", borderRadius: 8, padding: "8px 12px", marginBottom: "1.5rem", fontSize: 11, color: "#888780" }}>
            Transaction ID: <strong style={{ color: "#2C2C2A" }}>{tran_id}</strong>
          </div>
        )}
        <button onClick={() => router.push("/")} style={{ width: "100%", background: "#1D9E75", color: "#fff", border: "none", borderRadius: 12, padding: "13px", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
          Back to Home
        </button>
      </div>
    </main>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense>
      <SuccessContent />
    </Suspense>
  );
}