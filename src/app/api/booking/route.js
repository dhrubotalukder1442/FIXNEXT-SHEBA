import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { sanitize, isValidPhone } from "@/lib/validate";
import Pusher from "pusher";

const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID,
  key: process.env.PUSHER_KEY,
  secret: process.env.PUSHER_SECRET,
  cluster: process.env.PUSHER_CLUSTER || "ap2",
  useTLS: true,
});

export async function POST(req) {
  try {
    const body = await req.json();
    
    const service = sanitize(body.service || "");
    const option = body.option;
    const name = sanitize(body.name || "");
    const phone = sanitize(body.phone || "");
    const address = sanitize(body.address || "");
    const userId = sanitize(body.userId || "");
    const specialty = sanitize(body.specialty || "");

    if (!userId) {
      return Response.json(
        { success: false, message: "Unauthorized", code: "NOT_LOGGED_IN" },
        { status: 401 }
      );
    }

    if (!service || option === null || option === undefined || !name || !phone || !address || !specialty) {
      return Response.json(
        { success: false, message: "Missing required fields" },
        { status: 400 }
      );
    }

    if (!isValidPhone(phone)) {
      return Response.json(
        { success: false, message: "Invalid phone number" },
        { status: 400 }
      );
    }

    const booking = {
      service,
      option,
      name,
      phone,
      address,
      userId,
      specialty,
      status: "pending",
      createdAt: new Date(),
    };

    const client = await clientPromise;
    const db = client.db("fixnext-sheba");
    const result = await db.collection("bookings").insertOne(booking);

    // isOnline: { $ne: false } কেন?
    // পুরোনো accounts এ isOnline field নেই (undefined)।
    // isOnline: true দিলে তারা miss হয়ে যেত।
    // $ne: false মানে — offline explicitly করেনি, তারা সবাই online।
    // এটা backward-compatible — toggle ছাড়া পুরোনো accounts ও কাজ করবে।
    const servicemen = await db
      .collection("users")
      .find({ role: "serviceman", specialty: specialty, isOnline: { $ne: false } })
      .toArray();

    // cancelled বাদ দিতে হবে — cancelled booking কে active ধরা ঠিক না।
    const availableServicemen = [];
    for (const s of servicemen) {
      const activeBookingCount = await db.collection("bookings").countDocuments({
        servicemanId: s._id.toString(),
        status: { $nin: ["completed", "cancelled"] },
      });
      if (activeBookingCount === 0) {
        availableServicemen.push(s);
      }
    }

    const notifications = availableServicemen.map((s) => ({
      servicemanId: s._id.toString(),
      bookingId: result.insertedId.toString(),
      service,
      name,
      phone,
      address,
      option,
      specialty,
      status: "unread",
      createdAt: new Date(),
    }));

    if (notifications.length > 0) {
      await db.collection("notifications").insertMany(notifications);
    }

    // Send real-time notification to available servicemen only
    for (const s of availableServicemen) {
      await pusher.trigger(`serviceman-${s._id.toString()}`, "new-booking", {
        _id: result.insertedId.toString(),
        name,
        phone,
        service,
        address,
        option,
        specialty,
        status: "unread",
        createdAt: new Date().toISOString(),
      });
    }

    return Response.json(
      { success: true, message: "Booking saved successfully", data: { ...booking, _id: result.insertedId } },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error in POST handler:", error);
    return Response.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const servicemanId = searchParams.get("servicemanId");

    const client = await clientPromise;
    const db = client.db("fixnext-sheba");

    const query = servicemanId ? { servicemanId } : {};
    const bookings = await db.collection("bookings").find(query).toArray();

    return Response.json({ success: true, data: bookings });
  } catch (error) {
    console.error("GET ERROR:", error);
    return Response.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(req) {
  try {
    const { id, status, servicemanId } = await req.json();

    if (!id || !status) {
      return Response.json(
        { success: false, message: "Missing id or status" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db("fixnext-sheba");

    // Handle cancel — only allowed when status is pending
    if (status === "cancelled") {
      const booking = await db.collection("bookings").findOne({ _id: new ObjectId(id) });

      if (!booking) {
        return Response.json(
          { success: false, message: "Booking not found" },
          { status: 404 }
        );
      }

      if (booking.status !== "pending") {
        return Response.json(
          { success: false, message: "Only pending bookings can be cancelled" },
          { status: 400 }
        );
      }

      await db.collection("bookings").updateOne(
        { _id: new ObjectId(id) },
        { $set: { status: "cancelled" } }
      );

      // Notify the serviceman who accepted the booking
      if (booking.servicemanId) {
        await pusher.trigger(`serviceman-${booking.servicemanId}`, "booking-cancelled", {
          bookingId: id,
          message: "A booking has been cancelled.",
          service: booking.service,
          name: booking.name,
        });
      }

      return Response.json({ success: true, message: "Booking cancelled successfully" });
    }

    // Handle other status updates (accepted, completed, etc.)
    const updateData = { status };
    if (servicemanId) updateData.servicemanId = servicemanId;

    await db.collection("bookings").updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );

    // Notify user when booking is completed
    if (status === "completed") {
      const booking = await db.collection("bookings").findOne({ _id: new ObjectId(id) });
      if (booking?.userId) {
        await pusher.trigger(`user-${booking.userId}`, "booking-completed", {
          bookingId: id,
          message: "Your service has been completed. Please share your feedback.",
        });
      }
    }

    return Response.json({ success: true, message: "Status updated" });
  } catch (err) {
    console.error(err);
    return Response.json(
      { success: false, message: "Error updating status" },
      { status: 500 }
    );
  }
}