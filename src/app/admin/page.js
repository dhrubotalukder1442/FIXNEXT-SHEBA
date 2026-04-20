"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const StatusBadge = ({ status }) => {
  const map = {
    pending: { bg: "#FEF3C7", color: "#92400E", dot: "#F59E0B" },
    accepted: { bg: "#DBEAFE", color: "#1E40AF", dot: "#3B82F6" },
    completed: { bg: "#DCFCE7", color: "#166534", dot: "#22C55E" },
  };
  const s = map[status] || map.pending;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, background: s.bg, color: s.color, padding: "3px 10px", borderRadius: 999, fontSize: 10, fontWeight: 600, letterSpacing: "0.04em" }}>
      <span style={{ width: 5, height: 5, borderRadius: "50%", background: s.dot, flexShrink: 0 }} />
      {status}
    </span>
  );
};

const StatCard = ({ label, value, dotColor, valueColor }) => (
  <div style={{ background: "#fff", borderRadius: 12, padding: "16px 18px", border: "1px solid #E2EAF4", boxShadow: "0 1px 4px rgba(30,64,175,0.06)" }}>
    <div style={{ fontSize: 24, fontWeight: 700, color: valueColor || "#1E3A5F", lineHeight: 1, fontFamily: "'DM Mono', monospace" }}>{value}</div>
    <div style={{ fontSize: 11, color: "#7B94B5", marginTop: 5, display: "flex", alignItems: "center", gap: 5 }}>
      {dotColor && <span style={{ display: "inline-block", width: 6, height: 6, borderRadius: "50%", background: dotColor }} />}
      {label}
    </div>
  </div>
);

const RefreshIcon = ({ spinning }) => (
  <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ transition: "transform 0.5s", transform: spinning ? "rotate(360deg)" : "rotate(0deg)" }}>
    <polyline points="23 4 23 10 17 10" />
    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
  </svg>
);

