import clientPromise from "@/lib/mongodb";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const servicemanId = searchParams.get("servicemanId");

    const client = await clientPromise;
    const db = client.db("fixnext-sheba");

    const query = servicemanId ? { servicemanId } : {};
    const reviews = await db.collection("reviews").find(query).toArray();

    return Response.json({ success: true, data: reviews });
  } catch (error) {
    return Response.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}