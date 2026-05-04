"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";

const StarIcon = ({ filled }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill={filled ? "#F59E0B" : "none"} stroke="#F59E0B" strokeWidth="2">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

const Stars = ({ rating }) => (
  <div style={{ display: "flex", gap: 3 }}>
    {[1, 2, 3, 4, 5].map((i) => (
      <StarIcon key={i} filled={i <= Math.round(rating)} />
    ))}
  </div>
);

export default function ServicemanProfile() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id;

  const [serviceman, setServiceman] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeBooking, setActiveBooking] = useState(null); // booking with this serviceman
  const [user, setUser] = useState(null);

  useEffect(() => {
    if (!id) return;

    // fetch serviceman info
    fetch(`/api/serviceman/${id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setServiceman(data.data);
      })
      .finally(() => setLoading(false));

    // fetch reviews
    fetch(`/api/reviews?servicemanId=${id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setReviews(data.data);
      });

    // fetch current user and their bookings with this serviceman
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then(async (data) => {
        if (!data.success) return;
        setUser(data.user);
        // fetch bookings
        const bookingRes = await fetch("/api/booking");
        const bookingData = await bookingRes.json();
        if (bookingData.success) {
          // find any accepted/pending booking between this user and this serviceman
          const found = bookingData.data.find(
            (b) =>
              b.userId === data.user.id &&
              b.servicemanId === id &&
              (b.status === "accepted" || b.status === "pending")
          );
          if (found) setActiveBooking(found);
        }
      });
  }, [id]);

  if (loading) return (
    <div style={{ fontFamily: "'Sora', sans-serif", display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", color: "#888780" }}>
      Loading...
    </div>
  );

  if (!serviceman) return (
    <div style={{ fontFamily: "'Sora', sans-serif", display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", color: "#888780" }}>
      Serviceman not found
    </div>
  );

  return (
    <main style={{ fontFamily: "'Sora', sans-serif", background: "#F0F2F5", minHeight: "100vh", paddingBottom: "2rem" }}>

      {/* ── Header ── */}
      <div style={{ background: "#0A2540", padding: "1.5rem 1.25rem 2rem" }}>
        <button
          onClick={() => router.back()}
          style={{ background: "transparent", border: "none", color: "#9AAFC7", fontSize: 12, cursor: "pointer", fontFamily: "inherit", marginBottom: "1rem", padding: 0 }}
        >
          ← Back
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 64, height: 64, borderRadius: "50%", overflow: "hidden", background: "#1D9E75", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            {serviceman.avatar ? (
              <img src={serviceman.avatar} alt="avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              <span style={{ fontSize: 26, fontWeight: 700, color: "#fff" }}>
                {serviceman.name?.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <div>
            <div style={{ fontSize: 20, fontWeight: 700, color: "#fff" }}>{serviceman.name}</div>
            <div style={{ fontSize: 13, color: "#5DCAA5", marginTop: 2 }}>{serviceman.specialty || "General Services"}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6 }}>
              <Stars rating={serviceman.rating || 0} />
              <span style={{ fontSize: 12, color: "#9AAFC7" }}>
                {serviceman.rating ? serviceman.rating.toFixed(1) : "No ratings"} {serviceman.totalReviews ? `(${serviceman.totalReviews} reviews)` : ""}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div style={{ padding: "1.25rem" }}>

        {/* ── Chat & Call buttons (only if active booking exists) ── */}
        {user && activeBooking && (
          <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
            {/* Call button */}
            {serviceman.phone && (
              <button
                onClick={() => { window.location.href = `tel:${serviceman.phone}`; }}
                style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: "#1D9E75", color: "#fff", border: "none", borderRadius: 12, padding: "12px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.8a19.79 19.79 0 01-3.07-8.68A2 2 0 012 .82h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 8.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" />
                </svg>
                Call
              </button>
            )}
            {/* Chat button */}
            <button
              onClick={() => router.push(`/chat/${activeBooking._id}`)}
              style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: "#0A2540", color: "#fff", border: "none", borderRadius: 12, padding: "12px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round">
                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
              </svg>
              💬 Chat
            </button>
          </div>
        )}

        {/* ── About ── */}
        <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #E5E7EB", padding: "14px", marginBottom: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: "#888780", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>About</div>
          <div style={{ fontSize: 13, color: "#5F5E5A", lineHeight: 1.6 }}>{serviceman.bio || "No bio available"}</div>
          {serviceman.phone && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 12, paddingTop: 12, borderTop: "1px solid #F0F2F5" }}>
              <div style={{ fontSize: 12, color: "#888780" }}>Phone:</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#2C2C2A" }}>{serviceman.phone}</div>
            </div>
          )}
        </div>

        {/* ── Reviews ── */}
        <div style={{ fontSize: 11, fontWeight: 600, color: "#888780", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>
          Reviews ({reviews.length})
        </div>

        {reviews.length === 0 ? (
          <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #E5E7EB", padding: "1.5rem", textAlign: "center", color: "#888780", fontSize: 13 }}>
            No reviews yet
          </div>
        ) : (
          reviews.map((r, i) => (
            <div key={i} style={{ background: "#fff", borderRadius: 12, border: "1px solid #E5E7EB", padding: "14px", marginBottom: 8 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#2C2C2A" }}>{r.userName}</div>
                <Stars rating={r.rating} />
              </div>
              {r.comment && (
                <div style={{ fontSize: 12, color: "#5F5E5A", lineHeight: 1.5 }}>{r.comment}</div>
              )}
              <div style={{ fontSize: 11, color: "#B4B2A9", marginTop: 6 }}>
                {new Date(r.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
              </div>
            </div>
          ))
        )}
      </div>
    </main>
  );
}