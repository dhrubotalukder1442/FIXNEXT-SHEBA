"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

// Email validation
const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

// Password strength checker
const getPasswordStrength = (password) => {
  if (!password) return null;
  const checks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
  };
  const passed = Object.values(checks).filter(Boolean).length;
  if (passed <= 2) return { level: "weak", color: "#DC2626", bg: "#FEE2E2", label: "Weak", width: "33%", checks };
  if (passed <= 3) return { level: "medium", color: "#D97706", bg: "#FEF3C7", label: "Medium", width: "66%", checks };
  return { level: "strong", color: "#16A34A", bg: "#DCFCE7", label: "Strong", width: "100%", checks };
};

export default function SignupPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("user");
  const [showPassword, setShowPassword] = useState(false);
  const [showStrength, setShowStrength] = useState(false);
  const [loading, setLoading] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [emailError, setEmailError] = useState("");

  const strength = getPasswordStrength(password);

  const inputStyle = {
    width: "100%", padding: "10px 12px", marginBottom: 8,
    border: "1px solid #E5E7EB", borderRadius: 10, fontSize: 13,
    fontFamily: "'Sora', sans-serif", color: "#2C2C2A",
    background: "#FAFAFA", outline: "none", boxSizing: "border-box",
  };

  const startCountdown = () => {
    setCountdown(60);
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) { clearInterval(timer); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  const handleEmailChange = (e) => {
    const val = e.target.value;
    setIdentifier(val);
    if (val && !isValidEmail(val)) {
      setEmailError("Please enter a valid email address");
    } else {
      setEmailError("");
    }
  };

  const handleSendOTP = async () => {
    if (!name) return alert("Please enter your name");
    if (!identifier) return alert("Please enter your email");
    if (!isValidEmail(identifier)) return alert("Please enter a valid email address");
    if (!password) return alert("Please enter a password");
    if (strength?.level === "weak") return alert("Password is too weak. Please use a stronger password.");

    setLoading(true);
    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: identifier }),
      });
      const data = await res.json();
      if (data.success) {
        setStep(2);
        startCountdown();
      } else {
        alert(data.message || "Failed to send OTP");
      }
    } catch {
      alert("Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setOtpLoading(true);
    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: identifier }),
      });
      const data = await res.json();
      if (data.success) startCountdown();
      else alert(data.message || "Failed to resend OTP");
    } catch {
      alert("Something went wrong.");
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifyAndSignup = async () => {
    if (!otp) return alert("Please enter OTP");
    setLoading(true);
    try {
      const verifyRes = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: identifier, otp }),
      });
      const verifyData = await verifyRes.json();
      if (!verifyData.success) {
        alert(verifyData.message || "Invalid OTP");
        setLoading(false);
        return;
      }

      const signupRes = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, identifier, password, role }),
      });
      const signupData = await signupRes.json();
      if (signupData.success) {
        localStorage.setItem("user", JSON.stringify(signupData.user));
        if (signupData.user.role === "serviceman") router.push("/serviceman");
        else router.push("/");
      } else {
        alert(signupData.message || "Signup failed");
      }
    } catch {
      alert("Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const EyeIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
    </svg>
  );

  const EyeOffIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );

  const CheckIcon = ({ passed }) => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={passed ? "#16A34A" : "#B4B2A9"} strokeWidth="2.5" strokeLinecap="round">
      {passed ? <path d="M5 13l4 4L19 7" /> : <circle cx="12" cy="12" r="10" />}
    </svg>
  );

  return (
    <main style={{ fontFamily: "'Sora', sans-serif", background: "#F0F2F5", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "1.25rem" }}>
      <div style={{ width: "100%", maxWidth: 380 }}>

        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: "1.75rem", justifyContent: "center" }}>
          <div style={{ width: 40, height: 40, background: "#1D9E75", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg viewBox="0 0 24 24" fill="none" width="22" height="22">
              <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: "#2C2C2A", lineHeight: 1 }}>FixNext Sheba</div>
            <div style={{ fontSize: 11, color: "#1D9E75", textTransform: "uppercase", letterSpacing: "0.04em" }}>Home Services</div>
          </div>
        </div>

        <div style={{ background: "#fff", borderRadius: 16, padding: "1.75rem", border: "1px solid #E5E7EB" }}>

          {/* Step 1 — Form */}
          {step === 1 && (
            <>
              <div style={{ fontSize: 20, fontWeight: 700, color: "#2C2C2A", marginBottom: 4 }}>Create account</div>
              <div style={{ fontSize: 13, color: "#888780", marginBottom: "1.25rem" }}>Create a new account</div>

              {/* Name */}
              <input
                placeholder="Your Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={inputStyle}
              />

              {/* Email */}
              <div style={{ marginBottom: 8 }}>
                <input
                  placeholder="Email"
                  value={identifier}
                  onChange={handleEmailChange}
                  style={{
                    ...inputStyle,
                    marginBottom: 0,
                    border: emailError ? "1px solid #DC2626" : "1px solid #E5E7EB",
                  }}
                />
                {emailError && (
                  <div style={{ fontSize: 11, color: "#DC2626", marginTop: 4, display: "flex", alignItems: "center", gap: 4 }}>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2.5" strokeLinecap="round">
                      <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    {emailError}
                  </div>
                )}
                {identifier && !emailError && (
                  <div style={{ fontSize: 11, color: "#16A34A", marginTop: 4, display: "flex", alignItems: "center", gap: 4 }}>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2.5" strokeLinecap="round">
                      <path d="M5 13l4 4L19 7" />
                    </svg>
                    Valid email
                  </div>
                )}
              </div>

              {/* Password */}
              <div style={{ marginBottom: "1.25rem" }}>
                <div style={{ position: "relative" }}>
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setShowStrength(true); }}
                    onFocus={() => setShowStrength(true)}
                    style={{ ...inputStyle, marginBottom: 0, paddingRight: 42 }}
                  />
                  <button
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#888780", padding: 0, display: "flex", alignItems: "center" }}
                  >
                    {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </div>

                {/* Strength bar */}
                {showStrength && password && strength && (
                  <div style={{ marginTop: 8 }}>
                    {/* Bar */}
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                      <div style={{ flex: 1, height: 4, background: "#E5E7EB", borderRadius: 99, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: strength.width, background: strength.color, borderRadius: 99, transition: "width 0.3s, background 0.3s" }} />
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 700, color: strength.color, minWidth: 40 }}>{strength.label}</span>
                    </div>

                    {/* Checklist */}
                    <div style={{ background: "#F9FAFB", borderRadius: 8, padding: "10px 12px", border: "1px solid #E5E7EB" }}>
                      <div style={{ fontSize: 10, fontWeight: 600, color: "#888780", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>Password requirements</div>
                      {[
                        { key: "length", label: "At least 8 characters" },
                        { key: "uppercase", label: "One uppercase letter (A-Z)" },
                        { key: "lowercase", label: "One lowercase letter (a-z)" },
                        { key: "number", label: "One number (0-9)" },
                        { key: "special", label: "One special character (!@#$...)" },
                      ].map(({ key, label }) => (
                        <div key={key} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                          <CheckIcon passed={strength.checks[key]} />
                          <span style={{ fontSize: 11, color: strength.checks[key] ? "#16A34A" : "#888780" }}>{label}</span>
                        </div>
                      ))}
                    </div>

                    {/* Suggestion if weak */}
                    {strength.level === "weak" && (
                      <div style={{ marginTop: 6, background: "#FEF3C7", borderRadius: 8, padding: "8px 10px", border: "1px solid #FDE68A" }}>
                        <div style={{ fontSize: 11, color: "#92400E", fontWeight: 600 }}>💡 Suggestion</div>
                        <div style={{ fontSize: 11, color: "#92400E", marginTop: 2 }}>
                          Try something like: <strong>Fix@2024Next!</strong>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Role */}
              <div style={{ marginBottom: "1.25rem" }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: "#888780", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>I am a</div>
                <div style={{ display: "flex", gap: 8 }}>
                  {["user", "serviceman"].map((r) => (
                    <div key={r} onClick={() => setRole(r)} style={{ flex: 1, padding: "10px", borderRadius: 10, textAlign: "center", cursor: "pointer", fontSize: 13, fontWeight: 600, border: role === r ? "1.5px solid #1D9E75" : "1px solid #E5E7EB", background: role === r ? "#F0FBF6" : "#FAFAFA", color: role === r ? "#1D9E75" : "#888780" }}>
                      {r === "user" ? "👤 Customer" : "🔧 Serviceman"}
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={handleSendOTP}
                disabled={loading || !!emailError || !isValidEmail(identifier)}
                style={{ width: "100%", background: loading || !!emailError || !isValidEmail(identifier) ? "#B4B2A9" : "#1D9E75", color: "#fff", border: "none", borderRadius: 12, padding: "13px", fontSize: 14, fontWeight: 700, cursor: loading || !!emailError || !isValidEmail(identifier) ? "not-allowed" : "pointer", fontFamily: "inherit" }}
              >
                {loading ? "Sending OTP..." : "Continue"}
              </button>

              <div style={{ textAlign: "center", fontSize: 13, color: "#888780", marginTop: "1rem" }}>
                Already have an account?{" "}
                <span onClick={() => router.push("/login")} style={{ color: "#1D9E75", fontWeight: 700, cursor: "pointer" }}>Sign in</span>
              </div>
            </>
          )}

          {/* Step 2 — OTP */}
          {step === 2 && (
            <>
              <button onClick={() => setStep(1)} style={{ background: "none", border: "none", cursor: "pointer", color: "#888780", fontSize: 12, padding: 0, marginBottom: "1rem", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 4 }}>
                ← Back
              </button>

              <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
                <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#E1F5EE", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#1D9E75" strokeWidth="2" strokeLinecap="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                    <polyline points="22,6 12,13 2,6" />
                  </svg>
                </div>
                <div style={{ fontSize: 18, fontWeight: 700, color: "#2C2C2A", marginBottom: 6 }}>Check your email</div>
                <div style={{ fontSize: 13, color: "#888780", lineHeight: 1.5 }}>
                  We sent a 6-digit OTP to<br />
                  <strong style={{ color: "#2C2C2A" }}>{identifier}</strong>
                </div>
              </div>

              <input
                placeholder="Enter 6-digit OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                maxLength={6}
                style={{ ...inputStyle, letterSpacing: 8, fontWeight: 700, textAlign: "center", fontSize: 18, marginBottom: "1.25rem" }}
              />

              <button
                onClick={handleVerifyAndSignup}
                disabled={loading || otp.length !== 6}
                style={{ width: "100%", background: otp.length !== 6 || loading ? "#B4B2A9" : "#1D9E75", color: "#fff", border: "none", borderRadius: 12, padding: "13px", fontSize: 14, fontWeight: 700, cursor: otp.length !== 6 || loading ? "not-allowed" : "pointer", fontFamily: "inherit", marginBottom: 12 }}
              >
                {loading ? "Creating account..." : "Verify & Create Account"}
              </button>

              <div style={{ textAlign: "center", fontSize: 13, color: "#888780" }}>
                Didn't receive?{" "}
                {countdown > 0 ? (
                  <span style={{ color: "#B4B2A9" }}>Resend in {countdown}s</span>
                ) : (
                  <span onClick={handleResendOTP} style={{ color: "#1D9E75", fontWeight: 700, cursor: otpLoading ? "not-allowed" : "pointer" }}>
                    {otpLoading ? "Sending..." : "Resend OTP"}
                  </span>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  );
}