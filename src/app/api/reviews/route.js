import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { sanitize, isValidObjectId } from "@/lib/validate";

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
    const body = await req.json();

    const bookingId = sanitize(body.bookingId || "");
    const servicemanId = sanitize(body.servicemanId || "");
    const userId = sanitize(body.userId || "");
    const userName = sanitize(body.userName || "");
    const rating = parseInt(body.rating);
    const comment = sanitize(body.comment || "");

    // ✅ Validation
    if (!bookingId || !servicemanId || !rating) {
      return Response.json(
        { success: false, message: "Missing required fields" },
        { status: 400 }
      );
    }

    if (!isValidObjectId(servicemanId)) {
      return Response.json(
        { success: false, message: "Invalid serviceman ID" },
        { status: 400 }
      );
    }

    if (rating < 1 || rating > 5) {
      return Response.json(
        { success: false, message: "Rating must be between 1 and 5" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db("fixnext-sheba");

    // “Verify whether a review already exists for this booking.”
    const existing = await db.collection("reviews").findOne({ bookingId });
    if (existing) {
      return Response.json({ success: false, message: "Already reviewed" }, { status: 409 });
    }

    // Store the review
    await db.collection("reviews").insertOne({
      bookingId,
      servicemanId,
      userId,
      userName,
      rating,
      comment: comment || "",
      createdAt: new Date(),
    });

    // “Update the serviceman’s average rating.”
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