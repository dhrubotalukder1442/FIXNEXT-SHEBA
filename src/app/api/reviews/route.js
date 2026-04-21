import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const servicemanId = searchParams.get("servicemanId");

    const client = await clientPromise;
    const db = client.db("fixnext-sheba");

    const query = servicemanId ? { servicemanId } : {};
    const reviews = await db.collection("reviews").find(query).sort({ createdAt: -1 }).toArray();

    return Response.json({ success: true, data: reviews });
  } catch (error) {
    return Response.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const { bookingId, servicemanId, userId, userName, rating, comment } = await req.json();

    if (!bookingId || !servicemanId || !rating) {
      return Response.json({ success: false, message: "Missing required fields" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db("fixnext-sheba");

    // একই booking এ আগে review দিয়েছে কিনা check
    const existing = await db.collection("reviews").findOne({ bookingId });
    if (existing) {
      return Response.json({ success: false, message: "Already reviewed" }, { status: 409 });
    }

    // review save করো
    await db.collection("reviews").insertOne({
      bookingId,
      servicemanId,
      userId,
      userName,
      rating,
      comment: comment || "",
      createdAt: new Date(),
    });

    // serviceman এর average rating update করো
    const allReviews = await db.collection("reviews").find({ servicemanId }).toArray();
    const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;

    await db.collection("users").updateOne(
      { _id: new ObjectId(servicemanId) },
      { $set: { rating: Math.round(avgRating * 10) / 10, totalReviews: allReviews.length } }
    );

    return Response.json({ success: true });
  } catch (error) {
    console.error("Review error:", error);
    return Response.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}