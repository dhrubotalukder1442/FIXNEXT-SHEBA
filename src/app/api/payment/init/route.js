import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/jwt";

const store_id = process.env.SSLCOMMERZ_STORE_ID;
const store_passwd = process.env.SSLCOMMERZ_STORE_PASSWORD;

export async function POST(req) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return Response.json({ success: false, message: "Unauthorized" }, { status: 401 });

    const payload = await verifyToken(token);
    if (!payload) return Response.json({ success: false, message: "Unauthorized" }, { status: 401 });

    const { bookingId } = await req.json();
    if (!bookingId) return Response.json({ success: false, message: "bookingId required" }, { status: 400 });

    const client = await clientPromise;
    const db = client.db("fixnext-sheba");

    const booking = await db.collection("bookings").findOne({ _id: new ObjectId(bookingId) });
    if (!booking) return Response.json({ success: false, message: "Booking not found" }, { status: 404 });

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
    const transactionId = `TXN-${bookingId}-${Date.now()}`;

    // FormData বানান
    const formData = new URLSearchParams();
    formData.append("store_id", store_id);
    formData.append("store_passwd", store_passwd);
    formData.append("total_amount", Number(booking.price) || 500);
    formData.append("currency", "BDT");
    formData.append("tran_id", transactionId);
    formData.append("success_url", `${baseUrl}/api/payment/success`);
    formData.append("fail_url", `${baseUrl}/api/payment/fail`);
    formData.append("cancel_url", `${baseUrl}/api/payment/fail`);
    formData.append("ipn_url", `${baseUrl}/api/payment/success`);
    formData.append("shipping_method", "NO");
    formData.append("product_name", booking.service || "Service");
    formData.append("product_category", "Service");
    formData.append("product_profile", "general");
    formData.append("cus_name", booking.name || "Customer");
    formData.append("cus_email", payload.email || "customer@example.com");
    formData.append("cus_add1", booking.address || "Dhaka");
    formData.append("cus_city", "Dhaka");
    formData.append("cus_country", "Bangladesh");
    formData.append("cus_phone", booking.phone || "01700000000");

    // সরাসরি SSLCommerz Sandbox API তে call করুন
    const sslResponse = await fetch("https://sandbox.sslcommerz.com/gwprocess/v4/api.php", {
      method: "POST",
      body: formData,
    });

    const apiResponse = await sslResponse.json();
    console.log("SSLCommerz response:", apiResponse);

    if (apiResponse?.GatewayPageURL) {
      await db.collection("transactions").insertOne({
        transactionId,
        bookingId,
        userId: payload.id,
        amount: Number(booking.price) || 500,
        status: "pending",
        createdAt: new Date(),
      });

      return Response.json({ success: true, url: apiResponse.GatewayPageURL });
    } else {
      return Response.json({ success: false, message: apiResponse?.failedreason || "Failed to initiate payment" }, { status: 500 });
    }
  } catch (error) {
    console.error("Payment init error:", error);
    return Response.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}