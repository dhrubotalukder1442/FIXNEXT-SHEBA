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
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, background: s.bg, color: s.color, padding: "3px 10px", borderRadius: 999, fontSize: 11, fontWeight: 600 }}>
      <span style={{ width: 5, height: 5, borderRadius: "50%", background: s.dot }} />
      {status}
    </span>
  );
};

export default function ServicemanPage() {
  const router = useRouter();
  const [bookings, setBookings] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [filter, setFilter] = useState("all");

  const fetchNotifications = async (userId) => {
    try {
      const res = await fetch(`/api/notifications?servicemanId=${userId}`);
      const data = await res.json();
      if (data.success) setNotifications(data.data.filter(n => n.status === "unread"));
    } catch (err) {
      console.error(err);
    }
  };


 const fetchBookings = async (userId) => {
  setLoading(true);
  try {
    const res = await fetch(`/api/booking?servicemanId=${userId}`);
    const data = await res.json();
    if (data.success) setBookings(data.data);
  } catch (err) {
    console.error(err);
  } finally {
    setLoading(false);
  }
};

 const updateStatus = async (id, status) => {
  try {
    await fetch("/api/booking", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    fetchBookings(user.id); // ✅ user.id দাও
  } catch (err) {
    console.error(err);
  }
};

  const handleAcceptNotification = async (n) => {
  try {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: n._id }),
    });
    await fetch("/api/booking", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: n.bookingId,
        status: "accepted",
        servicemanId: user.id,
      }),
    });
    fetchNotifications(user.id);
    fetchBookings(user.id); // ✅ user.id দাও
  } catch (err) {
    console.error(err);
  }
};

  const handleLogout = () => {
    localStorage.removeItem("user");
    router.push("/login");
  };

