"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const StatusBadge = ({ status }) => {
  const map = {
    pending: { bg: "rgba(245,158,11,0.15)", color: "#F59E0B" },
    accepted: { bg: "rgba(59,130,246,0.15)", color: "#60A5FA" },
    completed: { bg: "rgba(34,197,94,0.15)", color: "#4ADE80" },
  };
  const s = map[status] || map.pending;
  return <span style={{ background: s.bg, color: s.color, padding: "3px 10px", borderRadius: 6, fontSize: 10, fontWeight: 600 }}>{status}</span>;
};

const Icon = ({ d: path, size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d={path} />
  </svg>
);

export default function AdminPage() {
  const router = useRouter();
  const [dark, setDark] = useState(true);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [userFilter, setUserFilter] = useState("all");
  const [bookings, setBookings] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [spinning, setSpinning] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userBookings, setUserBookings] = useState([]);
  const [modalTab, setModalTab] = useState("profile");
  const [modalLoading, setModalLoading] = useState(false);
  const [adminUser, setAdminUser] = useState(null);

  const bg = dark ? "#0D1117" : "#F0F4FF";
  const sidebar = dark ? "#161B22" : "#0A2540";
  const card = dark ? "#1C2333" : "#ffffff";
  const border = dark ? "rgba(255,255,255,0.06)" : "#E2EAF4";
  const text = dark ? "#E6EDF3" : "#1E3A5F";
  const muted = dark ? "#8B949E" : "#7B94B5";
  const accent = "#4F8EF7";
  const green = "#1D9E75";

  useEffect(() => {
  fetch("/api/auth/me")
    .then(r => r.json())
    .then(data => {
      if (!data.success) router.push("/login");
      else if (data.user.role !== "admin") router.push("/");
      else {
        setAdminUser(data.user);
        localStorage.setItem("user", JSON.stringify(data.user));
      }
    });
}, []);

  const fetchBookings = async () => {
    setLoading(true); setSpinning(true);
    try {
      const res = await fetch("/api/booking");
      const data = await res.json();
      if (data.success) setBookings(data.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); setTimeout(() => setSpinning(false), 500); }
  };

  const fetchUsers = async () => {
    const res = await fetch("/api/users");
    const data = await res.json();
    if (data.success) setUsers(data.data);
  };

  const updateStatus = async (id, status) => {
    await fetch("/api/booking", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, status }) });
    fetchBookings();
  };

  const handleViewUser = async (u) => {
    setSelectedUser(u); setModalTab("profile"); setModalLoading(true);
    try {
      const res = await fetch("/api/booking");
      const data = await res.json();
      if (data.success) {
        const field = u.role === "serviceman" ? "servicemanId" : "userId";
        setUserBookings(data.data.filter(b => b[field]?.toString() === u._id?.toString()));
      }
    } catch (err) { console.error(err); }
    finally { setModalLoading(false); }
  };

  const confirmDelete = async () => {
    await fetch(`/api/users/${deleteId}`, { method: "DELETE" });
    setDeleteId(null); fetchUsers();
  };

  useEffect(() => { fetchBookings(); fetchUsers(); }, []);

  const counts = {
    total: bookings.length,
    pending: bookings.filter(b => b.status === "pending").length,
    accepted: bookings.filter(b => b.status === "accepted").length,
    completed: bookings.filter(b => b.status === "completed").length,
  };

  const userCounts = {
    total: users.length,
    users: users.filter(u => u.role === "user").length,
    servicemen: users.filter(u => u.role === "serviceman").length,
    admins: users.filter(u => u.role === "admin").length,
  };

  const filteredBookings = (filter === "all" ? bookings : bookings.filter(b => b.status === filter))
    .filter(b => !search || b.name?.toLowerCase().includes(search.toLowerCase()) || b.service?.toLowerCase().includes(search.toLowerCase()));

  const filteredUsers = users
    .filter(u => userFilter === "all" || u.role === userFilter)
    .filter(u => !search || u.name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase()));

  const thStyle = { padding: "12px 16px", fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: muted, fontWeight: 600, borderBottom: `1px solid ${border}`, textAlign: "left", background: dark ? "rgba(255,255,255,0.02)" : "#F8FAFF" };
  const tdStyle = { padding: "13px 16px", fontSize: 12, color: text, borderBottom: `1px solid ${border}`, verticalAlign: "middle" };

  // Simple bar chart
  const BarChart = ({ data, max }) => (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 120, padding: "0 4px" }}>
      {data.map((item, i) => (
        <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
          <div style={{ fontSize: 10, color: muted, fontWeight: 600 }}>{item.value}</div>
          <div style={{ width: "100%", background: item.color, borderRadius: "4px 4px 0 0", height: `${max > 0 ? (item.value / max) * 90 : 4}px`, minHeight: 4, transition: "height 0.5s ease" }} />
          <div style={{ fontSize: 9, color: muted, textAlign: "center", lineHeight: 1.2 }}>{item.label}</div>
        </div>
      ))}
    </div>
  );

  const navItems = [
    { key: "dashboard", label: "Dashboard", icon: "M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" },
    { key: "bookings", label: "Bookings", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" },
    { key: "users", label: "Users", icon: "M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" },
    { key: "profile", label: "Profile", icon: "M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" },
  ];

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: bg, fontFamily: "'Inter', sans-serif", color: text, transition: "all 0.3s" }}>

      {/* Sidebar */}
      <div style={{ width: 230, background: sidebar, display: "flex", flexDirection: "column", position: "fixed", top: 0, bottom: 0, left: 0, zIndex: 50, borderRight: `1px solid rgba(255,255,255,0.05)` }}>
        <div style={{ padding: "1.5rem 1.25rem", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: "linear-gradient(135deg, #1D9E75, #3B82F6)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 12px rgba(29,158,117,0.4)" }}>
              <svg viewBox="0 0 24 24" fill="none" width="20" height="20"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>FixNext Sheba</div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Admin Panel</div>
            </div>
          </div>
        </div>

        <div style={{ padding: "0.5rem 0.75rem", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 10, background: "rgba(255,255,255,0.04)" }}>
            <div style={{ width: 34, height: 34, borderRadius: "50%", background: "linear-gradient(135deg, #1D9E75, #3B82F6)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>{adminUser?.name?.charAt(0).toUpperCase() || "A"}</span>
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#fff" }}>{adminUser?.name || "Admin"}</div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)" }}>Super Admin</div>
            </div>
          </div>
        </div>

        <nav style={{ padding: "0.75rem 0.75rem", flex: 1 }}>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", textTransform: "uppercase", letterSpacing: "0.1em", padding: "0 12px", marginBottom: 6 }}>Navigation</div>
          {navItems.map(item => (
            <button key={item.key} onClick={() => setActiveTab(item.key)} style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 8, border: "none", cursor: "pointer", background: activeTab === item.key ? "linear-gradient(135deg, rgba(79,142,247,0.2), rgba(29,158,117,0.12))" : "transparent", color: activeTab === item.key ? "#fff" : "rgba(255,255,255,0.4)", fontSize: 13, fontWeight: activeTab === item.key ? 600 : 400, marginBottom: 2, fontFamily: "inherit", transition: "all 0.2s", borderLeft: activeTab === item.key ? "2px solid #4F8EF7" : "2px solid transparent", textAlign: "left" }}>
              <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d={item.icon} /></svg>
              {item.label}
            </button>
          ))}
        </nav>

        <div style={{ padding: "0.75rem", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <button onClick={() => setDark(!dark)} style={{ width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "9px 12px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.08)", cursor: "pointer", background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.6)", fontSize: 12, fontWeight: 500, fontFamily: "inherit", marginBottom: 6 }}>
            {dark ? <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" /></svg> : <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" /></svg>}
            {dark ? "Light Mode" : "Dark Mode"}
          </button>
          <button onClick={async () => {
              await fetch("/api/auth/logout", { method: "POST" });
              localStorage.removeItem("user");
              router.push("/login");
            }} style={{ width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "9px 12px", borderRadius: 8, border: "none", cursor: "pointer", background: "rgba(239,68,68,0.1)", color: "#F87171", fontSize: 12, fontWeight: 500, fontFamily: "inherit" }}>
            <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
            Logout
          </button>
        </div>
      </div>

      {/* Main */}
      <div style={{ marginLeft: 230, flex: 1, display: "flex", flexDirection: "column" }}>

        {/* Topbar */}
        <div style={{ background: dark ? "rgba(22,27,34,0.95)" : "rgba(255,255,255,0.95)", backdropFilter: "blur(10px)", borderBottom: `1px solid ${border}`, padding: "0 2rem", height: 58, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 40 }}>
          <div style={{ fontSize: 13, color: muted }}>
            Home <span style={{ margin: "0 4px" }}>›</span>
            <span style={{ color: text, fontWeight: 600 }}>{navItems.find(n => n.key === activeTab)?.label}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ position: "relative" }}>
              <input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} style={{ padding: "7px 14px 7px 34px", borderRadius: 8, border: `1px solid ${border}`, background: dark ? "#0D1117" : "#F5F8FF", color: text, fontSize: 12, outline: "none", width: 200, fontFamily: "inherit" }} />
              <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke={muted} strokeWidth={2} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)" }}><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
            </div>
            <button onClick={() => { fetchBookings(); fetchUsers(); }} style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 8, border: `1px solid ${border}`, background: "transparent", color: accent, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
              <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" style={{ transition: "transform 0.5s", transform: spinning ? "rotate(360deg)" : "rotate(0deg)" }}><polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" /></svg>
              Refresh
            </button>
          </div>
        </div>

        <div style={{ padding: "2rem", flex: 1 }}>

          {/* ── DASHBOARD TAB ── */}
          {activeTab === "dashboard" && (
            <>
              <div style={{ marginBottom: "1.75rem" }}>
                <h1 style={{ fontSize: 22, fontWeight: 700, color: text, margin: "0 0 4px" }}>Dashboard Overview</h1>
                <p style={{ fontSize: 12, color: muted, margin: 0 }}>Welcome back, {adminUser?.name}</p>
              </div>

              {/* Booking stat cards */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: "1.5rem" }}>
                {[
                  { label: "Total Bookings", value: counts.total, gradient: "linear-gradient(135deg, #1F3A8A, #2563EB)", icon: "📦" },
                  { label: "Pending", value: counts.pending, gradient: "linear-gradient(135deg, #92400E, #D97706)", icon: "⏳" },
                  { label: "Accepted", value: counts.accepted, gradient: "linear-gradient(135deg, #1E3A5F, #3B82F6)", icon: "✅" },
                  { label: "Completed", value: counts.completed, gradient: "linear-gradient(135deg, #065F46, #10B981)", icon: "🎉" },
                ].map((s, i) => (
                  <div key={i} style={{ background: s.gradient, borderRadius: 14, padding: "1.25rem 1.5rem", position: "relative", overflow: "hidden", boxShadow: "0 4px 20px rgba(0,0,0,0.25)" }}>
                    <div style={{ position: "absolute", right: -10, top: -10, width: 70, height: 70, borderRadius: "50%", background: "rgba(255,255,255,0.07)" }} />
                    <div style={{ fontSize: 20, marginBottom: 8 }}>{s.icon}</div>
                    <div style={{ fontSize: 30, fontWeight: 700, color: "#fff", lineHeight: 1 }}>{s.value}</div>
                    <div style={{ fontSize: 12, color: "rgba(255,255,255,0.65)", marginTop: 6 }}>{s.label}</div>
                  </div>
                ))}
              </div>

              {/* User stat cards */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: "1.75rem" }}>
                {[
                  { label: "Total Users", value: userCounts.total, gradient: "linear-gradient(135deg, #312E81, #6D28D9)", icon: "👥" },
                  { label: "Customers", value: userCounts.users, gradient: "linear-gradient(135deg, #1E3A5F, #0EA5E9)", icon: "👤" },
                  { label: "Servicemen", value: userCounts.servicemen, gradient: "linear-gradient(135deg, #064E3B, #059669)", icon: "🔧" },
                  { label: "Admins", value: userCounts.admins, gradient: "linear-gradient(135deg, #7C2D12, #EA580C)", icon: "🛡️" },
                ].map((s, i) => (
                  <div key={i} style={{ background: s.gradient, borderRadius: 14, padding: "1.25rem 1.5rem", position: "relative", overflow: "hidden", boxShadow: "0 4px 20px rgba(0,0,0,0.25)" }}>
                    <div style={{ position: "absolute", right: -10, top: -10, width: 70, height: 70, borderRadius: "50%", background: "rgba(255,255,255,0.07)" }} />
                    <div style={{ fontSize: 20, marginBottom: 8 }}>{s.icon}</div>
                    <div style={{ fontSize: 30, fontWeight: 700, color: "#fff", lineHeight: 1 }}>{s.value}</div>
                    <div style={{ fontSize: 12, color: "rgba(255,255,255,0.65)", marginTop: 6 }}>{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Charts row */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: "1.5rem" }}>

                {/* Booking chart */}
                <div style={{ background: card, borderRadius: 14, border: `1px solid ${border}`, padding: "1.25rem", boxShadow: dark ? "0 4px 20px rgba(0,0,0,0.2)" : "0 4px 20px rgba(0,0,0,0.06)" }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: text, marginBottom: 4 }}>Booking Overview</div>
                  <div style={{ fontSize: 11, color: muted, marginBottom: "1.25rem" }}>Status breakdown</div>
                  <BarChart
                    max={Math.max(counts.total, counts.pending, counts.accepted, counts.completed, 1)}
                    data={[
                      { label: "Total", value: counts.total, color: "#4F8EF7" },
                      { label: "Pending", value: counts.pending, color: "#F59E0B" },
                      { label: "Accepted", value: counts.accepted, color: "#60A5FA" },
                      { label: "Completed", value: counts.completed, color: "#4ADE80" },
                    ]}
                  />
                </div>

                {/* User chart */}
                <div style={{ background: card, borderRadius: 14, border: `1px solid ${border}`, padding: "1.25rem", boxShadow: dark ? "0 4px 20px rgba(0,0,0,0.2)" : "0 4px 20px rgba(0,0,0,0.06)" }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: text, marginBottom: 4 }}>User Distribution</div>
                  <div style={{ fontSize: 11, color: muted, marginBottom: "1.25rem" }}>By role</div>
                  <BarChart
                    max={Math.max(userCounts.total, userCounts.users, userCounts.servicemen, userCounts.admins, 1)}
                    data={[
                      { label: "Total", value: userCounts.total, color: "#A78BFA" },
                      { label: "Customers", value: userCounts.users, color: "#0EA5E9" },
                      { label: "Servicemen", value: userCounts.servicemen, color: "#4ADE80" },
                      { label: "Admins", value: userCounts.admins, color: "#FB923C" },
                    ]}
                  />
                </div>
              </div>

              {/* Recent bookings */}
              <div style={{ background: card, borderRadius: 14, border: `1px solid ${border}`, overflow: "hidden", boxShadow: dark ? "0 4px 20px rgba(0,0,0,0.2)" : "0 4px 20px rgba(0,0,0,0.06)" }}>
                <div style={{ padding: "1rem 1.5rem", borderBottom: `1px solid ${border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: text }}>Recent Bookings</span>
                  <button onClick={() => setActiveTab("bookings")} style={{ fontSize: 11, color: accent, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", fontWeight: 600 }}>View all →</button>
                </div>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr>{["Customer", "Service", "Status", "Date"].map(h => <th key={h} style={thStyle}>{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    {bookings.slice(0, 5).map((b, i) => (
                      <tr key={i} onMouseEnter={e => e.currentTarget.style.background = dark ? "rgba(255,255,255,0.02)" : "#F8FAFF"} onMouseLeave={e => e.currentTarget.style.background = "transparent"} style={{ transition: "background 0.15s" }}>
                        <td style={{ ...tdStyle, fontWeight: 600 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <div style={{ width: 28, height: 28, borderRadius: "50%", background: `hsl(${(b.name?.charCodeAt(0) || 0) * 10}, 60%, 45%)`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                              <span style={{ fontSize: 11, fontWeight: 700, color: "#fff" }}>{b.name?.charAt(0).toUpperCase()}</span>
                            </div>
                            {b.name}
                          </div>
                        </td>
                        <td style={tdStyle}>{b.service}</td>
                        <td style={tdStyle}><StatusBadge status={b.status} /></td>
                        <td style={{ ...tdStyle, color: muted, fontSize: 11 }}>{new Date(b.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* ── BOOKINGS TAB ── */}
          {activeTab === "bookings" && (
            <>
              <div style={{ marginBottom: "1.5rem" }}>
                <h1 style={{ fontSize: 22, fontWeight: 700, color: text, margin: "0 0 4px" }}>All Bookings</h1>
                <p style={{ fontSize: 12, color: muted, margin: 0 }}>{counts.total} total bookings</p>
              </div>

              <div style={{ display: "flex", gap: 6, marginBottom: "1.25rem", flexWrap: "wrap" }}>
                {["all", "pending", "accepted", "completed"].map(f => (
                  <button key={f} onClick={() => setFilter(f)} style={{ padding: "6px 16px", borderRadius: 8, fontSize: 11, fontWeight: 600, border: `1px solid ${filter === f ? accent : border}`, cursor: "pointer", background: filter === f ? accent : "transparent", color: filter === f ? "#fff" : muted, textTransform: "capitalize", fontFamily: "inherit", transition: "all 0.15s" }}>
                    {f === "all" ? `All (${counts.total})` : `${f} (${counts[f]})`}
                  </button>
                ))}
              </div>

              <div style={{ background: card, borderRadius: 14, border: `1px solid ${border}`, overflow: "hidden", boxShadow: dark ? "0 4px 20px rgba(0,0,0,0.2)" : "0 4px 20px rgba(0,0,0,0.06)" }}>
                <div style={{ padding: "1rem 1.5rem", borderBottom: `1px solid ${border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: text }}>Booking Records</span>
                  <span style={{ fontSize: 11, color: muted }}>{filteredBookings.length} records</span>
                </div>
                {loading ? (
                  <div style={{ padding: "3rem", textAlign: "center", color: muted, fontSize: 13 }}>Loading…</div>
                ) : (
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                      <thead><tr>{["Customer", "Phone", "Service", "Address", "Status", "Date"].map(h => <th key={h} style={thStyle}>{h}</th>)}</tr></thead>
                      <tbody>
                        {filteredBookings.length === 0 ? (
                          <tr><td colSpan={6} style={{ padding: "2.5rem", textAlign: "center", color: muted, fontSize: 13 }}>No bookings found</td></tr>
                        ) : filteredBookings.map((b, i) => (
                          <tr key={i} onMouseEnter={e => e.currentTarget.style.background = dark ? "rgba(255,255,255,0.02)" : "#F8FAFF"} onMouseLeave={e => e.currentTarget.style.background = "transparent"} style={{ transition: "background 0.15s" }}>
                            <td style={{ ...tdStyle, fontWeight: 600 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <div style={{ width: 28, height: 28, borderRadius: "50%", background: `hsl(${(b.name?.charCodeAt(0) || 0) * 10}, 60%, 45%)`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                  <span style={{ fontSize: 11, fontWeight: 700, color: "#fff" }}>{b.name?.charAt(0).toUpperCase()}</span>
                                </div>
                                {b.name}
                              </div>
                            </td>
                            <td style={{ ...tdStyle, color: muted, fontFamily: "monospace", fontSize: 11 }}>{b.phone}</td>
                            <td style={tdStyle}>{b.service}</td>
                            <td style={{ ...tdStyle, color: muted, maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={b.address}>{b.address}</td>
                            <td style={tdStyle}>
                              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                                <StatusBadge status={b.status} />
                                <div style={{ display: "flex", gap: 4 }}>
                                  {b.status === "pending" && <button onClick={() => updateStatus(b._id, "accepted")} style={{ fontSize: 10, padding: "2px 8px", background: "rgba(59,130,246,0.12)", color: "#60A5FA", border: "1px solid rgba(59,130,246,0.2)", borderRadius: 5, cursor: "pointer" }}>Accept</button>}
                                  {b.status === "accepted" && <button onClick={() => updateStatus(b._id, "completed")} style={{ fontSize: 10, padding: "2px 8px", background: "rgba(34,197,94,0.12)", color: "#4ADE80", border: "1px solid rgba(34,197,94,0.2)", borderRadius: 5, cursor: "pointer" }}>Complete</button>}
                                </div>
                              </div>
                            </td>
                            <td style={{ ...tdStyle, color: muted, fontSize: 11 }}>{new Date(b.createdAt).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}

          {/* ── USERS TAB ── */}
          {activeTab === "users" && (
            <>
              <div style={{ marginBottom: "1.5rem" }}>
                <h1 style={{ fontSize: 22, fontWeight: 700, color: text, margin: "0 0 4px" }}>Users & Servicemen</h1>
                <p style={{ fontSize: 12, color: muted, margin: 0 }}>{userCounts.total} total members</p>
              </div>

              {/* Role filter */}
              <div style={{ display: "flex", gap: 6, marginBottom: "1.25rem" }}>
                {[
                  { key: "all", label: `All (${userCounts.total})` },
                  { key: "user", label: `Customers (${userCounts.users})` },
                  { key: "serviceman", label: `Servicemen (${userCounts.servicemen})` },
                  { key: "admin", label: `Admins (${userCounts.admins})` },
                ].map(f => (
                  <button key={f.key} onClick={() => setUserFilter(f.key)} style={{ padding: "6px 16px", borderRadius: 8, fontSize: 11, fontWeight: 600, border: `1px solid ${userFilter === f.key ? accent : border}`, cursor: "pointer", background: userFilter === f.key ? accent : "transparent", color: userFilter === f.key ? "#fff" : muted, fontFamily: "inherit", transition: "all 0.15s" }}>
                    {f.label}
                  </button>
                ))}
              </div>

              <div style={{ background: card, borderRadius: 14, border: `1px solid ${border}`, overflow: "hidden", boxShadow: dark ? "0 4px 20px rgba(0,0,0,0.2)" : "0 4px 20px rgba(0,0,0,0.06)" }}>
                <div style={{ padding: "1rem 1.5rem", borderBottom: `1px solid ${border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: text }}>{userFilter === "all" ? "All Members" : userFilter === "user" ? "Customers" : userFilter === "serviceman" ? "Servicemen" : "Admins"}</span>
                  <span style={{ fontSize: 11, color: muted }}>{filteredUsers.length} members</span>
                </div>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead><tr>{["User", "Email", "Role", "Joined", "Actions"].map(h => <th key={h} style={thStyle}>{h}</th>)}</tr></thead>
                    <tbody>
                      {filteredUsers.length === 0 ? (
                        <tr><td colSpan={5} style={{ padding: "2.5rem", textAlign: "center", color: muted, fontSize: 13 }}>No users found</td></tr>
                      ) : filteredUsers.map(u => {
                        const rc = { user: { c: "#60A5FA", bg: "rgba(96,165,250,0.1)" }, serviceman: { c: "#4ADE80", bg: "rgba(74,222,128,0.1)" }, admin: { c: "#FBBF24", bg: "rgba(251,191,36,0.1)" } }[u.role] || { c: muted, bg: "transparent" };
                        return (
                          <tr key={u._id} onMouseEnter={e => e.currentTarget.style.background = dark ? "rgba(255,255,255,0.02)" : "#F8FAFF"} onMouseLeave={e => e.currentTarget.style.background = "transparent"} style={{ transition: "background 0.15s" }}>
                            <td style={tdStyle}>
                              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                <div style={{ width: 34, height: 34, borderRadius: "50%", background: `hsl(${(u.name?.charCodeAt(0) || 0) * 10}, 55%, 45%)`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                  <span style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>{u.name?.charAt(0).toUpperCase()}</span>
                                </div>
                                <span style={{ fontWeight: 600, color: text }}>{u.name}</span>
                              </div>
                            </td>
                            <td style={{ ...tdStyle, color: muted, fontSize: 11 }}>{u.email}</td>
                            <td style={tdStyle}>
                              <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 10px", borderRadius: 6, background: rc.bg, color: rc.c }}>{u.role}</span>
                            </td>
                            <td style={{ ...tdStyle, color: muted, fontSize: 11 }}>{u.createdAt ? new Date(u.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—"}</td>
                            <td style={tdStyle}>
                              <div style={{ display: "flex", gap: 6 }}>
                                <button onClick={() => handleViewUser(u)} style={{ fontSize: 11, padding: "5px 12px", background: "rgba(79,142,247,0.1)", color: "#4F8EF7", border: "1px solid rgba(79,142,247,0.2)", borderRadius: 6, cursor: "pointer", fontFamily: "inherit" }}>View</button>
                                <button onClick={() => setDeleteId(u._id)} style={{ fontSize: 11, padding: "5px 12px", background: "rgba(239,68,68,0.1)", color: "#F87171", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 6, cursor: "pointer", fontFamily: "inherit" }}>Delete</button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* ── PROFILE TAB ── */}
          {activeTab === "profile" && (
            <>
              <div style={{ marginBottom: "1.5rem" }}>
                <h1 style={{ fontSize: 22, fontWeight: 700, color: text, margin: "0 0 4px" }}>My Profile</h1>
                <p style={{ fontSize: 12, color: muted, margin: 0 }}>Admin account details</p>
              </div>
              <div style={{ maxWidth: 500 }}>
                <div style={{ background: card, borderRadius: 16, border: `1px solid ${border}`, overflow: "hidden", boxShadow: dark ? "0 4px 20px rgba(0,0,0,0.2)" : "0 4px 20px rgba(0,0,0,0.06)" }}>
                  <div style={{ background: "linear-gradient(135deg, #0A2540, #1D4E89)", padding: "2rem", textAlign: "center" }}>
                    <div style={{ width: 72, height: 72, borderRadius: "50%", background: "linear-gradient(135deg, #1D9E75, #3B82F6)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px", boxShadow: "0 8px 24px rgba(29,158,117,0.4)" }}>
                      <span style={{ fontSize: 28, fontWeight: 700, color: "#fff" }}>{adminUser?.name?.charAt(0).toUpperCase() || "A"}</span>
                    </div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: "#fff" }}>{adminUser?.name}</div>
                    <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginTop: 4 }}>Super Admin</div>
                  </div>
                  <div style={{ padding: "1.25rem" }}>
                    {[
                      ["Name", adminUser?.name],
                      ["Email", adminUser?.email],
                      ["Role", adminUser?.role],
                      ["ID", adminUser?.id],
                    ].map(([label, val]) => (
                      <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: `1px solid ${border}` }}>
                        <span style={{ fontSize: 12, color: muted, fontWeight: 500 }}>{label}</span>
                        <span style={{ fontSize: 12, color: text, fontWeight: 600 }}>{val || "—"}</span>
                      </div>
                    ))}
                    <div style={{ marginTop: "1.25rem", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                      {[
                        { label: "Total Bookings", value: counts.total, color: "#4F8EF7" },
                        { label: "Total Users", value: userCounts.total, color: "#4ADE80" },
                        { label: "Servicemen", value: userCounts.servicemen, color: "#F59E0B" },
                      ].map(s => (
                        <div key={s.label} style={{ background: dark ? "rgba(255,255,255,0.04)" : "#F8FAFF", borderRadius: 10, padding: "12px", textAlign: "center", border: `1px solid ${border}` }}>
                          <div style={{ fontSize: 22, fontWeight: 700, color: s.color }}>{s.value}</div>
                          <div style={{ fontSize: 10, color: muted, marginTop: 4, lineHeight: 1.3 }}>{s.label}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* User Detail Modal */}
      {selectedUser && (
        <div onClick={() => setSelectedUser(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, padding: "1rem", backdropFilter: "blur(4px)" }}>
          <div onClick={e => e.stopPropagation()} style={{ background: card, borderRadius: 18, width: "100%", maxWidth: 500, maxHeight: "82vh", display: "flex", flexDirection: "column", boxShadow: "0 30px 80px rgba(0,0,0,0.4)", border: `1px solid ${border}` }}>
            <div style={{ background: "linear-gradient(135deg, #0A2540, #1D4E89)", padding: "1.5rem", borderRadius: "18px 18px 0 0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ width: 48, height: 48, borderRadius: "50%", background: `hsl(${(selectedUser.name?.charCodeAt(0) || 0) * 10}, 55%, 45%)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontSize: 20, fontWeight: 700, color: "#fff" }}>{selectedUser.name?.charAt(0).toUpperCase()}</span>
                </div>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: "#fff" }}>{selectedUser.name}</div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", marginTop: 2 }}>{selectedUser.email}</div>
                </div>
              </div>
              <button onClick={() => setSelectedUser(null)} style={{ background: "rgba(255,255,255,0.1)", border: "none", cursor: "pointer", color: "#fff", width: 32, height: 32, borderRadius: "50%", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
            </div>
            <div style={{ display: "flex", borderBottom: `1px solid ${border}` }}>
              {["profile", "bookings"].map(t => (
                <button key={t} onClick={() => setModalTab(t)} style={{ flex: 1, padding: "12px", fontSize: 12, fontWeight: 600, border: "none", cursor: "pointer", fontFamily: "inherit", background: modalTab === t ? (dark ? "rgba(79,142,247,0.08)" : "#F0F8FF") : card, color: modalTab === t ? accent : muted, borderBottom: modalTab === t ? `2px solid ${accent}` : "2px solid transparent", textTransform: "capitalize", transition: "all 0.15s" }}>
                  {t === "bookings" ? `Bookings (${userBookings.length})` : "Profile"}
                </button>
              ))}
            </div>
            <div style={{ flex: 1, overflowY: "auto", padding: "1.25rem" }}>
              {modalLoading ? <div style={{ textAlign: "center", color: muted, padding: "2rem" }}>Loading...</div>
                : modalTab === "profile" ? (
                  <div>
                    {[["Name", selectedUser.name], ["Email", selectedUser.email], ["Role", selectedUser.role], ["Phone", selectedUser.phone || "—"], ["Specialty", selectedUser.specialty || "—"], ["Rating", selectedUser.rating ? `${selectedUser.rating} ⭐ (${selectedUser.totalReviews} reviews)` : "No ratings"], ["Joined", selectedUser.createdAt ? new Date(selectedUser.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—"]].map(([label, val]) => (
                      <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "11px 0", borderBottom: `1px solid ${border}` }}>
                        <span style={{ fontSize: 12, color: muted, fontWeight: 500 }}>{label}</span>
                        <span style={{ fontSize: 12, color: text, fontWeight: 600, maxWidth: "60%", textAlign: "right" }}>{val}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div>
                    {userBookings.length === 0 ? <div style={{ textAlign: "center", color: muted, padding: "2rem", fontSize: 13 }}>No bookings found</div>
                      : userBookings.map((b, i) => (
                        <div key={i} style={{ background: dark ? "rgba(255,255,255,0.03)" : "#F8FAFF", borderRadius: 10, padding: "12px 14px", marginBottom: 8, border: `1px solid ${border}` }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                            <div style={{ fontSize: 13, fontWeight: 600, color: text }}>{b.service}</div>
                            <StatusBadge status={b.status} />
                          </div>
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                            {[["Customer", b.name], ["Phone", b.phone], ["Address", b.address], ["Date", new Date(b.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })]].map(([label, val]) => (
                              <div key={label}>
                                <div style={{ fontSize: 10, color: muted, marginBottom: 2 }}>{label}</div>
                                <div style={{ fontSize: 11, fontWeight: 600, color: text }}>{val}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                  </div>
                )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {deleteId && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, backdropFilter: "blur(4px)" }}>
          <div style={{ background: card, padding: "2rem", borderRadius: 18, width: 320, textAlign: "center", border: `1px solid ${border}`, boxShadow: "0 25px 60px rgba(0,0,0,0.4)" }}>
            <div style={{ width: 52, height: 52, borderRadius: "50%", background: "rgba(239,68,68,0.12)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1rem", border: "1px solid rgba(239,68,68,0.2)" }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#F87171" strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" /><path d="M10 11v6M14 11v6" /></svg>
            </div>
            <div style={{ fontSize: 16, fontWeight: 700, color: text, marginBottom: 8 }}>Delete User?</div>
            <div style={{ fontSize: 13, color: muted, marginBottom: "1.5rem", lineHeight: 1.5 }}>This action is permanent and cannot be undone.</div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={confirmDelete} style={{ flex: 1, padding: "11px", background: "linear-gradient(135deg, #DC2626, #EF4444)", color: "#fff", border: "none", borderRadius: 10, cursor: "pointer", fontWeight: 700, fontFamily: "inherit", fontSize: 13 }}>Delete</button>
              <button onClick={() => setDeleteId(null)} style={{ flex: 1, padding: "11px", background: dark ? "rgba(255,255,255,0.06)" : "#F3F4F6", color: text, border: `1px solid ${border}`, borderRadius: 10, cursor: "pointer", fontFamily: "inherit", fontSize: 13 }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}