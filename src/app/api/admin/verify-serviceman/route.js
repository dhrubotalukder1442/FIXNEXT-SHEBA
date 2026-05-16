import clientPromise from "@/lib/mongodb";
import { verifyToken } from "@/lib/jwt";
import { cookies } from "next/headers";
import { ObjectId } from "mongodb";

export async function PATCH(req) {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) return Response.json({ success: false }, { status: 401 });

  const payload = await verifyToken(token);
  if (!payload || payload.role !== "admin")
    return Response.json({ success: false }, { status: 403 });

  const { servicemanId, action } = await req.json();
  // action = "approved" অথবা "rejected"

  const client = await clientPromise;
  const db = client.db("fixnext-sheba");

  await db.collection("users").updateOne(
    { _id: new ObjectId(servicemanId) },
    { $set: { status: action, verifiedAt: new Date() } }
  );

  return Response.json({ success: true });
}