useEffect(() => {
  const stored = JSON.parse(localStorage.getItem("user"));
  if (!stored) {
    router.push("/login");
  } else if (stored.role !== "serviceman") {
    router.push("/");
  } else {
    setUser(stored);
    fetchNotifications(stored.id);
    fetchBookings(stored.id); // ✅ নিজের id দিয়ে fetch
  }
}, []);

  const counts = {
    total: bookings.length,
    pending: bookings.filter((b) => b.status === "pending").length,
    accepted: bookings.filter((b) => b.status === "accepted").length,
    completed: bookings.filter((b) => b.status === "completed").length,
  };

  const filtered = filter === "all" ? bookings : bookings.filter((b) => b.status === filter);

  return (
    <main style={{ fontFamily: "'Sora', sans-serif", background: "#F0F2F5", minHeight: "100vh", paddingBottom: "2rem" }}>

      {/* ── Header ── */}
      <div style={{ background: "#0A2540", padding: "1.25rem 1.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#fff" }}>Serviceman Panel</div>
            <div style={{ fontSize: 12, color: "#5DCAA5", marginTop: 2 }}>Welcome, {user?.name}</div>
          </div>
          <button
            onClick={handleLogout}
            style={{ background: "transparent", border: "1px solid #1D9E75", color: "#5DCAA5", borderRadius: 8, padding: "6px 14px", fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}
          >
            Logout
          </button>
        </div>
      </div>

      <div style={{ padding: "1.25rem" }}>

        {/* ── Notifications ── */}
        {notifications.length > 0 && (
          <div style={{ marginBottom: "1.25rem" }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "#888780", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>
              New Bookings ({notifications.length})
            </div>
            {notifications.map((n, i) => (
              <div key={i} style={{ background: "#F0FBF6", borderRadius: 12, border: "1px solid #9FE1CB", padding: "14px", marginBottom: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#2C2C2A" }}>{n.name}</div>
                    <div style={{ fontSize: 12, color: "#888780", marginTop: 2 }}>{n.phone}</div>
                  </div>
                  <div style={{ fontSize: 11, background: "#1D9E75", color: "#fff", borderRadius: 6, padding: "3px 8px" }}>New</div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 10 }}>
                  {[
                    ["Service", n.service],
                    ["Option", n.option ?? "—"],
                    ["Address", n.address],
                  ].map(([label, val]) => (
                    <div key={label} style={{ background: "#fff", borderRadius: 8, padding: "8px 10px" }}>
                      <div style={{ fontSize: 10, color: "#888780", marginBottom: 2 }}>{label}</div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: "#2C2C2A" }}>{val}</div>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => handleAcceptNotification(n)}
                  style={{ width: "100%", background: "#1D9E75", color: "#fff", border: "none", borderRadius: 8, padding: "10px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}
                >
                  Accept
                </button>
              </div>
            ))}
          </div>
        )}

        {/* ── Stats ── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginBottom: "1.25rem" }}>
          {[
            { label: "Total", value: counts.total, color: "#0A2540" },
            { label: "Pending", value: counts.pending, color: "#92400E" },
            { label: "Accepted", value: counts.accepted, color: "#1E40AF" },
            { label: "Completed", value: counts.completed, color: "#166534" },
          ].map((s) => (
            <div key={s.label} style={{ background: "#fff", borderRadius: 12, padding: "12px", border: "1px solid #E5E7EB", textAlign: "center" }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 10, color: "#888780", marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* ── Filter ── */}
        <div style={{ display: "flex", gap: 6, marginBottom: "1rem", flexWrap: "wrap" }}>
          {["all", "pending", "accepted", "completed"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: "6px 14px", borderRadius: 999, fontSize: 11, fontWeight: 600,
                border: "1px solid #E5E7EB", cursor: "pointer", fontFamily: "inherit",
                background: filter === f ? "#1D9E75" : "#fff",
                color: filter === f ? "#fff" : "#888780",
                textTransform: "capitalize",
              }}
            >
              {f === "all" ? `All (${counts.total})` : `${f} (${counts[f]})`}
            </button>
          ))}
        </div>

        {/* ── Booking Cards ── */}
        {loading ? (
          <div style={{ textAlign: "center", color: "#888780", padding: "2rem", fontSize: 13 }}>Loading...</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", color: "#888780", padding: "2rem", fontSize: 13 }}>No bookings found</div>
        ) : (
          filtered.map((b, i) => (
            <div key={i} style={{ background: "#fff", borderRadius: 12, border: "1px solid #E5E7EB", padding: "14px", marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#2C2C2A" }}>{b.name}</div>
                  <div style={{ fontSize: 12, color: "#888780", marginTop: 2 }}>{b.phone}</div>
                </div>
                <StatusBadge status={b.status} />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 10 }}>
                {[
                  ["Service", b.service],
                  ["Option", b.option ?? "—"],
                  ["Address", b.address],
                  ["Time", new Date(b.createdAt).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })],
                ].map(([label, val]) => (
                  <div key={label} style={{ background: "#F9FAFB", borderRadius: 8, padding: "8px 10px" }}>
                    <div style={{ fontSize: 10, color: "#888780", marginBottom: 2 }}>{label}</div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "#2C2C2A" }}>{val}</div>
                  </div>
                ))}
              </div>

              <div style={{ display: "flex", gap: 8 }}>
                {b.status === "pending" && (
                  <button
                    onClick={() => updateStatus(b._id, "accepted")}
                    style={{ flex: 1, background: "#1D9E75", color: "#fff", border: "none", borderRadius: 8, padding: "10px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}
                  >
                    Accept
                  </button>
                )}
                {b.status === "accepted" && (
                  <button
                    onClick={() => updateStatus(b._id, "completed")}
                    style={{ flex: 1, background: "#0A2540", color: "#fff", border: "none", borderRadius: 8, padding: "10px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}
                  >
                    Mark Complete
                  </button>
                )}
                {b.status === "completed" && (
                  <div style={{ flex: 1, textAlign: "center", fontSize: 12, color: "#166534", fontWeight: 600, padding: "10px" }}>
                    ✓ Completed
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </main>
  );
}