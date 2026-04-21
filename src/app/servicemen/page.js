"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const StarIcon = ({ filled }) => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill={filled ? "#F59E0B" : "none"} stroke="#F59E0B" strokeWidth="2">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

const Stars = ({ rating }) => (
  <div style={{ display: "flex", gap: 2 }}>
    {[1, 2, 3, 4, 5].map((i) => (
      <StarIcon key={i} filled={i <= Math.round(rating)} />
    ))}
  </div>
);

export default function ServicemenListPage() {
  const router = useRouter();
  const [servicemen, setServicemen] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/serviceman")
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setServicemen(data.data);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <main style={{ fontFamily: "'Sora', sans-serif", background: "#F0F2F5", minHeight: "100vh", paddingBottom: "2rem" }}>
      <div style={{ background: "#0A2540", padding: "1.5rem 1.25rem" }}>
        <button
          onClick={() => router.push("/")}
          style={{ background: "transparent", border: "none", color: "#9AAFC7", fontSize: 12, cursor: "pointer", fontFamily: "inherit", marginBottom: 8, padding: 0 }}
        >
          ← Back
        </button>
        <div style={{ fontSize: 20, fontWeight: 700, color: "#fff" }}>Our Servicemen</div>
        <div style={{ fontSize: 13, color: "#9AAFC7", marginTop: 4 }}>Verified professionals for your home</div>
      </div>

      <div style={{ padding: "1.25rem" }}>
        {loading ? (
          <div style={{ textAlign: "center", color: "#888780", padding: "2rem", fontSize: 13 }}>Loading...</div>
        ) : servicemen.length === 0 ? (
          <div style={{ textAlign: "center", color: "#888780", padding: "2rem", fontSize: 13 }}>No servicemen found</div>
        ) : (
          servicemen.map((s) => (
            <div
              key={s._id}
              onClick={() => router.push(`/serviceman/${s._id}`)}
              style={{ background: "#fff", borderRadius: 12, border: "1px solid #E5E7EB", padding: "14px", marginBottom: 10, cursor: "pointer", display: "flex", alignItems: "center", gap: 14 }}
            >
              <div style={{ width: 52, height: 52, borderRadius: "50%", background: "#E1F5EE", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <span style={{ fontSize: 20, fontWeight: 700, color: "#1D9E75" }}>
                  {s.name?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#2C2C2A" }}>{s.name}</div>
                <div style={{ fontSize: 12, color: "#1D9E75", marginTop: 2 }}>{s.specialty || "General Services"}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
                  <Stars rating={s.rating || 0} />
                  <span style={{ fontSize: 11, color: "#888780" }}>
                    {s.rating ? s.rating.toFixed(1) : "No ratings"} {s.totalReviews ? `(${s.totalReviews})` : ""}
                  </span>
                </div>
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#B4B2A9" strokeWidth="2" strokeLinecap="round">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </div>
          ))
        )}
      </div>
    </main>
  );
}