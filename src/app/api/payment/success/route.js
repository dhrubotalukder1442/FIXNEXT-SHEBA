import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { sendBookingConfirmation } from "@/lib/mailer";
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
    const formData = await req.formData();
    const tran_id = formData.get("tran_id");
    const val_id = formData.get("val_id");
    const status = formData.get("status");

    const client = await clientPromise;
    const db = client.db("fixnext-sheba");

    if (status === "VALID") {
      const transaction = await db.collection("transactions").findOneAndUpdate(
        { transactionId: tran_id },
        { $set: { status: "paid", val_id, paidAt: new Date() } },
        { returnDocument: "after" }
      );

      if (transaction?.bookingId) {
        const booking = await db.collection("bookings").findOneAndUpdate(
          { _id: new ObjectId(transaction.bookingId) },
          { $set: { paymentStatus: "paid" } },
          { returnDocument: "after" }
        );

        // Payment confirm হলে user কে email পাঠাই।
        // try-catch আলাদা রাখি — email fail করলে payment flow break হবে না।
        if (booking && transaction?.userEmail) {
          try {
            await sendBookingConfirmation({
              to: transaction.userEmail,
              name: booking.name,
              service: booking.service,
              option: booking.option,
              address: booking.address,
              scheduledAt: booking.scheduledAt,
              amount: transaction.amount,
              transactionId: tran_id,
            });
          } catch (emailErr) {
            console.error("Confirmation email failed:", emailErr);
          }
        }

        // Payment successful হলে user কে Pusher দিয়ে notify করি
        // যাতে review popup automatically আসে — SSLCommerz redirect এর পরে
        // page reload হয় তাই Pusher দিয়ে trigger করা safe।
        if (booking?.userId) {
          try {
            await pusher.trigger(`user-${booking.userId}`, "payment-successful", {
              bookingId: transaction.bookingId,
              transactionId: tran_id,
            });
          } catch (pusherErr) {
            console.error("Pusher payment-successful trigger failed:", pusherErr);
          }
        }
      }
    }

    return new Response(null, {
      status: 303,
      headers: {
        Location: `${process.env.NEXT_PUBLIC_BASE_URL}/payment/success?tran_id=${tran_id}`,
      },
    });
  } catch (error) {
    console.error("Payment success error:", error);
    return new Response(null, {
      status: 303,
      headers: {
        Location: `${process.env.NEXT_PUBLIC_BASE_URL}/payment/fail`,
      },
    });
  }
}