import clientPromise from "@/lib/mongodb";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/jwt";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return Response.json({ success: false, message: "Unauthorized" }, { status: 401 });

    const payload = await verifyToken(token);
    if (!payload) return Response.json({ success: false, message: "Unauthorized" }, { status: 401 });

    const client = await clientPromise;
    const db = client.db("fixnext-sheba");

    let transactions = [];

    if (payload.role === "admin") {
     
      transactions = await db.collection("transactions")
        .find({})
        .sort({ createdAt: -1 })
        .toArray();

    } else if (payload.role === "serviceman") {
      
      const bookings = await db.collection("bookings")
        .find({ servicemanId: payload.id })
        .toArray();
      const bookingIds = bookings.map(b => b._id.toString());

      transactions = await db.collection("transactions")
        .find({ bookingId: { $in: bookingIds } })
        .sort({ createdAt: -1 })
        .toArray();

    } else {
     
      transactions = await db.collection("transactions")
        .find({ userId: payload.id })
        .sort({ createdAt: -1 })
        .toArray();
    }

    return Response.json({ success: true, data: transactions });
  } catch (error) {
    console.error("Transactions fetch error:", error);
    return Response.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}