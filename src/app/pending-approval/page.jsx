"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function PendingApprovalPage() {
  const router = useRouter();
  const [dots, setDots] = useState(1);

  // Animated dots
  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev >= 3 ? 1 : prev + 1));
    }, 600);
    return () => clearInterval(interval);
  }, []);

  return (
    <main
      style={{
        fontFamily: "'Sora', sans-serif",
        background: "#F0F2F5",
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1.25rem",
      }}
    >
      <div style={{ width: "100%", maxWidth: 380 }}>

        {/* Logo */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: "1.75rem",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              background: "#1D9E75",
              borderRadius: 10,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg viewBox="0 0 24 24" fill="none" width="22" height="22">
              <path
                d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"
                stroke="#fff"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div>
            <div
              style={{
                fontSize: 18,
                fontWeight: 700,
                color: "#2C2C2A",
                lineHeight: 1,
              }}
            >
              FixNext Sheba
            </div>
            <div
              style={{
                fontSize: 11,
                color: "#1D9E75",
                textTransform: "uppercase",
                letterSpacing: "0.04em",
              }}
            >
              Home Services
            </div>
          </div>
        </div>

        {/* Card */}
        <div
          style={{
            background: "#fff",
            borderRadius: 16,
            padding: "2rem 1.75rem",
            border: "1px solid #E5E7EB",
            textAlign: "center",
          }}
        >
          {/* Animated clock icon */}
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: "50%",
              background: "#E1F5EE",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 1.25rem",
              border: "2px solid #A7E4CF",
            }}
          >
            <svg
              width="36"
              height="36"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#1D9E75"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>

          {/* Title */}
          <div
            style={{
              fontSize: 20,
              fontWeight: 700,
              color: "#2C2C2A",
              marginBottom: 8,
            }}
          >
            Approval এর অপেক্ষায়
          </div>

          {/* Subtitle */}
          <div
            style={{
              fontSize: 13,
              color: "#888780",
              lineHeight: 1.7,
              marginBottom: "1.5rem",
            }}
          >
            আপনার serviceman account টি সফলভাবে তৈরি হয়েছে।
            <br />
            Admin verify করার পর আপনি booking পাবেন।
          </div>

          {/* Status badge */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              background: "#FEF3C7",
              border: "1px solid #FDE68A",
              borderRadius: 99,
              padding: "6px 14px",
              marginBottom: "1.5rem",
            }}
          >
            <div
              style={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                background: "#D97706",
                animation: "pulse 1.5s ease-in-out infinite",
              }}
            />
            <span
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: "#92400E",
              }}
            >
              Pending Approval{".".repeat(dots)}
            </span>
          </div>

          {/* Steps */}
          <div
            style={{
              background: "#F9FAFB",
              borderRadius: 12,
              padding: "1rem",
              border: "1px solid #E5E7EB",
              marginBottom: "1.5rem",
              textAlign: "left",
            }}
          >
            {[
              { icon: "✅", label: "Account তৈরি হয়েছে", done: true },
              { icon: "⏳", label: "Admin verification চলছে", done: false },
              { icon: "🔒", label: "Booking access পাবেন", done: false },
            ].map((item, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "7px 0",
                  borderBottom: i < 2 ? "1px solid #E5E7EB" : "none",
                }}
              >
                <span style={{ fontSize: 16 }}>{item.icon}</span>
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: item.done ? "#1D9E75" : "#888780",
                  }}
                >
                  {item.label}
                </span>
              </div>
            ))}
          </div>

          {/* Info box */}
          <div
            style={{
              background: "#E1F5EE",
              borderRadius: 10,
              padding: "10px 14px",
              border: "1px solid #A7E4CF",
              marginBottom: "1.5rem",
              display: "flex",
              gap: 8,
              alignItems: "flex-start",
              textAlign: "left",
            }}
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#1D9E75"
              strokeWidth="2.5"
              strokeLinecap="round"
              style={{ flexShrink: 0, marginTop: 1 }}
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span style={{ fontSize: 12, color: "#065F46", lineHeight: 1.6 }}>
              সাধারণত <strong>২৪-৪৮ ঘণ্টার</strong> মধ্যে admin verify করে থাকেন। Approve হলে email এ জানানো হবে।
            </span>
          </div>

          {/* Logout button */}
          <button
            onClick={() => {
              document.cookie = "token=; Max-Age=0; path=/";
              localStorage.removeItem("user");
              router.push("/login");
            }}
            style={{
              width: "100%",
              background: "transparent",
              color: "#888780",
              border: "1px solid #E5E7EB",
              borderRadius: 12,
              padding: "11px",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            অন্য account এ login করুন
          </button>
        </div>

        <style>{`
          @keyframes pulse {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.5; transform: scale(0.8); }
          }
        `}</style>
      </div>
    </main>
  );
}