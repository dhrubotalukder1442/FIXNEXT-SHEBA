import clientPromise from "@/lib/mongodb";

export async function POST(req) {
  try {
    const { email, otp } = await req.json();

    const client = await clientPromise;
    const db = client.db("fixnext-sheba");

    const record = await db.collection("otps").findOne({ email });

    if (!record) {
      return Response.json({ success: false, message: "OTP not found" }, { status: 400 });
    }

    if (record.otp !== otp) {
      return Response.json({ success: false, message: "Invalid OTP" }, { status: 400 });
    }

    if (new Date() > new Date(record.expiresAt)) {
      return Response.json({ success: false, message: "OTP expired" }, { status: 400 });
    }

    await db.collection("otps").deleteOne({ email });

    return Response.json({ success: true, message: "OTP verified" });
  } catch (error) {
    return Response.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}