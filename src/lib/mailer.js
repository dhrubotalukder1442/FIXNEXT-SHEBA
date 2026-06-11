import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
});

export async function sendOTP(email, otp) {
  await transporter.sendMail({
    from: `"FixNext Sheba" <${process.env.GMAIL_USER}>`,
    to: email,
    subject: "Your OTP Code - FixNext Sheba",
    html: `
      <div style="font-family: sans-serif; max-width: 400px; margin: 0 auto; padding: 2rem; background: #F0F2F5; border-radius: 12px;">
        <div style="background: #1D9E75; padding: 1rem; border-radius: 8px; text-align: center; margin-bottom: 1.5rem;">
          <h2 style="color: #fff; margin: 0;">FixNext Sheba</h2>
        </div>
        <h3 style="color: #2C2C2A;">Verify your email</h3>
        <p style="color: #888780;">Use this OTP to complete your signup:</p>
        <div style="background: #fff; border: 2px dashed #1D9E75; border-radius: 10px; padding: 1.5rem; text-align: center; margin: 1.5rem 0;">
          <span style="font-size: 36px; font-weight: 700; letter-spacing: 10px; color: #1D9E75;">${otp}</span>
        </div>
        <p style="color: #888780; font-size: 13px;">This OTP will expire in <strong>5 minutes</strong>.</p>
        <p style="color: #B4B2A9; font-size: 11px;">If you didn't request this, please ignore this email.</p>
      </div>
    `,
  });
}

