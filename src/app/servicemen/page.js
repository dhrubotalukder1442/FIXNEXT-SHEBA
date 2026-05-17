"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Pusher from "pusher-js";

const StatusBadge = ({ status }) => {
  const map = {
    pending: { bg: "#FEF3C7", color: "#92400E", dot: "#F59E0B" },
    accepted: { bg: "#DBEAFE", color: "#1E40AF", dot: "#3B82F6" },
    completed: { bg: "#DCFCE7", color: "#166534", dot: "#22C55E" },
    rejected: { bg: "#FEE2E2", color: "#991B1B", dot: "#EF4444" },
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
  const pusherRef = useRef(null);

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
  const [allMessages, setAllMessages] = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [txLoading, setTxLoading] = useState(false);

  // ✅ নতুন state
  const [isOnline, setIsOnline] = useState(true);
  const [toastMsg, setToastMsg] = useState(null);
  const [rejectingId, setRejectingId] = useState(null);

  // ✅ Toast notification helper
  const showToast = (msg, type = "success") => {
    setToastMsg({ msg, type });
    setTimeout(() => setToastMsg(null), 3000);
  };

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
      if (fullData.success) {
        setProfile(fullData.data);
        setIsOnline(fullData.data.isOnline !== false); // default true
      }
    }
  };

  const fetchTransactions = async () => {
    setTxLoading(true);
    try {
      const res = await fetch("/api/transactions");
      const data = await res.json();
      if (data.success) setTransactions(data.data);
    } catch (err) { console.error(err); }
    finally { setTxLoading(false); }
  };

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
            service: booking.service,
            status: booking.status,
            messages: msgData.success ? msgData.data : [],
            lastMessage: msgData.success && msgData.data.length > 0 ? msgData.data[msgData.data.length - 1] : null,
          };
        })
      );
      setAllMessages(groups.filter(g => g.messages.length > 0));
    } catch (err) { console.error(err); }
    finally { setMessagesLoading(false); }
  };

  // ✅ Pusher real-time setup
  useEffect(() => {
    if (!user) return;

    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || "ap2",
    });

    const channel = pusher.subscribe(`serviceman-${user.id}`);

    // নতুন booking notification আসলে
    channel.bind("new-booking", (data) => {
      setNotifications(prev => [data, ...prev]);
      showToast(`New booking: ${data.name} — ${data.service}`, "info");
    });

    pusherRef.current = pusher;

    return () => {
      pusher.unsubscribe(`serviceman-${user.id}`);
      pusher.disconnect();
    };
  }, [user]);

  const updateStatus = async (id, status) => {
    try {
      await fetch("/api/booking", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      fetchBookings(user.id);
      showToast(`Booking marked as ${status}`);
    } catch (err) { console.error(err); }
  };

  // ✅ Accept notification
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
        body: JSON.stringify({ id: n.bookingId, status: "accepted", servicemanId: user.id }),
      });
      setNotifications(prev => prev.filter(notif => notif._id !== n._id));
      fetchBookings(user.id);
      showToast("Booking accepted!");
    } catch (err) { console.error(err); }
  };

  // ✅ Reject notification
  const handleRejectNotification = async (n) => {
    setRejectingId(n._id);
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: n._id }),
      });
      setNotifications(prev => prev.filter(notif => notif._id !== n._id));
      showToast("Booking rejected", "error");
    } catch (err) { console.error(err); }
    finally { setRejectingId(null); }
  };

  // ✅ Online/Offline toggle
  const handleToggleOnline = async () => {
    const newStatus = !isOnline;
    setIsOnline(newStatus);
    try {
      await fetch("/api/serviceman/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isOnline: newStatus }),
      });
      showToast(newStatus ? "You are now Online" : "You are now Offline");
    } catch (err) {
      setIsOnline(!newStatus); // revert on error
      console.error(err);
    }
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
        showToast("Profile updated!");
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
        if (data.success) {
          setProfile(prev => ({ ...prev, avatar: base64 }));
          showToast("Avatar updated!");
        } else {
          alert("Failed to upload image");
        }
      } catch { alert("Something went wrong."); }
      finally { setAvatarLoading(false); }
    };
    reader.readAsDataURL(file);
  };

  const openSidebar = (tab = "profile") => {
    fetchProfile();
    setSidebarTab(tab);
    if (tab === "messages" && user) fetchAllMessages(user.id);
    if (tab === "transactions") fetchTransactions();
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
    color: "#2C2C2A", background: "#FAFAFA", outline: "none",
    boxSizing: "border-box", marginBottom: 8,
  };

  const formatDate = (date) => new Date(date).toLocaleDateString("en-GB", { day: "2-digit", month: "short" });

  const tabs = [
    { key: "profile", label: "Profile" },
    { key: "transactions", label: "Payments" },
    { key: "messages", label: "Messages" },
  ];

  return (
    <main style={{ fontFamily: "'Sora', sans-serif", background: "#F0F2F5", minHeight: "100vh", paddingBottom: "2rem" }}>

      {/* ✅ Toast */}
      {toastMsg && (
        <div style={{
          position: "fixed", top: 16, left: "50%", transform: "translateX(-50%)",
          zIndex: 999, background: toastMsg.type === "error" ? "#DC2626" : toastMsg.type === "info" ? "#0A2540" : "#1D9E75",
          color: "#fff", padding: "10px 20px", borderRadius: 10, fontSize: 13,
          fontWeight: 600, boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
          animation: "fadeIn 0.2s ease", whiteSpace: "nowrap",
        }}>
          {toastMsg.msg}
        </div>
      )}

      {/* ── Sidebar ── */}
      {showSidebar && (
        <div onClick={() => setShowSidebar(false)} style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(10,37,64,0.5)" }}>
          <div onClick={e => e.stopPropagation()} style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: 300, background: "#fff", display: "flex", flexDirection: "column", boxShadow: "-4px 0 20px rgba(0,0,0,0.1)" }}>

            <div style={{ background: "#0A2540", padding: "1.25rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>My Account</div>
              <button onClick={() => setShowSidebar(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#9AAFC7" }}><CloseIcon /></button>
            </div>

            <div style={{ display: "flex", borderBottom: "1px solid #E5E7EB" }}>
              {tabs.map(t => (
                <button key={t.key} onClick={() => {
                  setSidebarTab(t.key);
                  if (t.key === "messages" && user) fetchAllMessages(user.id);
                  if (t.key === "transactions") fetchTransactions();
                }} style={{ flex: 1, padding: "10px 4px", fontSize: 11, fontWeight: 600, border: "none", cursor: "pointer", fontFamily: "inherit", background: sidebarTab === t.key ? "#F0FBF6" : "#fff", color: sidebarTab === t.key ? "#1D9E75" : "#888780", borderBottom: sidebarTab === t.key ? "2px solid #1D9E75" : "2px solid transparent" }}>
                  {t.label}
                </button>
              ))}
            </div>

            <div style={{ flex: 1, overflowY: "auto", padding: "1.25rem" }}>

              {/* Profile Tab */}
              {sidebarTab === "profile" && (
                <>
                  <div style={{ textAlign: "center", marginBottom: "1.25rem" }}>
                    <div style={{ position: "relative", display: "inline-block" }}>
                      <div style={{ width: 80, height: 80, borderRadius: "50%", overflow: "hidden", border: "3px solid #1D9E75" }}>
                        {profile?.avatar ? (
                          <img src={profile.avatar} alt="avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        ) : (
                          <div style={{ width: "100%", height: "100%", background: "#E1F5EE", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <span style={{ fontSize: 28, fontWeight: 700, color: "#1D9E75" }}>{user?.name?.charAt(0).toUpperCase()}</span>
                          </div>
                        )}
                      </div>
                      <button onClick={() => fileInputRef.current?.click()} disabled={avatarLoading} style={{ position: "absolute", bottom: 0, right: 0, width: 26, height: 26, borderRadius: "50%", background: "#1D9E75", border: "2px solid #fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        {avatarLoading ? <span style={{ fontSize: 8, color: "#fff" }}>...</span> : (
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round">
                            <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" /><circle cx="12" cy="13" r="4" />
                          </svg>
                        )}
                      </button>
                      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarChange} style={{ display: "none" }} />
                    </div>

                    {/* ✅ Online status indicator */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 10 }}>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: isOnline ? "#22C55E" : "#9CA3AF" }} />
                      <span style={{ fontSize: 12, color: isOnline ? "#166534" : "#888780", fontWeight: 600 }}>
                        {isOnline ? "Online" : "Offline"}
                      </span>
                    </div>

                    <div style={{ fontSize: 15, fontWeight: 700, color: "#2C2C2A", marginTop: 6 }}>{user?.name}</div>
                    <div style={{ fontSize: 12, color: "#1D9E75", marginTop: 2 }}>{profile?.specialty || "Serviceman"}</div>
                    {profile?.rating > 0 && (
                      <div style={{ fontSize: 12, color: "#888780", marginTop: 4 }}>⭐ {profile.rating.toFixed(1)} ({profile.totalReviews} reviews)</div>
                    )}
                  </div>

                  {!editMode ? (
                    <div>
                      {[["Email", user?.email], ["Phone", profile?.phone || "Not set"], ["Specialty", profile?.specialty || "Not set"], ["Bio", profile?.bio || "Not set"]].map(([label, val]) => (
                        <div key={label} style={{ background: "#F9FAFB", borderRadius: 10, padding: "10px 14px", marginBottom: 8, border: "1px solid #E5E7EB" }}>
                          <div style={{ fontSize: 10, color: "#888780", marginBottom: 2 }}>{label}</div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: "#2C2C2A", wordBreak: "break-word" }}>{val}</div>
                        </div>
                      ))}
                      <button onClick={() => { setEditPhone(profile?.phone || ""); setEditSpecialty(profile?.specialty || ""); setEditBio(profile?.bio || ""); setEditMode(true); }} style={{ width: "100%", background: "#0A2540", color: "#fff", border: "none", borderRadius: 10, padding: "11px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", marginTop: 4 }}>
                        Edit Profile
                      </button>
                    </div>
                  ) : (
                    <div>
                      <label style={{ fontSize: 11, color: "#888780", display: "block", marginBottom: 4 }}>Phone</label>
                      <input placeholder="Phone number" value={editPhone} onChange={e => setEditPhone(e.target.value)} style={inputStyle} />
                      <label style={{ fontSize: 11, color: "#888780", display: "block", marginBottom: 4 }}>Specialty</label>
                      <select value={editSpecialty} onChange={e => setEditSpecialty(e.target.value)} style={inputStyle}>
                        <option value="">Select specialty</option>
                        <option value="Electrician">⚡ Electrician</option>
                        <option value="Plumber">🔧 Plumber</option>
                        <option value="Ac">❄️ AC Service</option>
                      </select>
                      <label style={{ fontSize: 11, color: "#888780", display: "block", marginBottom: 4 }}>Bio</label>
                      <textarea placeholder="Tell customers about yourself" value={editBio} onChange={e => setEditBio(e.target.value)} style={{ ...inputStyle, resize: "none", height: 80 }} />
                      <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                        <button onClick={handleSaveProfile} disabled={saveLoading} style={{ flex: 1, background: saveLoading ? "#B4B2A9" : "#1D9E75", color: "#fff", border: "none", borderRadius: 10, padding: "11px", fontSize: 13, fontWeight: 700, cursor: saveLoading ? "not-allowed" : "pointer", fontFamily: "inherit" }}>
                          {saveLoading ? "Saving..." : "Save"}
                        </button>
                        <button onClick={() => setEditMode(false)} style={{ flex: 1, background: "transparent", color: "#888780", border: "1px solid #E5E7EB", borderRadius: 10, padding: "11px", fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>Cancel</button>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Transactions Tab */}
              {sidebarTab === "transactions" && (
                <div>
                  {txLoading ? (
                    <div style={{ textAlign: "center", color: "#888780", fontSize: 13, padding: "2rem 0" }}>Loading...</div>
                  ) : transactions.length === 0 ? (
                    <div style={{ textAlign: "center", color: "#888780", fontSize: 13, padding: "2rem 0" }}>
                      <div style={{ fontSize: 32, marginBottom: 8 }}>💳</div>No transactions yet
                    </div>
                  ) : (
                    <>
                      {/* Summary row */}
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
                        {[
                          { label: "Total Revenue", value: `৳${transactions.filter(t => t.status === "paid").reduce((s, t) => s + (t.amount || 0), 0).toLocaleString()}`, color: "#1D9E75" },
                          { label: "Transactions", value: transactions.length, color: "#0A2540" },
                        ].map(s => (
                          <div key={s.label} style={{ background: "#F9FAFB", borderRadius: 10, padding: "10px 12px", border: "1px solid #E5E7EB", textAlign: "center" }}>
                            <div style={{ fontSize: 16, fontWeight: 700, color: s.color }}>{s.value}</div>
                            <div style={{ fontSize: 10, color: "#888780", marginTop: 2 }}>{s.label}</div>
                          </div>
                        ))}
                      </div>

                      {/* Per-transaction cards with booking info */}
                      {transactions.map((t, i) => {
                        const isPaid = t.status === "paid";
                        const bk = t.booking;
                        return (
                          <div key={i} style={{ background: "#F9FAFB", borderRadius: 12, marginBottom: 10, border: `1px solid ${isPaid ? "#9FE1CB" : "#FDE68A"}`, overflow: "hidden" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "11px 13px 8px" }}>
                              <span style={{ fontSize: 14, fontWeight: 700, color: isPaid ? "#1D9E75" : "#92400E" }}>৳{(t.amount || 0).toLocaleString()}</span>
                              <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 5, background: isPaid ? "#DCFCE7" : "#FEF3C7", color: isPaid ? "#166534" : "#92400E" }}>
                                {isPaid ? "✓ Paid" : t.status}
                              </span>
                            </div>

                            {/* Booking details — customer ও service clearly দেখাও */}
                            {bk && (
                              <div style={{ margin: "0 13px 10px", background: "#fff", borderRadius: 8, padding: "9px 11px", border: "1px solid #E5E7EB" }}>
                                <div style={{ fontSize: 10, color: "#888780", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Booking details</div>
                                {[
                                  ["Service", bk.service],
                                  ["Customer", bk.name],
                                  ["Address", bk.address],
                                ].map(([label, val]) => (
                                  <div key={label} style={{ display: "flex", justifyContent: "space-between", fontSize: 11, padding: "2px 0" }}>
                                    <span style={{ color: "#888780" }}>{label}</span>
                                    <span style={{ fontWeight: 600, color: "#2C2C2A", maxWidth: "60%", textAlign: "right", wordBreak: "break-word" }}>{val || "—"}</span>
                                  </div>
                                ))}
                              </div>
                            )}

                            <div style={{ padding: "0 13px 11px" }}>
                              <div style={{ fontSize: 10, color: "#B4B2A9", fontFamily: "monospace", wordBreak: "break-all", marginBottom: 2 }}>{t.transactionId}</div>
                              <div style={{ fontSize: 10, color: "#B4B2A9" }}>
                                {isPaid && t.paidAt
                                  ? `Paid: ${new Date(t.paidAt).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}`
                                  : t.createdAt
                                  ? `Initiated: ${new Date(t.createdAt).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}`
                                  : "—"}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </>
                  )}
                </div>
              )}

              {/* Messages Tab */}
              {sidebarTab === "messages" && (
                <div>
                  {messagesLoading ? (
                    <div style={{ textAlign: "center", color: "#888780", fontSize: 13, padding: "2rem 0" }}>Loading...</div>
                  ) : allMessages.length === 0 ? (
                    <div style={{ textAlign: "center", color: "#888780", fontSize: 13, padding: "2rem 0" }}>
                      <div style={{ fontSize: 32, marginBottom: 8 }}>💬</div>No messages yet
                    </div>
                  ) : (
                    allMessages.map((group, i) => {
                      const last = group.lastMessage;
                      const isFromCustomer = last?.senderRole === "user";
                      return (
                        <div key={i} onClick={() => { router.push(`/chat/${group.bookingId}`); setShowSidebar(false); }} style={{ background: "#F9FAFB", borderRadius: 12, padding: "12px 14px", marginBottom: 8, border: "1px solid #E5E7EB", cursor: "pointer" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
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
                            {isFromCustomer && <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#1D9E75", flexShrink: 0 }} />}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>

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
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>

            {/* ✅ Online/Offline Toggle */}
            <button
              onClick={handleToggleOnline}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                background: isOnline ? "rgba(34,197,94,0.15)" : "rgba(156,163,175,0.15)",
                border: `1px solid ${isOnline ? "#22C55E" : "#9CA3AF"}`,
                color: isOnline ? "#22C55E" : "#9CA3AF",
                borderRadius: 8, padding: "6px 12px", fontSize: 12,
                cursor: "pointer", fontFamily: "inherit", fontWeight: 600,
              }}
            >
              <div style={{ width: 7, height: 7, borderRadius: "50%", background: isOnline ? "#22C55E" : "#9CA3AF" }} />
              {isOnline ? "Online" : "Offline"}
            </button>

            <button onClick={() => openSidebar("messages")} style={{ display: "flex", alignItems: "center", gap: 6, background: "transparent", border: "1px solid #1D9E75", color: "#5DCAA5", borderRadius: 8, padding: "6px 12px", fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
              </svg>
              Messages
            </button>

            <button onClick={() => openSidebar("profile")} style={{ display: "flex", alignItems: "center", gap: 8, background: "transparent", border: "1px solid #1D9E75", color: "#5DCAA5", borderRadius: 8, padding: "6px 12px", fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
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

        {/* ✅ Offline warning banner */}
        {!isOnline && (
          <div style={{ background: "#FEF3C7", border: "1px solid #FDE68A", borderRadius: 10, padding: "10px 14px", marginBottom: "1rem", display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 16 }}>⚠️</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#92400E" }}>You are currently Offline</div>
              <div style={{ fontSize: 11, color: "#92400E" }}>You won't receive new booking notifications</div>
            </div>
          </div>
        )}

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
                {/* ✅ Accept + Reject buttons */}
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    onClick={() => handleAcceptNotification(n)}
                    style={{ flex: 1, background: "#1D9E75", color: "#fff", border: "none", borderRadius: 8, padding: "10px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}
                  >
                    ✓ Accept
                  </button>
                  <button
                    onClick={() => handleRejectNotification(n)}
                    disabled={rejectingId === n._id}
                    style={{ flex: 1, background: "#FFF5F5", color: "#DC2626", border: "1px solid #FECACA", borderRadius: 8, padding: "10px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}
                  >
                    ✕ Reject
                  </button>
                </div>
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
          ].map(s => (
            <div key={s.label} style={{ background: "#fff", borderRadius: 12, padding: "12px", border: "1px solid #E5E7EB", textAlign: "center" }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 10, color: "#888780", marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* ── Filter ── */}
        <div style={{ display: "flex", gap: 6, marginBottom: "1rem", flexWrap: "wrap" }}>
          {["all", "pending", "accepted", "completed"].map(f => (
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
                  <button onClick={() => updateStatus(b._id, "accepted")} style={{ flex: 1, background: "#1D9E75", color: "#fff", border: "none", borderRadius: 8, padding: "10px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                    ✓ Accept
                  </button>
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