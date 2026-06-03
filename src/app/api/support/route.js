import clientPromise from "@/lib/mongodb";
import { verifyToken } from "@/lib/jwt";
import { cookies } from "next/headers";
import Pusher from "pusher";

// ✅ Pusher server-side instance — booking chat এর মতোই same config
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

// GET — messages আনো
// User: নিজের thread (userId দিয়ে)
// Admin: সব active threads এর list (latest message per user)
export async function GET(req) {
  try {
    const payload = await getAuth();
    if (!payload) return Response.json({ success: false }, { status: 401 });

    const client = await clientPromise;
    const db = client.db("fixnext-sheba");

    if (payload.role === "admin") {
      // ✅ Admin দেখবে: কোন কোন user support এ message করেছে, latest message কী
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
              // user এর message count (admin এর reply বাদ দিয়ে)
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

    // ✅ User দেখবে: নিজের thread এর সব messages
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

// POST — message পাঠাও (user বা admin উভয়েই পারবে)
// body: { message: "...", threadId: "..." }
// threadId শুধু admin দেবে (কোন user এর thread এ reply করছে)
// User এর জন্য threadId = user এর নিজের id (auto)
export async function POST(req) {
  try {
    const payload = await getAuth();
    if (!payload) return Response.json({ success: false }, { status: 401 });

    const { message, threadId: bodyThreadId } = await req.json();
    if (!message?.trim()) {
      return Response.json({ success: false, message: "Message required" }, { status: 400 });
    }

    // ✅ Admin যেকোনো thread এ reply করতে পারবে
    // User শুধু নিজের thread এ (নিজের userId = threadId)
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

    // ✅ Real-time: ওই thread এর subscriber রা instant message পাবে
    // Channel name: "support-{userId}" — booking chat থেকে আলাদা
    await pusher.trigger(`support-${threadId}`, "new-message", doc);

    // ✅ User message হলে admin কে notify করো (admin dashboard এ badge দেখাবে)
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