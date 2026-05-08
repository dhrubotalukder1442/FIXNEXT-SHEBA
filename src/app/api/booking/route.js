import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { sanitize, isValidPhone } from "@/lib/validate";

export async function POST(req) {
  try {
    const body = await req.json();
    
    const service = sanitize(body.service || "");
    const option = body.option;
    const name = sanitize(body.name || "");
    const phone = sanitize(body.phone || "");
    const address = sanitize(body.address || "");
    const userId = sanitize(body.userId || "");
    const specialty = sanitize(body.specialty || ""); // ✅ নতুন

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
      specialty, // ✅ নতুন
      status: "pending",
      createdAt: new Date(),
    };

    const client = await clientPromise;
    const db = client.db("fixnext-sheba");
    const result = await db.collection("bookings").insertOne(booking);

    // ✅ শুধু matching specialty র serviceman রা notification পাবে
    const servicemen = await db
      .collection("users")
      .find({ role: "serviceman", specialty: specialty })
      .toArray();

    const notifications = servicemen.map((s) => ({
      servicemanId: s._id.toString(),
      bookingId: result.insertedId.toString(),
      service,
      name,
      phone,
      address,
      option,
      specialty, // ✅ নতুন
      status: "unread",
      createdAt: new Date(),
    }));

    if (notifications.length > 0) {
      await db.collection("notifications").insertMany(notifications);
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

    const updateData = { status };
    if (servicemanId) updateData.servicemanId = servicemanId;

    await db.collection("bookings").updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );

    return Response.json({ success: true, message: "Status updated" });
  } catch (err) {
    console.error(err);
    return Response.json(
      { success: false, message: "Error updating status" },
      { status: 500 }
    );
  }
}