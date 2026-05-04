"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";

export default function ChatPage() {
  const router = useRouter();
  const { bookingId } = useParams();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [user, setUser] = useState(null);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then(r => r.json())
      .then(data => {
        if (!data.success) router.push("/login");
        else setUser(data.user);
      });
  }, []);

  const fetchMessages = useCallback(async () => {
    try {
      const res = await fetch(`/api/chat?bookingId=${bookingId}`);
      const data = await res.json();
      if (data.success) setMessages(data.data);
    } catch (err) { console.error(err); }
  }, [bookingId]);

  useEffect(() => {
    if (!bookingId) return;
    fetchMessages();
    intervalRef.current = setInterval(fetchMessages, 1000);
    return () => clearInterval(intervalRef.current);
  }, [fetchMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || sending) return;
    console.log("bookingId:", bookingId);
    console.log("message:", input.trim());

    setSending(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId, message: input.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setMessages(prev => [...prev, data.data]);
        setInput("");
      }
    } catch { }
    finally { setSending(false); }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };


  

  const formatTime = (date) => new Date(date).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

  return (
    <div style={{ fontFamily: "'Sora', sans-serif", display: "flex", flexDirection: "column", height: "100vh", background: "#F0F2F5" }}>

      {/* Header */}
      <div style={{ background: "#0A2540", padding: "1rem 1.25rem", display: "flex", alignItems: "center", gap: 12 }}>
        <button
          onClick={() => router.back()}
          style={{ background: "none", border: "none", cursor: "pointer", color: "#9AAFC7", padding: 0, display: "flex", alignItems: "center" }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
        </button>
        <div style={{ width: 38, height: 38, borderRadius: "50%", background: "#1D9E75", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round">
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
          </svg>
        </div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>Booking Chat</div>
          <div style={{ fontSize: 11, color: "#5DCAA5" }}>Booking #{bookingId?.slice(-6)}</div>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: "1rem", display: "flex", flexDirection: "column", gap: 8 }}>
        {messages.length === 0 && (
          <div style={{ textAlign: "center", color: "#888780", fontSize: 13, marginTop: "2rem" }}>
            No messages yet. Start the conversation!
          </div>
        )}
        {messages.map((msg, i) => {
          const isMe = msg.senderId === user?.id;
          return (
            <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: isMe ? "flex-end" : "flex-start" }}>
              {!isMe && (
                <div style={{ fontSize: 10, color: "#888780", marginBottom: 3, marginLeft: 4 }}>
                  {msg.senderName} · {msg.senderRole}
                </div>
              )}
              <div style={{
                maxWidth: "75%",
                background: isMe ? "#1D9E75" : "#fff",
                color: isMe ? "#fff" : "#2C2C2A",
                padding: "10px 14px",
                borderRadius: isMe ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                fontSize: 13,
                lineHeight: 1.5,
                boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
                border: isMe ? "none" : "1px solid #E5E7EB",
              }}>
                {msg.message}
              </div>
              <div style={{ fontSize: 10, color: "#B4B2A9", marginTop: 3, marginLeft: isMe ? 0 : 4, marginRight: isMe ? 4 : 0 }}>
                {formatTime(msg.createdAt)}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ background: "#fff", padding: "0.75rem 1rem", borderTop: "1px solid #E5E7EB", display: "flex", gap: 8, alignItems: "flex-end" }}>
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          rows={1}
          style={{
            flex: 1, padding: "10px 14px", border: "1px solid #E5E7EB", borderRadius: 20,
            fontSize: 13, fontFamily: "'Sora', sans-serif", color: "#2C2C2A",
            background: "#FAFAFA", outline: "none", resize: "none",
            maxHeight: 100, overflowY: "auto", lineHeight: 1.5,
          }}
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || sending}
          style={{
            width: 44, height: 44, borderRadius: "50%", border: "none",
            background: !input.trim() ? "#B4B2A9" : "#1D9E75",
            cursor: !input.trim() ? "not-allowed" : "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </button>
      </div>
    </div>
  );
}