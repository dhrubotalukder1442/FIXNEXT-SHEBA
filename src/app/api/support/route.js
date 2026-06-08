import clientPromise from "@/lib/mongodb";
import { verifyToken } from "@/lib/jwt";
import { cookies } from "next/headers";
import Pusher from "pusher";

const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID,
  key: process.env.PUSHER_KEY,
  secret: process.env.PUSHER_SECRET,
  cluster: process.env.PUSHER_CLUSTER || "ap1",
  useTLS: true,
});

async function getAuth() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) return null;
  return verifyToken(token);
}

export async function GET(req) {
  try {
    const payload = await getAuth();
    if (!payload) return Response.json({ success: false }, { status: 401 });

    const client = await clientPromise;
    const db = client.db("fixnext-sheba");

    if (payload.role === "admin") {
      const { searchParams } = new URL(req.url);
      const threadId = searchParams.get("threadId");

      // ✅ Admin specific thread er messages fetch korbe
      if (threadId) {
        const messages = await db
          .collection("support_chats")
          .find({ threadId })
          .sort({ createdAt: 1 })
          .toArray();
        return Response.json({ success: true, data: messages });
      }

      // ✅ Admin dekhbe: sob active threads list
      const threads = await db
        .collection("support_chats")
        .aggregate([
          { $sort: { createdAt: -1 } },
          {
            $group: {
              _id: "$threadId",
              lastMessage: { $first: "$message" },
              senderName: { $first: "$senderName" },
              lastAt: { $first: "$createdAt" },
              unread: {
                $sum: { $cond: [{ $ne: ["$senderRole", "admin"] }, 1, 0] },
              },
            },
          },
          { $sort: { lastAt: -1 } },
          { $limit: 50 },
        ])
        .toArray();
      return Response.json({ success: true, data: threads });
    }

    // ✅ User dekhbe: nijer thread er sob messages
    const threadId = payload.id;
    const messages = await db
      .collection("support_chats")
      .find({ threadId })
      .sort({ createdAt: 1 })
      .toArray();

    return Response.json({ success: true, data: messages });
  } catch {
    return Response.json({ success: false, message: "Server error" }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const payload = await getAuth();
    if (!payload) return Response.json({ success: false }, { status: 401 });

    const { message, threadId: bodyThreadId } = await req.json();
    if (!message?.trim()) {
      return Response.json({ success: false, message: "Message required" }, { status: 400 });
    }

    const threadId =
      payload.role === "admin" ? bodyThreadId || payload.id : payload.id;

    const client = await clientPromise;
    const db = client.db("fixnext-sheba");

    const doc = {
      threadId,
      senderId: payload.id,
      senderName: payload.name || (payload.role === "admin" ? "Support Team" : "User"),
      senderRole: payload.role,
      message: message.trim(),
      createdAt: new Date(),
    };

    await db.collection("support_chats").insertOne(doc);

    await pusher.trigger(`support-${threadId}`, "new-message", doc);

    if (payload.role !== "admin") {
      await pusher.trigger("admin-support", "new-thread", {
        threadId,
        senderName: payload.name,
        message: message.trim(),
        at: new Date(),
      });
    }

    return Response.json({ success: true, data: doc });
  } catch {
    return Response.json({ success: false, message: "Server error" }, { status: 500 });
  }
}