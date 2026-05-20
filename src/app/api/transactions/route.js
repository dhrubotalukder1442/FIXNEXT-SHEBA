import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/jwt";

// Use the MongoDB Aggregation Pipeline to join booking details with the transaction.
// Why aggregation? Because bookingId is stored as a string, so before using $lookup,
// we need to convert it to ObjectId using $addFields. This is a common MongoDB pattern —
// when a foreign key is stored as a string, joins are handled this way.
function buildPipeline(matchStage) {
  return [
    { $match: matchStage },
    { $sort: { createdAt: -1 } },

    // Convert bookingId (string) to ObjectId, then perform a lookup in the bookings collection.
    {
      $addFields: {
        bookingObjectId: { $toObjectId: "$bookingId" },
      },
    },
    {
      $lookup: {
        from: "bookings",
        localField: "bookingObjectId",
        foreignField: "_id",
        as: "booking",
      },
    },

    // $lookup always returns an array. Since we expect only one booking,
// we use $first to extract the first (and only) element from the array.
    {
      $addFields: {
        booking: { $first: "$booking" },
      },
    },

    // Keep only the necessary fields — it's better not to send unnecessary data to the client.
    {
      $project: {
        transactionId: 1,
        bookingId: 1,
        amount: 1,
        status: 1,
        createdAt: 1,
        paidAt: 1,
        "booking.service": 1,
        "booking.option": 1,
        "booking.name": 1,
        "booking.address": 1,
        "booking.createdAt": 1,
        "booking.servicemanId": 1,
        "booking.status": 1,
      },
    },
  ];
}

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
        .aggregate(buildPipeline({}))
        .toArray();

    } else if (payload.role === "serviceman") {
      // Find the serviceman's own bookings and filter using those bookingIds.
// This could be done in a single aggregation, but it would increase complexity —
// this two-step approach is much easier to read and maintain.
      const bookings = await db.collection("bookings")
        .find({ servicemanId: payload.id }, { projection: { _id: 1 } })
        .toArray();
      const bookingIds = bookings.map(b => b._id.toString());

      transactions = await db.collection("transactions")
        .aggregate(buildPipeline({ bookingId: { $in: bookingIds } }))
        .toArray();

    } else {
      transactions = await db.collection("transactions")
        .aggregate(buildPipeline({ userId: payload.id }))
        .toArray();
    }

    return Response.json({ success: true, data: transactions });
  } catch (error) {
    console.error("Transactions fetch error:", error);
    return Response.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}