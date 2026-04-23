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