import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { verifyToken } from "@/lib/jwt";
import { cookies } from "next/headers";

export async function PATCH(req) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return Response.json({ success: false, message: "Unauthorized" }, { status: 401 });

    const payload = await verifyToken(token);
    if (!payload || payload.role !== "serviceman") {
      return Response.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { phone, specialty, bio, avatar } = await req.json();

    const updateData = {};
    if (phone !== undefined) updateData.phone = phone;
    if (specialty !== undefined) updateData.specialty = specialty;
    if (bio !== undefined) updateData.bio = bio;
    if (avatar !== undefined) updateData.avatar = avatar;

    const client = await clientPromise;
    const db = client.db("fixnext-sheba");

    await db.collection("users").updateOne(
      { _id: new ObjectId(payload.id) },
      { $set: updateData }
    );

    const updated = await db.collection("users").findOne({ _id: new ObjectId(payload.id) });

    return Response.json({
      success: true,
      user: {
        name: updated.name,
        email: updated.email,
        phone: updated.phone,
        specialty: updated.specialty,
        bio: updated.bio,
        avatar: updated.avatar,
        rating: updated.rating,
        totalReviews: updated.totalReviews,
      },
    });
  } catch (error) {
    console.error(error);
    return Response.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}