import clientPromise from "@/lib/mongodb";

export async function POST(req) {
  try {
    const body = await req.json();

    console.log("Request Body:", body);

    const { service, option, name, phone, address } = body;

    // validation
    if (!service || option === null || option === undefined || !name || !phone || !address) {
      console.error("Validation failed: Missing required fields");
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

    console.log("Booking Object:", booking);

    // connect DB
    const client = await clientPromise;
    const db = client.db("fixnext-sheba");

    console.log("Connected to database");

    // insert booking
    await db.collection("bookings").insertOne(booking);

    console.log("Booking inserted successfully");

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

export async function GET(req) {
  try {
    console.log("GET /api/booking: Connecting to database...");

    // Connect to the database
    const client = await clientPromise;
    const db = client.db("fixnext-sheba");

    console.log("GET /api/booking: Connected to database.");

    // Fetch all bookings
    const bookings = await db.collection("bookings").find({}).toArray();

    console.log("GET /api/booking: Fetched bookings:", bookings);

    // Return the bookings as JSON
    return Response.json({
      success: true,
      data: bookings,
    });
  } catch (error) {
    console.error("GET /api/booking: Error fetching bookings:", error);
    return Response.json(
      {
        success: false,
        message: "Failed to fetch bookings",
      },
      { status: 500 }
    );
  }
}