"use client";
import { useEffect, useState } from "react";

/* ─── Status Badge ─────────────────────────────────────────────────────────── */
const StatusBadge = ({ status }) => {
  const map = {
    pending: { bg: "#FEF3C7", color: "#92400E", dot: "#F59E0B" },
    accepted: { bg: "#DBEAFE", color: "#1E40AF", dot: "#3B82F6" },
    completed: { bg: "#DCFCE7", color: "#166534", dot: "#22C55E" },
  };
  const s = map[status] || map.pending;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        background: s.bg,
        color: s.color,
        padding: "3px 10px",
        borderRadius: 999,
        fontSize: 10,
        fontWeight: 600,
        letterSpacing: "0.04em",
      }}
    >
      <span style={{ width: 5, height: 5, borderRadius: "50%", background: s.dot, flexShrink: 0 }} />
      {status}
    </span>
  );
};

/* ─── Stat Card ─────────────────────────────────────────────────────────────── */
const StatCard = ({ label, value, dotColor, valueColor }) => (
  <div
    style={{
      background: "#fff",
      borderRadius: 12,
      padding: "16px 18px",
      border: "1px solid #E2EAF4",
      boxShadow: "0 1px 4px rgba(30,64,175,0.06)",
    }}
  >
    <div style={{ fontSize: 24, fontWeight: 700, color: valueColor || "#1E3A5F", lineHeight: 1, fontFamily: "'DM Mono', monospace" }}>
      {value}
    </div>
    <div style={{ fontSize: 11, color: "#7B94B5", marginTop: 5, display: "flex", alignItems: "center", gap: 5 }}>
      {dotColor && <span style={{ display: "inline-block", width: 6, height: 6, borderRadius: "50%", background: dotColor }} />}
      {label}
    </div>
  </div>
);

/* ─── Refresh Icon ──────────────────────────────────────────────────────────── */
const RefreshIcon = ({ spinning }) => (
  <svg
    width={13} height={13} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
    style={{ transition: "transform 0.5s", transform: spinning ? "rotate(360deg)" : "rotate(0deg)" }}
  >
    <polyline points="23 4 23 10 17 10" />
    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
  </svg>
);

