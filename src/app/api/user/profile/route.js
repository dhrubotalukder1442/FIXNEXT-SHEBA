import clientPromise from "@/lib/mongodb";
import { verifyToken } from "@/lib/jwt";
import { cookies } from "next/headers";

export async function PATCH(req) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return Response.json({ success: false, message: "Unauthorized" }, { status: 401 });

    const payload = await verifyToken(token);
    if (!payload) return Response.json({ success: false, message: "Unauthorized" }, { status: 401 });

    const { avatar } = await req.json();
    if (!avatar) return Response.json({ success: false, message: "No data" }, { status: 400 });

    const client = await clientPromise;
    const db = client.db("fixnext-sheba");

    const { ObjectId } = await import("mongodb");
    await db.collection("users").updateOne(
      { _id: new ObjectId(payload.id) },
      { $set: { avatar } }
    );

    return Response.json({ success: true });
  } catch (e) {
    return Response.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}