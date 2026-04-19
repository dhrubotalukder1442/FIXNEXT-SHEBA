"use client";
import { useState } from "react";
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

export default function Home() {
  const [activeService, setActiveService] = useState(null);
  const [selectedOption, setSelectedOption] = useState(null);
  const [confirmed, setConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [showModal, setShowModal] = useState(false);

  const service = activeService ? services[activeService] : null;

  const handleSelectService = (key) => {
    setActiveService(key);
    setSelectedOption(null);
    setConfirmed(false);
  };

  // Step 1: validate & open modal
  const handleOpenModal = () => {
    if (!activeService || selectedOption === null) {
      alert("Please select a service and package");
      return;
    }
    if (!name || !phone || !address) {
      alert("Please fill all fields");
      return;
    }
    setShowModal(true);
  };

  // Step 2: confirm booking from modal
  const handleConfirmBooking = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ service: activeService, option: selectedOption, name, phone, address }),
      });
      const result = await response.json();
      if (result.success) {
        setShowModal(false);
        setConfirmed(true);
      } else {
        alert(result.message || "Failed to book the service.");
      }
    } catch (error) {
      alert("Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setActiveService(null);
    setSelectedOption(null);
    setConfirmed(false);
    setName("");
    setPhone("");
    setAddress("");
  };

  const inputStyle = {
    width: "100%",
    padding: "10px 12px",
    marginBottom: 8,
    border: "1px solid #E5E7EB",
    borderRadius: 10,
    fontSize: 13,
    fontFamily: "'Sora', sans-serif",
    color: "#2C2C2A",
    background: "#FAFAFA",
    outline: "none",
    boxSizing: "border-box",
  };

  return (
    <main style={{ fontFamily: "'Sora', sans-serif", background: "#F0F2F5", minHeight: "100vh", paddingBottom: "2rem" }}>

      {/* ── Overlay Modal ── */}
      {showModal && (
        <div
          onClick={() => setShowModal(false)}
          style={{
            position: "fixed", inset: 0, zIndex: 100,
            background: "rgba(10,37,64,0.55)",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: "1.25rem",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#fff",
              borderRadius: 16,
              width: "100%",
              maxWidth: 360,
              padding: "1.5rem",
              boxShadow: "0 8px 40px rgba(0,0,0,0.18)",
            }}
          >
            {/* Modal header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#2C2C2A" }}>Confirm Booking</div>
              <button
                onClick={() => setShowModal(false)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#888780", padding: 4 }}
              >
                <CloseIcon />
              </button>
            </div>

            {/* Summary card */}
            <div style={{ background: "#F0FBF6", border: "1px solid #9FE1CB", borderRadius: 10, padding: "10px 14px", marginBottom: "1.25rem" }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: "#0F6E56", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>
                Order Summary
              </div>
              {[
                ["Service", `${service.icon} ${service.title}`],
                ["Package", service?.options[selectedOption]?.name],
                ["Price", service?.options[selectedOption]?.price],
              ].map(([label, val]) => (
                <div key={label} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "3px 0" }}>
                  <span style={{ color: "#0F6E56" }}>{label}</span>
                  <span style={{ fontWeight: 600, color: "#2C2C2A" }}>{val}</span>
                </div>
              ))}
              <div style={{ borderTop: "1px solid #9FE1CB", marginTop: 8, paddingTop: 8 }}>
                {[
                  ["Name", name],
                  ["Phone", phone],
                  ["Address", address],
                ].map(([label, val]) => (
                  <div key={label} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "2px 0" }}>
                    <span style={{ color: "#0F6E56" }}>{label}</span>
                    <span style={{ fontWeight: 600, color: "#2C2C2A", maxWidth: "60%", textAlign: "right", wordBreak: "break-word" }}>{val}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Action buttons */}
            <button
              onClick={handleConfirmBooking}
              disabled={loading}
              style={{
                width: "100%",
                background: loading ? "#B4B2A9" : "#1D9E75",
                color: "#fff",
                border: "none",
                borderRadius: 12,
                padding: "13px",
                fontSize: 14,
                fontWeight: 700,
                cursor: loading ? "not-allowed" : "pointer",
                fontFamily: "inherit",
                marginBottom: 8,
              }}
            >
              {loading ? "Booking..." : "Yes, Confirm Booking"}
            </button>
            <button
              onClick={() => setShowModal(false)}
              style={{
                width: "100%",
                background: "transparent",
                border: "1px solid #E5E7EB",
                borderRadius: 12,
                padding: "11px",
                fontSize: 13,
                color: "#5F5E5A",
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              Go back & edit
            </button>
          </div>
        </div>
      )}

      {/* ── Hero ── */}
      <div style={{ background: "#0A2540", padding: "1.5rem 1.25rem 2rem", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", width: 220, height: 220, background: "#1D9E75", opacity: 0.07, borderRadius: "50%", top: -70, right: -50, pointerEvents: "none" }} />
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: "1.25rem" }}>
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
        <div style={{ fontSize: 20, fontWeight: 700, color: "#fff", marginBottom: 4 }}>Trusted Home Services</div>
        <div style={{ fontSize: 13, color: "#9AAFC7" }}>Professional helpers, right at your door</div>
        <div style={{ display: "flex", gap: 14, marginTop: "1rem" }}>
          {["Verified Pros", "Fixed Prices", "Guaranteed"].map((t) => (
            <div key={t} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "#7BAEC8" }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#1D9E75", flexShrink: 0 }} />
              {t}
            </div>
          ))}
        </div>
      </div>

      {/* ── Services Grid ── */}
      <div style={{ padding: "1.25rem" }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: "#888780", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.75rem" }}>
          Choose a service
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
          {Object.entries(services).map(([key, s]) => (
            <div
              key={key}
              onClick={() => handleSelectService(key)}
              style={{
                background: activeService === key ? "#F0FBF6" : "#fff",
                border: activeService === key ? "1.5px solid #1D9E75" : "1px solid #E5E7EB",
                borderRadius: 12, padding: "12px 8px", textAlign: "center",
                cursor: "pointer", WebkitTapHighlightColor: "transparent",
              }}
            >
              <div style={{ fontSize: 22, marginBottom: 5, lineHeight: 1 }}>{s.icon}</div>
              <div style={{ fontSize: 11, fontWeight: 600, color: "#2C2C2A", lineHeight: 1.3 }}>{s.title}</div>
              <div style={{ fontSize: 10, color: "#888780", marginTop: 2, lineHeight: 1.3 }}>{s.subtitle}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Detail Panel ── */}
      {true && (
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
                <div
                  key={i}
                  onClick={() => setSelectedOption(i)}
                  style={{
                    background: selectedOption === i ? "#F0FBF6" : "#fff",
                    border: selectedOption === i ? "1.5px solid #1D9E75" : "1px solid #E5E7EB",
                    borderRadius: 12, padding: "12px 14px", marginBottom: 8,
                    cursor: "pointer", display: "flex", justifyContent: "space-between",
                    alignItems: "center", WebkitTapHighlightColor: "transparent",
                  }}
                >
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#2C2C2A" }}>{opt.name}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: "#1D9E75", whiteSpace: "nowrap" }}>{opt.price}</span>
                    <div style={{
                      width: 18, height: 18, borderRadius: "50%",
                      background: selectedOption === i ? "#1D9E75" : "transparent",
                      border: selectedOption === i ? "1.5px solid #1D9E75" : "1.5px solid #B4B2A9",
                      display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                    }}>
                      {selectedOption === i && <CheckMark />}
                    </div>
                  </div>
                </div>
              ))}

              {/* ── Contact Form ── */}
              <div style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 12, padding: "14px", marginBottom: "1rem" }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: "#888780", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>
                  Your Details
                </div>
                <input
                  placeholder="Your Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={inputStyle}
                />
                <input
                  placeholder="Phone Number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  style={inputStyle}
                />
                <input
                  placeholder="Address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  style={{ ...inputStyle, marginBottom: 0 }}
                />
              </div>

              <button
                onClick={handleOpenModal}
                disabled={selectedOption === null}
                style={{
                  width: "100%",
                  background: selectedOption === null ? "#B4B2A9" : "#1D9E75",
                  color: "#fff", border: "none", borderRadius: 12,
                  padding: "14px", fontSize: 15, fontWeight: 700,
                  cursor: selectedOption === null ? "not-allowed" : "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  gap: 8, marginTop: 4, fontFamily: "inherit",
                }}
              >
                <CalendarIcon />
                Book Now
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
              <button
                onClick={handleReset}
                style={{ background: "transparent", border: "1px solid #D3D1C7", borderRadius: 10, padding: "10px 20px", fontSize: 13, color: "#5F5E5A", cursor: "pointer", fontFamily: "inherit" }}
              >
                ← Book another service
              </button>
            </div>
          )}
        </div>
      )}
    </main>
  );
}