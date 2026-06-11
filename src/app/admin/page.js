"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";

const StatusBadge = ({ status }) => {
  const map = {
    pending: { bg: "rgba(245,158,11,0.15)", color: "#F59E0B" },
    accepted: { bg: "rgba(59,130,246,0.15)", color: "#60A5FA" },
    completed: { bg: "rgba(34,197,94,0.15)", color: "#4ADE80" },
    paid: { bg: "rgba(34,197,94,0.15)", color: "#4ADE80" },
    failed: { bg: "rgba(239,68,68,0.15)", color: "#F87171" },
  };
  const s = map[status] || map.pending;
  return (
    <span style={{ background: s.bg, color: s.color, padding: "3px 10px", borderRadius: 6, fontSize: 10, fontWeight: 600, textTransform: "capitalize", whiteSpace: "nowrap" }}>
      {status}
    </span>
  );
};

const TierBadge = ({ type }) => {
  const map = {
    basic: { bg: "rgba(14,165,233,0.15)", color: "#0EA5E9", label: "Basic" },
    standard: { bg: "rgba(139,92,246,0.15)", color: "#8B5CF6", label: "Standard" },
    premium: { bg: "rgba(245,158,11,0.15)", color: "#F59E0B", label: "Premium" },
  };
  const t = map[type] || map.basic;
  return (
    <span style={{ background: t.bg, color: t.color, padding: "2px 8px", borderRadius: 5, fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>
      {t.label}
    </span>
  );
};

const groupServicesByName = (services) => {
  const grouped = {};
  services.forEach((s) => {
    if (!grouped[s.name]) grouped[s.name] = { name: s.name, items: [] };
    grouped[s.name].items.push(s);
  });
  return Object.values(grouped);
};

export default function AdminPage() {
  const router = useRouter();

  const [dark, setDark] = useState(true);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [spinning, setSpinning] = useState(false);
  const [search, setSearch] = useState("");
  const [adminUser, setAdminUser] = useState(null);

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  const [users, setUsers] = useState([]);
  const [userFilter, setUserFilter] = useState("all");
  const [deleteId, setDeleteId] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userBookings, setUserBookings] = useState([]);
  const [modalTab, setModalTab] = useState("profile");
  const [modalLoading, setModalLoading] = useState(false);

  const [transactions, setTransactions] = useState([]);
  const [txLoading, setTxLoading] = useState(false);
  const [selectedTx, setSelectedTx] = useState(null);
  const [txDetailLoading, setTxDetailLoading] = useState(false);
  const [txBooking, setTxBooking] = useState(null);
  const [txUser, setTxUser] = useState(null);

  const [pendingServicemen, setPendingServicemen] = useState([]);
  const [pendingLoading, setPendingLoading] = useState(false);
  const [verifyAction, setVerifyAction] = useState(null);

  const [supportThreads, setSupportThreads] = useState([]);
  const [supportLoading, setSupportLoading] = useState(false);
  const [selectedThread, setSelectedThread] = useState(null);
  const [threadMessages, setThreadMessages] = useState([]);
  const [threadLoading, setThreadLoading] = useState(false);
  const [adminReply, setAdminReply] = useState("");
  const [replySending, setReplySending] = useState(false);

  const [allServices, setAllServices] = useState([]);
  const [servicesLoading, setServicesLoading] = useState(false);
  const [showServiceForm, setShowServiceForm] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [serviceForm, setServiceForm] = useState({
    name: "",
    subtitle: "",
    image: "",
    nameImage: "",
    options: [{ label: "", price: "", type: "basic" }],
  });
  const [serviceSaving, setServiceSaving] = useState(false);
  const [deleteServiceId, setDeleteServiceId] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const imageInputRef = useRef(null);
  const [nameImagePreview, setNameImagePreview] = useState("");
  const nameImageInputRef = useRef(null);

  const [expandedGroups, setExpandedGroups] = useState({});

  const bg = dark ? "#0D1117" : "#F0F4FF";
  const sidebar = dark ? "#161B22" : "#0A2540";
  const card = dark ? "#1C2333" : "#ffffff";
  const border = dark ? "rgba(255,255,255,0.06)" : "#E2EAF4";
  const text = dark ? "#E6EDF3" : "#1E3A5F";
  const muted = dark ? "#8B949E" : "#7B94B5";
  const accent = "#4F8EF7";
  const SIDEBAR_W = 230;

  const formatTime = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "";
    const now = new Date();
    const diff = now - d;
    if (diff < 60000) return "just now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
  };

  const formatMsgTime = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  };

  const getMsgText = (msg) => {
    return msg.message || msg.text || msg.content || msg.body || msg.msg || msg.messageText || msg.description || "";
  };

  const getMsgTime = (msg) => {
    return msg.createdAt || msg.timestamp || msg.date || msg.sentAt || msg.time || msg.created_at || msg.updatedAt || "";
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const base64 = ev.target.result;
      setImagePreview(base64);
      setServiceForm((p) => ({ ...p, image: base64 }));
    };
    reader.readAsDataURL(file);
  };

  const handleNameImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const base64 = ev.target.result;
      setNameImagePreview(base64);
      setServiceForm((p) => ({ ...p, nameImage: base64 }));
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = `
      * { box-sizing: border-box; }
      @media (max-width: 768px) {
        .admin-sidebar { transform: translateX(-100%); transition: transform 0.3s; }
        .admin-sidebar.open { transform: translateX(0); }
        .admin-main { margin-left: 0 !important; }
        .admin-overlay { display: block !important; }
        .stat-grid-4 { grid-template-columns: repeat(2,1fr) !important; }
        .stat-grid-3 { grid-template-columns: repeat(2,1fr) !important; }
        .chart-grid { grid-template-columns: 1fr !important; }
        .profile-stats { grid-template-columns: repeat(3,1fr) !important; }
        .filter-row { flex-wrap: wrap; }
        .topbar-search { width: 140px !important; }
        .tx-detail-grid { grid-template-columns: 1fr !important; }
        .support-grid { grid-template-columns: 1fr !important; }
        .service-grid { grid-template-columns: 1fr !important; }
      }
      @media (max-width: 480px) {
        .stat-grid-4 { grid-template-columns: 1fr 1fr !important; }
        .stat-grid-3 { grid-template-columns: 1fr 1fr !important; }
        .profile-stats { grid-template-columns: 1fr 1fr !important; }
        .topbar-search { display: none !important; }
      }
      .scrollbar-thin::-webkit-scrollbar { width: 4px; height: 4px; }
      .scrollbar-thin::-webkit-scrollbar-track { background: transparent; }
      .scrollbar-thin::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.12); border-radius: 4px; }
      .admin-sidebar { transition: transform 0.3s; }
      .service-card-item:hover { opacity: 0.9; }
      .tier-box { border-radius: 8px; padding: 10px 12px; border: 1px solid; display: flex; flex-direction: column; gap: 3px; }
      .img-upload-zone { border: 2px dashed; border-radius: 10px; padding: 20px; text-align: center; cursor: pointer; transition: all 0.2s; }
      .img-upload-zone:hover { opacity: 0.8; }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  useEffect(() => {
    fetch("/api/auth/me").then((r) => r.json()).then((data) => {
      if (!data.success) router.push("/login");
      else if (data.user.role !== "admin") router.push("/");
      else { setAdminUser(data.user); localStorage.setItem("user", JSON.stringify(data.user)); }
    });
  }, []);

  const fetchBookings = async () => {
    setLoading(true); setSpinning(true);
    try { const res = await fetch("/api/booking"); const data = await res.json(); if (data.success) setBookings(data.data); }
    catch (err) { console.error(err); }
    finally { setLoading(false); setTimeout(() => setSpinning(false), 500); }
  };

  const fetchUsers = async () => {
    const res = await fetch("/api/users"); const data = await res.json();
    if (data.success) setUsers(data.data);
  };

  const fetchTransactions = async () => {
    setTxLoading(true);
    try { const res = await fetch("/api/transactions"); const data = await res.json(); if (data.success) setTransactions(data.data); }
    catch (err) { console.error(err); }
    finally { setTxLoading(false); }
  };

  const fetchPendingServicemen = async () => {
    setPendingLoading(true);
    try { const res = await fetch("/api/admin/pending-servicemen"); const data = await res.json(); if (data.success) setPendingServicemen(data.data); }
    finally { setPendingLoading(false); }
  };

  const fetchSupportThreads = async () => {
    setSupportLoading(true);
    try { const res = await fetch("/api/support"); const data = await res.json(); if (data.success) setSupportThreads(data.data); }
    finally { setSupportLoading(false); }
  };

  const fetchThreadMessages = async (threadId) => {
    setThreadLoading(true);
    setThreadMessages([]);
    try {
      const res = await fetch(`/api/support?threadId=${threadId}`);
      const data = await res.json();
      if (data.success) {
        const msgs = Array.isArray(data.data) ? data.data : [];
        setThreadMessages(msgs);
      }
    } catch (err) { console.error("fetchThreadMessages error:", err); }
    finally { setThreadLoading(false); }
  };

  const sendAdminReply = async () => {
    if (!adminReply.trim() || !selectedThread || replySending) return;
    setReplySending(true);
    try {
      await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: adminReply.trim(), threadId: selectedThread._id }),
      });
      setAdminReply("");
      fetchThreadMessages(selectedThread._id);
    } finally { setReplySending(false); }
  };

  const fetchAllServices = async () => {
    setServicesLoading(true);
    try { const res = await fetch("/api/admin/specialists"); const data = await res.json(); if (data.success) setAllServices(data.data); }
    finally { setServicesLoading(false); }
  };

  const resetServiceForm = () => {
    setServiceForm({ name: "", subtitle: "", image: "", nameImage: "", options: [{ label: "", price: "", type: "basic" }] });
    setImagePreview("");
    setNameImagePreview("");
    setEditingService(null);
    setShowServiceForm(false);
  };

  const handleSaveService = async () => {
    if (!serviceForm.name.trim()) return alert("Please enter a service name");
    if (!serviceForm.subtitle.trim()) return alert("Please enter a subtitle");
    if (serviceForm.options.some((o) => !o.label || !o.price)) return alert("Please fill in all package options");
    setServiceSaving(true);
    try {
      const method = editingService ? "PATCH" : "POST";
      const body = editingService ? { id: editingService._id, ...serviceForm } : serviceForm;
      const res = await fetch("/api/admin/specialists", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) { resetServiceForm(); fetchAllServices(); }
    } finally { setServiceSaving(false); }
  };

  const handleDeleteService = async () => {
    await fetch("/api/admin/specialists", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: deleteServiceId }) });
    setDeleteServiceId(null); fetchAllServices();
  };

  const updateStatus = async (id, status) => {
    await fetch("/api/booking", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, status }) });
    fetchBookings();
  };

  const handleViewUser = async (u) => {
    setSelectedUser(u); setModalTab("profile"); setModalLoading(true);
    try {
      const res = await fetch("/api/booking"); const data = await res.json();
      if (data.success) { const field = u.role === "serviceman" ? "servicemanId" : "userId"; setUserBookings(data.data.filter((b) => b[field]?.toString() === u._id?.toString())); }
    } catch (err) { console.error(err); }
    finally { setModalLoading(false); }
  };

  const handleViewTransaction = async (tx) => {
    setSelectedTx(tx); setTxDetailLoading(true); setTxBooking(null); setTxUser(null);
    try {
      const bRes = await fetch("/api/booking"); const bData = await bRes.json();
      if (bData.success) {
        const matched = bData.data.find((b) => b._id?.toString() === tx.bookingId?.toString());
        setTxBooking(matched || null);
        if (matched) {
          const uRes = await fetch("/api/users"); const uData = await uRes.json();
          if (uData.success) { const matchedUser = uData.data.find((u) => u._id?.toString() === matched.userId?.toString()); setTxUser(matchedUser || null); }
        }
      }
    } catch (err) { console.error(err); }
    finally { setTxDetailLoading(false); }
  };

  const confirmDelete = async () => { await fetch(`/api/users/${deleteId}`, { method: "DELETE" }); setDeleteId(null); fetchUsers(); };

  const handleVerify = async (servicemanId, action) => {
    await fetch("/api/admin/verify-serviceman", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ servicemanId, action }) });
    setVerifyAction(null); fetchPendingServicemen(); fetchUsers();
  };

  useEffect(() => { fetchBookings(); fetchUsers(); fetchTransactions(); fetchPendingServicemen(); fetchSupportThreads(); fetchAllServices(); }, []);

  const counts = { total: bookings.length, pending: bookings.filter((b) => b.status === "pending").length, accepted: bookings.filter((b) => b.status === "accepted").length, completed: bookings.filter((b) => b.status === "completed").length };
  const userCounts = { total: users.length, users: users.filter((u) => u.role === "user").length, servicemen: users.filter((u) => u.role === "serviceman").length, admins: users.filter((u) => u.role === "admin").length };
  const txPaid = transactions.filter((t) => t.status === "paid").length;
  const txPending = transactions.filter((t) => t.status === "pending").length;
  const totalRevenue = transactions.filter((t) => t.status === "paid").reduce((sum, t) => sum + (t.amount || 0), 0);

  const filteredBookings = (filter === "all" ? bookings : bookings.filter((b) => b.status === filter)).filter((b) => !search || b.name?.toLowerCase().includes(search.toLowerCase()) || b.service?.toLowerCase().includes(search.toLowerCase()));
  const filteredUsers = users.filter((u) => userFilter === "all" || u.role === userFilter).filter((u) => !search || u.name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase()));

  const groupedServices = groupServicesByName(allServices);

  const thStyle = { padding: "12px 16px", fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: muted, fontWeight: 600, borderBottom: `1px solid ${border}`, textAlign: "left", background: dark ? "rgba(255,255,255,0.02)" : "#F8FAFF", whiteSpace: "nowrap" };
  const tdStyle = { padding: "13px 16px", fontSize: 12, color: text, borderBottom: `1px solid ${border}`, verticalAlign: "middle" };

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
    { key: "verify", label: "Verify Servicemen", icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" },
    { key: "transactions", label: "Transactions", icon: "M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" },
    { key: "support", label: "Customer Support", icon: "M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" },
    { key: "services", label: "Services", icon: "M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" },
    { key: "profile", label: "Profile", icon: "M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" },
  ];

  const goTab = (key) => { setActiveTab(key); setSidebarOpen(false); };

  const tierConfig = {
    basic: { bg: "rgba(14,165,233,0.10)", border: "rgba(14,165,233,0.3)", color: "#38BDF8", label: "BASIC" },
    standard: { bg: "rgba(139,92,246,0.10)", border: "rgba(139,92,246,0.3)", color: "#A78BFA", label: "STANDARD" },
    premium: { bg: "rgba(245,158,11,0.10)", border: "rgba(245,158,11,0.3)", color: "#FCD34D", label: "PREMIUM" },
  };

  const ServiceTierBoxes = ({ options }) => {
    const byTier = { basic: [], standard: [], premium: [] };
    options.forEach((o) => { const t = o.type || "basic"; if (byTier[t]) byTier[t].push(o); });
    const hasTiers = Object.values(byTier).some((arr) => arr.length > 0);
    if (!hasTiers) return null;
    return (
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6, marginTop: 10 }}>
        {["basic", "standard", "premium"].map((tier) => {
          const cfg = tierConfig[tier];
          const items = byTier[tier];
          return (
            <div key={tier} className="tier-box" style={{ background: cfg.bg, borderColor: cfg.border }}>
              <div style={{ fontSize: 9, fontWeight: 800, color: cfg.color, letterSpacing: "0.1em", marginBottom: 4 }}>{cfg.label}</div>
              {items.length === 0 ? (
                <div style={{ fontSize: 10, color: muted, fontStyle: "italic" }}>—</div>
              ) : items.map((o, i) => (
                <div key={i} style={{ display: "flex", flexDirection: "column", gap: 1, marginBottom: i < items.length - 1 ? 4 : 0 }}>
                  <div style={{ fontSize: 10, color: text, fontWeight: 600 }}>{o.label}</div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#4ADE80" }}>৳{o.price}</div>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: bg, fontFamily: "'Inter', sans-serif", color: text, transition: "background 0.3s", position: "relative" }}>

      <div className="admin-overlay" onClick={() => setSidebarOpen(false)} style={{ display: "none", position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 49, ...(sidebarOpen ? { display: "block" } : {}) }} />

      {/* SIDEBAR */}
      <div className={`admin-sidebar${sidebarOpen ? " open" : ""}`} style={{ width: SIDEBAR_W, background: sidebar, display: "flex", flexDirection: "column", position: "fixed", top: 0, bottom: 0, left: 0, zIndex: 50, borderRight: "1px solid rgba(255,255,255,0.05)", overflowY: "auto" }}>
        <div style={{ padding: "1.5rem 1.25rem", borderBottom: "1px solid rgba(255,255,255,0.06)", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: "linear-gradient(135deg, #1D9E75, #3B82F6)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 12px rgba(29,158,117,0.4)", flexShrink: 0 }}>
              <svg viewBox="0 0 24 24" fill="none" width="20" height="20"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>FixNext Sheba</div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Admin Panel</div>
            </div>
          </div>
        </div>

        <div style={{ padding: "0.5rem 0.75rem", borderBottom: "1px solid rgba(255,255,255,0.06)", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 10, background: "rgba(255,255,255,0.04)" }}>
            <div style={{ width: 34, height: 34, borderRadius: "50%", background: "linear-gradient(135deg, #1D9E75, #3B82F6)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>{adminUser?.name?.charAt(0).toUpperCase() || "A"}</span>
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{adminUser?.name || "Admin"}</div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)" }}>Super Admin</div>
            </div>
          </div>
        </div>

        <nav style={{ padding: "0.75rem", flex: 1 }}>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", textTransform: "uppercase", letterSpacing: "0.1em", padding: "0 12px", marginBottom: 6 }}>Navigation</div>
          {navItems.map((item) => (
            <button key={item.key} onClick={() => goTab(item.key)} style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 8, border: "none", cursor: "pointer", background: activeTab === item.key ? "linear-gradient(135deg, rgba(79,142,247,0.2), rgba(29,158,117,0.12))" : "transparent", color: activeTab === item.key ? "#fff" : "rgba(255,255,255,0.4)", fontSize: 13, fontWeight: activeTab === item.key ? 600 : 400, marginBottom: 2, fontFamily: "inherit", transition: "all 0.2s", borderLeft: activeTab === item.key ? "2px solid #4F8EF7" : "2px solid transparent", textAlign: "left" }}>
              <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><path d={item.icon} /></svg>
              {item.label}
            </button>
          ))}
        </nav>

        <div style={{ padding: "0.75rem", borderTop: "1px solid rgba(255,255,255,0.06)", flexShrink: 0 }}>
          <button onClick={() => setDark(!dark)} style={{ width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "9px 12px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.08)", cursor: "pointer", background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.6)", fontSize: 12, fontWeight: 500, fontFamily: "inherit", marginBottom: 6 }}>
            {dark ? "☀ Light Mode" : "🌙 Dark Mode"}
          </button>
          <button onClick={async () => { await fetch("/api/auth/logout", { method: "POST" }); localStorage.removeItem("user"); router.push("/login"); }} style={{ width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "9px 12px", borderRadius: 8, border: "none", cursor: "pointer", background: "rgba(239,68,68,0.1)", color: "#F87171", fontSize: 12, fontWeight: 500, fontFamily: "inherit" }}>
            <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
            Logout
          </button>
        </div>
      </div>

      {/* MAIN */}
      <div className="admin-main" style={{ marginLeft: SIDEBAR_W, flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <div style={{ background: dark ? "rgba(22,27,34,0.95)" : "rgba(255,255,255,0.95)", backdropFilter: "blur(10px)", borderBottom: `1px solid ${border}`, padding: "0 1rem", height: 58, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 40, gap: 10 }}>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{ display: "none", background: "none", border: "none", color: text, cursor: "pointer", padding: 4, flexShrink: 0 }} className="hamburger-btn">
            <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" /></svg>
          </button>
          <div style={{ fontSize: 13, color: muted, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            Home <span style={{ margin: "0 4px" }}>›</span>
            <span style={{ color: text, fontWeight: 600 }}>{navItems.find((n) => n.key === activeTab)?.label}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
            <div style={{ position: "relative" }} className="topbar-search">
              <input placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ padding: "7px 14px 7px 34px", borderRadius: 8, border: `1px solid ${border}`, background: dark ? "#0D1117" : "#F5F8FF", color: text, fontSize: 12, outline: "none", width: 200, fontFamily: "inherit" }} />
              <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke={muted} strokeWidth={2} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)" }}><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
            </div>
            <button onClick={() => { fetchBookings(); fetchUsers(); fetchTransactions(); }} style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 8, border: `1px solid ${border}`, background: "transparent", color: accent, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}>
              <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" style={{ transition: "transform 0.5s", transform: spinning ? "rotate(360deg)" : "rotate(0deg)" }}><polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" /></svg>
              Refresh
            </button>
          </div>
        </div>

        <style>{`@media(max-width:768px){.hamburger-btn{display:flex !important;}.admin-sidebar{transform:translateX(-100%)}.admin-sidebar.open{transform:translateX(0)}.admin-main{margin-left:0!important}}`}</style>

        <div style={{ padding: "1.5rem 1rem", flex: 1 }}>

          {/* DASHBOARD */}
          {activeTab === "dashboard" && (
            <>
              <div style={{ marginBottom: "1.5rem" }}>
                <h1 style={{ fontSize: 20, fontWeight: 700, color: text, margin: "0 0 4px" }}>Dashboard Overview</h1>
                <p style={{ fontSize: 12, color: muted, margin: 0 }}>Welcome back, {adminUser?.name}</p>
              </div>
              <div className="stat-grid-4" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: "1.25rem" }}>
                {[{ label: "Total Bookings", value: counts.total, gradient: "linear-gradient(135deg,#1F3A8A,#2563EB)", icon: "📦" }, { label: "Pending", value: counts.pending, gradient: "linear-gradient(135deg,#92400E,#D97706)", icon: "⏳" }, { label: "Accepted", value: counts.accepted, gradient: "linear-gradient(135deg,#1E3A5F,#3B82F6)", icon: "✅" }, { label: "Completed", value: counts.completed, gradient: "linear-gradient(135deg,#065F46,#10B981)", icon: "🎉" }].map((s, i) => (
                  <div key={i} style={{ background: s.gradient, borderRadius: 14, padding: "1rem 1.25rem", position: "relative", overflow: "hidden", boxShadow: "0 4px 20px rgba(0,0,0,0.25)" }}>
                    <div style={{ position: "absolute", right: -10, top: -10, width: 60, height: 60, borderRadius: "50%", background: "rgba(255,255,255,0.07)" }} />
                    <div style={{ fontSize: 18, marginBottom: 6 }}>{s.icon}</div>
                    <div style={{ fontSize: 26, fontWeight: 700, color: "#fff", lineHeight: 1 }}>{s.value}</div>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.65)", marginTop: 5 }}>{s.label}</div>
                  </div>
                ))}
              </div>
              <div className="stat-grid-4" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: "1.25rem" }}>
                {[{ label: "Total Users", value: userCounts.total, gradient: "linear-gradient(135deg,#312E81,#6D28D9)", icon: "👥" }, { label: "Customers", value: userCounts.users, gradient: "linear-gradient(135deg,#1E3A5F,#0EA5E9)", icon: "👤" }, { label: "Servicemen", value: userCounts.servicemen, gradient: "linear-gradient(135deg,#064E3B,#059669)", icon: "🔧" }, { label: "Admins", value: userCounts.admins, gradient: "linear-gradient(135deg,#7C2D12,#EA580C)", icon: "🛡️" }].map((s, i) => (
                  <div key={i} style={{ background: s.gradient, borderRadius: 14, padding: "1rem 1.25rem", position: "relative", overflow: "hidden", boxShadow: "0 4px 20px rgba(0,0,0,0.25)" }}>
                    <div style={{ position: "absolute", right: -10, top: -10, width: 60, height: 60, borderRadius: "50%", background: "rgba(255,255,255,0.07)" }} />
                    <div style={{ fontSize: 18, marginBottom: 6 }}>{s.icon}</div>
                    <div style={{ fontSize: 26, fontWeight: 700, color: "#fff", lineHeight: 1 }}>{s.value}</div>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.65)", marginTop: 5 }}>{s.label}</div>
                  </div>
                ))}
              </div>
              <div style={{ background: card, borderRadius: 14, border: `1px solid ${border}`, marginBottom: "1.5rem", overflow: "hidden", boxShadow: dark ? "0 4px 20px rgba(0,0,0,0.2)" : "0 4px 20px rgba(0,0,0,0.06)" }}>
                <div style={{ padding: "1rem 1.5rem", borderBottom: `1px solid ${border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div><span style={{ fontSize: 14, fontWeight: 700, color: text }}>Transaction Summary</span><span style={{ marginLeft: 10, fontSize: 10, background: "rgba(79,142,247,0.12)", color: accent, padding: "2px 8px", borderRadius: 5, fontWeight: 600 }}>{transactions.length} total</span></div>
                  <button onClick={() => setActiveTab("transactions")} style={{ fontSize: 11, color: accent, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", fontWeight: 600 }}>View all →</button>
                </div>
                <div className="stat-grid-3" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 0, borderBottom: `1px solid ${border}` }}>
                  {[{ label: "Total Revenue", value: `৳${totalRevenue.toLocaleString()}`, color: "#4ADE80", icon: "💰" }, { label: "Paid", value: txPaid, color: "#60A5FA", icon: "✅" }, { label: "Pending", value: txPending, color: "#F59E0B", icon: "⏳" }].map((s, i) => (
                    <div key={i} style={{ padding: "1rem 1.25rem", borderRight: i < 2 ? `1px solid ${border}` : "none" }}>
                      <div style={{ fontSize: 18, marginBottom: 4 }}>{s.icon}</div>
                      <div style={{ fontSize: 20, fontWeight: 700, color: s.color }}>{s.value}</div>
                      <div style={{ fontSize: 11, color: muted, marginTop: 2 }}>{s.label}</div>
                    </div>
                  ))}
                </div>
                {txLoading ? <div style={{ padding: "1.5rem", textAlign: "center", color: muted, fontSize: 13 }}>Loading transactions…</div> : transactions.length === 0 ? <div style={{ padding: "1.5rem", textAlign: "center", color: muted, fontSize: 13 }}>No transactions yet</div> : (
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                      <thead><tr>{["Transaction ID", "Amount", "Status", "Date", ""].map((h) => <th key={h} style={thStyle}>{h}</th>)}</tr></thead>
                      <tbody>
                        {transactions.slice(0, 4).map((t, i) => {
                          const sc = { paid: { bg: "rgba(34,197,94,0.15)", color: "#4ADE80" }, pending: { bg: "rgba(245,158,11,0.15)", color: "#F59E0B" }, failed: { bg: "rgba(239,68,68,0.15)", color: "#F87171" } }[t.status] || { bg: "rgba(255,255,255,0.06)", color: muted };
                          return <tr key={i} onMouseEnter={(e) => (e.currentTarget.style.background = dark ? "rgba(255,255,255,0.02)" : "#F8FAFF")} onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")} style={{ transition: "background 0.15s" }}>
                            <td style={{ ...tdStyle, fontFamily: "monospace", fontSize: 11, color: accent }}>{t.transactionId}</td>
                            <td style={{ ...tdStyle, fontWeight: 700, color: t.status === "paid" ? "#4ADE80" : text }}>৳{(t.amount || 0).toLocaleString()}</td>
                            <td style={tdStyle}><span style={{ background: sc.bg, color: sc.color, padding: "3px 10px", borderRadius: 6, fontSize: 10, fontWeight: 600, textTransform: "capitalize" }}>{t.status}</span></td>
                            <td style={{ ...tdStyle, color: muted, fontSize: 11 }}>{formatDate(t.createdAt)}</td>
                            <td style={tdStyle}><button onClick={() => handleViewTransaction(t)} style={{ fontSize: 11, padding: "4px 12px", background: "rgba(79,142,247,0.1)", color: accent, border: `1px solid rgba(79,142,247,0.2)`, borderRadius: 6, cursor: "pointer", fontFamily: "inherit" }}>Details</button></td>
                          </tr>;
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
              <div className="chart-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: "1.5rem" }}>
                {[{ title: "Booking Overview", subtitle: "Status breakdown", max: Math.max(counts.total, counts.pending, counts.accepted, counts.completed, 1), data: [{ label: "Total", value: counts.total, color: "#4F8EF7" }, { label: "Pending", value: counts.pending, color: "#F59E0B" }, { label: "Accepted", value: counts.accepted, color: "#60A5FA" }, { label: "Completed", value: counts.completed, color: "#4ADE80" }] }, { title: "User Distribution", subtitle: "By role", max: Math.max(userCounts.total, userCounts.users, userCounts.servicemen, userCounts.admins, 1), data: [{ label: "Total", value: userCounts.total, color: "#A78BFA" }, { label: "Customers", value: userCounts.users, color: "#0EA5E9" }, { label: "Servicemen", value: userCounts.servicemen, color: "#4ADE80" }, { label: "Admins", value: userCounts.admins, color: "#FB923C" }] }].map((chart, i) => (
                  <div key={i} style={{ background: card, borderRadius: 14, border: `1px solid ${border}`, padding: "1.25rem", boxShadow: dark ? "0 4px 20px rgba(0,0,0,0.2)" : "0 4px 20px rgba(0,0,0,0.06)" }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: text, marginBottom: 4 }}>{chart.title}</div>
                    <div style={{ fontSize: 11, color: muted, marginBottom: "1.25rem" }}>{chart.subtitle}</div>
                    <BarChart max={chart.max} data={chart.data} />
                  </div>
                ))}
              </div>
              <div style={{ background: card, borderRadius: 14, border: `1px solid ${border}`, overflow: "hidden", boxShadow: dark ? "0 4px 20px rgba(0,0,0,0.2)" : "0 4px 20px rgba(0,0,0,0.06)" }}>
                <div style={{ padding: "1rem 1.5rem", borderBottom: `1px solid ${border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: text }}>Recent Bookings</span>
                  <button onClick={() => setActiveTab("bookings")} style={{ fontSize: 11, color: accent, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", fontWeight: 600 }}>View all →</button>
                </div>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead><tr>{["Customer", "Service", "Status", "Date"].map((h) => <th key={h} style={thStyle}>{h}</th>)}</tr></thead>
                    <tbody>
                      {bookings.slice(0, 5).map((b, i) => (
                        <tr key={i} onMouseEnter={(e) => (e.currentTarget.style.background = dark ? "rgba(255,255,255,0.02)" : "#F8FAFF")} onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")} style={{ transition: "background 0.15s" }}>
                          <td style={{ ...tdStyle, fontWeight: 600 }}><div style={{ display: "flex", alignItems: "center", gap: 8 }}><div style={{ width: 28, height: 28, borderRadius: "50%", background: `hsl(${(b.name?.charCodeAt(0) || 0) * 10},60%,45%)`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><span style={{ fontSize: 11, fontWeight: 700, color: "#fff" }}>{b.name?.charAt(0).toUpperCase()}</span></div>{b.name}</div></td>
                          <td style={tdStyle}>{b.service}</td>
                          <td style={tdStyle}><StatusBadge status={b.status} /></td>
                          <td style={{ ...tdStyle, color: muted, fontSize: 11 }}>{formatDate(b.createdAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* BOOKINGS */}
          {activeTab === "bookings" && (
            <>
              <div style={{ marginBottom: "1.25rem" }}><h1 style={{ fontSize: 20, fontWeight: 700, color: text, margin: "0 0 4px" }}>All Bookings</h1><p style={{ fontSize: 12, color: muted, margin: 0 }}>{counts.total} total bookings</p></div>
              <div className="filter-row" style={{ display: "flex", gap: 6, marginBottom: "1.25rem", flexWrap: "wrap" }}>
                {["all", "pending", "accepted", "completed"].map((f) => (<button key={f} onClick={() => setFilter(f)} style={{ padding: "6px 14px", borderRadius: 8, fontSize: 11, fontWeight: 600, border: `1px solid ${filter === f ? accent : border}`, cursor: "pointer", background: filter === f ? accent : "transparent", color: filter === f ? "#fff" : muted, textTransform: "capitalize", fontFamily: "inherit", transition: "all 0.15s" }}>{f === "all" ? `All (${counts.total})` : `${f} (${counts[f]})`}</button>))}
              </div>
              <div style={{ background: card, borderRadius: 14, border: `1px solid ${border}`, overflow: "hidden", boxShadow: dark ? "0 4px 20px rgba(0,0,0,0.2)" : "0 4px 20px rgba(0,0,0,0.06)" }}>
                <div style={{ padding: "1rem 1.5rem", borderBottom: `1px solid ${border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}><span style={{ fontSize: 14, fontWeight: 700, color: text }}>Booking Records</span><span style={{ fontSize: 11, color: muted }}>{filteredBookings.length} records</span></div>
                {loading ? <div style={{ padding: "3rem", textAlign: "center", color: muted, fontSize: 13 }}>Loading…</div> : (
                  <div style={{ overflowX: "auto" }} className="scrollbar-thin">
                    <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 600 }}>
                      <thead><tr>{["Customer", "Phone", "Service", "Tier", "Address", "Status", "Date"].map((h) => <th key={h} style={thStyle}>{h}</th>)}</tr></thead>
                      <tbody>
                        {filteredBookings.length === 0 ? <tr><td colSpan={7} style={{ padding: "2.5rem", textAlign: "center", color: muted, fontSize: 13 }}>No bookings found</td></tr> : filteredBookings.map((b, i) => {
                          const tierColors = { basic: "#0EA5E9", standard: "#8B5CF6", premium: "#F59E0B" };
                          const tierBgs = { basic: "rgba(14,165,233,0.12)", standard: "rgba(139,92,246,0.12)", premium: "rgba(245,158,11,0.12)" };
                          const tc = tierColors[b.serviceType] || tierColors.basic;
                          const tb = tierBgs[b.serviceType] || tierBgs.basic;
                          return (
                            <tr key={i} onMouseEnter={(e) => (e.currentTarget.style.background = dark ? "rgba(255,255,255,0.02)" : "#F8FAFF")} onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")} style={{ transition: "background 0.15s" }}>
                              <td style={{ ...tdStyle, fontWeight: 600 }}><div style={{ display: "flex", alignItems: "center", gap: 8 }}><div style={{ width: 28, height: 28, borderRadius: "50%", background: `hsl(${(b.name?.charCodeAt(0) || 0) * 10},60%,45%)`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><span style={{ fontSize: 11, fontWeight: 700, color: "#fff" }}>{b.name?.charAt(0).toUpperCase()}</span></div>{b.name}</div></td>
                              <td style={{ ...tdStyle, color: muted, fontFamily: "monospace", fontSize: 11 }}>{b.phone}</td>
                              <td style={tdStyle}>{b.service}</td>
                              <td style={tdStyle}><span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 6, background: tb, color: tc, textTransform: "uppercase" }}>{b.serviceType || "basic"}</span></td>
                              <td style={{ ...tdStyle, color: muted, maxWidth: 130, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={b.address}>{b.address}</td>
                              <td style={tdStyle}><div style={{ display: "flex", flexDirection: "column", gap: 4 }}><StatusBadge status={b.status} /><div style={{ display: "flex", gap: 4 }}>{b.status === "pending" && <button onClick={() => updateStatus(b._id, "accepted")} style={{ fontSize: 10, padding: "2px 8px", background: "rgba(59,130,246,0.12)", color: "#60A5FA", border: "1px solid rgba(59,130,246,0.2)", borderRadius: 5, cursor: "pointer" }}>Accept</button>}{b.status === "accepted" && <button onClick={() => updateStatus(b._id, "completed")} style={{ fontSize: 10, padding: "2px 8px", background: "rgba(34,197,94,0.12)", color: "#4ADE80", border: "1px solid rgba(34,197,94,0.2)", borderRadius: 5, cursor: "pointer" }}>Complete</button>}</div></div></td>
                              <td style={{ ...tdStyle, color: muted, fontSize: 11 }}>{formatDateTime(b.createdAt)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}

          {/* USERS */}
          {activeTab === "users" && (
            <>
              <div style={{ marginBottom: "1.25rem" }}><h1 style={{ fontSize: 20, fontWeight: 700, color: text, margin: "0 0 4px" }}>Users & Servicemen</h1><p style={{ fontSize: 12, color: muted, margin: 0 }}>{userCounts.total} total members</p></div>
              <div className="filter-row" style={{ display: "flex", gap: 6, marginBottom: "1.25rem", flexWrap: "wrap" }}>
                {[{ key: "all", label: `All (${userCounts.total})` }, { key: "user", label: `Customers (${userCounts.users})` }, { key: "serviceman", label: `Servicemen (${userCounts.servicemen})` }, { key: "admin", label: `Admins (${userCounts.admins})` }].map((f) => (<button key={f.key} onClick={() => setUserFilter(f.key)} style={{ padding: "6px 14px", borderRadius: 8, fontSize: 11, fontWeight: 600, border: `1px solid ${userFilter === f.key ? accent : border}`, cursor: "pointer", background: userFilter === f.key ? accent : "transparent", color: userFilter === f.key ? "#fff" : muted, fontFamily: "inherit", transition: "all 0.15s" }}>{f.label}</button>))}
              </div>
              <div style={{ background: card, borderRadius: 14, border: `1px solid ${border}`, overflow: "hidden", boxShadow: dark ? "0 4px 20px rgba(0,0,0,0.2)" : "0 4px 20px rgba(0,0,0,0.06)" }}>
                <div style={{ padding: "1rem 1.5rem", borderBottom: `1px solid ${border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}><span style={{ fontSize: 14, fontWeight: 700, color: text }}>{userFilter === "all" ? "All Members" : userFilter === "user" ? "Customers" : userFilter === "serviceman" ? "Servicemen" : "Admins"}</span><span style={{ fontSize: 11, color: muted }}>{filteredUsers.length} members</span></div>
                <div style={{ overflowX: "auto" }} className="scrollbar-thin">
                  <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 500 }}>
                    <thead><tr>{["User", "Email", "Role", "Joined", "Actions"].map((h) => <th key={h} style={thStyle}>{h}</th>)}</tr></thead>
                    <tbody>
                      {filteredUsers.length === 0 ? <tr><td colSpan={5} style={{ padding: "2.5rem", textAlign: "center", color: muted, fontSize: 13 }}>No users found</td></tr> : filteredUsers.map((u) => {
                        const rc = { user: { c: "#60A5FA", bg: "rgba(96,165,250,0.1)" }, serviceman: { c: "#4ADE80", bg: "rgba(74,222,128,0.1)" }, admin: { c: "#FBBF24", bg: "rgba(251,191,36,0.1)" } }[u.role] || { c: muted, bg: "transparent" };
                        return <tr key={u._id} onMouseEnter={(e) => (e.currentTarget.style.background = dark ? "rgba(255,255,255,0.02)" : "#F8FAFF")} onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")} style={{ transition: "background 0.15s" }}>
                          <td style={tdStyle}><div style={{ display: "flex", alignItems: "center", gap: 10 }}><div style={{ width: 34, height: 34, borderRadius: "50%", background: `hsl(${(u.name?.charCodeAt(0) || 0) * 10},55%,45%)`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><span style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>{u.name?.charAt(0).toUpperCase()}</span></div><span style={{ fontWeight: 600, color: text }}>{u.name}</span></div></td>
                          <td style={{ ...tdStyle, color: muted, fontSize: 11 }}>{u.email}</td>
                          <td style={tdStyle}><span style={{ fontSize: 10, fontWeight: 700, padding: "3px 10px", borderRadius: 6, background: rc.bg, color: rc.c }}>{u.role}</span></td>
                          <td style={{ ...tdStyle, color: muted, fontSize: 11 }}>{formatDate(u.createdAt)}</td>
                          <td style={tdStyle}><div style={{ display: "flex", gap: 6 }}><button onClick={() => handleViewUser(u)} style={{ fontSize: 11, padding: "5px 12px", background: "rgba(79,142,247,0.1)", color: "#4F8EF7", border: "1px solid rgba(79,142,247,0.2)", borderRadius: 6, cursor: "pointer", fontFamily: "inherit" }}>View</button><button onClick={() => setDeleteId(u._id)} style={{ fontSize: 11, padding: "5px 12px", background: "rgba(239,68,68,0.1)", color: "#F87171", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 6, cursor: "pointer", fontFamily: "inherit" }}>Delete</button></div></td>
                        </tr>;
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* TRANSACTIONS */}
          {activeTab === "transactions" && (() => {
            const txStatusMap = { paid: { bg: "rgba(34,197,94,0.15)", color: "#4ADE80" }, pending: { bg: "rgba(245,158,11,0.15)", color: "#F59E0B" }, failed: { bg: "rgba(239,68,68,0.15)", color: "#F87171" } };
            return <>
              <div style={{ marginBottom: "1.25rem" }}><h1 style={{ fontSize: 20, fontWeight: 700, color: text, margin: "0 0 4px" }}>Transactions</h1><p style={{ fontSize: 12, color: muted, margin: 0 }}>{transactions.length} total transactions</p></div>
              <div className="stat-grid-3" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: "1.5rem" }}>
                {[{ label: "Total Revenue", value: `৳${totalRevenue.toLocaleString()}`, gradient: "linear-gradient(135deg,#065F46,#10B981)", icon: "💰" }, { label: "Paid", value: txPaid, gradient: "linear-gradient(135deg,#1E3A5F,#3B82F6)", icon: "✅" }, { label: "Pending", value: txPending, gradient: "linear-gradient(135deg,#92400E,#D97706)", icon: "⏳" }].map((s, i) => (
                  <div key={i} style={{ background: s.gradient, borderRadius: 14, padding: "1rem 1.25rem", position: "relative", overflow: "hidden", boxShadow: "0 4px 20px rgba(0,0,0,0.25)" }}>
                    <div style={{ position: "absolute", right: -10, top: -10, width: 60, height: 60, borderRadius: "50%", background: "rgba(255,255,255,0.07)" }} />
                    <div style={{ fontSize: 18, marginBottom: 6 }}>{s.icon}</div>
                    <div style={{ fontSize: 22, fontWeight: 700, color: "#fff", lineHeight: 1 }}>{s.value}</div>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.65)", marginTop: 5 }}>{s.label}</div>
                  </div>
                ))}
              </div>
              <div style={{ background: card, borderRadius: 14, border: `1px solid ${border}`, overflow: "hidden", boxShadow: dark ? "0 4px 20px rgba(0,0,0,0.2)" : "0 4px 20px rgba(0,0,0,0.06)" }}>
                <div style={{ padding: "1rem 1.5rem", borderBottom: `1px solid ${border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}><span style={{ fontSize: 14, fontWeight: 700, color: text }}>Transaction Records</span><span style={{ fontSize: 11, color: muted }}>{transactions.length} records</span></div>
                {txLoading ? <div style={{ padding: "3rem", textAlign: "center", color: muted, fontSize: 13 }}>Loading…</div> : (
                  <div style={{ overflowX: "auto" }} className="scrollbar-thin">
                    <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 520 }}>
                      <thead><tr>{["Transaction ID", "Booking ID", "Amount", "Status", "Date", ""].map((h) => <th key={h} style={thStyle}>{h}</th>)}</tr></thead>
                      <tbody>
                        {transactions.length === 0 ? <tr><td colSpan={6} style={{ padding: "2.5rem", textAlign: "center", color: muted, fontSize: 13 }}>No transactions found</td></tr> : transactions.map((t, i) => {
                          const sc = txStatusMap[t.status] || { bg: "rgba(255,255,255,0.06)", color: muted };
                          return <tr key={i} onMouseEnter={(e) => (e.currentTarget.style.background = dark ? "rgba(255,255,255,0.02)" : "#F8FAFF")} onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")} style={{ transition: "background 0.15s" }}>
                            <td style={{ ...tdStyle, fontFamily: "monospace", fontSize: 11, color: accent }}>{t.transactionId}</td>
                            <td style={{ ...tdStyle, fontFamily: "monospace", fontSize: 11, color: muted }}>{t.bookingId}</td>
                            <td style={{ ...tdStyle, fontWeight: 700, color: t.status === "paid" ? "#4ADE80" : text }}>৳{(t.amount || 0).toLocaleString()}</td>
                            <td style={tdStyle}><span style={{ background: sc.bg, color: sc.color, padding: "3px 10px", borderRadius: 6, fontSize: 10, fontWeight: 600, textTransform: "capitalize" }}>{t.status}</span></td>
                            <td style={{ ...tdStyle, color: muted, fontSize: 11 }}>{formatDateTime(t.createdAt)}</td>
                            <td style={tdStyle}><button onClick={() => handleViewTransaction(t)} style={{ fontSize: 11, padding: "5px 12px", background: "rgba(79,142,247,0.1)", color: accent, border: `1px solid rgba(79,142,247,0.2)`, borderRadius: 6, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}>View Details</button></td>
                          </tr>;
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>;
          })()}

          {/* VERIFY */}
          {activeTab === "verify" && (
            <>
              <div style={{ marginBottom: "1.25rem" }}><h1 style={{ fontSize: 20, fontWeight: 700, color: text, margin: "0 0 4px" }}>Verify Servicemen</h1><p style={{ fontSize: 12, color: muted, margin: 0 }}>{pendingServicemen.length} waiting for approval</p></div>
              <div style={{ background: "linear-gradient(135deg,#92400E,#D97706)", borderRadius: 14, padding: "1rem 1.25rem", marginBottom: "1.5rem", display: "flex", alignItems: "center", justifyContent: "space-between", boxShadow: "0 4px 20px rgba(0,0,0,0.25)" }}>
                <div><div style={{ fontSize: 28, fontWeight: 700, color: "#fff" }}>{pendingServicemen.length}</div><div style={{ fontSize: 12, color: "rgba(255,255,255,0.65)", marginTop: 4 }}>Pending Verification</div></div>
                <div style={{ fontSize: 36 }}>⏳</div>
              </div>
              <div style={{ background: card, borderRadius: 14, border: `1px solid ${border}`, overflow: "hidden", boxShadow: dark ? "0 4px 20px rgba(0,0,0,0.2)" : "0 4px 20px rgba(0,0,0,0.06)" }}>
                <div style={{ padding: "1rem 1.5rem", borderBottom: `1px solid ${border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}><span style={{ fontSize: 14, fontWeight: 700, color: text }}>Pending Servicemen</span><button onClick={fetchPendingServicemen} style={{ fontSize: 11, color: accent, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", fontWeight: 600 }}>Refresh ↺</button></div>
                {pendingLoading ? <div style={{ padding: "3rem", textAlign: "center", color: muted, fontSize: 13 }}>Loading…</div> : pendingServicemen.length === 0 ? (
                  <div style={{ padding: "3rem", textAlign: "center" }}><div style={{ fontSize: 32, marginBottom: 12 }}>✅</div><div style={{ fontSize: 14, fontWeight: 700, color: text, marginBottom: 6 }}>All clear!</div><div style={{ fontSize: 12, color: muted }}>No pending servicemen.</div></div>
                ) : (
                  <div style={{ overflowX: "auto" }} className="scrollbar-thin">
                    <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 520 }}>
                      <thead><tr>{["Serviceman", "Email", "Phone", "Specialty", "Joined", "Actions"].map((h) => <th key={h} style={thStyle}>{h}</th>)}</tr></thead>
                      <tbody>
                        {pendingServicemen.map((u) => (
                          <tr key={u._id} onMouseEnter={(e) => (e.currentTarget.style.background = dark ? "rgba(255,255,255,0.02)" : "#F8FAFF")} onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")} style={{ transition: "background 0.15s" }}>
                            <td style={tdStyle}><div style={{ display: "flex", alignItems: "center", gap: 10 }}><div style={{ width: 34, height: 34, borderRadius: "50%", background: `hsl(${(u.name?.charCodeAt(0) || 0) * 10},55%,45%)`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><span style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>{u.name?.charAt(0).toUpperCase()}</span></div><span style={{ fontWeight: 600, color: text }}>{u.name}</span></div></td>
                            <td style={{ ...tdStyle, color: muted, fontSize: 11 }}>{u.email}</td>
                            <td style={{ ...tdStyle, color: muted, fontSize: 11 }}>{u.phone || "—"}</td>
                            <td style={{ ...tdStyle, color: muted, fontSize: 11 }}>{u.specialty || "—"}</td>
                            <td style={{ ...tdStyle, color: muted, fontSize: 11 }}>{formatDate(u.createdAt)}</td>
                            <td style={tdStyle}><div style={{ display: "flex", gap: 6 }}><button onClick={() => setVerifyAction({ user: u, action: "approved" })} style={{ fontSize: 11, padding: "5px 12px", background: "rgba(34,197,94,0.12)", color: "#4ADE80", border: "1px solid rgba(34,197,94,0.2)", borderRadius: 6, cursor: "pointer", fontFamily: "inherit", fontWeight: 600 }}>✓ Approve</button><button onClick={() => setVerifyAction({ user: u, action: "rejected" })} style={{ fontSize: 11, padding: "5px 12px", background: "rgba(239,68,68,0.1)", color: "#F87171", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 6, cursor: "pointer", fontFamily: "inherit", fontWeight: 600 }}>✕ Reject</button></div></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}

          {/* SUPPORT */}
          {activeTab === "support" && (
            <>
              <div style={{ marginBottom: "1.25rem" }}>
                <h1 style={{ fontSize: 20, fontWeight: 700, color: text, margin: "0 0 4px" }}>Customer Support</h1>
                <p style={{ fontSize: 12, color: muted, margin: 0 }}>
                  {supportThreads.length} active conversations
                  <button onClick={fetchSupportThreads} style={{ marginLeft: 8, fontSize: 11, color: accent, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}>↺ Refresh</button>
                </p>
              </div>
              <div className="support-grid" style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: 16, minHeight: 500 }}>
                <div style={{ background: card, borderRadius: 14, border: `1px solid ${border}`, overflow: "hidden", display: "flex", flexDirection: "column" }}>
                  <div style={{ padding: "12px 16px", borderBottom: `1px solid ${border}`, fontSize: 13, fontWeight: 700, color: text }}>Conversations</div>
                  <div style={{ flex: 1, overflowY: "auto" }}>
                    {supportLoading ? <div style={{ padding: "2rem", textAlign: "center", color: muted, fontSize: 13 }}>Loading…</div> : supportThreads.length === 0 ? (
                      <div style={{ padding: "2rem", textAlign: "center", color: muted, fontSize: 13 }}><div style={{ fontSize: 28, marginBottom: 8 }}>💬</div>No messages yet</div>
                    ) : supportThreads.map((thread, i) => {
                      const isSelected = selectedThread?._id === thread._id;
                      const hasUnread = thread.unread > 0;
                      return (
                        <div key={i} onClick={() => { setSelectedThread(thread); fetchThreadMessages(thread._id); }}
                          style={{ padding: "12px 16px", borderBottom: `1px solid ${border}`, cursor: "pointer", background: isSelected ? (dark ? "rgba(79,142,247,0.10)" : "#EFF6FF") : hasUnread ? (dark ? "rgba(79,142,247,0.04)" : "#F8FBFF") : "transparent", borderLeft: hasUnread ? `3px solid ${accent}` : "3px solid transparent", transition: "background 0.15s" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <div style={{ position: "relative", flexShrink: 0 }}>
                              <div style={{ width: 36, height: 36, borderRadius: "50%", background: `hsl(${(thread.senderName?.charCodeAt(0) || 0) * 10},55%,45%)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <span style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>{thread.senderName?.charAt(0).toUpperCase() || "?"}</span>
                              </div>
                              {hasUnread && <div style={{ position: "absolute", bottom: 0, right: 0, width: 10, height: 10, borderRadius: "50%", background: "#22C55E", border: `2px solid ${dark ? "#161B22" : "#ffffff"}` }} />}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 2 }}>
                                <span style={{ fontSize: 12, fontWeight: hasUnread ? 700 : 600, color: text }}>{thread.senderName || "User"}</span>
                                <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                                  <span style={{ fontSize: 10, color: muted, whiteSpace: "nowrap" }}>{formatTime(thread.lastMessageAt || thread.updatedAt || thread.createdAt)}</span>
                                  {hasUnread && <span style={{ fontSize: 10, background: accent, color: "#fff", padding: "1px 6px", borderRadius: 10, fontWeight: 700, minWidth: 18, textAlign: "center" }}>{thread.unread}</span>}
                                </div>
                              </div>
                              <div style={{ fontSize: 11, color: muted, fontWeight: hasUnread ? 500 : 400, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{thread.lastMessage || "No messages yet"}</div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div style={{ background: card, borderRadius: 14, border: `1px solid ${border}`, display: "flex", flexDirection: "column", overflow: "hidden" }}>
                  {!selectedThread ? (
                    <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", color: muted, fontSize: 13, gap: 8 }}>
                      <div style={{ fontSize: 32 }}>💬</div>
                      <div>Select a conversation to view messages</div>
                    </div>
                  ) : (
                    <>
                      <div style={{ padding: "12px 16px", borderBottom: `1px solid ${border}`, display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ width: 32, height: 32, borderRadius: "50%", background: `hsl(${(selectedThread.senderName?.charCodeAt(0) || 0) * 10},55%,45%)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <span style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>{selectedThread.senderName?.charAt(0).toUpperCase()}</span>
                        </div>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: text }}>{selectedThread.senderName}</div>
                          <div style={{ fontSize: 10, color: muted }}>{threadMessages.length} message{threadMessages.length !== 1 ? "s" : ""}</div>
                        </div>
                      </div>
                      <div style={{ flex: 1, overflowY: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 10, minHeight: 300 }} className="scrollbar-thin">
                        {threadLoading ? (
                          <div style={{ textAlign: "center", color: muted, fontSize: 13, marginTop: "2rem" }}>Loading messages…</div>
                        ) : threadMessages.length === 0 ? (
                          <div style={{ textAlign: "center", color: muted, fontSize: 13, marginTop: "2rem" }}>No messages in this thread yet</div>
                        ) : threadMessages.map((msg, i) => {
                          const isAdmin = msg.senderRole === "admin";
                          const timeStr = formatMsgTime(getMsgTime(msg));
                          const msgText = getMsgText(msg);
                          return (
                            <div key={i} style={{ display: "flex", justifyContent: isAdmin ? "flex-end" : "flex-start" }}>
                              <div style={{ maxWidth: "70%", padding: "10px 14px", borderRadius: isAdmin ? "14px 4px 14px 14px" : "4px 14px 14px 14px", background: isAdmin ? accent : dark ? "rgba(255,255,255,0.06)" : "#F3F4F6", color: isAdmin ? "#fff" : text, fontSize: 13, lineHeight: 1.5 }}>
                                {!isAdmin && <div style={{ fontSize: 10, fontWeight: 700, color: muted, marginBottom: 3 }}>{msg.senderName || selectedThread.senderName}</div>}
                                <div>{msgText || <span style={{ opacity: 0.4, fontStyle: "italic" }}>empty message</span>}</div>
                                {timeStr && <div style={{ fontSize: 10, opacity: 0.55, marginTop: 5, textAlign: "right" }}>{timeStr}</div>}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      <div style={{ padding: "12px 16px", borderTop: `1px solid ${border}`, display: "flex", gap: 8 }}>
                        <input value={adminReply} onChange={(e) => setAdminReply(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendAdminReply(); } }} placeholder="Type a reply…" style={{ flex: 1, padding: "9px 14px", borderRadius: 8, border: `1px solid ${border}`, background: dark ? "#0D1117" : "#F9FAFB", color: text, fontSize: 13, outline: "none", fontFamily: "inherit" }} />
                        <button onClick={sendAdminReply} disabled={!adminReply.trim() || replySending} style={{ padding: "9px 18px", borderRadius: 8, background: adminReply.trim() ? accent : dark ? "rgba(255,255,255,0.06)" : "#E5E7EB", color: adminReply.trim() ? "#fff" : muted, border: "none", cursor: adminReply.trim() ? "pointer" : "not-allowed", fontSize: 12, fontWeight: 700, fontFamily: "inherit", whiteSpace: "nowrap" }}>
                          {replySending ? "…" : "Send"}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </>
          )}

          {/* SERVICES */}
          {activeTab === "services" && (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
                <div>
                  <h1 style={{ fontSize: 20, fontWeight: 700, color: text, margin: "0 0 4px" }}>Service Management</h1>
                  <p style={{ fontSize: 12, color: muted, margin: 0 }}>
                    {groupedServices.length} service{groupedServices.length !== 1 ? "s" : ""} · {allServices.length} sub-entries
                  </p>
                </div>
                <button
                  onClick={() => { resetServiceForm(); setShowServiceForm(true); }}
                  style={{ padding: "9px 18px", background: "#1D9E75", color: "#fff", border: "none", borderRadius: 10, cursor: "pointer", fontSize: 13, fontWeight: 700, fontFamily: "inherit", display: "flex", alignItems: "center", gap: 6 }}
                >
                  <span style={{ fontSize: 16, lineHeight: 1 }}>+</span> Add Service
                </button>
              </div>

              {/* SERVICE FORM */}
              {showServiceForm && (
                <div style={{ background: card, borderRadius: 14, border: `2px solid ${accent}`, padding: "1.5rem", marginBottom: "1.5rem", boxShadow: "0 4px 24px rgba(79,142,247,0.12)" }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: text, marginBottom: "1.25rem" }}>
                    {editingService ? "✏️ Edit Service Entry" : "➕ New Service Entry"}
                  </div>

                  {/* Row 1: name + subtitle */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                    <div>
                      <div style={{ fontSize: 11, color: muted, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>Service Name</div>
                      <input
                        value={serviceForm.name}
                        onChange={(e) => setServiceForm((p) => ({ ...p, name: e.target.value }))}
                        placeholder="e.g. Plumbing"
                        style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: `1px solid ${border}`, background: dark ? "#0D1117" : "#F9FAFB", color: text, fontSize: 13, outline: "none", fontFamily: "inherit" }}
                      />
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: muted, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>Subtitle</div>
                      <input
                        value={serviceForm.subtitle}
                        onChange={(e) => setServiceForm((p) => ({ ...p, subtitle: e.target.value }))}
                        placeholder="e.g. Leak fix & pipe work"
                        style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: `1px solid ${border}`, background: dark ? "#0D1117" : "#F9FAFB", color: text, fontSize: 13, outline: "none", fontFamily: "inherit" }}
                      />
                    </div>
                  </div>

                  {/* Service Name (Group) Image */}
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 11, color: muted, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>
                      Service Name Image <span style={{ fontSize: 10, color: accent, fontWeight: 500, textTransform: "none", letterSpacing: 0 }}>(group cover — service নামের পাশে দেখাবে)</span>
                    </div>
                    <input ref={nameImageInputRef} type="file" accept="image/*" onChange={handleNameImageUpload} style={{ display: "none" }} />
                    {nameImagePreview || serviceForm.nameImage ? (
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <img
                          src={nameImagePreview || serviceForm.nameImage}
                          alt="name preview"
                          style={{ width: 72, height: 72, objectFit: "cover", borderRadius: 10, border: `1px solid ${border}` }}
                        />
                        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                          <button
                            onClick={() => nameImageInputRef.current?.click()}
                            style={{ padding: "6px 14px", borderRadius: 8, border: `1px solid ${border}`, background: "transparent", color: accent, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}
                          >
                            Change Image
                          </button>
                          <button
                            onClick={() => { setNameImagePreview(""); setServiceForm((p) => ({ ...p, nameImage: "" })); }}
                            style={{ padding: "6px 14px", borderRadius: 8, border: "1px solid rgba(239,68,68,0.3)", background: "transparent", color: "#F87171", fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div
                        className="img-upload-zone"
                        onClick={() => nameImageInputRef.current?.click()}
                        style={{ borderColor: border, background: dark ? "rgba(255,255,255,0.02)" : "#F9FAFB", color: muted }}
                      >
                        <div style={{ fontSize: 28, marginBottom: 6 }}>🖼️</div>
                        <div style={{ fontSize: 12, fontWeight: 600 }}>Click to upload service name cover image</div>
                        <div style={{ fontSize: 11, marginTop: 3 }}>Group header-এ দেখাবে</div>
                      </div>
                    )}
                  </div>

                  {/* Subtitle Image upload */}
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 11, color: muted, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>
                      Subtitle Image <span style={{ fontSize: 10, color: muted, fontWeight: 500, textTransform: "none", letterSpacing: 0 }}>(এই subtitle-এর জন্য)</span>
                    </div>
                    <input ref={imageInputRef} type="file" accept="image/*" onChange={handleImageUpload} style={{ display: "none" }} />
                    {imagePreview || serviceForm.image ? (
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <img
                          src={imagePreview || serviceForm.image}
                          alt="preview"
                          style={{ width: 72, height: 72, objectFit: "cover", borderRadius: 10, border: `1px solid ${border}` }}
                        />
                        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                          <button
                            onClick={() => imageInputRef.current?.click()}
                            style={{ padding: "6px 14px", borderRadius: 8, border: `1px solid ${border}`, background: "transparent", color: accent, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}
                          >
                            Change Image
                          </button>
                          <button
                            onClick={() => { setImagePreview(""); setServiceForm((p) => ({ ...p, image: "" })); }}
                            style={{ padding: "6px 14px", borderRadius: 8, border: "1px solid rgba(239,68,68,0.3)", background: "transparent", color: "#F87171", fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div
                        className="img-upload-zone"
                        onClick={() => imageInputRef.current?.click()}
                        style={{ borderColor: border, background: dark ? "rgba(255,255,255,0.02)" : "#F9FAFB", color: muted }}
                      >
                        <div style={{ fontSize: 28, marginBottom: 6 }}>📷</div>
                        <div style={{ fontSize: 12, fontWeight: 600 }}>Click to upload subtitle image</div>
                        <div style={{ fontSize: 11, marginTop: 3 }}>PNG, JPG, WebP supported</div>
                      </div>
                    )}
                  </div>

                  {/* Packages */}
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 11, color: muted, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>Packages</div>
                    <div style={{ display: "flex", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
                      {["basic", "standard", "premium"].map((tier) => {
                        const cfg = tierConfig[tier];
                        return (
                          <div key={tier} style={{ display: "flex", alignItems: "center", gap: 5, padding: "3px 10px", borderRadius: 6, background: cfg.bg, border: `1px solid ${cfg.border}` }}>
                            <div style={{ width: 8, height: 8, borderRadius: "50%", background: cfg.color }} />
                            <span style={{ fontSize: 10, fontWeight: 700, color: cfg.color, textTransform: "uppercase" }}>{tier}</span>
                          </div>
                        );
                      })}
                    </div>
                    {serviceForm.options.map((opt, i) => (
                      <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8, flexWrap: "wrap", alignItems: "center" }}>
                        <input
                          placeholder="Package name (e.g. Basic Fix)"
                          value={opt.label}
                          onChange={(e) => { const opts = [...serviceForm.options]; opts[i] = { ...opts[i], label: e.target.value }; setServiceForm((p) => ({ ...p, options: opts })); }}
                          style={{ flex: 2, minWidth: 120, padding: "8px 12px", borderRadius: 8, border: `1px solid ${border}`, background: dark ? "#0D1117" : "#F9FAFB", color: text, fontSize: 13, outline: "none", fontFamily: "inherit" }}
                        />
                        <input
                          placeholder="Price"
                          type="number"
                          value={opt.price}
                          onChange={(e) => { const opts = [...serviceForm.options]; opts[i] = { ...opts[i], price: e.target.value }; setServiceForm((p) => ({ ...p, options: opts })); }}
                          style={{ flex: 1, minWidth: 80, padding: "8px 12px", borderRadius: 8, border: `1px solid ${border}`, background: dark ? "#0D1117" : "#F9FAFB", color: text, fontSize: 13, outline: "none", fontFamily: "inherit" }}
                        />
                        <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                          {["basic", "standard", "premium"].map((tier) => {
                            const cfg = tierConfig[tier];
                            const isActive = (opt.type || "basic") === tier;
                            return (
                              <button
                                key={tier}
                                onClick={() => { const opts = [...serviceForm.options]; opts[i] = { ...opts[i], type: tier }; setServiceForm((p) => ({ ...p, options: opts })); }}
                                style={{ padding: "5px 10px", borderRadius: 6, border: `1px solid ${isActive ? cfg.border : border}`, background: isActive ? cfg.bg : "transparent", color: isActive ? cfg.color : muted, fontSize: 10, fontWeight: 700, textTransform: "uppercase", cursor: "pointer", fontFamily: "inherit", letterSpacing: "0.04em", transition: "all 0.15s" }}
                              >
                                {tier}
                              </button>
                            );
                          })}
                        </div>
                        {serviceForm.options.length > 1 && (
                          <button
                            onClick={() => setServiceForm((p) => ({ ...p, options: p.options.filter((_, idx) => idx !== i) }))}
                            style={{ padding: "8px 10px", background: "rgba(239,68,68,0.1)", color: "#F87171", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 8, cursor: "pointer", fontFamily: "inherit", flexShrink: 0 }}
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      onClick={() => setServiceForm((p) => ({ ...p, options: [...p.options, { label: "", price: "", type: "basic" }] }))}
                      style={{ fontSize: 12, color: accent, background: "none", border: `1px dashed ${border}`, borderRadius: 8, padding: "7px 14px", cursor: "pointer", fontFamily: "inherit", width: "100%", marginTop: 4 }}
                    >
                      + Add package option
                    </button>
                  </div>

                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      onClick={handleSaveService}
                      disabled={serviceSaving}
                      style={{ padding: "10px 24px", background: "#1D9E75", color: "#fff", border: "none", borderRadius: 10, cursor: "pointer", fontSize: 13, fontWeight: 700, fontFamily: "inherit" }}
                    >
                      {serviceSaving ? "Saving…" : editingService ? "Update" : "Create"}
                    </button>
                    <button
                      onClick={resetServiceForm}
                      style={{ padding: "10px 20px", background: "transparent", color: muted, border: `1px solid ${border}`, borderRadius: 10, cursor: "pointer", fontSize: 13, fontFamily: "inherit" }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* SERVICE CARDS — GROUPED BY NAME */}
              {servicesLoading ? (
                <div style={{ textAlign: "center", color: muted, padding: "3rem" }}>Loading…</div>
              ) : groupedServices.length === 0 ? (
                <div style={{ background: card, borderRadius: 14, border: `1px solid ${border}`, padding: "3rem", textAlign: "center" }}>
                  <div style={{ fontSize: 32, marginBottom: 12 }}>🛠️</div>
                  <div style={{ fontSize: 14, color: text, marginBottom: 6 }}>No services yet</div>
                  <div style={{ fontSize: 12, color: muted }}>Use Add Service to create the first one.</div>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {groupedServices.map((group) => {
                    const isExpanded = expandedGroups[group.name] !== false;
                    const groupCoverImage = group.items.find((item) => item.nameImage)?.nameImage || null;
                    return (
                      <div key={group.name} style={{ background: card, borderRadius: 14, border: `1px solid ${border}`, overflow: "hidden" }}>
                        {/* Group header */}
                        <div
                          style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 20px", cursor: "pointer", borderBottom: isExpanded ? `1px solid ${border}` : "none", background: dark ? "rgba(255,255,255,0.02)" : "#FAFBFF" }}
                          onClick={() => setExpandedGroups((p) => ({ ...p, [group.name]: !isExpanded }))}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <div style={{ width: 36, height: 36, borderRadius: 8, overflow: "hidden", flexShrink: 0 }}>
                              {groupCoverImage ? (
                                <img src={groupCoverImage} alt={group.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                              ) : (
                                <div style={{ width: "100%", height: "100%", background: "linear-gradient(135deg,#1D9E75,#3B82F6)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                  <svg viewBox="0 0 24 24" fill="none" width="16" height="16" stroke="#fff" strokeWidth="2" strokeLinecap="round"><path d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>
                                </div>
                              )}
                            </div>
                            <div>
                              <div style={{ fontSize: 14, fontWeight: 700, color: text }}>{group.name}</div>
                              <div style={{ fontSize: 11, color: muted }}>{group.items.length} subtitle{group.items.length !== 1 ? "s" : ""}</div>
                            </div>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <button
                              onClick={(e) => { e.stopPropagation(); resetServiceForm(); setServiceForm((p) => ({ ...p, name: group.name })); setShowServiceForm(true); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                              style={{ padding: "5px 12px", background: "rgba(29,158,117,0.12)", color: "#1D9E75", border: "1px solid rgba(29,158,117,0.25)", borderRadius: 6, cursor: "pointer", fontSize: 11, fontWeight: 700, fontFamily: "inherit" }}
                            >
                              + Add subtitle
                            </button>
                            <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={muted} strokeWidth={2} style={{ transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s", flexShrink: 0 }}><polyline points="6 9 12 15 18 9" /></svg>
                          </div>
                        </div>

                        {/* Subtitle cards grid */}
                        {isExpanded && (
                          <div className="service-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 12, padding: 16 }}>
                            {group.items.map((s) => (
                              <div key={s._id} className="service-card-item" style={{ background: dark ? "rgba(255,255,255,0.03)" : "#F8FAFF", borderRadius: 12, border: `1px solid ${border}`, overflow: "hidden" }}>
                                {s.image ? (
                                  <div style={{ width: "100%", height: 130, overflow: "hidden", position: "relative" }}>
                                    <img src={s.image} alt={s.subtitle} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                                    <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, transparent 50%, rgba(0,0,0,0.45) 100%)" }} />
                                  </div>
                                ) : (
                                  <div style={{ width: "100%", height: 80, background: dark ? "rgba(79,142,247,0.06)" : "#EFF6FF", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                    <svg viewBox="0 0 24 24" fill="none" width="28" height="28" stroke={muted} strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>
                                  </div>
                                )}
                                <div style={{ padding: "12px 14px" }}>
                                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                                    <div>
                                      <div style={{ fontSize: 12, fontWeight: 700, color: text }}>{s.subtitle}</div>
                                      <div style={{ fontSize: 10, color: muted, marginTop: 2 }}>{s.options?.length || 0} package{(s.options?.length || 0) !== 1 ? "s" : ""}</div>
                                    </div>
                                    <div style={{ display: "flex", gap: 5, flexShrink: 0 }}>
                                      <button
                                        onClick={() => {
                                          setEditingService(s);
                                          setImagePreview(s.image || "");
                                          setNameImagePreview(s.nameImage || "");
                                          setServiceForm({ name: s.name, subtitle: s.subtitle, image: s.image || "", nameImage: s.nameImage || "", options: s.options.map((o) => ({ label: o.label, price: o.price, type: o.type || "basic" })) });
                                          setShowServiceForm(true);
                                          window.scrollTo({ top: 0, behavior: "smooth" });
                                        }}
                                        style={{ fontSize: 11, padding: "4px 10px", background: "rgba(79,142,247,0.1)", color: accent, border: `1px solid rgba(79,142,247,0.2)`, borderRadius: 6, cursor: "pointer", fontFamily: "inherit" }}
                                      >
                                        Edit
                                      </button>
                                      <button
                                        onClick={() => setDeleteServiceId(s._id)}
                                        style={{ fontSize: 11, padding: "4px 10px", background: "rgba(239,68,68,0.1)", color: "#F87171", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 6, cursor: "pointer", fontFamily: "inherit" }}
                                      >
                                        Del
                                      </button>
                                    </div>
                                  </div>
                                  <ServiceTierBoxes options={s.options || []} />
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {/* PROFILE */}
          {activeTab === "profile" && (
            <>
              <div style={{ marginBottom: "1.25rem" }}><h1 style={{ fontSize: 20, fontWeight: 700, color: text, margin: "0 0 4px" }}>My Profile</h1><p style={{ fontSize: 12, color: muted, margin: 0 }}>Admin account details</p></div>
              <div style={{ maxWidth: 500 }}>
                <div style={{ background: card, borderRadius: 16, border: `1px solid ${border}`, overflow: "hidden", boxShadow: dark ? "0 4px 20px rgba(0,0,0,0.2)" : "0 4px 20px rgba(0,0,0,0.06)" }}>
                  <div style={{ background: "linear-gradient(135deg,#0A2540,#1D4E89)", padding: "2rem", textAlign: "center" }}>
                    <div style={{ width: 72, height: 72, borderRadius: "50%", background: "linear-gradient(135deg,#1D9E75,#3B82F6)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px", boxShadow: "0 8px 24px rgba(29,158,117,0.4)" }}><span style={{ fontSize: 28, fontWeight: 700, color: "#fff" }}>{adminUser?.name?.charAt(0).toUpperCase() || "A"}</span></div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: "#fff" }}>{adminUser?.name}</div>
                    <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginTop: 4 }}>Super Admin</div>
                  </div>
                  <div style={{ padding: "1.25rem" }}>
                    {[["Name", adminUser?.name], ["Email", adminUser?.email], ["Role", adminUser?.role], ["ID", adminUser?.id]].map(([label, val]) => (
                      <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: `1px solid ${border}` }}><span style={{ fontSize: 12, color: muted, fontWeight: 500 }}>{label}</span><span style={{ fontSize: 12, color: text, fontWeight: 600 }}>{val || "—"}</span></div>
                    ))}
                    <div className="profile-stats" style={{ marginTop: "1.25rem", display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
                      {[{ label: "Total Bookings", value: counts.total, color: "#4F8EF7" }, { label: "Total Users", value: userCounts.total, color: "#4ADE80" }, { label: "Servicemen", value: userCounts.servicemen, color: "#F59E0B" }].map((s) => (
                        <div key={s.label} style={{ background: dark ? "rgba(255,255,255,0.04)" : "#F8FAFF", borderRadius: 10, padding: "12px", textAlign: "center", border: `1px solid ${border}` }}><div style={{ fontSize: 22, fontWeight: 700, color: s.color }}>{s.value}</div><div style={{ fontSize: 10, color: muted, marginTop: 4, lineHeight: 1.3 }}>{s.label}</div></div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* TRANSACTION MODAL */}
      {selectedTx && (
        <div onClick={() => setSelectedTx(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, padding: "1rem", backdropFilter: "blur(4px)" }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: card, borderRadius: 18, width: "100%", maxWidth: 560, maxHeight: "88vh", display: "flex", flexDirection: "column", boxShadow: "0 30px 80px rgba(0,0,0,0.5)", border: `1px solid ${border}`, overflow: "hidden" }}>
            <div style={{ background: "linear-gradient(135deg,#065F46,#10B981)", padding: "1.25rem 1.5rem", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
              <div><div style={{ fontSize: 15, fontWeight: 700, color: "#fff" }}>Transaction Details</div><div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", marginTop: 2, fontFamily: "monospace" }}>{selectedTx.transactionId}</div></div>
              <button onClick={() => setSelectedTx(null)} style={{ background: "rgba(255,255,255,0.15)", border: "none", cursor: "pointer", color: "#fff", width: 32, height: 32, borderRadius: "50%", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
            </div>
            <div style={{ overflowY: "auto", flex: 1, padding: "1.25rem" }} className="scrollbar-thin">
              {txDetailLoading ? <div style={{ textAlign: "center", color: muted, padding: "3rem", fontSize: 13 }}>Loading details…</div> : (
                <>
                  <div style={{ background: dark ? "rgba(255,255,255,0.03)" : "#F8FAFF", borderRadius: 12, padding: "1rem", border: `1px solid ${border}`, marginBottom: "1rem" }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: muted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>Payment Info</div>
                    <div className="tx-detail-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                      {[["Amount", `৳${(selectedTx.amount || 0).toLocaleString()}`], ["Status", null], ["Booking ID", selectedTx.bookingId || "—"], ["Date", formatDateTime(selectedTx.createdAt)]].map(([label, val]) => (
                        <div key={label}><div style={{ fontSize: 10, color: muted, marginBottom: 3 }}>{label}</div>{label === "Status" ? <StatusBadge status={selectedTx.status} /> : <div style={{ fontSize: 12, fontWeight: 600, color: label === "Amount" ? "#4ADE80" : text }}>{val}</div>}</div>
                      ))}
                    </div>
                  </div>
                  <div style={{ background: dark ? "rgba(255,255,255,0.03)" : "#F8FAFF", borderRadius: 12, padding: "1rem", border: `1px solid ${border}`, marginBottom: "1rem" }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: muted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>Linked Booking</div>
                    {txBooking ? (<>
                      <div className="tx-detail-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
                        {[["Customer", txBooking.name], ["Service", txBooking.service], ["Phone", txBooking.phone], ["Status", null], ["Address", txBooking.address], ["Date", formatDate(txBooking.createdAt)]].map(([label, val]) => (
                          <div key={label}><div style={{ fontSize: 10, color: muted, marginBottom: 3 }}>{label}</div>{label === "Status" ? <StatusBadge status={txBooking.status} /> : <div style={{ fontSize: 12, fontWeight: 600, color: text, wordBreak: "break-word" }}>{val || "—"}</div>}</div>
                        ))}
                      </div>
                      <button onClick={() => { setSelectedTx(null); setActiveTab("bookings"); }} style={{ fontSize: 11, padding: "5px 14px", background: "rgba(79,142,247,0.1)", color: accent, border: `1px solid rgba(79,142,247,0.2)`, borderRadius: 6, cursor: "pointer", fontFamily: "inherit" }}>View all bookings →</button>
                    </>) : <div style={{ fontSize: 12, color: muted }}>No booking found for this transaction.</div>}
                  </div>
                  <div style={{ background: dark ? "rgba(255,255,255,0.03)" : "#F8FAFF", borderRadius: 12, padding: "1rem", border: `1px solid ${border}` }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: muted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>Customer Info</div>
                    {txUser ? (<>
                      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
                        <div style={{ width: 42, height: 42, borderRadius: "50%", background: `hsl(${(txUser.name?.charCodeAt(0) || 0) * 10},55%,45%)`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><span style={{ fontSize: 16, fontWeight: 700, color: "#fff" }}>{txUser.name?.charAt(0).toUpperCase()}</span></div>
                        <div><div style={{ fontSize: 13, fontWeight: 700, color: text }}>{txUser.name}</div><div style={{ fontSize: 11, color: muted }}>{txUser.email}</div></div>
                      </div>
                      <div className="tx-detail-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
                        {[["Role", txUser.role], ["Phone", txUser.phone || "—"], ["Joined", formatDate(txUser.createdAt)]].map(([label, val]) => (
                          <div key={label}><div style={{ fontSize: 10, color: muted, marginBottom: 3 }}>{label}</div><div style={{ fontSize: 12, fontWeight: 600, color: text }}>{val}</div></div>
                        ))}
                      </div>
                      <button onClick={() => { setSelectedTx(null); handleViewUser(txUser); }} style={{ fontSize: 11, padding: "5px 14px", background: "rgba(79,142,247,0.1)", color: accent, border: `1px solid rgba(79,142,247,0.2)`, borderRadius: 6, cursor: "pointer", fontFamily: "inherit" }}>View user profile →</button>
                    </>) : <div style={{ fontSize: 12, color: muted }}>Customer info not found.</div>}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* USER MODAL */}
      {selectedUser && (
        <div onClick={() => setSelectedUser(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, padding: "1rem", backdropFilter: "blur(4px)" }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: card, borderRadius: 18, width: "100%", maxWidth: 500, maxHeight: "82vh", display: "flex", flexDirection: "column", boxShadow: "0 30px 80px rgba(0,0,0,0.4)", border: `1px solid ${border}`, overflow: "hidden" }}>
            <div style={{ background: "linear-gradient(135deg,#0A2540,#1D4E89)", padding: "1.5rem", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ width: 48, height: 48, borderRadius: "50%", background: `hsl(${(selectedUser.name?.charCodeAt(0) || 0) * 10},55%,45%)`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><span style={{ fontSize: 20, fontWeight: 700, color: "#fff" }}>{selectedUser.name?.charAt(0).toUpperCase()}</span></div>
                <div style={{ minWidth: 0 }}><div style={{ fontSize: 16, fontWeight: 700, color: "#fff" }}>{selectedUser.name}</div><div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{selectedUser.email}</div></div>
              </div>
              <button onClick={() => setSelectedUser(null)} style={{ background: "rgba(255,255,255,0.1)", border: "none", cursor: "pointer", color: "#fff", width: 32, height: 32, borderRadius: "50%", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>✕</button>
            </div>
            <div style={{ display: "flex", borderBottom: `1px solid ${border}`, flexShrink: 0 }}>
              {["profile", "bookings"].map((t) => (<button key={t} onClick={() => setModalTab(t)} style={{ flex: 1, padding: "12px", fontSize: 12, fontWeight: 600, border: "none", cursor: "pointer", fontFamily: "inherit", background: modalTab === t ? (dark ? "rgba(79,142,247,0.08)" : "#F0F8FF") : card, color: modalTab === t ? accent : muted, borderBottom: modalTab === t ? `2px solid ${accent}` : "2px solid transparent", textTransform: "capitalize", transition: "all 0.15s" }}>{t === "bookings" ? `Bookings (${userBookings.length})` : "Profile"}</button>))}
            </div>
            <div style={{ flex: 1, overflowY: "auto", padding: "1.25rem" }} className="scrollbar-thin">
              {modalLoading ? <div style={{ textAlign: "center", color: muted, padding: "2rem" }}>Loading...</div> : modalTab === "profile" ? (
                <div>
                  {[["Name", selectedUser.name], ["Email", selectedUser.email], ["Role", selectedUser.role], ["Phone", selectedUser.phone || "—"], ["Specialty", selectedUser.specialty || "—"], ["Rating", selectedUser.rating ? `${selectedUser.rating} ⭐ (${selectedUser.totalReviews} reviews)` : "No ratings"], ["Joined", formatDate(selectedUser.createdAt)]].map(([label, val]) => (
                    <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "11px 0", borderBottom: `1px solid ${border}` }}><span style={{ fontSize: 12, color: muted, fontWeight: 500 }}>{label}</span><span style={{ fontSize: 12, color: text, fontWeight: 600, maxWidth: "60%", textAlign: "right", wordBreak: "break-word" }}>{val}</span></div>
                  ))}
                </div>
              ) : (
                <div>
                  {userBookings.length === 0 ? <div style={{ textAlign: "center", color: muted, padding: "2rem", fontSize: 13 }}>No bookings found</div> : userBookings.map((b, i) => (
                    <div key={i} style={{ background: dark ? "rgba(255,255,255,0.03)" : "#F8FAFF", borderRadius: 10, padding: "12px 14px", marginBottom: 8, border: `1px solid ${border}` }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}><div style={{ fontSize: 13, fontWeight: 600, color: text }}>{b.service}</div><StatusBadge status={b.status} /></div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                        {[["Customer", b.name], ["Phone", b.phone], ["Address", b.address], ["Date", formatDate(b.createdAt)]].map(([label, val]) => (<div key={label}><div style={{ fontSize: 10, color: muted, marginBottom: 2 }}>{label}</div><div style={{ fontSize: 11, fontWeight: 600, color: text }}>{val}</div></div>))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* DELETE USER MODAL */}
      {deleteId && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, backdropFilter: "blur(4px)", padding: "1rem" }}>
          <div style={{ background: card, padding: "2rem", borderRadius: 18, width: "100%", maxWidth: 320, textAlign: "center", border: `1px solid ${border}`, boxShadow: "0 25px 60px rgba(0,0,0,0.4)" }}>
            <div style={{ width: 52, height: 52, borderRadius: "50%", background: "rgba(239,68,68,0.12)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1rem", border: "1px solid rgba(239,68,68,0.2)" }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#F87171" strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" /><path d="M10 11v6M14 11v6" /></svg>
            </div>
            <div style={{ fontSize: 16, fontWeight: 700, color: text, marginBottom: 8 }}>Delete User?</div>
            <div style={{ fontSize: 13, color: muted, marginBottom: "1.5rem", lineHeight: 1.5 }}>This action is permanent and cannot be undone.</div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={confirmDelete} style={{ flex: 1, padding: "11px", background: "linear-gradient(135deg,#DC2626,#EF4444)", color: "#fff", border: "none", borderRadius: 10, cursor: "pointer", fontWeight: 700, fontFamily: "inherit", fontSize: 13 }}>Delete</button>
              <button onClick={() => setDeleteId(null)} style={{ flex: 1, padding: "11px", background: dark ? "rgba(255,255,255,0.06)" : "#F3F4F6", color: text, border: `1px solid ${border}`, borderRadius: 10, cursor: "pointer", fontFamily: "inherit", fontSize: 13 }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* VERIFY MODAL */}
      {verifyAction && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, backdropFilter: "blur(4px)", padding: "1rem" }}>
          <div style={{ background: card, padding: "2rem", borderRadius: 18, width: "100%", maxWidth: 340, textAlign: "center", border: `1px solid ${border}`, boxShadow: "0 25px 60px rgba(0,0,0,0.4)" }}>
            <div style={{ width: 52, height: 52, borderRadius: "50%", background: verifyAction.action === "approved" ? "rgba(34,197,94,0.12)" : "rgba(239,68,68,0.12)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1rem", border: `1px solid ${verifyAction.action === "approved" ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.2)"}` }}>
              <span style={{ fontSize: 22 }}>{verifyAction.action === "approved" ? "✓" : "✕"}</span>
            </div>
            <div style={{ fontSize: 16, fontWeight: 700, color: text, marginBottom: 6 }}>{verifyAction.action === "approved" ? "Approve serviceman?" : "Reject serviceman?"}</div>
            <div style={{ fontSize: 13, color: muted, marginBottom: "1.5rem", lineHeight: 1.5 }}><strong style={{ color: text }}>{verifyAction.user.name}</strong>{" "}{verifyAction.action === "approved" ? "will be approved and can receive bookings." : "will be rejected."}</div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => handleVerify(verifyAction.user._id, verifyAction.action)} style={{ flex: 1, padding: "11px", background: verifyAction.action === "approved" ? "linear-gradient(135deg,#065F46,#10B981)" : "linear-gradient(135deg,#DC2626,#EF4444)", color: "#fff", border: "none", borderRadius: 10, cursor: "pointer", fontWeight: 700, fontFamily: "inherit", fontSize: 13 }}>{verifyAction.action === "approved" ? "Approve" : "Reject"}</button>
              <button onClick={() => setVerifyAction(null)} style={{ flex: 1, padding: "11px", background: dark ? "rgba(255,255,255,0.06)" : "#F3F4F6", color: text, border: `1px solid ${border}`, borderRadius: 10, cursor: "pointer", fontFamily: "inherit", fontSize: 13 }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE SERVICE MODAL */}
      {deleteServiceId && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, padding: "1rem" }}>
          <div style={{ background: card, padding: "2rem", borderRadius: 18, width: "100%", maxWidth: 320, textAlign: "center", border: `1px solid ${border}` }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: text, marginBottom: 8 }}>Delete Service Entry?</div>
            <div style={{ fontSize: 13, color: muted, marginBottom: "1.5rem" }}>This subtitle entry will be removed from the signup form.</div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={handleDeleteService} style={{ flex: 1, padding: "11px", background: "linear-gradient(135deg,#DC2626,#EF4444)", color: "#fff", border: "none", borderRadius: 10, cursor: "pointer", fontWeight: 700, fontFamily: "inherit" }}>Delete</button>
              <button onClick={() => setDeleteServiceId(null)} style={{ flex: 1, padding: "11px", background: dark ? "rgba(255,255,255,0.06)" : "#F3F4F6", color: text, border: `1px solid ${border}`, borderRadius: 10, cursor: "pointer", fontFamily: "inherit" }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
