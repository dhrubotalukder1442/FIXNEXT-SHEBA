import clientPromise from "@/lib/mongodb";
import { sendOTP } from "@/lib/mailer";

export async function POST(req) {
  try {
    const { email } = await req.json();

    if (!email) {
      return Response.json({ success: false, message: "Email required" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db("fixnext-sheba");

    const existing = await db.collection("users").findOne({ email });
    if (existing) {
      return Response.json({ success: false, message: "Email already registered" }, { status: 409 });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await db.collection("otps").updateOne(
      { email },
      { $set: { email, otp, expiresAt, createdAt: new Date() } },
      { upsert: true }
    );

    await sendOTP(email, otp);

    return Response.json({ success: true, message: "OTP sent successfully" });
  } catch (error) {
    console.error("OTP error:", error);
    return Response.json({ success: false, message: "Failed to send OTP" }, { status: 500 });
  }
}