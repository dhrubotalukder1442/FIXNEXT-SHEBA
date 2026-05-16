import clientPromise from "@/lib/mongodb";
import { verifyToken } from "@/lib/jwt";
import { cookies } from "next/headers";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) return Response.json({ success: false }, { status: 401 });

  const payload = await verifyToken(token);
  if (!payload || payload.role !== "admin")
    return Response.json({ success: false }, { status: 403 });

  const client = await clientPromise;
  const db = client.db("fixnext-sheba");

  const list = await db
    .collection("users")
    .find({ role: "serviceman", status: "pending" })
    .project({ password: 0 })
    .toArray();

  return Response.json({ success: true, data: list });
}