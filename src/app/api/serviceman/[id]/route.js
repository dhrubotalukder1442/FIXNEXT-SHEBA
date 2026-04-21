import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function GET(req, { params }) {
  try {
    const { id } = await params;  // ✅ await করো

    const client = await clientPromise;
    const db = client.db("fixnext-sheba");

    const serviceman = await db
      .collection("users")
      .findOne({ _id: new ObjectId(id) });

    if (!serviceman) {
      return Response.json(
        { success: false, message: "Serviceman not found" },
        { status: 404 }
      );
    }

    return Response.json({ success: true, data: serviceman });
  } catch (error) {
    return Response.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}