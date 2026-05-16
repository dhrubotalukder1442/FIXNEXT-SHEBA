import clientPromise from "@/lib/mongodb";
import bcrypt from "bcryptjs";
import { signToken } from "@/lib/jwt";
import { cookies } from "next/headers";
import { isValidEmail, isValidPassword, isValidName, sanitize } from "@/lib/validate";

export async function POST(req) {
  try {
    const body = await req.json();
    const name = sanitize(body.name || "");
    const identifier = sanitize(body.identifier || "");
    const password = body.password || "";
    const role = sanitize(body.role || "user");

    // ✅ Validation
    if (!name || !identifier || !password) {
      return Response.json(
        { success: false, message: "All fields are required" },
        { status: 400 }
      );
    }

    if (!isValidName(name)) {
      return Response.json(
        { success: false, message: "Name must be at least 2 characters" },
        { status: 400 }
      );
    }

    if (!isValidEmail(identifier)) {
      return Response.json(
        { success: false, message: "Invalid email format" },
        { status: 400 }
      );
    }

    if (!isValidPassword(password)) {
      return Response.json(
        { success: false, message: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    if (!["user", "serviceman"].includes(role)) {
      return Response.json(
        { success: false, message: "Invalid role" },
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

    const hashedPassword = await bcrypt.hash(password, 12);

    const result = await db.collection("users").insertOne({
      name,
      email: identifier,
      password: hashedPassword,
      role,
      status: role === "serviceman" ? "pending" : "active",
      specialty: "",
      bio: "",
      phone: "",
      rating: 0,
      totalReviews: 0,
      createdAt: new Date(),
    });

    const status = role === "serviceman" ? "pending" : "active";

    const token = await signToken({
      id: result.insertedId.toString(),
      name,
      email: identifier,
      role,
      status,
    });

    const cookieStore = await cookies();
    cookieStore.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return Response.json({
      success: true,
      user: {
        id: result.insertedId,
        name,
        email: identifier,
        role,
        status,
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