"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { services } from "../data/services";

const CalendarIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);
const CheckMark = () => (
  <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
    <path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const CheckCircle = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
    <path d="M5 13l4 4L19 7" stroke="#1D9E75" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const CloseIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);
const BellIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
);
const UserIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
  </svg>
);
const ChatIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
  </svg>
);

export default function Home() {
  const router = useRouter();
  const fileInputRef = useRef(null);
  const [activeService, setActiveService] = useState(null);
  const [selectedOption, setSelectedOption] = useState(null);
  const [confirmed, setConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [user, setUser] = useState(null);
  const [confirmedBooking, setConfirmedBooking] = useState(null);
  const [showSidebar, setShowSidebar] = useState(false);
  const [sidebarTab, setSidebarTab] = useState("profile");
  const [bookingHistory, setBookingHistory] = useState([]);
  const [userNotifications, setUserNotifications] = useState([]);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [reviewed, setReviewed] = useState(false);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [showReviewPopup, setShowReviewPopup] = useState(false);
  const [servicemanInfo, setServicemanInfo] = useState(null);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [userAvatar, setUserAvatar] = useState(null);
  const [allMessages, setAllMessages] = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState(null); // null | "paid"

  useEffect(() => {
    fetch("/api/auth/me")
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          setUser(data.user);
          localStorage.setItem("user", JSON.stringify(data.user));
          if (data.user.avatar) setUserAvatar(data.user.avatar);
        }
      });
  }, []);

  // Serviceman accept করেছে কিনা check
  useEffect(() => {
    if (!confirmed || !confirmedBooking) return;
    const interval = setInterval(async () => {
      const res = await fetch("/api/booking");
      const data = await res.json();
      if (data.success) {
        const updated = data.data.find(b =>
          b.userId === confirmedBooking.userId &&
          b.service === confirmedBooking.service &&
          b.createdAt === confirmedBooking.createdAt
        );
        if (updated?.servicemanId) {
          setConfirmedBooking(updated);
          setUserNotifications(prev => [{
            message: "Your booking has been accepted!",
            service: updated.service,
            servicemanId: updated.servicemanId,
            createdAt: new Date().toISOString(),
            read: false,
          }, ...prev]);
          fetch(`/api/serviceman/${updated.servicemanId}`)
            .then(r => r.json())
            .then(d => { if (d.success) setServicemanInfo(d.data); });
          clearInterval(interval);
        }
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [confirmed]);

  // Service complete হয়েছে কিনা check — payment status ও check করে
  useEffect(() => {
    if (!confirmedBooking?.servicemanId) return;
    const interval = setInterval(async () => {
      const res = await fetch("/api/booking");
      const data = await res.json();
      if (data.success) {
        const updated = data.data.find(b =>
          b._id?.toString() === confirmedBooking._id?.toString()
        );
        if (updated?.status === "completed") {
          setIsCompleted(true);
          // payment status check
          if (updated.paymentStatus === "paid") setPaymentStatus("paid");
          // review popup — শুধু payment হওয়ার পরে দেখাবো
          if (updated.paymentStatus === "paid" && !reviewed) setShowReviewPopup(true);
          clearInterval(interval);
        }
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [confirmedBooking?.servicemanId]);

  const fetchBookingHistory = async (userId) => {
    const res = await fetch("/api/booking");
    const data = await res.json();
    if (data.success) setBookingHistory(data.data.filter(b => b.userId === userId));
  };

  const fetchAllMessages = async (userId) => {
    setMessagesLoading(true);
    try {
      const res = await fetch("/api/booking");
      const data = await res.json();
      if (!data.success) return;
      const userBookings = data.data.filter(b => b.userId === userId && b.servicemanId);
      const messageGroups = await Promise.all(
        userBookings.map(async (booking) => {
          const msgRes = await fetch(`/api/chat?bookingId=${booking._id}`);
          const msgData = await msgRes.json();
          let servicemanName = "Serviceman";
          if (booking.servicemanId) {
            try {
              const smRes = await fetch(`/api/serviceman/${booking.servicemanId}`);
              const smData = await smRes.json();
              if (smData.success) servicemanName = smData.data.name;
            } catch {}
          }
          return {
            bookingId: booking._id,
            service: booking.service,
            servicemanName,
            messages: msgData.success ? msgData.data : [],
            lastMessage: msgData.success && msgData.data.length > 0 ? msgData.data[msgData.data.length - 1] : null,
          };
        })
      );
      setAllMessages(messageGroups.filter(g => g.messages.length > 0));
    } catch (err) { console.error(err); }
    finally { setMessagesLoading(false); }
  };

  const handleOpenSidebar = (tab = "profile") => {
    if (!user) { router.push("/login"); return; }
    setSidebarTab(tab);
    fetchBookingHistory(user.id);
    if (tab === "messages") fetchAllMessages(user.id);
    setShowSidebar(true);
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
        const res = await fetch("/api/user/profile", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ avatar: base64 }),
        });
        const data = await res.json();
        if (data.success) setUserAvatar(base64);
        else alert("Failed to upload image");
      } catch { alert("Something went wrong."); }
      finally { setAvatarLoading(false); }
    };
    reader.readAsDataURL(file);
  };

  // Payment handler
const handlePayment = async () => {
    if (!confirmedBooking?._id) return;
    setPaymentLoading(true);
    try {
      const res = await fetch("/api/payment/init", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId: confirmedBooking._id }),
      });
      const data = await res.json();
      
      console.log("Payment response:", data); // 👈 এটা যোগ করুন
      
      if (data.success && data.url) {
        window.location.href = data.url;
      } else {
        alert(data.message || "Failed to initiate payment");
      }
    } catch (err) {
      console.error("Payment error:", err); // 👈 এটাও
      alert("Something went wrong.");
    } finally {
      setPaymentLoading(false);
    }
  };

  const service = activeService ? services[activeService] : null;

  const handleSelectService = (key) => {
    setActiveService(key);
    setSelectedOption(null);
    setConfirmed(false);
  };

  const handleOpenModal = () => {
    const storedUser = JSON.parse(localStorage.getItem("user"));
    if (!storedUser) { router.push("/login"); return; }
    if (!activeService || selectedOption === null) { alert("Please select a service and package"); return; }
    if (!name || !phone || !address) { alert("Please fill all fields"); return; }
    setShowModal(true);
  };

  const handleConfirmBooking = async () => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user) { setShowModal(false); router.push("/login"); return; }
    setLoading(true);
    try {
      const response = await fetch("/api/booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ service: activeService, option: selectedOption, name, phone, address, userId: user.id }),
      });
      const result = await response.json();
      if (result.success) {
        setShowModal(false);
        setConfirmed(true);
        setConfirmedBooking(result.data);
      } else if (result.code === "NOT_LOGGED_IN") {
        setShowModal(false);
        router.push("/login");
      } else {
        alert(result.message || "Failed to book the service.");
      }
    } catch {
      alert("Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReview = async () => {
    if (!rating) { alert("Please select a rating"); return; }
    setReviewLoading(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: confirmedBooking._id,
          servicemanId: confirmedBooking.servicemanId,
          userId: user?.id,
          userName: user?.name,
          rating,
          comment,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setReviewed(true);
        setShowReviewPopup(false);
      } else {
        alert(data.message || "Failed to submit review");
      }
    } catch {
      alert("Something went wrong.");
    } finally {
      setReviewLoading(false);
    }
  };

  const handleReset = () => {
    setActiveService(null);
    setSelectedOption(null);
    setConfirmed(false);
    setConfirmedBooking(null);
    setServicemanInfo(null);
    setName("");
    setPhone("");
    setAddress("");
    setRating(0);
    setComment("");
    setReviewed(false);
    setShowReviewPopup(false);
    setIsCompleted(false);
    setPaymentStatus(null);
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    localStorage.removeItem("user");
    setUser(null);
    setUserAvatar(null);
    setShowSidebar(false);
  };

  const handleCall = (phoneNumber) => {
    window.location.href = `tel:${phoneNumber}`;
  };

  const unreadCount = userNotifications.filter(n => !n.read).length;

  const inputStyle = {
    width: "100%", padding: "10px 12px", marginBottom: 8,
    border: "1px solid #E5E7EB", borderRadius: 10, fontSize: 13,
    fontFamily: "'Sora', sans-serif", color: "#2C2C2A",
    background: "#FAFAFA", outline: "none", boxSizing: "border-box",
  };

  const statusColor = { pending: "#F59E0B", accepted: "#3B82F6", completed: "#22C55E" };
  const formatDate = (date) => new Date(date).toLocaleDateString("en-GB", { day: "2-digit", month: "short" });

  const tabs = [
    { key: "profile", label: "Profile" },
    { key: "history", label: "History" },
    { key: "notifications", label: unreadCount > 0 ? `Notif (${unreadCount})` : "Notif" },
    { key: "messages", label: "Messages" },
  ];

  return (
    <main style={{ fontFamily: "'Sora', sans-serif", background: "#F0F2F5", minHeight: "100vh", paddingBottom: "2rem" }}>

      {/* ── Review Popup ── */}
      {showReviewPopup && !reviewed && (
        <div style={{ position: "fixed", inset: 0, zIndex: 300, background: "rgba(10,37,64,0.65)", display: "flex", alignItems: "center", justifyContent: "center", padding: "1.25rem", backdropFilter: "blur(6px)" }}>
          <div style={{ background: "#fff", borderRadius: 24, width: "100%", maxWidth: 360, padding: "1.75rem", position: "relative", boxShadow: "0 32px 80px rgba(10,37,64,0.4)" }}>
            <button onClick={() => setShowReviewPopup(false)} style={{ position: "absolute", top: 14, right: 14, width: 30, height: 30, borderRadius: "50%", background: "#F0F2F5", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#888780" }}>
              <CloseIcon />
            </button>
            <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
              <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#1D9E75", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
                <svg width="30" height="30" viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 7" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </div>
              <div style={{ fontSize: 18, fontWeight: 700, color: "#2C2C2A", marginBottom: 6 }}>Job Completed!</div>
              <div style={{ fontSize: 13, color: "#888780", lineHeight: 1.6 }}>How was your experience?<br />Your feedback helps others.</div>
            </div>
            <div style={{ display: "flex", justifyContent: "center", gap: 10, marginBottom: 8 }}>
              {[1, 2, 3, 4, 5].map((star) => (
                <div key={star} onClick={() => setRating(star)} style={{ cursor: "pointer", fontSize: 34, transition: "transform 0.15s", transform: star <= rating ? "scale(1.15)" : "scale(1)", filter: star <= rating ? "drop-shadow(0 3px 6px rgba(245,158,11,0.5))" : "grayscale(1) opacity(0.4)" }}>⭐</div>
              ))}
            </div>
            <div style={{ textAlign: "center", fontSize: 12, fontWeight: 600, color: "#1D9E75", marginBottom: "1rem", minHeight: 18 }}>
              {rating > 0 ? ["", "Poor", "Fair", "Good", "Very Good", "Excellent!"][rating] : ""}
            </div>
            <textarea placeholder="Share your experience (optional)" value={comment} onChange={(e) => setComment(e.target.value)} style={{ width: "100%", padding: "10px 12px", border: "1px solid #E5E7EB", borderRadius: 12, fontSize: 13, fontFamily: "'Sora', sans-serif", color: "#2C2C2A", background: "#FAFAFA", outline: "none", boxSizing: "border-box", resize: "none", height: 80, marginBottom: "1.25rem" }} />
            <button onClick={handleSubmitReview} disabled={reviewLoading || rating === 0} style={{ width: "100%", background: rating === 0 ? "#B4B2A9" : "#1D9E75", color: "#fff", border: "none", borderRadius: 14, padding: "14px", fontSize: 14, fontWeight: 700, cursor: rating === 0 ? "not-allowed" : "pointer", fontFamily: "inherit", marginBottom: 10 }}>
              {reviewLoading ? "Submitting..." : "Submit Review"}
            </button>
            <button onClick={() => setShowReviewPopup(false)} style={{ width: "100%", background: "transparent", border: "none", color: "#B4B2A9", fontSize: 12, cursor: "pointer", fontFamily: "inherit", padding: 4 }}>Skip for now</button>
          </div>
        </div>
      )}

      {/* ── Sidebar ── */}
      {showSidebar && (
        <div onClick={() => setShowSidebar(false)} style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(10,37,64,0.5)" }}>
          <div onClick={e => e.stopPropagation()} style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: 300, background: "#fff", display: "flex", flexDirection: "column" }}>
            <div style={{ background: "#0A2540", padding: "1.25rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>My Account</div>
              <button onClick={() => setShowSidebar(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#9AAFC7" }}><CloseIcon /></button>
            </div>
            <div style={{ display: "flex", borderBottom: "1px solid #E5E7EB", overflowX: "auto" }}>
              {tabs.map(t => (
                <button key={t.key} onClick={() => { setSidebarTab(t.key); if (t.key === "messages") fetchAllMessages(user.id); }} style={{ flex: 1, padding: "10px 4px", fontSize: 10, fontWeight: 600, border: "none", cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap", background: sidebarTab === t.key ? "#F0FBF6" : "#fff", color: sidebarTab === t.key ? "#1D9E75" : "#888780", borderBottom: sidebarTab === t.key ? "2px solid #1D9E75" : "2px solid transparent" }}>
                  {t.label}
                </button>
              ))}
            </div>
            <div style={{ flex: 1, overflowY: "auto", padding: "1rem" }}>
              {sidebarTab === "profile" && (
                <div>
                  <div style={{ textAlign: "center", marginBottom: "1.25rem" }}>
                    <div style={{ position: "relative", display: "inline-block" }}>
                      <div style={{ width: 72, height: 72, borderRadius: "50%", overflow: "hidden", border: "3px solid #1D9E75", margin: "0 auto" }}>
                        {userAvatar ? <img src={userAvatar} alt="avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : (
                          <div style={{ width: "100%", height: "100%", background: "#E1F5EE", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <span style={{ fontSize: 26, fontWeight: 700, color: "#1D9E75" }}>{user?.name?.charAt(0).toUpperCase()}</span>
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
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#2C2C2A", marginTop: 10 }}>{user?.name}</div>
                    <div style={{ fontSize: 11, color: "#888780", marginTop: 2 }}>{user?.email}</div>
                  </div>
                  {[["Name", user?.name], ["Email", user?.email], ["Role", user?.role]].map(([label, val]) => (
                    <div key={label} style={{ background: "#F9FAFB", borderRadius: 10, padding: "10px 14px", marginBottom: 8 }}>
                      <div style={{ fontSize: 10, color: "#888780", marginBottom: 2 }}>{label}</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#2C2C2A" }}>{val}</div>
                    </div>
                  ))}
                </div>
              )}
              {sidebarTab === "history" && (
                <div>
                  {bookingHistory.length === 0 ? (
                    <div style={{ textAlign: "center", color: "#888780", fontSize: 13, padding: "2rem 0" }}>No bookings yet</div>
                  ) : (
                    [...bookingHistory].reverse().map((b, i) => (
                      <div key={i} style={{ background: "#F9FAFB", borderRadius: 10, padding: "10px 14px", marginBottom: 8, border: "1px solid #E5E7EB" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: "#2C2C2A" }}>{b.service}</div>
                          <span style={{ fontSize: 10, fontWeight: 600, color: statusColor[b.status] || "#888780", background: "#F0F2F5", borderRadius: 6, padding: "2px 8px" }}>{b.status}</span>
                        </div>
                        <div style={{ fontSize: 11, color: "#888780" }}>{new Date(b.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</div>
                        {/* Payment badge in history */}
                        {b.paymentStatus === "paid" && (
                          <div style={{ fontSize: 10, color: "#16A34A", fontWeight: 600, marginTop: 4 }}>✓ Paid</div>
                        )}
                        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                          {b.servicemanId && (
                            <button onClick={() => { router.push(`/serviceman/${b.servicemanId}`); setShowSidebar(false); }} style={{ flex: 1, fontSize: 11, color: "#1D9E75", background: "#F0FBF6", border: "1px solid #9FE1CB", borderRadius: 7, padding: "6px 8px", cursor: "pointer", fontFamily: "inherit", fontWeight: 600 }}>
                              View Profile
                            </button>
                          )}
                          {b.servicemanId && (
                            <button onClick={() => { router.push(`/chat/${b._id}`); setShowSidebar(false); }} style={{ flex: 1, fontSize: 11, color: "#0A2540", background: "#F0F2F5", border: "1px solid #E5E7EB", borderRadius: 7, padding: "6px 8px", cursor: "pointer", fontFamily: "inherit", fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
                              <ChatIcon /> Chat
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
              {sidebarTab === "notifications" && (
                <div>
                  {userNotifications.length === 0 ? (
                    <div style={{ textAlign: "center", color: "#888780", fontSize: 13, padding: "2rem 0" }}>No notifications yet</div>
                  ) : (
                    userNotifications.map((n, i) => (
                      <div key={i} onClick={() => setUserNotifications(prev => prev.map((item, idx) => idx === i ? { ...item, read: true } : item))} style={{ background: n.read ? "#F9FAFB" : "#F0FBF6", borderRadius: 10, padding: "10px 14px", marginBottom: 8, border: `1px solid ${n.read ? "#E5E7EB" : "#9FE1CB"}`, cursor: "pointer" }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: "#2C2C2A", marginBottom: 4 }}>{n.message}</div>
                        <div style={{ fontSize: 11, color: "#888780", marginBottom: 4 }}>{n.service}</div>
                        {n.servicemanId && (
                          <button onClick={(e) => { e.stopPropagation(); router.push(`/serviceman/${n.servicemanId}`); setShowSidebar(false); }} style={{ fontSize: 11, color: "#1D9E75", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", padding: 0, fontWeight: 600 }}>
                            View Serviceman →
                          </button>
                        )}
                        <div style={{ fontSize: 10, color: "#B4B2A9", marginTop: 4 }}>{new Date(n.createdAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}</div>
                      </div>
                    ))
                  )}
                </div>
              )}
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
                      const isFromServiceman = last?.senderRole === "serviceman";
                      return (
                        <div key={i} onClick={() => { router.push(`/chat/${group.bookingId}`); setShowSidebar(false); }} style={{ background: "#F9FAFB", borderRadius: 12, padding: "12px 14px", marginBottom: 8, border: "1px solid #E5E7EB", cursor: "pointer" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <div style={{ width: 40, height: 40, borderRadius: "50%", background: "#E1F5EE", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                              <span style={{ fontSize: 16, fontWeight: 700, color: "#1D9E75" }}>{group.servicemanName?.charAt(0).toUpperCase()}</span>
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <div style={{ fontSize: 13, fontWeight: 700, color: "#2C2C2A" }}>{group.servicemanName}</div>
                                {last && <div style={{ fontSize: 10, color: "#B4B2A9" }}>{formatDate(last.createdAt)}</div>}
                              </div>
                              <div style={{ fontSize: 11, color: "#1D9E75", marginBottom: 2 }}>{group.service}</div>
                              {last && (
                                <div style={{ fontSize: 12, color: isFromServiceman ? "#2C2C2A" : "#888780", fontWeight: isFromServiceman ? 600 : 400, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                  {isFromServiceman ? "" : "You: "}{last.message}
                                </div>
                              )}
                            </div>
                            {isFromServiceman && <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#1D9E75", flexShrink: 0 }} />}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
            <div style={{ padding: "1rem", borderTop: "1px solid #E5E7EB" }}>
              <button onClick={handleLogout} style={{ width: "100%", background: "#FFF5F5", color: "#DC2626", border: "1px solid #FECACA", borderRadius: 10, padding: "11px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Logout</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Overlay Modal ── */}
      {showModal && (
        <div onClick={() => setShowModal(false)} style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(10,37,64,0.55)", display: "flex", alignItems: "center", justifyContent: "center", padding: "1.25rem" }}>
          <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: 16, width: "100%", maxWidth: 360, padding: "1.5rem", boxShadow: "0 8px 40px rgba(0,0,0,0.18)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#2C2C2A" }}>Confirm Booking</div>
              <button onClick={() => setShowModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#888780", padding: 4 }}><CloseIcon /></button>
            </div>
            <div style={{ background: "#F0FBF6", border: "1px solid #9FE1CB", borderRadius: 10, padding: "10px 14px", marginBottom: "1.25rem" }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: "#0F6E56", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>Order Summary</div>
              {[["Service", `${service.icon} ${service.title}`], ["Package", service?.options[selectedOption]?.name], ["Price", service?.options[selectedOption]?.price]].map(([label, val]) => (
                <div key={label} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "3px 0" }}>
                  <span style={{ color: "#0F6E56" }}>{label}</span>
                  <span style={{ fontWeight: 600, color: "#2C2C2A" }}>{val}</span>
                </div>
              ))}
              <div style={{ borderTop: "1px solid #9FE1CB", marginTop: 8, paddingTop: 8 }}>
                {[["Name", name], ["Phone", phone], ["Address", address]].map(([label, val]) => (
                  <div key={label} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "2px 0" }}>
                    <span style={{ color: "#0F6E56" }}>{label}</span>
                    <span style={{ fontWeight: 600, color: "#2C2C2A", maxWidth: "60%", textAlign: "right", wordBreak: "break-word" }}>{val}</span>
                  </div>
                ))}
              </div>
            </div>
            <button onClick={handleConfirmBooking} disabled={loading} style={{ width: "100%", background: loading ? "#B4B2A9" : "#1D9E75", color: "#fff", border: "none", borderRadius: 12, padding: "13px", fontSize: 14, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", fontFamily: "inherit", marginBottom: 8 }}>
              {loading ? "Booking..." : "Yes, Confirm Booking"}
            </button>
            <button onClick={() => setShowModal(false)} style={{ width: "100%", background: "transparent", border: "1px solid #E5E7EB", borderRadius: 12, padding: "11px", fontSize: 13, color: "#5F5E5A", cursor: "pointer", fontFamily: "inherit" }}>Go back & edit</button>
          </div>
        </div>
      )}

      {/* ── Hero ── */}
      <div style={{ background: "#0A2540", padding: "1.5rem 1.25rem 2rem", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", width: 220, height: 220, background: "#1D9E75", opacity: 0.07, borderRadius: "50%", top: -70, right: -50, pointerEvents: "none" }} />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 40, height: 40, background: "#1D9E75", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <svg viewBox="0 0 24 24" fill="none" width="22" height="22">
                <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M9 22V12h6v10" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 700, color: "#fff", lineHeight: 1 }}>FixNext Sheba</div>
              <div style={{ fontSize: 11, color: "#5DCAA5", marginTop: 2, letterSpacing: "0.04em", textTransform: "uppercase" }}>Home Services</div>
            </div>
          </div>
          {user ? (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <button onClick={() => handleOpenSidebar("notifications")} style={{ position: "relative", background: "transparent", border: "none", cursor: "pointer", color: "#9AAFC7", padding: 4 }}>
                <BellIcon />
                {unreadCount > 0 && <span style={{ position: "absolute", top: 0, right: 0, width: 8, height: 8, background: "#DC2626", borderRadius: "50%" }} />}
              </button>
              <button onClick={() => handleOpenSidebar("profile")} style={{ display: "flex", alignItems: "center", gap: 6, background: "transparent", border: "1px solid #1D9E75", color: "#5DCAA5", borderRadius: 8, padding: "5px 10px", fontSize: 11, cursor: "pointer", fontFamily: "inherit" }}>
                <div style={{ width: 22, height: 22, borderRadius: "50%", overflow: "hidden", background: "#1D9E75", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  {userAvatar ? <img src={userAvatar} alt="avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ fontSize: 10, fontWeight: 700, color: "#fff" }}>{user?.name?.charAt(0).toUpperCase()}</span>}
                </div>
                {user.name}
              </button>
            </div>
          ) : (
            <button onClick={() => router.push("/login")} style={{ background: "#1D9E75", color: "#fff", border: "none", borderRadius: 8, padding: "7px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Login</button>
          )}
        </div>
        <div style={{ fontSize: 20, fontWeight: 700, color: "#fff", marginBottom: 4 }}>Trusted Home Services</div>
        <div style={{ fontSize: 13, color: "#9AAFC7" }}>Professional helpers, right at your door</div>
        <div style={{ display: "flex", gap: 14, marginTop: "1rem" }}>
          {["Verified Pros", "Fixed Prices", "Guaranteed"].map((t) => (
            <div key={t} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "#7BAEC8" }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#1D9E75", flexShrink: 0 }} />{t}
            </div>
          ))}
        </div>
        {user && user.role === "user" && (
          <button onClick={() => router.push("/servicemen")} style={{ marginTop: "1rem", background: "transparent", border: "1px solid #1D9E75", color: "#5DCAA5", borderRadius: 8, padding: "8px 16px", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
            View Our Servicemen →
          </button>
        )}
      </div>

      {/* ── Services Grid ── */}
      <div style={{ padding: "1.25rem" }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: "#888780", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.75rem" }}>Choose a service</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
          {Object.entries(services).map(([key, s]) => (
            <div key={key} onClick={() => handleSelectService(key)} style={{ background: activeService === key ? "#F0FBF6" : "#fff", border: activeService === key ? "1.5px solid #1D9E75" : "1px solid #E5E7EB", borderRadius: 12, padding: "12px 8px", textAlign: "center", cursor: "pointer", WebkitTapHighlightColor: "transparent" }}>
              <div style={{ fontSize: 22, marginBottom: 5, lineHeight: 1 }}>{s.icon}</div>
              <div style={{ fontSize: 11, fontWeight: 600, color: "#2C2C2A", lineHeight: 1.3 }}>{s.title}</div>
              <div style={{ fontSize: 10, color: "#888780", marginTop: 2, lineHeight: 1.3 }}>{s.subtitle}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Detail Panel ── */}
      {service && (
        <div style={{ padding: "0 1.25rem 1.5rem" }}>
          {!confirmed ? (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: "1rem" }}>
                <span style={{ fontSize: 20 }}>{service?.icon}</span>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "#2C2C2A" }}>{service?.title}</div>
                  <div style={{ fontSize: 12, color: "#888780", marginTop: 1 }}>{service?.subtitle}</div>
                </div>
              </div>
              {service?.options?.map((opt, i) => (
                <div key={i} onClick={() => setSelectedOption(i)} style={{ background: selectedOption === i ? "#F0FBF6" : "#fff", border: selectedOption === i ? "1.5px solid #1D9E75" : "1px solid #E5E7EB", borderRadius: 12, padding: "12px 14px", marginBottom: 8, cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", WebkitTapHighlightColor: "transparent" }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#2C2C2A" }}>{opt.name}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: "#1D9E75", whiteSpace: "nowrap" }}>{opt.price}</span>
                    <div style={{ width: 18, height: 18, borderRadius: "50%", background: selectedOption === i ? "#1D9E75" : "transparent", border: selectedOption === i ? "1.5px solid #1D9E75" : "1.5px solid #B4B2A9", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      {selectedOption === i && <CheckMark />}
                    </div>
                  </div>
                </div>
              ))}
              <div style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 12, padding: "14px", marginBottom: "1rem" }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: "#888780", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>Your Details</div>
                <input placeholder="Your Name" value={name} onChange={(e) => setName(e.target.value)} style={inputStyle} />
                <input placeholder="Phone Number" value={phone} onChange={(e) => setPhone(e.target.value)} style={inputStyle} />
                <input placeholder="Address" value={address} onChange={(e) => setAddress(e.target.value)} style={{ ...inputStyle, marginBottom: 0 }} />
              </div>
              <button onClick={handleOpenModal} disabled={selectedOption === null} style={{ width: "100%", background: selectedOption === null ? "#B4B2A9" : "#1D9E75", color: "#fff", border: "none", borderRadius: 12, padding: "14px", fontSize: 15, fontWeight: 700, cursor: selectedOption === null ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 4, fontFamily: "inherit" }}>
                <CalendarIcon />Book Now
              </button>
            </>
          ) : (
            <div style={{ background: "#fff", border: "1px solid #9FE1CB", borderRadius: 14, padding: "1.5rem", textAlign: "center" }}>
              <div style={{ width: 56, height: 56, background: "#E1F5EE", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1rem" }}>
                <CheckCircle />
              </div>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#2C2C2A", marginBottom: 6 }}>Booking Confirmed!</div>
              <div style={{ fontSize: 13, color: "#888780", marginBottom: "1.25rem", lineHeight: 1.5 }}>
                Your service has been booked.<br />A professional will contact you shortly.
              </div>
              <div style={{ background: "#F0FBF6", borderRadius: 10, padding: "10px 14px", marginBottom: "1rem", textAlign: "left" }}>
                {[
                  ["Service", `${service.icon} ${service.title}`],
                  ["Package", service.options[selectedOption]?.name],
                  ["Price", service.options[selectedOption]?.price],
                  ["Name", name],
                  ["Phone", phone],
                  ["Status", "Confirmed ✓"],
                ].map(([label, val]) => (
                  <div key={label} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "3px 0" }}>
                    <span style={{ color: "#888780" }}>{label}</span>
                    <span style={{ fontWeight: 600, color: label === "Status" ? "#1D9E75" : "#2C2C2A" }}>{val}</span>
                  </div>
                ))}
              </div>

              {/* ── Payment Section (service complete হলে দেখাবে) ── */}
              {isCompleted && (
                <div style={{ marginBottom: 12 }}>
                  {paymentStatus === "paid" ? (
                    <div style={{ background: "#DCFCE7", borderRadius: 12, padding: "14px", border: "1px solid #86EFAC", textAlign: "center" }}>
                      <div style={{ fontSize: 20, marginBottom: 4 }}>✅</div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "#166534" }}>Payment Complete!</div>
                      <div style={{ fontSize: 12, color: "#166534", marginTop: 4 }}>Thank you for using FixNext Sheba</div>
                    </div>
                  ) : (
                    <div style={{ background: "#FEF3C7", borderRadius: 12, padding: "14px", border: "1px solid #FDE68A", marginBottom: 8 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#92400E", marginBottom: 4 }}>🎉 Service Completed!</div>
                      <div style={{ fontSize: 12, color: "#92400E", marginBottom: 12 }}>Please complete your payment to finish the booking.</div>
                      <button
                        onClick={handlePayment}
                        disabled={paymentLoading}
                        style={{ width: "100%", background: paymentLoading ? "#B4B2A9" : "#0A2540", color: "#fff", border: "none", borderRadius: 10, padding: "13px", fontSize: 14, fontWeight: 700, cursor: paymentLoading ? "not-allowed" : "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
                      >
                        {paymentLoading ? "Redirecting..." : (
                          <>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round">
                              <rect x="1" y="4" width="22" height="16" rx="2" /><line x1="1" y1="10" x2="23" y2="10" />
                            </svg>
                            Pay Now — {service.options[selectedOption]?.price}
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Serviceman card */}
              {confirmedBooking?.servicemanId && servicemanInfo ? (
                <div style={{ background: "#F0FBF6", borderRadius: 12, border: "1px solid #9FE1CB", padding: "14px", marginBottom: 8, textAlign: "left" }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "#0F6E56", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>Your Serviceman</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                    <div style={{ width: 44, height: 44, borderRadius: "50%", overflow: "hidden", background: "#1D9E75", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      {servicemanInfo.avatar ? <img src={servicemanInfo.avatar} alt="avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ fontSize: 18, fontWeight: 700, color: "#fff" }}>{servicemanInfo.name?.charAt(0).toUpperCase()}</span>}
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "#2C2C2A" }}>{servicemanInfo.name}</div>
                      <div style={{ fontSize: 12, color: "#1D9E75" }}>{servicemanInfo.specialty || "Serviceman"}</div>
                      {servicemanInfo.rating > 0 && <div style={{ fontSize: 11, color: "#888780" }}>⭐ {servicemanInfo.rating.toFixed(1)}</div>}
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {servicemanInfo.phone ? (
                      <button onClick={() => handleCall(servicemanInfo.phone)} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: "#1D9E75", color: "#fff", borderRadius: 10, padding: "11px", fontSize: 13, fontWeight: 700, border: "none", cursor: "pointer", width: "100%", fontFamily: "inherit" }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round">
                          <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.8a19.79 19.79 0 01-3.07-8.68A2 2 0 012 .82h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 8.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" />
                        </svg>
                        Call {servicemanInfo.name}
                      </button>
                    ) : (
                      <div style={{ fontSize: 12, color: "#888780", textAlign: "center", padding: "8px" }}>Phone number not available</div>
                    )}
                    <button onClick={() => router.push(`/chat/${confirmedBooking._id}`)} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: "#0A2540", color: "#fff", borderRadius: 10, padding: "11px", fontSize: 13, fontWeight: 700, border: "none", cursor: "pointer", width: "100%", fontFamily: "inherit" }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round">
                        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                      </svg>
                      Chat with Serviceman
                    </button>
                  </div>
                </div>
              ) : confirmedBooking?.servicemanId ? (
                <div style={{ marginBottom: 8, display: "flex", flexDirection: "column", gap: 8 }}>
                  <button onClick={() => router.push(`/serviceman/${confirmedBooking.servicemanId}`)} style={{ width: "100%", background: "#0A2540", color: "#fff", border: "none", borderRadius: 10, padding: "11px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>View Serviceman Profile →</button>
                  <button onClick={() => router.push(`/chat/${confirmedBooking._id}`)} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: "#F0FBF6", color: "#1D9E75", borderRadius: 10, padding: "11px", fontSize: 13, fontWeight: 700, border: "1px solid #9FE1CB", cursor: "pointer", width: "100%", fontFamily: "inherit" }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1D9E75" strokeWidth="2.5" strokeLinecap="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" /></svg>
                    Chat with Serviceman
                  </button>
                </div>
              ) : (
                <div style={{ marginBottom: 8 }}>
                  <div style={{ fontSize: 12, color: "#888780", textAlign: "center", padding: "8px", background: "#F9FAFB", borderRadius: 8 }}>
                    ⏳ Waiting for serviceman to accept...
                  </div>
                </div>
              )}

              {reviewed && (
                <div style={{ background: "#F0FBF6", borderRadius: 10, padding: "10px 14px", marginBottom: 12, textAlign: "center", border: "1px solid #9FE1CB" }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#1D9E75" }}>✓ Review submitted!</div>
                </div>
              )}

              <button onClick={handleReset} style={{ background: "transparent", border: "1px solid #D3D1C7", borderRadius: 10, padding: "10px 20px", fontSize: 13, color: "#5F5E5A", cursor: "pointer", fontFamily: "inherit" }}>
                ← Book another service
              </button>
            </div>
          )}
        </div>
      )}
    </main>
  );
}