import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { verifyToken } from "@/lib/jwt";
import { cookies } from "next/headers";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const bookingId = searchParams.get("bookingId");

    if (!bookingId) {
      return Response.json({ success: false, message: "bookingId required" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db("fixnext-sheba");

    const messages = await db
      .collection("messages")
      .find({ bookingId })
      .sort({ createdAt: 1 })
      .toArray();

    return Response.json({ success: true, data: messages });
  } catch (error) {
    return Response.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return Response.json({ success: false, message: "Unauthorized" }, { status: 401 });

    const payload = await verifyToken(token);
    if (!payload) return Response.json({ success: false, message: "Unauthorized" }, { status: 401 });

    const { bookingId, message } = await req.json();

    if (!bookingId || !message?.trim()) {
      return Response.json({ success: false, message: "Missing fields" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db("fixnext-sheba");

    // booking verify করো
    const booking = await db.collection("bookings").findOne({ _id: new ObjectId(bookingId) });
    if (!booking) {
      return Response.json({ success: false, message: "Booking not found" }, { status: 404 });
    }

    const newMessage = {
      bookingId,
      senderId: payload.id,
      senderName: payload.name,
      senderRole: payload.role,
      message: message.trim(),
      createdAt: new Date(),
    };

    const result = await db.collection("messages").insertOne(newMessage);

    return Response.json({
      success: true,
      data: { ...newMessage, _id: result.insertedId },
    });
  } catch (error) {
    return Response.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}