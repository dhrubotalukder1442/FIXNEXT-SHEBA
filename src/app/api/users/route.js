import clientPromise from "@/lib/mongodb";

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db("fixnext-sheba");

    const users = await db.collection("users").find({}).toArray();

    return Response.json({ success: true, data: users });
  } catch (e) {
    return Response.json({ success: false }, { status: 500 });
  }
}