import clientPromise from "@/lib/mongodb";
import bcrypt from "bcryptjs";

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

    // ✅ Password hash করো
    const hashedPassword = await bcrypt.hash(password, 12);

    const result = await db.collection("users").insertOne({
      name,
      email: identifier,
      password: hashedPassword,  // ✅ hashed password save
      role: role || "user",
      specialty: "",
      bio: "",
      phone: "",
      rating: 0,
      totalReviews: 0,
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