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
    {[1, 2, 3, 4, 5].map((i) => <StarIcon key={i} filled={i <= Math.round(rating)} />)}
  </div>
);

export default function ServicemenListPage() {
  const router = useRouter();
  const [servicemen, setServicemen] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter state — client-side filtering, API call একবারই হয়
  const [searchQuery, setSearchQuery] = useState("");
  const [minRating, setMinRating] = useState(0);   // 0 = সব দেখাও
  const [sortBy, setSortBy] = useState("rating");   // "rating" | "name"

  useEffect(() => {
    fetch("/api/serviceman")
      .then((r) => r.json())
      .then((data) => { if (data.success) setServicemen(data.data); })
      .finally(() => setLoading(false));
  }, []);

  // Filter + sort — সব client-side। servicemen list static থাকলে এটাই best approach।
  // Dynamic হলে (হাজার হাজার serviceman) server-side query করতে হতো।
  const filtered = servicemen
    .filter((s) => {
      const q = searchQuery.toLowerCase();
      const matchQuery = !q || s.name?.toLowerCase().includes(q) || s.specialty?.toLowerCase().includes(q);
      const matchRating = (s.rating || 0) >= minRating;
      return matchQuery && matchRating;
    })
    .sort((a, b) => {
      if (sortBy === "rating") return (b.rating || 0) - (a.rating || 0);
      return (a.name || "").localeCompare(b.name || "");
    });

  const inputStyle = {
    width: "100%", padding: "9px 12px 9px 32px",
    border: "1px solid #E5E7EB", borderRadius: 10, fontSize: 13,
    fontFamily: "'Sora', sans-serif", color: "#2C2C2A",
    background: "#fff", outline: "none", boxSizing: "border-box",
  };

  return (
    <main style={{ fontFamily: "'Sora', sans-serif", background: "#F0F2F5", minHeight: "100vh", paddingBottom: "2rem" }}>
      <div style={{ background: "#0A2540", padding: "1.5rem 1.25rem" }}>
        <button onClick={() => router.push("/")} style={{ background: "transparent", border: "none", color: "#9AAFC7", fontSize: 12, cursor: "pointer", fontFamily: "inherit", marginBottom: 8, padding: 0 }}>
          ← Back
        </button>
        <div style={{ fontSize: 20, fontWeight: 700, color: "#fff" }}>Our Servicemen</div>
        <div style={{ fontSize: 13, color: "#9AAFC7", marginTop: 4 }}>Verified professionals for your home</div>
      </div>

      <div style={{ padding: "1.25rem" }}>

        {/* ── Search box ── */}
        <div style={{ position: "relative", marginBottom: 10 }}>
          <svg style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#888780" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            placeholder="Search by name or specialty..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={inputStyle}
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#888780", padding: 2, display: "flex", alignItems: "center" }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          )}
        </div>

        {/* ── Filter bar: rating chips + sort ──
            কেন chips? Radio button এর চেয়ে tap করা সহজ mobile এ।
            4★+ মানে rating >= 4 — এটাই সবচেয়ে common filter pattern। */}
        <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap", alignItems: "center" }}>
          <span style={{ fontSize: 11, color: "#888780", fontWeight: 600, whiteSpace: "nowrap" }}>Min rating:</span>
          {[0, 3, 4, 5].map((r) => (
            <button
              key={r}
              onClick={() => setMinRating(r)}
              style={{
                padding: "5px 12px", borderRadius: 20, fontSize: 11, fontWeight: 600,
                cursor: "pointer", border: "1px solid",
                background: minRating === r ? "#1D9E75" : "#fff",
                color: minRating === r ? "#fff" : "#888780",
                borderColor: minRating === r ? "#1D9E75" : "#E5E7EB",
                fontFamily: "inherit",
              }}
            >
              {r === 0 ? "All" : `${r}★+`}
            </button>
          ))}

          {/* Sort */}
          <div style={{ marginLeft: "auto", display: "flex", gap: 6, alignItems: "center" }}>
            <span style={{ fontSize: 11, color: "#888780", fontWeight: 600 }}>Sort:</span>
            {[["rating", "Top Rated"], ["name", "A–Z"]].map(([val, label]) => (
              <button
                key={val}
                onClick={() => setSortBy(val)}
                style={{
                  padding: "5px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600,
                  cursor: "pointer", border: "1px solid",
                  background: sortBy === val ? "#0A2540" : "#fff",
                  color: sortBy === val ? "#fff" : "#888780",
                  borderColor: sortBy === val ? "#0A2540" : "#E5E7EB",
                  fontFamily: "inherit",
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Result count ── */}
        {!loading && (
          <div style={{ fontSize: 11, color: "#888780", marginBottom: 10 }}>
            {filtered.length} serviceman{filtered.length !== 1 ? "s" : ""} found
          </div>
        )}

        {/* ── List ── */}
        {loading ? (
          <div style={{ textAlign: "center", color: "#888780", padding: "2rem", fontSize: 13 }}>Loading...</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", color: "#888780", padding: "2rem", fontSize: 13 }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>🔍</div>
            No servicemen match your filters
          </div>
        ) : (
          filtered.map((s) => (
            <div
              key={s._id}
              onClick={() => router.push(`/serviceman/${s._id}`)}
              style={{ background: "#fff", borderRadius: 12, border: "1px solid #E5E7EB", padding: "14px", marginBottom: 10, cursor: "pointer", display: "flex", alignItems: "center", gap: 14 }}
            >
              <div style={{ width: 52, height: 52, borderRadius: "50%", overflow: "hidden", background: "#E1F5EE", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                {s.avatar
                  ? <img src={s.avatar} alt={s.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  : <span style={{ fontSize: 20, fontWeight: 700, color: "#1D9E75" }}>{s.name?.charAt(0).toUpperCase()}</span>
                }
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#2C2C2A" }}>{s.name}</div>
                  {/* Online indicator */}
                  {s.isOnline !== false && (
                    <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#22C55E", flexShrink: 0, display: "inline-block" }} title="Online" />
                  )}
                </div>
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