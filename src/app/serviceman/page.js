"use client";
import { useEffect, useState, useRef } from "react";
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

const CloseIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

export default function ServicemanPage() {
  const router = useRouter();
  const fileInputRef = useRef(null);
  const [bookings, setBookings] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [filter, setFilter] = useState("all");
  const [showSidebar, setShowSidebar] = useState(false);
  const [sidebarTab, setSidebarTab] = useState("profile");
  const [profile, setProfile] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [editPhone, setEditPhone] = useState("");
  const [editSpecialty, setEditSpecialty] = useState("");
  const [editBio, setEditBio] = useState("");
  const [saveLoading, setSaveLoading] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);
  // Messages
  const [allMessages, setAllMessages] = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(false);

  const fetchNotifications = async (userId) => {
    try {
      const res = await fetch(`/api/notifications?servicemanId=${userId}`);
      const data = await res.json();
      if (data.success) setNotifications(data.data.filter(n => n.status === "unread"));
    } catch (err) { console.error(err); }
  };

  const fetchBookings = async (userId) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/booking?servicemanId=${userId}`);
      const data = await res.json();
      if (data.success) setBookings(data.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const fetchProfile = async () => {
    const res = await fetch("/api/auth/me");
    const data = await res.json();
    if (data.success) {
      const fullRes = await fetch(`/api/serviceman/${data.user.id}`);
      const fullData = await fullRes.json();
      if (fullData.success) setProfile(fullData.data);
    }
  };

  // Fetch all messages for serviceman's accepted bookings
  const fetchAllMessages = async (userId) => {
    setMessagesLoading(true);
    try {
      const res = await fetch(`/api/booking?servicemanId=${userId}`);
      const data = await res.json();
      if (!data.success) return;

      const acceptedBookings = data.data.filter(b => b.servicemanId && (b.status === "accepted" || b.status === "completed"));

      const groups = await Promise.all(
        acceptedBookings.map(async (booking) => {
          const msgRes = await fetch(`/api/chat?bookingId=${booking._id}`);
          const msgData = await msgRes.json();
          return {
            bookingId: booking._id,
            customerName: booking.name,
            customerPhone: booking.phone,
            service: booking.service,
            status: booking.status,
            messages: msgData.success ? msgData.data : [],
            lastMessage: msgData.success && msgData.data.length > 0
              ? msgData.data[msgData.data.length - 1]
              : null,
          };
        })
      );

      setAllMessages(groups.filter(g => g.messages.length > 0));
    } catch (err) { console.error(err); }
    finally { setMessagesLoading(false); }
  };

  const updateStatus = async (id, status) => {
    try {
      await fetch("/api/booking", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, status }) });
      fetchBookings(user.id);
    } catch (err) { console.error(err); }
  };

  const handleAcceptNotification = async (n) => {
    try {
      await fetch("/api/notifications", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: n._id }) });
      await fetch("/api/booking", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: n.bookingId, status: "accepted", servicemanId: user.id }) });
      fetchNotifications(user.id);
      fetchBookings(user.id);
    } catch (err) { console.error(err); }
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    localStorage.removeItem("user");
    router.push("/login");
  };

  const handleSaveProfile = async () => {
    setSaveLoading(true);
    try {
      const res = await fetch("/api/serviceman/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: editPhone, specialty: editSpecialty, bio: editBio }),
      });
      const data = await res.json();
      if (data.success) {
        setProfile(prev => ({ ...prev, ...data.user }));
        setEditMode(false);
      } else {
        alert(data.message || "Failed to update profile");
      }
    } catch { alert("Something went wrong."); }
    finally { setSaveLoading(false); }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { alert("Image must be under 2MB"); return; }
    setAvatarLoading(true);
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result;
      try {
        const res = await fetch("/api/serviceman/profile", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ avatar: base64 }),
        });
        const data = await res.json();
        if (data.success) setProfile(prev => ({ ...prev, avatar: base64 }));
        else alert("Failed to upload image");
      } catch { alert("Something went wrong."); }
      finally { setAvatarLoading(false); }
    };
    reader.readAsDataURL(file);
  };

  const openSidebar = (tab = "profile") => {
    fetchProfile();
    setSidebarTab(tab);
    if (tab === "messages" && user) fetchAllMessages(user.id);
    setShowSidebar(true);
  };

  useEffect(() => {
    fetch("/api/auth/me")
      .then(r => r.json())
      .then(data => {
        if (!data.success) router.push("/login");
        else if (data.user.role !== "serviceman") router.push("/");
        else {
          setUser(data.user);
          localStorage.setItem("user", JSON.stringify(data.user));
          fetchNotifications(data.user.id);
          fetchBookings(data.user.id);
        }
      });
  }, []);

  const counts = {
    total: bookings.length,
    pending: bookings.filter(b => b.status === "pending").length,
    accepted: bookings.filter(b => b.status === "accepted").length,
    completed: bookings.filter(b => b.status === "completed").length,
  };

  const filtered = filter === "all" ? bookings : bookings.filter(b => b.status === filter);

  const inputStyle = {
    width: "100%", padding: "9px 12px", border: "1px solid #E5E7EB",
    borderRadius: 8, fontSize: 13, fontFamily: "'Sora', sans-serif",
    color: "#2C2C2A", background: "#FAFAFA", outline: "none", boxSizing: "border-box",
    marginBottom: 8,
  };

  const formatDate = (date) => new Date(date).toLocaleDateString("en-GB", { day: "2-digit", month: "short" });

  const tabs = [
    { key: "profile", label: "Profile" },
    { key: "messages", label: "Messages" },
  ];

  return (
    <main style={{ fontFamily: "'Sora', sans-serif", background: "#F0F2F5", minHeight: "100vh", paddingBottom: "2rem" }}>

      {/* ── Profile Sidebar ── */}
      {showSidebar && (
        <div onClick={() => setShowSidebar(false)} style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(10,37,64,0.5)" }}>
          <div onClick={e => e.stopPropagation()} style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: 300, background: "#fff", display: "flex", flexDirection: "column", boxShadow: "-4px 0 20px rgba(0,0,0,0.1)" }}>

            {/* Sidebar Header */}
            <div style={{ background: "#0A2540", padding: "1.25rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>My Profile</div>
              <button onClick={() => setShowSidebar(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#9AAFC7" }}>
                <CloseIcon />
              </button>
            </div>

            {/* Tabs */}
            <div style={{ display: "flex", borderBottom: "1px solid #E5E7EB" }}>
              {tabs.map(t => (
                <button key={t.key} onClick={() => {
                  setSidebarTab(t.key);
                  if (t.key === "messages" && user) fetchAllMessages(user.id);
                }} style={{ flex: 1, padding: "10px 4px", fontSize: 12, fontWeight: 600, border: "none", cursor: "pointer", fontFamily: "inherit", background: sidebarTab === t.key ? "#F0FBF6" : "#fff", color: sidebarTab === t.key ? "#1D9E75" : "#888780", borderBottom: sidebarTab === t.key ? "2px solid #1D9E75" : "2px solid transparent" }}>
                  {t.label}
                </button>
              ))}
            </div>

            <div style={{ flex: 1, overflowY: "auto", padding: "1.25rem" }}>

              {/* ── Profile Tab ── */}
              {sidebarTab === "profile" && (
                <>
                  {/* Avatar */}
                  <div style={{ textAlign: "center", marginBottom: "1.25rem" }}>
                    <div style={{ position: "relative", display: "inline-block" }}>
                      <div style={{ width: 80, height: 80, borderRadius: "50%", overflow: "hidden", border: "3px solid #1D9E75", margin: "0 auto" }}>
                        {profile?.avatar ? (
                          <img src={profile.avatar} alt="avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        ) : (
                          <div style={{ width: "100%", height: "100%", background: "#E1F5EE", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <span style={{ fontSize: 28, fontWeight: 700, color: "#1D9E75" }}>{user?.name?.charAt(0).toUpperCase()}</span>
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={avatarLoading}
                        style={{ position: "absolute", bottom: 0, right: 0, width: 26, height: 26, borderRadius: "50%", background: "#1D9E75", border: "2px solid #fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                      >
                        {avatarLoading ? (
                          <span style={{ fontSize: 8, color: "#fff" }}>...</span>
                        ) : (
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round">
                            <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
                            <circle cx="12" cy="13" r="4" />
                          </svg>
                        )}
                      </button>
                      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarChange} style={{ display: "none" }} />
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: "#2C2C2A", marginTop: 10 }}>{user?.name}</div>
                    <div style={{ fontSize: 12, color: "#1D9E75", marginTop: 2 }}>{profile?.specialty || "Serviceman"}</div>
                    {profile?.rating > 0 && (
                      <div style={{ fontSize: 12, color: "#888780", marginTop: 4 }}>
                        ⭐ {profile.rating.toFixed(1)} ({profile.totalReviews} reviews)
                      </div>
                    )}
                  </div>

                  {/* Profile Info / Edit */}
                  {!editMode ? (
                    <div>
                      {[
                        ["Email", user?.email],
                        ["Phone", profile?.phone || "Not set"],
                        ["Specialty", profile?.specialty || "Not set"],
                        ["Bio", profile?.bio || "Not set"],
                      ].map(([label, val]) => (
                        <div key={label} style={{ background: "#F9FAFB", borderRadius: 10, padding: "10px 14px", marginBottom: 8, border: "1px solid #E5E7EB" }}>
                          <div style={{ fontSize: 10, color: "#888780", marginBottom: 2 }}>{label}</div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: "#2C2C2A", wordBreak: "break-word" }}>{val}</div>
                        </div>
                      ))}
                      <button
                        onClick={() => {
                          setEditPhone(profile?.phone || "");
                          setEditSpecialty(profile?.specialty || "");
                          setEditBio(profile?.bio || "");
                          setEditMode(true);
                        }}
                        style={{ width: "100%", background: "#0A2540", color: "#fff", border: "none", borderRadius: 10, padding: "11px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", marginTop: 4 }}
                      >
                        Edit Profile
                      </button>
                    </div>
                  ) : (
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 600, color: "#888780", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>Edit Profile</div>
                      <label style={{ fontSize: 11, color: "#888780", display: "block", marginBottom: 4 }}>Phone</label>
                      <input placeholder="Phone number" value={editPhone} onChange={e => setEditPhone(e.target.value)} style={inputStyle} />
                      <label style={{ fontSize: 11, color: "#888780", display: "block", marginBottom: 4 }}>Specialty</label>
                      <input placeholder="e.g. Electrician, Plumber" value={editSpecialty} onChange={e => setEditSpecialty(e.target.value)} style={inputStyle} />
                      <label style={{ fontSize: 11, color: "#888780", display: "block", marginBottom: 4 }}>Bio</label>
                      <textarea
                        placeholder="Tell customers about yourself"
                        value={editBio}
                        onChange={e => setEditBio(e.target.value)}
                        style={{ ...inputStyle, resize: "none", height: 80 }}
                      />
                      <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                        <button onClick={handleSaveProfile} disabled={saveLoading} style={{ flex: 1, background: saveLoading ? "#B4B2A9" : "#1D9E75", color: "#fff", border: "none", borderRadius: 10, padding: "11px", fontSize: 13, fontWeight: 700, cursor: saveLoading ? "not-allowed" : "pointer", fontFamily: "inherit" }}>
                          {saveLoading ? "Saving..." : "Save"}
                        </button>
                        <button onClick={() => setEditMode(false)} style={{ flex: 1, background: "transparent", color: "#888780", border: "1px solid #E5E7EB", borderRadius: 10, padding: "11px", fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* ── Messages Tab ── */}
              {sidebarTab === "messages" && (
                <div>
                  {messagesLoading ? (
                    <div style={{ textAlign: "center", color: "#888780", fontSize: 13, padding: "2rem 0" }}>Loading messages...</div>
                  ) : allMessages.length === 0 ? (
                    <div style={{ textAlign: "center", color: "#888780", fontSize: 13, padding: "2rem 0" }}>
                      <div style={{ fontSize: 32, marginBottom: 8 }}>💬</div>
                      No messages yet
                    </div>
                  ) : (
                    allMessages.map((group, i) => {
                      const last = group.lastMessage;
                      const isFromCustomer = last?.senderRole === "user";
                      return (
                        <div
                          key={i}
                          onClick={() => { router.push(`/chat/${group.bookingId}`); setShowSidebar(false); }}
                          style={{ background: "#F9FAFB", borderRadius: 12, padding: "12px 14px", marginBottom: 8, border: "1px solid #E5E7EB", cursor: "pointer" }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            {/* Customer avatar */}
                            <div style={{ width: 40, height: 40, borderRadius: "50%", background: "#E1F5EE", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                              <span style={{ fontSize: 16, fontWeight: 700, color: "#1D9E75" }}>{group.customerName?.charAt(0).toUpperCase()}</span>
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <div style={{ fontSize: 13, fontWeight: 700, color: "#2C2C2A" }}>{group.customerName}</div>
                                {last && <div style={{ fontSize: 10, color: "#B4B2A9" }}>{formatDate(last.createdAt)}</div>}
                              </div>
                              <div style={{ fontSize: 11, color: "#1D9E75", marginBottom: 2 }}>{group.service}</div>
                              {last && (
                                <div style={{ fontSize: 12, color: isFromCustomer ? "#2C2C2A" : "#888780", fontWeight: isFromCustomer ? 600 : 400, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                  {isFromCustomer ? "" : "You: "}{last.message}
                                </div>
                              )}
                            </div>
                            {/* Unread dot for customer messages */}
                            {isFromCustomer && (
                              <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#1D9E75", flexShrink: 0 }} />
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>

            {/* Logout */}
            <div style={{ padding: "1rem", borderTop: "1px solid #E5E7EB" }}>
              <button onClick={handleLogout} style={{ width: "100%", background: "#FFF5F5", color: "#DC2626", border: "1px solid #FECACA", borderRadius: 10, padding: "11px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Header ── */}
      <div style={{ background: "#0A2540", padding: "1.25rem 1.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#fff" }}>Serviceman Panel</div>
            <div style={{ fontSize: 12, color: "#5DCAA5", marginTop: 2 }}>Welcome, {user?.name}</div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {/* Messages button */}
            <button
              onClick={() => openSidebar("messages")}
              style={{ display: "flex", alignItems: "center", gap: 6, background: "transparent", border: "1px solid #1D9E75", color: "#5DCAA5", borderRadius: 8, padding: "6px 12px", fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
              </svg>
              Messages
            </button>
            {/* Profile button */}
            <button
              onClick={() => openSidebar("profile")}
              style={{ display: "flex", alignItems: "center", gap: 8, background: "transparent", border: "1px solid #1D9E75", color: "#5DCAA5", borderRadius: 8, padding: "6px 12px", fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}
            >
              <div style={{ width: 24, height: 24, borderRadius: "50%", overflow: "hidden", background: "#1D9E75", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                {profile?.avatar ? (
                  <img src={profile.avatar} alt="avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#fff" }}>{user?.name?.charAt(0).toUpperCase()}</span>
                )}
              </div>
              Profile
            </button>
          </div>
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
                  {[["Service", n.service], ["Option", n.option ?? "—"], ["Address", n.address]].map(([label, val]) => (
                    <div key={label} style={{ background: "#fff", borderRadius: 8, padding: "8px 10px" }}>
                      <div style={{ fontSize: 10, color: "#888780", marginBottom: 2 }}>{label}</div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: "#2C2C2A" }}>{val}</div>
                    </div>
                  ))}
                </div>
                <button onClick={() => handleAcceptNotification(n)} style={{ width: "100%", background: "#1D9E75", color: "#fff", border: "none", borderRadius: 8, padding: "10px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
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
            <button key={f} onClick={() => setFilter(f)} style={{ padding: "6px 14px", borderRadius: 999, fontSize: 11, fontWeight: 600, border: "1px solid #E5E7EB", cursor: "pointer", fontFamily: "inherit", background: filter === f ? "#1D9E75" : "#fff", color: filter === f ? "#fff" : "#888780", textTransform: "capitalize" }}>
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
                {[["Service", b.service], ["Option", b.option ?? "—"], ["Address", b.address], ["Time", new Date(b.createdAt).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })]].map(([label, val]) => (
                  <div key={label} style={{ background: "#F9FAFB", borderRadius: 8, padding: "8px 10px" }}>
                    <div style={{ fontSize: 10, color: "#888780", marginBottom: 2 }}>{label}</div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "#2C2C2A" }}>{val}</div>
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                {b.status === "pending" && (
                  <button onClick={() => updateStatus(b._id, "accepted")} style={{ flex: 1, background: "#1D9E75", color: "#fff", border: "none", borderRadius: 8, padding: "10px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Accept</button>
                )}
                {b.status === "accepted" && (
                  <>
                    <button onClick={() => router.push(`/chat/${b._id}`)} style={{ flex: 1, background: "#F0FBF6", color: "#1D9E75", border: "1px solid #1D9E75", borderRadius: 8, padding: "10px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                      💬 Chat
                    </button>
                    <button onClick={() => updateStatus(b._id, "completed")} style={{ flex: 1, background: "#0A2540", color: "#fff", border: "none", borderRadius: 8, padding: "10px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                      ✓ Complete
                    </button>
                  </>
                )}
                {b.status === "completed" && (
                  <div style={{ flex: 1, textAlign: "center", fontSize: 12, color: "#166534", fontWeight: 600, padding: "10px" }}>✓ Completed</div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </main>
  );
}