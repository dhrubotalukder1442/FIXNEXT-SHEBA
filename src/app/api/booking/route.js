import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function POST(req) {
  try {
    const body = await req.json();
    console.log("Request Body:", body);

    const { service, option, name, phone, address, userId } = body;

    if (!userId) {
      return Response.json(
        { success: false, message: "Unauthorized", code: "NOT_LOGGED_IN" },
        { status: 401 }
      );
    }

    if (!service || option === null || option === undefined || !name || !phone || !address) {
      console.error("Validation failed: Missing required fields");
      return Response.json(
        { success: false, message: "Missing required fields" },
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
      status: "pending",
      createdAt: new Date(),
    };

    const client = await clientPromise;
    const db = client.db("fixnext-sheba");
    await db.collection("bookings").insertOne(booking);
    console.log("Booking inserted successfully");

    return Response.json(
      { success: true, message: "Booking saved successfully", data: booking },
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
    const client = await clientPromise;
    const db = client.db("fixnext-sheba");
    const bookings = await db.collection("bookings").find({}).toArray();

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
    const { id, status } = await req.json();

    if (!id || !status) {
      return Response.json(
        { success: false, message: "Missing id or status" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db("fixnext-sheba");

    await db.collection("bookings").updateOne(
      { _id: new ObjectId(id) },
      { $set: { status } }
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