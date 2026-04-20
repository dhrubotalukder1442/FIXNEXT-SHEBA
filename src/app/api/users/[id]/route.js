import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function DELETE(req, { params }) {
  try {
    const client = await clientPromise;
    const db = client.db("fixnext-sheba");

    await db.collection("users").deleteOne({
      _id: new ObjectId(params.id),
    });

    return Response.json({ success: true });
  } catch (e) {
    return Response.json({ success: false }, { status: 500 });
  }
}