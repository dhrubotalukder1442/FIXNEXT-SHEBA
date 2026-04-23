import { cookies } from "next/headers";
import { verifyToken } from "@/lib/jwt";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return Response.json(
        { success: false, message: "Not authenticated" },
        { status: 401 }
      );
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return Response.json(
        { success: false, message: "Invalid token" },
        { status: 401 }
      );
    }

    return Response.json({ success: true, user: payload });
  } catch (error) {
    return Response.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}