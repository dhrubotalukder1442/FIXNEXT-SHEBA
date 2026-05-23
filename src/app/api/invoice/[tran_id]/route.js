// Next.js App Router এ binary response (PDF) পাঠাতে হলে
// standard Response object ব্যবহার করতে হয় — এটাই web standard।
// pdfkit একটা Node.js stream দেয়, সেটাকে Buffer এ convert করে
// Response এ দিই।

import clientPromise from "@/lib/mongodb";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/jwt";

export async function GET(req, { params }) {
  try {
    // Auth check — শুধু logged-in user নিজের invoice দেখতে পারবে
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return new Response("Unauthorized", { status: 401 });

    const payload = await verifyToken(token);
    if (!payload) return new Response("Unauthorized", { status: 401 });

    const { tran_id } = await params;

    const client = await clientPromise;
    const db = client.db("fixnext-sheba");

    // Transaction খুঁজি
    const tx = await db.collection("transactions").findOne({ transactionId: tran_id });
    if (!tx) return new Response("Transaction not found", { status: 404 });

    // Admin ছাড়া অন্যরা শুধু নিজের transaction দেখতে পারবে
    if (payload.role !== "admin" && tx.userId !== payload.id) {
      return new Response("Forbidden", { status: 403 });
    }

    // Booking details populate করি
    let booking = null;
    if (tx.bookingId) {
      const { ObjectId } = await import("mongodb");
      booking = await db.collection("bookings").findOne({ _id: new ObjectId(tx.bookingId) });
    }

    // User details
const user = await db.collection("users").findOne(
  { _id: { $in: [] } } // placeholder
);
   

    // ── PDF Generate ────────────────────────────────────────────────────────
    // pdfkit একটা EventEmitter-based stream। Next.js এ await করার জন্য
    // Promise দিয়ে wrap করতে হয়।
    const PDFDocument = (await import("pdfkit")).default;

    const pdfBuffer = await new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50, size: "A4" });
      const chunks = [];

      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      // ── Header ──────────────────────────────────────────────────
      doc
        .fillColor("#0A2540")
        .rect(0, 0, doc.page.width, 80)
        .fill();

      doc
        .fillColor("#ffffff")
        .fontSize(22)
        .font("Helvetica-Bold")
        .text("FixNext Sheba", 50, 25);

      doc
        .fillColor("#5DCAA5")
        .fontSize(10)
        .font("Helvetica")
        .text("Home Services Platform · Bangladesh", 50, 52);

      // Invoice title (right side of header)
      doc
        .fillColor("#ffffff")
        .fontSize(13)
        .font("Helvetica-Bold")
        .text("PAYMENT INVOICE", 0, 30, { align: "right", width: doc.page.width - 50 });

      doc.moveDown(3);

      // ── Invoice Meta ─────────────────────────────────────────────
      const paidAt = tx.paidAt
        ? new Date(tx.paidAt).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
        : new Date(tx.createdAt).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

      const metaY = 110;
      doc.fillColor("#2C2C2A").fontSize(10).font("Helvetica");

      // Left column
      doc.text("Invoice Date:", 50, metaY).font("Helvetica-Bold").text(paidAt, 50, metaY + 14);
      doc.font("Helvetica").text("Status:", 50, metaY + 34)
        .fillColor("#166534").font("Helvetica-Bold").text("PAID ✓", 50, metaY + 48);

      // Right column
      doc.fillColor("#888780").font("Helvetica")
        .text("Transaction ID:", 350, metaY)
        .fillColor("#2C2C2A").font("Helvetica-Bold")
        .fontSize(8)
        .text(tran_id, 350, metaY + 14, { width: 190 });

      // Divider
      doc.moveTo(50, metaY + 80).lineTo(doc.page.width - 50, metaY + 80)
        .strokeColor("#E5E7EB").lineWidth(1).stroke();

      // ── Billed To ────────────────────────────────────────────────
      const billedY = metaY + 95;
      doc.fillColor("#888780").fontSize(9).font("Helvetica")
        .text("BILLED TO", 50, billedY);
      doc.fillColor("#2C2C2A").fontSize(12).font("Helvetica-Bold")
        .text(booking?.name || "Customer", 50, billedY + 14);
      doc.fontSize(10).font("Helvetica").fillColor("#555")
        .text(booking?.phone || "", 50, billedY + 30)
        .text(booking?.address || "", 50, billedY + 44, { width: 200 });

      // ── Service Table ─────────────────────────────────────────────
      const tableY = billedY + 100;

      // Table header
      doc.fillColor("#F0F2F5").rect(50, tableY, doc.page.width - 100, 28).fill();
      doc.fillColor("#0A2540").fontSize(10).font("Helvetica-Bold")
        .text("Service", 60, tableY + 9)
        .text("Scheduled", 260, tableY + 9)
        .text("Amount", doc.page.width - 130, tableY + 9);

      // Table row
      const rowY = tableY + 28;
      doc.fillColor("#F9FAFB").rect(50, rowY, doc.page.width - 100, 36).fill();
      doc.strokeColor("#E5E7EB").lineWidth(0.5)
        .rect(50, rowY, doc.page.width - 100, 36).stroke();

      const scheduledText = booking?.scheduledAt
        ? new Date(booking.scheduledAt).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
        : "Immediate";

      doc.fillColor("#2C2C2A").fontSize(11).font("Helvetica-Bold")
        .text(booking?.service || "Home Service", 60, rowY + 8);
      doc.fillColor("#888780").fontSize(9).font("Helvetica")
        .text(booking?.option !== undefined ? `Option ${Number(booking.option) + 1}` : "", 60, rowY + 22);
      doc.fillColor("#2C2C2A").fontSize(10).font("Helvetica")
        .text(scheduledText, 260, rowY + 13)
        .font("Helvetica-Bold").fontSize(13)
        .text(`BDT ${(tx.amount || 0).toLocaleString()}`, doc.page.width - 130, rowY + 10);

      // ── Total ─────────────────────────────────────────────────────
      const totalY = rowY + 50;
      doc.fillColor("#1D9E75").rect(doc.page.width - 200, totalY, 150, 40).fill();
      doc.fillColor("#ffffff").fontSize(10).font("Helvetica")
        .text("TOTAL PAID", doc.page.width - 195, totalY + 8);
      doc.fontSize(15).font("Helvetica-Bold")
        .text(`BDT ${(tx.amount || 0).toLocaleString()}`, doc.page.width - 195, totalY + 22);

      // ── Footer ────────────────────────────────────────────────────
      doc.moveDown(6);
      doc.fillColor("#E5E7EB").rect(50, doc.page.height - 80, doc.page.width - 100, 1).fill();
      doc.fillColor("#B4B2A9").fontSize(9).font("Helvetica")
        .text("Thank you for using FixNext Sheba.", 50, doc.page.height - 65, { align: "center" })
        .text("This is a computer-generated invoice. No signature required.", 50, doc.page.height - 52, { align: "center" });

      doc.end();
    });

    // PDF Response — Content-Disposition: attachment মানে browser download করবে
    return new Response(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="invoice-${tran_id}.pdf"`,
        "Content-Length": pdfBuffer.length.toString(),
      },
    });

  } catch (error) {
    console.error("Invoice generation error:", error);
    return new Response("Failed to generate invoice", { status: 500 });
  }
}