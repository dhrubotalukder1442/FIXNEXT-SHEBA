"use client";
import Link from "next/link";

// Simple SVG icons used in footer
const FacebookIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" />
  </svg>
);
const LinkedInIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);
const InstagramIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
  </svg>
);
const PhoneIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.8a19.79 19.79 0 01-3.07-8.68A2 2 0 012 .82h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 8.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" />
  </svg>
);
const MailIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
    <polyline points="22,6 12,13 2,6" />
  </svg>
);
const LocationIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);
const ShieldIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

export default function Footer() {
  const quickLinks = [
    { label: "Home", path: "/" },
    { label: "Services", path: "/#services" },
    { label: "Our Servicemen", path: "/servicemen" },
    { label: "Login", path: "/login" },
    { label: "Register", path: "/register" },
  ];

  const legalLinks = [
    { label: "Privacy Policy", path: "/privacy" },
    { label: "Terms of Service", path: "/terms" },
    { label: "Refund Policy", path: "/refund" },
  ];

  const contactInfo = [
    { icon: <PhoneIcon />, text: "+880 1615-823129" },
    { icon: <MailIcon />, text: "support@fixnextsheba.com" },
    { icon: <LocationIcon />, text: "Dhaka, Bangladesh" },
  ];

  const socialLinks = [
    { icon: <FacebookIcon />, label: "Facebook", href: "https://facebook.com" },
    { icon: <LinkedInIcon />, label: "LinkedIn", href: "https://linkedin.com" },
    { icon: <InstagramIcon />, label: "Instagram", href: "https://instagram.com" },
  ];

  return (
    <footer
      style={{
        background: "#0A2540",
        fontFamily: "'Sora', sans-serif",
        marginTop: "2rem",
      }}
    >
      {/* Top divider line */}
      <div style={{ height: 3, background: "linear-gradient(90deg, #1D9E75 0%, #5DCAA5 50%, transparent 100%)" }} />

      {/* Main footer body */}
      <div style={{ padding: "2rem 1.25rem 1.5rem" }}>

        {/* Brand block */}
        <div style={{ marginBottom: "1.75rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
            <div
              style={{
                width: 38, height: 38,
                background: "#1D9E75",
                borderRadius: 9,
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <svg viewBox="0 0 24 24" fill="none" width="20" height="20">
                <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M9 22V12h6v10" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div>
              <div style={{ fontSize: 17, fontWeight: 700, color: "#fff", lineHeight: 1 }}>FixNext Sheba</div>
              <div style={{ fontSize: 10, color: "#5DCAA5", marginTop: 2, letterSpacing: "0.06em", textTransform: "uppercase" }}>Home Services</div>
            </div>
          </div>
          <p style={{ fontSize: 12, color: "#7BAEC8", lineHeight: 1.7, margin: 0, maxWidth: 260 }}>
            Trusted home services at your doorstep. Verified professionals, transparent pricing, and hassle-free booking.
          </p>

          {/* Social icons */}
          <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
            {socialLinks.map((s) => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={s.label}
                style={{
                  width: 34, height: 34,
                  borderRadius: 8,
                  background: "rgba(255,255,255,0.07)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "#9AAFC7",
                  textDecoration: "none",
                  transition: "background 0.2s",
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = "rgba(29,158,117,0.25)"}
                onMouseLeave={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.07)"}
              >
                {s.icon}
              </a>
            ))}
          </div>
        </div>

        {/* Quick Links + Contact — flex, space-between */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.75rem" }}>

          {/* Quick Links — left */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#5DCAA5", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 12 }}>
              Quick Links
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {quickLinks.map((link) => (
                <Link
                  key={link.label}
                  href={link.path}
                  style={{
                    display: "block",
                    fontSize: 12, color: "#9AAFC7",
                    textDecoration: "none",
                    fontFamily: "'Sora', sans-serif",
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.color = "#5DCAA5"}
                  onMouseLeave={(e) => e.currentTarget.style.color = "#9AAFC7"}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Contact — right */}
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#5DCAA5", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 12 }}>
              Contact
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {contactInfo.map((item, i) => (
                <div key={i} style={{ display: "flex", alignItems: "flex-start", justifyContent: "flex-end", gap: 7, color: "#9AAFC7" }}>
                  <span style={{ marginTop: 1, flexShrink: 0 }}>{item.icon}</span>
                  <span style={{ fontSize: 11, lineHeight: 1.5 }}>{item.text}</span>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Legal links row */}
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: "1.5rem" }}>
          {legalLinks.map((link) => (
            <Link
              key={link.label}
              href={link.path}
              style={{
                fontSize: 11, color: "#7BAEC8",
                textDecoration: "underline",
                textDecorationColor: "rgba(123,174,200,0.35)",
                fontFamily: "'Sora', sans-serif",
              }}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* SSLCommerz trust badge */}
        <div
          style={{
            display: "inline-flex", alignItems: "center", gap: 7,
            background: "rgba(29,158,117,0.1)",
            border: "1px solid rgba(29,158,117,0.25)",
            borderRadius: 8,
            padding: "7px 12px",
            marginBottom: "1.5rem",
          }}
        >
          <ShieldIcon />
          <span style={{ fontSize: 11, color: "#5DCAA5", fontWeight: 600 }}>Secured by SSLCommerz</span>
        </div>

        {/* Bottom copyright bar */}
        <div
          style={{
            borderTop: "1px solid rgba(255,255,255,0.07)",
            paddingTop: "1rem",
            display: "flex",
            flexDirection: "column",
            gap: 4,
          }}
        >
          <div style={{ fontSize: 11, color: "#4E6A82" }}>
            © {new Date().getFullYear()} FixNext Sheba. All rights reserved.
          </div>
          <div style={{ fontSize: 10, color: "#3A5570" }}>
            Made with ❤️ in Dhaka, Bangladesh
          </div>
        </div>

      </div>
    </footer>
  );
}