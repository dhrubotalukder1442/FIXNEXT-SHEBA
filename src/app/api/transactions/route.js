import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/jwt";

// MongoDB Aggregation Pipeline দিয়ে transaction এর সাথে booking details join করি।
// কেন aggregation? কারণ bookingId string হিসেবে store আছে, তাই $lookup এর আগে
// $addFields দিয়ে সেটাকে ObjectId তে convert করতে হয়। এটা MongoDB এর একটা
// common pattern — foreign key string হলে এভাবেই join করতে হয়।
function buildPipeline(matchStage) {
  return [
    { $match: matchStage },
    { $sort: { createdAt: -1 } },

    // bookingId (string) → ObjectId convert করো, তারপর bookings collection এ lookup করো
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

    // $lookup সবসময় array return করে। আমরা একটাই booking expect করি, তাই
    // $first দিয়ে array থেকে প্রথম (একমাত্র) element বের করি।
    {
      $addFields: {
        booking: { $first: "$booking" },
      },
    },

    // শুধু দরকারী fields রাখো — client এ unnecessary data না পাঠানোই ভালো
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
      // Serviceman এর নিজের bookings খুঁজে সেই bookingId গুলো দিয়ে filter করি।
      // এই কাজটা একটা aggregation এ করা যেত কিন্তু complexity বাড়ত —
      // এই দুই-step approach টা পড়তে অনেক সহজ।
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