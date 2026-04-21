import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function GET(req) {
  try {
    const client = await clientPromise;
    const db = client.db("fixnext-sheba");

    const servicemen = await db
      .collection("users")
      .find({ role: "serviceman" })
      .toArray();

    return Response.json({ success: true, data: servicemen });
  } catch (error) {
    return Response.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}