// ── Booking Confirmation ─────────────────────────────────────────────────────
export async function sendBookingConfirmation({ to, name, service, option, address, scheduledAt, amount, transactionId }) {
  const scheduledText = scheduledAt
    ? new Date(scheduledAt).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
    : "As soon as possible";

  const rows = [
    ["Service", service],
    ["Package", option !== undefined ? `Option ${Number(option) + 1}` : "—"],
    ["Address", address],
    ["Scheduled", scheduledText],
    ["Amount Paid", `BDT ${amount?.toLocaleString()}`],
  ];

  await transporter.sendMail({
    from: `"FixNext Sheba" <${process.env.GMAIL_USER}>`,
    to,
    subject: "Booking Confirmed — FixNext Sheba",
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; background: #F0F2F5; padding: 2rem; border-radius: 12px;">
        <div style="background: #0A2540; padding: 1.25rem 1.5rem; border-radius: 10px; margin-bottom: 1.5rem; text-align: center;">
          <h2 style="color: #fff; margin: 0; font-size: 18px;">FixNext Sheba</h2>
          <p style="color: #5DCAA5; margin: 4px 0 0; font-size: 12px;">Home Services Platform</p>
        </div>

        <div style="background: #DCFCE7; border: 1px solid #9FE1CB; border-radius: 10px; padding: 1rem 1.25rem; margin-bottom: 1.25rem; text-align: center;">
          <div style="font-size: 28px; margin-bottom: 6px;">✅</div>
          <div style="font-size: 16px; font-weight: 700; color: #166534;">Payment Successful!</div>
          <div style="font-size: 13px; color: #166534; margin-top: 4px;">Your booking is confirmed, ${name}.</div>
        </div>

        <div style="background: #fff; border-radius: 10px; padding: 1.25rem; border: 1px solid #E5E7EB; margin-bottom: 1rem;">
          <div style="font-size: 11px; font-weight: 700; color: #888780; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 12px;">Booking Details</div>
          <table style="width: 100%; border-collapse: collapse;">
            ${rows.map(([label, val], idx) => `
              <tr style="${idx < rows.length - 1 ? "border-bottom: 1px solid #F0F2F5;" : ""}">
                <td style="padding: 7px 0; font-size: 13px; color: #888780; width: 40%;">${label}</td>
                <td style="padding: 7px 0; font-size: 13px; font-weight: 600; color: #2C2C2A; text-align: right;">${val}</td>
              </tr>
            `).join("")}
          </table>
        </div>

        <div style="background: #F9FAFB; border-radius: 8px; padding: 10px 14px; margin-bottom: 1.25rem; font-size: 11px; color: #888780;">
          Transaction ID: <strong style="color: #2C2C2A; font-family: monospace;">${transactionId}</strong>
        </div>

        <div style="background: #FEF3C7; border: 1px solid #FDE68A; border-radius: 8px; padding: 10px 14px; font-size: 12px; color: #92400E;">
          ⏳ A serviceman will be assigned shortly. You'll receive another email once they accept.
        </div>

        <p style="color: #B4B2A9; font-size: 11px; text-align: center; margin-top: 1.5rem;">
          FixNext Sheba · Home Services Platform · Bangladesh
        </p>
      </div>
    `,
  });
}

// ── Booking Accepted ──────────────────────────────────────────────────────────
export async function sendBookingAccepted({ to, name, service, address, scheduledAt, servicemanName, servicemanPhone }) {
  const scheduledText = scheduledAt
    ? new Date(scheduledAt).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
    : "As soon as possible";

  const servicemanRows = [
    ["Name", servicemanName],
    ["Phone", servicemanPhone || "Will contact you soon"],
  ];

  const bookingRows = [
    ["Service", service],
    ["Address", address],
    ["Scheduled", scheduledText],
  ];

  await transporter.sendMail({
    from: `"FixNext Sheba" <${process.env.GMAIL_USER}>`,
    to,
    subject: "A Serviceman is on the way! — FixNext Sheba",
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; background: #F0F2F5; padding: 2rem; border-radius: 12px;">
        <div style="background: #0A2540; padding: 1.25rem 1.5rem; border-radius: 10px; margin-bottom: 1.5rem; text-align: center;">
          <h2 style="color: #fff; margin: 0; font-size: 18px;">FixNext Sheba</h2>
          <p style="color: #5DCAA5; margin: 4px 0 0; font-size: 12px;">Home Services Platform</p>
        </div>

        <div style="background: #DBEAFE; border: 1px solid #93C5FD; border-radius: 10px; padding: 1rem 1.25rem; margin-bottom: 1.25rem; text-align: center;">
          <div style="font-size: 28px; margin-bottom: 6px;">🔧</div>
          <div style="font-size: 16px; font-weight: 700; color: #1E40AF;">Serviceman Assigned!</div>
          <div style="font-size: 13px; color: #1E40AF; margin-top: 4px;">Great news, ${name}. Someone is on the way.</div>
        </div>

        <div style="background: #fff; border-radius: 10px; padding: 1.25rem; border: 1px solid #E5E7EB; margin-bottom: 1rem;">
          <div style="font-size: 11px; font-weight: 700; color: #888780; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 12px;">Your Serviceman</div>
          <table style="width: 100%; border-collapse: collapse;">
            ${servicemanRows.map(([label, val], idx) => `
              <tr style="${idx < servicemanRows.length - 1 ? "border-bottom: 1px solid #F0F2F5;" : ""}">
                <td style="padding: 8px 0; font-size: 13px; color: #888780; width: 40%;">${label}</td>
                <td style="padding: 8px 0; font-size: 13px; font-weight: 600; color: #2C2C2A; text-align: right;">${val}</td>
              </tr>
            `).join("")}
          </table>
        </div>

        <div style="background: #fff; border-radius: 10px; padding: 1.25rem; border: 1px solid #E5E7EB;">
          <div style="font-size: 11px; font-weight: 700; color: #888780; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 12px;">Booking Summary</div>
          <table style="width: 100%; border-collapse: collapse;">
            ${bookingRows.map(([label, val], idx) => `
              <tr style="${idx < bookingRows.length - 1 ? "border-bottom: 1px solid #F0F2F5;" : ""}">
                <td style="padding: 8px 0; font-size: 13px; color: #888780; width: 40%;">${label}</td>
                <td style="padding: 8px 0; font-size: 13px; font-weight: 600; color: #2C2C2A; text-align: right;">${val}</td>
              </tr>
            `).join("")}
          </table>
        </div>

        <p style="color: #B4B2A9; font-size: 11px; text-align: center; margin-top: 1.5rem;">
          FixNext Sheba · Home Services Platform · Bangladesh
        </p>
      </div>
    `,
  });
}