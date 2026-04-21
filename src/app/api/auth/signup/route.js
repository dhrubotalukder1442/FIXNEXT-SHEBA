import clientPromise from "@/lib/mongodb";

export async function POST(req) {
  try {
    const { name, identifier, password, role } = await req.json();

    if (!name || !identifier || !password) {
      return Response.json(
        { success: false, message: "All fields are required" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db("fixnext-sheba");

    const existing = await db.collection("users").findOne({ email: identifier });
    if (existing) {
      return Response.json(
        { success: false, message: "Email already registered" },
        { status: 409 }
      );
    }

    const result = await db.collection("users").insertOne({
      name,
      email: identifier,
      password,
      role: role || "user",
      createdAt: new Date(),
    });

    return Response.json({
      success: true,
      user: {
        id: result.insertedId,
        name,
        email: identifier,
        role: role || "user",
      },
    });
  } catch (error) {
    console.error("Signup error:", error);
    return Response.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}