/* ─── Global Styles ─────────────────────────────────────────────────────────── */
const GLOBAL_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500;600&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');

  .admin-root {
    background: linear-gradient(145deg, #EEF4FF 0%, #F7FAFF 60%, #ffffff 100%);
    min-height: 100vh;
    font-family: 'Plus Jakarta Sans', sans-serif;
    color: #1E3A5F;
  }

  .admin-tbl-row:hover td { background: #F0F6FF !important; }

  .admin-filter-tab { transition: all 0.15s ease; font-family: 'Plus Jakarta Sans', sans-serif; }
  .admin-filter-tab:hover:not(.active-tab) { background: #EEF4FF !important; color: #1E40AF !important; }
  .active-tab { background: #1E40AF !important; color: #fff !important; border-color: #1E40AF !important; }

  .admin-btn-refresh:hover { background: #EEF4FF !important; border-color: #93C5FD !important; color: #1E40AF !important; }

  .admin-tbl-row td { transition: background 0.1s; }
`;

/* ─── Main Page ─────────────────────────────────────────────────────────────── */
export default function AdminPage() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [lastUpdated, setLastUpdated] = useState(null);
  const [spinning, setSpinning] = useState(false);

  useEffect(() => {
    if (document.getElementById("admin-global-styles")) return;
    const style = document.createElement("style");
    style.id = "admin-global-styles";
    style.textContent = GLOBAL_STYLES;
    document.head.appendChild(style);
  }, []);

  const fetchBookings = async () => {
    setLoading(true);
    setSpinning(true);
    try {
      const res = await fetch("/api/booking"); // Updated endpoint

      // Check if the response is OK and Content-Type is JSON
      if (!res.ok) {
        throw new Error(`HTTP error! Status: ${res.status}`);
      }

      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Invalid content type. Expected JSON.");
      }

      const data = await res.json();
      if (data.success) {
        setBookings(data.data);
        setLastUpdated(new Date());
      }
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
      setTimeout(() => setSpinning(false), 500);
    }
  };

  useEffect(() => { fetchBookings(); }, []);

  const counts = {
    total: bookings.length,
    pending: bookings.filter((b) => b.status === "pending").length,
    accepted: bookings.filter((b) => b.status === "accepted").length,
    completed: bookings.filter((b) => b.status === "completed").length,
  };

  const filtered = filter === "all" ? bookings : bookings.filter((b) => b.status === filter);
  const filters = ["all", "pending", "accepted", "completed"];

  return (
    <div className="admin-root">
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "2rem 1.5rem" }}>

        {/* ── Header ── */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#3B82F6" }} />
              <span style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "#7B94B5", fontWeight: 600 }}>
                Management Console
              </span>
            </div>
            <h1 style={{ fontSize: 28, fontWeight: 700, color: "#1E3A5F", margin: 0, lineHeight: 1.1 }}>
              Bookings Dashboard
            </h1>
            {lastUpdated && (
              <p style={{ fontSize: 12, color: "#93AECB", margin: "5px 0 0" }}>
                Last updated at{" "}
                {lastUpdated.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
              </p>
            )}
          </div>

          <button
            className="admin-btn-refresh"
            onClick={fetchBookings}
            style={{
              display: "flex", alignItems: "center", gap: 7,
              padding: "9px 18px", borderRadius: 8,
              border: "1px solid #BFDBFE",
              background: "#fff", color: "#3B82F6",
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: 13, fontWeight: 600, cursor: "pointer",
              boxShadow: "0 1px 3px rgba(30,64,175,0.08)",
              transition: "all 0.15s",
            }}
          >
            <RefreshIcon spinning={spinning} />
            Refresh
          </button>
        </div>

        {/* ── Stats ── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 12, marginBottom: "1.75rem" }}>
          <StatCard label="Total bookings" value={counts.total} valueColor="#1E3A5F" />
          <StatCard label="Pending" value={counts.pending} dotColor="#F59E0B" valueColor="#92400E" />
          <StatCard label="Accepted" value={counts.accepted} dotColor="#3B82F6" valueColor="#1E40AF" />
          <StatCard label="Completed" value={counts.completed} dotColor="#22C55E" valueColor="#166534" />
        </div>

        {/* ── Filter Tabs ── */}
        <div style={{ display: "flex", gap: 6, marginBottom: "1.25rem", flexWrap: "wrap" }}>
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`admin-filter-tab${filter === f ? " active-tab" : ""}`}
              style={{
                padding: "6px 16px", borderRadius: 999,
                fontSize: 12, fontWeight: 600,
                border: "1px solid #BFDBFE",
                cursor: "pointer",
                background: filter === f ? "#1E40AF" : "#fff",
                color: filter === f ? "#fff" : "#3B82F6",
                textTransform: "capitalize",
              }}
            >
              {f === "all" ? `All (${counts.total})` : `${f} (${counts[f]})`}
            </button>
          ))}
        </div>

        {/* ── Table ── */}
        <div
          style={{
            background: "#fff",
            borderRadius: 14,
            border: "1px solid #E2EAF4",
            boxShadow: "0 2px 12px rgba(30,64,175,0.07)",
            overflow: "hidden",
          }}
        >
          {loading ? (
            <div style={{ padding: "3rem", textAlign: "center", color: "#7B94B5", fontSize: 13 }}>
              Loading bookings…
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
                <colgroup>
                  <col style={{ width: "14%" }} />
                  <col style={{ width: "13%" }} />
                  <col style={{ width: "13%" }} />
                  <col style={{ width: "11%" }} />
                  <col style={{ width: "22%" }} />
                  <col style={{ width: "11%" }} />
                  <col style={{ width: "16%" }} />
                </colgroup>

                <thead>
                  <tr style={{ background: "#F0F6FF" }}>
                    {["Name", "Phone", "Service", "Option", "Address", "Status", "Time"].map((h) => (
                      <th
                        key={h}
                        style={{
                          padding: "11px 16px",
                          fontSize: 10,
                          letterSpacing: "0.1em",
                          textTransform: "uppercase",
                          color: "#7B94B5",
                          fontWeight: 700,
                          borderBottom: "1px solid #E2EAF4",
                          textAlign: "left",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ padding: "3rem", textAlign: "center", color: "#7B94B5", fontSize: 13 }}>
                        No bookings found
                      </td>
                    </tr>
                  ) : (
                    filtered.map((b, i) => (
                      <tr
                        key={i}
                        className="admin-tbl-row"
                        style={{ borderBottom: "1px solid #EEF4FF" }}
                      >
                        <td style={{ ...td, fontWeight: 600, color: "#1E3A5F" }}>{b.name}</td>
                        <td style={{ ...td, fontFamily: "'DM Mono', monospace", fontSize: 11 }}>{b.phone}</td>
                        <td style={td}>{b.service}</td>
                        <td style={{ ...td, color: "#7B94B5" }}>{b.option || "—"}</td>
                        <td
                          style={{ ...td, overflow: "hidden", textOverflow: "ellipsis", color: "#4B6A8A" }}
                          title={b.address}
                        >
                          {b.address}
                        </td>
                        <td style={td}>
                          <StatusBadge status={b.status} />
                        </td>
                        <td style={{ ...td, fontFamily: "'DM Mono', monospace", fontSize: 11, color: "#93AECB" }}>
                          {new Date(b.createdAt).toLocaleString("en-GB", {
                            day: "2-digit",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ── Footer count ── */}
        {!loading && filtered.length > 0 && (
          <p style={{ fontSize: 12, color: "#93AECB", marginTop: 12, textAlign: "right" }}>
            Showing {filtered.length} of {counts.total} bookings
          </p>
        )}
      </div>
    </div>
  );
}

const td = {
  padding: "12px 16px",
  fontSize: 12,
  color: "#1E3A5F",
  whiteSpace: "nowrap",
  verticalAlign: "middle",
};