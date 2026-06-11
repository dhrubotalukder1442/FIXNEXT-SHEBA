import clientPromise from "@/lib/mongodb";
import { verifyToken } from "@/lib/jwt";
import { cookies } from "next/headers";
import { ObjectId } from "mongodb";

async function getAdminDb() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) return null;
  const payload = await verifyToken(token);
  if (!payload || payload.role !== "admin") return null;
  const client = await clientPromise;
  return client.db("fixnext-sheba");
}

// GET — public endpoint
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
  } catch (err) {
    console.error("GET specialists error:", err);
    return Response.json({ success: false, message: "Server error" }, { status: 500 });
  }
}

// POST — admin only
export async function POST(req) {
  try {
    const db = await getAdminDb();
    if (!db) return Response.json({ success: false, message: "Unauthorized" }, { status: 403 });

    const { name, subtitle, image, nameImage, options } = await req.json();

    if (!name?.trim()) {
      return Response.json({ success: false, message: "Specialist name required" }, { status: 400 });
    }
    if (!options || options.length === 0) {
      return Response.json({ success: false, message: "At least one service option required" }, { status: 400 });
    }

    const result = await db.collection("specialists").insertOne({
      name: name.trim(),
      subtitle: subtitle?.trim() || "",
      image: image || "",
      nameImage: nameImage || "",
      options: options.map((o) => ({
        label: o.label,
        price: Number(o.price) || 0,
        type: ["basic", "standard", "premium"].includes(o.type) ? o.type : "basic",
      })),
      createdAt: new Date(),
    });

    return Response.json({ success: true, id: result.insertedId });
  } catch (err) {
    console.error("POST specialists error:", err);
    return Response.json({ success: false, message: "Server error" }, { status: 500 });
  }
}

// PATCH — admin only
export async function PATCH(req) {
  try {
    const db = await getAdminDb();
    if (!db) return Response.json({ success: false, message: "Unauthorized" }, { status: 403 });

    const { id, ...updates } = await req.json();
    if (!id) return Response.json({ success: false, message: "id required" }, { status: 400 });

    if (updates.options) {
      updates.options = updates.options.map((o) => ({
        label: o.label,
        price: Number(o.price) || 0,
        type: ["basic", "standard", "premium"].includes(o.type) ? o.type : "basic",
      }));
    }

    await db.collection("specialists").updateOne(
      { _id: new ObjectId(id) },
      { $set: { ...updates, updatedAt: new Date() } }
    );

    return Response.json({ success: true });
  } catch (err) {
    console.error("PATCH specialists error:", err);
    return Response.json({ success: false, message: "Server error" }, { status: 500 });
  }
}

// DELETE — admin only
export async function DELETE(req) {
  try {
    const db = await getAdminDb();
    if (!db) return Response.json({ success: false, message: "Unauthorized" }, { status: 403 });

    const { id } = await req.json();
    if (!id) return Response.json({ success: false, message: "id required" }, { status: 400 });

    await db.collection("specialists").deleteOne({ _id: new ObjectId(id) });
    return Response.json({ success: true });
  } catch (err) {
    console.error("DELETE specialists error:", err);
    return Response.json({ success: false, message: "Server error" }, { status: 500 });
  }
}