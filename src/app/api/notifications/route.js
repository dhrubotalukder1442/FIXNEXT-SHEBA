import clientPromise from "@/lib/mongodb";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const servicemanId = searchParams.get("servicemanId");

    if (!servicemanId) {
      return Response.json(
        { success: false, message: "servicemanId required" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db("fixnext-sheba");

    const notifications = await db
      .collection("notifications")
      .find({ servicemanId })
      .sort({ createdAt: -1 })
      .toArray();

    return Response.json({ success: true, data: notifications });
  } catch (error) {
    return Response.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(req) {
  try {
    const { id } = await req.json();
    const { ObjectId } = await import("mongodb");

    const client = await clientPromise;
    const db = client.db("fixnext-sheba");

    await db.collection("notifications").updateOne(
      { _id: new ObjectId(id) },
      { $set: { status: "read" } }
    );

    return Response.json({ success: true });
  } catch (error) {
    return Response.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}