"use client";
import Link from "next/link";

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
    <footer style={{ background: "#0A2540", fontFamily: "'Sora', sans-serif", marginBottom: 0, paddingBottom: 0 }}>

      {/* Top gradient divider */}
      <div style={{ height: 3, background: "linear-gradient(90deg, #1D9E75 0%, #5DCAA5 50%, transparent 100%)" }} />

      <div style={{ padding: "1.5rem 1.25rem 1rem" }}>

        {/* TOP ROW: Brand (left) + Links (right) */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, marginBottom: "1.25rem" }}>

          {/* LEFT: Brand block */}
          <div style={{ flexShrink: 0, maxWidth: 220 }}>

            {/* Logo + name */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <div style={{ width: 34, height: 34, background: "#1D9E75", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <svg viewBox="0 0 24 24" fill="none" width="18" height="18">
                  <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M9 22V12h6v10" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#fff", lineHeight: 1 }}>FixNext Sheba</div>
                <div style={{ fontSize: 9, color: "#5DCAA5", marginTop: 2, letterSpacing: "0.06em", textTransform: "uppercase" }}>Home Services</div>
              </div>
            </div>

            {/* Description */}
            <p style={{ fontSize: 11, color: "#7BAEC8", lineHeight: 1.6, margin: "0 0 12px" }}>
              Trusted home services at your doorstep. Verified professionals, transparent pricing.
            </p>

            {/* Social icons — <a tag fixed here */}
            <div style={{ display: "flex", gap: 8 }}>
              {socialLinks.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.label}
                  style={{
                    width: 30, height: 30, borderRadius: 7,
                    background: "rgba(255,255,255,0.07)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: "#9AAFC7", textDecoration: "none", transition: "background 0.2s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(29,158,117,0.25)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.07)")}
                >
                  {s.icon}
                </a>
              ))}
            </div>
          </div>

          {/* RIGHT: Quick Links + Contact side by side */}
          <div style={{ display: "flex", gap: 32, flexShrink: 0 }}>

            {/* Quick Links */}
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#5DCAA5", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 10 }}>
                Quick Links
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                {quickLinks.map((link) => (
                  <Link
                    key={link.label}
                    href={link.path}
                    style={{ display: "block", fontSize: 11, color: "#9AAFC7", textDecoration: "none", fontFamily: "'Sora', sans-serif", transition: "color 0.2s" }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "#5DCAA5")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "#9AAFC7")}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>

            {/* Contact */}
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#5DCAA5", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 10 }}>
                Contact
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                {contactInfo.map((item, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 7, color: "#9AAFC7" }}>
                    <span style={{ marginTop: 1, flexShrink: 0 }}>{item.icon}</span>
                    <span style={{ fontSize: 11, lineHeight: 1.4 }}>{item.text}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>

        {/* MIDDLE ROW: Legal links + SSLCommerz badge */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10, marginBottom: "1rem" }}>

          <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
            {legalLinks.map((link) => (
              <Link
                key={link.label}
                href={link.path}
                style={{ fontSize: 10, color: "#7BAEC8", textDecoration: "underline", textDecorationColor: "rgba(123,174,200,0.35)", fontFamily: "'Sora', sans-serif" }}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(29,158,117,0.1)", border: "1px solid rgba(29,158,117,0.25)", borderRadius: 7, padding: "5px 10px" }}>
            <ShieldIcon />
            <span style={{ fontSize: 10, color: "#5DCAA5", fontWeight: 600 }}>Secured by SSLCommerz</span>
          </div>

        </div>

        {/* BOTTOM ROW: Copyright */}
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.07)", paddingTop: "0.75rem" }}>
          <div style={{ fontSize: 10, color: "#4E6A82" }}>
            © {new Date().getFullYear()} FixNext Sheba. All rights reserved. · Made with ❤️ in Dhaka, Bangladesh
          </div>
        </div>

      </div>
    </footer>
  );
}