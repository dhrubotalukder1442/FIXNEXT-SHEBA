import clientPromise from "@/lib/mongodb";
import { verifyToken } from "@/lib/jwt";
import { cookies } from "next/headers";
import { ObjectId } from "mongodb";

// ✅ Helper: cookie থেকে token নিয়ে admin কিনা verify করে DB return করে
async function getAdminDb() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) return null;
  const payload = await verifyToken(token);
  if (!payload || payload.role !== "admin") return null;
  const client = await clientPromise;
  return client.db("fixnext-sheba");
}

// GET — public endpoint, signup page এ specialist list দেখানোর জন্য
export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db("fixnext-sheba");
    const list = await db
      .collection("specialists")
      .find({})
      .sort({ name: 1 })
      .toArray();
    return Response.json({ success: true, data: list });
  } catch {
    return Response.json({ success: false, message: "Server error" }, { status: 500 });
  }
}

// POST — admin only: নতুন specialist type add করো
// body: { name: "Electrician", icon: "⚡", subtitle: "Wiring & repairs", options: [{label:"Basic",price:500},{label:"Full",price:1200}] }
export async function POST(req) {
  try {
    const db = await getAdminDb();
    if (!db) return Response.json({ success: false, message: "Unauthorized" }, { status: 403 });

    const { name, icon, subtitle, options } = await req.json();

    if (!name?.trim()) {
      return Response.json({ success: false, message: "Specialist name required" }, { status: 400 });
    }
    if (!options || options.length === 0) {
      return Response.json({ success: false, message: "At least one service option required" }, { status: 400 });
    }

    const result = await db.collection("specialists").insertOne({
      name: name.trim(),
      icon: icon || "🔧",
      subtitle: subtitle?.trim() || "",
      // ✅ price গুলো সবসময় Number হিসেবে save করো
      options: options.map((o) => ({
        label: o.label,
        price: Number(o.price) || 0,
      })),
      createdAt: new Date(),
    });

    return Response.json({ success: true, id: result.insertedId });
  } catch {
    return Response.json({ success: false, message: "Server error" }, { status: 500 });
  }
}

// PATCH — admin only: specialist এর name/icon/subtitle/options update করো
// body: { id: "...", name: "...", options: [...] }
export async function PATCH(req) {
  try {
    const db = await getAdminDb();
    if (!db) return Response.json({ success: false, message: "Unauthorized" }, { status: 403 });

    const { id, ...updates } = await req.json();
    if (!id) return Response.json({ success: false, message: "id required" }, { status: 400 });

    // options থাকলে price গুলো Number করে দাও
    if (updates.options) {
      updates.options = updates.options.map((o) => ({
        label: o.label,
        price: Number(o.price) || 0,
      }));
    }

    await db.collection("specialists").updateOne(
      { _id: new ObjectId(id) },
      { $set: { ...updates, updatedAt: new Date() } }
    );

    return Response.json({ success: true });
  } catch {
    return Response.json({ success: false, message: "Server error" }, { status: 500 });
  }
}

// DELETE — admin only: specialist মুছে ফেলো
// body: { id: "..." }
export async function DELETE(req) {
  try {
    const db = await getAdminDb();
    if (!db) return Response.json({ success: false, message: "Unauthorized" }, { status: 403 });

    const { id } = await req.json();
    if (!id) return Response.json({ success: false, message: "id required" }, { status: 400 });

    await db.collection("specialists").deleteOne({ _id: new ObjectId(id) });
    return Response.json({ success: true });
  } catch {
    return Response.json({ success: false, message: "Server error" }, { status: 500 });
  }
}