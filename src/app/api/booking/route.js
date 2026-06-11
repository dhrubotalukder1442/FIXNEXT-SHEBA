import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { sanitize, isValidPhone } from "@/lib/validate";
import Pusher from "pusher";
import { sendBookingAccepted } from "@/lib/mailer";

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
    // ✅ serviceId save করি — page reload এর পর restore করতে কাজে লাগবে
    const serviceId = body.serviceId ? sanitize(body.serviceId) : null;
    // scheduledAt — user এর preferred datetime। ISO string হিসেবে আসে।
    const scheduledAt = body.scheduledAt ? new Date(body.scheduledAt) : null;

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
      // ✅ serviceId এখন booking document এ store হবে
      serviceId,
      status: "pending",
      createdAt: new Date(),
      scheduledAt,
    };

    const client = await clientPromise;
    const db = client.db("fixnext-sheba");
    const result = await db.collection("bookings").insertOne(booking);

    // isOnline: { $ne: false } — backward-compatible online check
    const servicemen = await db
      .collection("users")
      .find({ role: "serviceman", specialty: specialty, isOnline: { $ne: false } })
      .toArray();

    // শুধু "accepted" booking নেই এমন servicemen কে notify করবে
    const availableServicemen = [];
    for (const s of servicemen) {
      const hasAcceptedBooking = await db.collection("bookings").findOne({
        servicemanId: s._id.toString(),
        status: "accepted",
      });
      if (!hasAcceptedBooking) {
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
      scheduledAt,
      status: "unread",
      createdAt: new Date(),
    }));

    if (notifications.length > 0) {
      await db.collection("notifications").insertMany(notifications);
    }

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

    if (status === "accepted") {
      try {
        const booking = await db.collection("bookings").findOne({ _id: new ObjectId(id) });
        const sm = servicemanId
          ? await db.collection("users").findOne({ _id: new ObjectId(servicemanId) })
          : null;
        const userDoc = booking?.userId
          ? await db.collection("users").findOne({ _id: new ObjectId(booking.userId) })
          : null;

        if (booking && userDoc?.email) {
          await sendBookingAccepted({
            to: userDoc.email,
            name: booking.name,
            service: booking.service,
            address: booking.address,
            scheduledAt: booking.scheduledAt,
            servicemanName: sm?.name || "Our Serviceman",
            servicemanPhone: sm?.phone || null,
          });
        }
      } catch (emailErr) {
        console.error("Accepted email failed:", emailErr);
      }
    }

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