const GLOBAL_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500;600&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
  .admin-root { background: linear-gradient(145deg, #EEF4FF 0%, #F7FAFF 60%, #ffffff 100%); min-height: 100vh; font-family: 'Plus Jakarta Sans', sans-serif; color: #1E3A5F; }
  .admin-tbl-row:hover td { background: #F0F6FF !important; }
  .admin-filter-tab { transition: all 0.15s ease; font-family: 'Plus Jakarta Sans', sans-serif; }
  .admin-filter-tab:hover:not(.active-tab) { background: #EEF4FF !important; color: #1E40AF !important; }
  .active-tab { background: #1E40AF !important; color: #fff !important; border-color: #1E40AF !important; }
  .admin-btn-refresh:hover { background: #EEF4FF !important; border-color: #93C5FD !important; color: #1E40AF !important; }
  .admin-tbl-row td { transition: background 0.1s; }
`;

const td = { padding: "12px 16px", fontSize: 12, color: "#1E3A5F", whiteSpace: "nowrap", verticalAlign: "middle" };

export default function AdminPage() {
  const router = useRouter();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [lastUpdated, setLastUpdated] = useState(null);
  const [spinning, setSpinning] = useState(false);
  const [users, setUsers] = useState([]);
  const [deleteId, setDeleteId] = useState(null);

  // ✅ Auth check
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user) {
      router.push("/login");
    } else if (user.role !== "admin") {
      router.push("/");
    }
  }, []);

  // ✅ Global styles
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
      const res = await fetch("/api/booking");
      if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
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

  const updateStatus = async (id, status) => {
    try {
      await fetch("/api/booking", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      fetchBookings();
    } catch (err) {
      console.error(err);
    }
  };

  const fetchUsers = async () => {
    const res = await fetch("/api/users");
    const data = await res.json();
    if (data.success) setUsers(data.data);
  };

  const confirmDelete = async () => {
    await fetch(`/api/users/${deleteId}`, { method: "DELETE" });
    setDeleteId(null);
    fetchUsers();
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    router.push("/login");
  };

  useEffect(() => { fetchBookings(); }, []);
  useEffect(() => { fetchUsers(); }, []);

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
              <span style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "#7B94B5", fontWeight: 600 }}>Management Console</span>
            </div>
            <h1 style={{ fontSize: 28, fontWeight: 700, color: "#1E3A5F", margin: 0, lineHeight: 1.1 }}>Bookings Dashboard</h1>
            {lastUpdated && (
              <p style={{ fontSize: 12, color: "#93AECB", margin: "5px 0 0" }}>
                Last updated at {lastUpdated.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
              </p>
            )}
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <button
              className="admin-btn-refresh"
              onClick={fetchBookings}
              style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 18px", borderRadius: 8, border: "1px solid #BFDBFE", background: "#fff", color: "#3B82F6", fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
            >
              <RefreshIcon spinning={spinning} />
              Refresh
            </button>

            {/* ✅ Logout button */}
            <button
              onClick={handleLogout}
              style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 18px", borderRadius: 8, border: "1px solid #FECACA", background: "#FFF5F5", color: "#DC2626", fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
            >
              Logout
            </button>
          </div>
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
              style={{ padding: "6px 16px", borderRadius: 999, fontSize: 12, fontWeight: 600, border: "1px solid #BFDBFE", cursor: "pointer", background: filter === f ? "#1E40AF" : "#fff", color: filter === f ? "#fff" : "#3B82F6", textTransform: "capitalize" }}
            >
              {f === "all" ? `All (${counts.total})` : `${f} (${counts[f]})`}
            </button>
          ))}
        </div>

        {/* ── Bookings Table ── */}
        <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #E2EAF4", boxShadow: "0 2px 12px rgba(30,64,175,0.07)", overflow: "hidden" }}>
          {loading ? (
            <div style={{ padding: "3rem", textAlign: "center", color: "#7B94B5", fontSize: 13 }}>Loading bookings…</div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
                <colgroup>
                  <col style={{ width: "14%" }} /><col style={{ width: "13%" }} /><col style={{ width: "13%" }} />
                  <col style={{ width: "11%" }} /><col style={{ width: "22%" }} /><col style={{ width: "11%" }} />
                  <col style={{ width: "16%" }} />
                </colgroup>
                <thead>
                  <tr style={{ background: "#F0F6FF" }}>
                    {["Name", "Phone", "Service", "Option", "Address", "Status", "Time"].map((h) => (
                      <th key={h} style={{ padding: "11px 16px", fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "#7B94B5", fontWeight: 700, borderBottom: "1px solid #E2EAF4", textAlign: "left", whiteSpace: "nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ padding: "2rem", textAlign: "center", color: "#7B94B5", fontSize: 13 }}>
                        No bookings found
                      </td>
                    </tr>
                  ) : (
                    filtered.map((b, i) => (
                      <tr key={i} className="admin-tbl-row" style={{ borderBottom: "1px solid #EEF4FF" }}>
                        <td style={{ ...td, fontWeight: 600, color: "#1E3A5F" }}>{b.name}</td>
                        <td style={{ ...td, fontFamily: "'DM Mono', monospace", fontSize: 11 }}>{b.phone}</td>
                        <td style={td}>{b.service}</td>
                        <td style={{ ...td, color: "#7B94B5" }}>{b.option || "—"}</td>
                        <td style={{ ...td, overflow: "hidden", textOverflow: "ellipsis", color: "#4B6A8A" }} title={b.address}>{b.address}</td>
                        <td style={td}>
                          <StatusBadge status={b.status} />
                          <div style={{ marginTop: 6, display: "flex", gap: 5 }}>
                            {b.status === "pending" && (
                              <button onClick={() => updateStatus(b._id, "accepted")} style={{ fontSize: 10, padding: "4px 8px", background: "#3B82F6", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer" }}>
                                Accept
                              </button>
                            )}
                            {b.status === "accepted" && (
                              <button onClick={() => updateStatus(b._id, "completed")} style={{ fontSize: 10, padding: "4px 8px", background: "#22C55E", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer" }}>
                                Complete
                              </button>
                            )}
                          </div>
                        </td>
                        <td style={{ ...td, fontFamily: "'DM Mono', monospace", fontSize: 11, color: "#93AECB" }}>
                          {new Date(b.createdAt).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ── Users Table ── */}
        <div style={{ marginTop: "2rem", background: "#fff", borderRadius: 14, border: "1px solid #E2EAF4", overflow: "hidden" }}>
          <div style={{ padding: "1rem 1.5rem", borderBottom: "1px solid #E2EAF4" }}>
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#1E3A5F" }}>Users & Service Men</h2>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#F0F6FF" }}>
                  {["Name", "Email", "Role", "Action"].map((h) => (
                    <th key={h} style={{ padding: "11px 16px", fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "#7B94B5", fontWeight: 700, borderBottom: "1px solid #E2EAF4", textAlign: "left" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr><td colSpan={4} style={{ padding: "2rem", textAlign: "center", color: "#7B94B5", fontSize: 13 }}>No users found</td></tr>
                ) : (
                  users.map((u) => (
                    <tr key={u._id} className="admin-tbl-row" style={{ borderBottom: "1px solid #EEF4FF" }}>
                      <td style={{ ...td, fontWeight: 600 }}>{u.name}</td>
                      <td style={td}>{u.email}</td>
                      <td style={td}>{u.role}</td>
                      <td style={td}>
                        <button onClick={() => setDeleteId(u._id)} style={{ fontSize: 11, padding: "5px 12px", background: "#FFF5F5", color: "#DC2626", border: "1px solid #FECACA", borderRadius: 6, cursor: "pointer" }}>
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {!loading && filtered.length > 0 && (
          <p style={{ fontSize: 12, color: "#93AECB", marginTop: 12, textAlign: "right" }}>
            Showing {filtered.length} of {counts.total} bookings
          </p>
        )}
      </div>

      {/* ── Delete Modal ── */}
      {deleteId && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <div style={{ background: "#fff", padding: "1.5rem", borderRadius: 12, width: 300, textAlign: "center" }}>
            <h3 style={{ margin: "0 0 8px", color: "#1E3A5F" }}>Delete User?</h3>
            <p style={{ fontSize: 13, color: "#7B94B5", marginBottom: "1.25rem" }}>This action cannot be undone.</p>
            <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
              <button onClick={confirmDelete} style={{ padding: "8px 20px", background: "#DC2626", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600 }}>Yes, Delete</button>
              <button onClick={() => setDeleteId(null)} style={{ padding: "8px 20px", background: "#F3F4F6", color: "#374151", border: "none", borderRadius: 8, cursor: "pointer" }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}