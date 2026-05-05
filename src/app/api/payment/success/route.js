import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

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
        await db.collection("bookings").updateOne(
          { _id: new ObjectId(transaction.bookingId) },
          { $set: { paymentStatus: "paid" } }
        );
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