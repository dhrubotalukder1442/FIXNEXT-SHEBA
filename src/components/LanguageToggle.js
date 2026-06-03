"use client";

export default function LanguageToggle({ lang, onToggle, style = {} }) {
  return (
    <button
      onClick={onToggle}
      title={lang === "en" ? "বাংলায় দেখুন" : "View in English"}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 5,
        background: "rgba(255,255,255,0.08)",
        border: "1px solid rgba(255,255,255,0.18)",
        color: "#fff",
        borderRadius: 8,
        padding: "5px 10px",
        fontSize: 12,
        fontWeight: 700,
        cursor: "pointer",
        fontFamily: "'Sora', sans-serif",
        letterSpacing: "0.02em",
        flexShrink: 0,
        ...style,
      }}
    >
      {lang === "en" ? (
        <>
          <span style={{ fontSize: 14 }}>বাং</span>
          <span style={{ opacity: 0.6, fontSize: 10, fontWeight: 400 }}>EN</span>
        </>
      ) : (
        <>
          <span style={{ fontSize: 14 }}>EN</span>
          <span style={{ opacity: 0.6, fontSize: 10, fontWeight: 400 }}>বাং</span>
        </>
      )}
    </button>
  );
}