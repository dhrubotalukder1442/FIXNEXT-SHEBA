import clientPromise from "@/lib/mongodb";

export async function POST(req) {
  try {
    const body = await req.json();

    const { service, option, name, phone, address } = body;

    // validation
    if (!service || option === null || !name || !phone || !address) {
      return Response.json(
        {
          success: false,
          message: "Missing required fields",
        },
        { status: 400 }
      );
    }

    // create booking object
    const booking = {
      service,
      option,
      name,
      phone,
      address,
      status: "pending",
      createdAt: new Date(),
    };

    // connect DB
    const client = await clientPromise;
    const db = client.db("fixnext-sheba");

    // insert booking
    await db.collection("bookings").insertOne(booking);

    // success response
    return Response.json(
      {
        success: true,
        message: "Booking saved successfully",
        data: booking,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error in POST handler:", error);

    return Response.json(
      {
        success: false,
        message: "Internal server error",
      },
      { status: 500 }
    );
  }
}