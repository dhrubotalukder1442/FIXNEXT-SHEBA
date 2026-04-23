import clientPromise from "@/lib/mongodb";
import bcrypt from "bcryptjs";
import { signToken } from "@/lib/jwt";
import { cookies } from "next/headers";

export async function POST(req) {
  try {
    const { identifier, password } = await req.json();

    if (!identifier || !password) {
      return Response.json(
        { success: false, message: "All fields are required" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db("fixnext-sheba");

    const user = await db.collection("users").findOne({ email: identifier });

    if (!user) {
      return Response.json(
        { success: false, message: "Invalid email or password" },
        { status: 401 }
      );
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return Response.json(
        { success: false, message: "Invalid email or password" },
        { status: 401 }
      );
    }

    // ✅ JWT token বানাও
    const token = await signToken({
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
    });

    // ✅ HttpOnly cookie তে save করো
    const cookieStore = await cookies();
    cookieStore.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    return Response.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        role: user.role,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return Response.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}