import clientPromise from "@/lib/mongodb";
import { verifyToken } from "@/lib/jwt";
import { cookies } from "next/headers";

// GET /api/invoice/[tran_id]
// tran_id = transactionId string (e.g. TXN-6a2b...-1234567890)
// Returns an HTML page that auto-prints as a PDF invoice.
// Auth: user, serviceman, or admin — must own the transaction.
export async function GET(req, { params }) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) {
      return new Response("Unauthorized", { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return new Response("Unauthorized", { status: 401 });
    }

    const { tran_id } = await params;
    if (!tran_id) {
      return new Response("Transaction ID required", { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db("fixnext-sheba");

    // Transaction খুঁজি
    const tx = await db.collection("transactions").findOne({ transactionId: tran_id });
    if (!tx) {
      return new Response("Transaction not found", { status: 404 });
    }

    // Authorization: নিজের transaction কিনা check করি
    // admin সব দেখতে পারবে, user ও serviceman শুধু নিজেরটা
    if (payload.role !== "admin" && tx.userId !== payload.id) {
      // serviceman check — booking এর servicemanId দিয়ে
      if (payload.role === "serviceman") {
        const booking = await db.collection("bookings").findOne({ _id: tx.bookingId });
        if (!booking || booking.servicemanId !== payload.id) {
          return new Response("Forbidden", { status: 403 });
        }
      } else {
        return new Response("Forbidden", { status: 403 });
      }
    }

    // Booking details fetch করি
    let booking = null;
    try {
      const { ObjectId } = await import("mongodb");
      booking = await db.collection("bookings").findOne({ _id: new ObjectId(tx.bookingId) });
    } catch {
      // bookingId invalid হলেও invoice দেখাবো — booking info ছাড়া
    }

    const isPaid = tx.status === "paid";
    const paidDate = tx.paidAt
      ? new Date(tx.paidAt).toLocaleString("en-GB", {
          day: "2-digit", month: "long", year: "numeric",
          hour: "2-digit", minute: "2-digit",
        })
      : "—";
    const createdDate = tx.createdAt
      ? new Date(tx.createdAt).toLocaleString("en-GB", {
          day: "2-digit", month: "long", year: "numeric",
          hour: "2-digit", minute: "2-digit",
        })
      : "—";

    const amount = (tx.amount || 0).toLocaleString();

    // HTML invoice — print-ready, responsive
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Invoice — ${tran_id}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Segoe UI', Arial, sans-serif;
      background: #F0F2F5;
      color: #2C2C2A;
      min-height: 100vh;
      display: flex;
      align-items: flex-start;
      justify-content: center;
      padding: 2rem 1rem;
    }
    .invoice {
      background: #fff;
      max-width: 680px;
      width: 100%;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 4px 24px rgba(0,0,0,0.1);
    }
    .header {
      background: #0A2540;
      padding: 2rem 2.5rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .brand { display: flex; align-items: center; gap: 12px; }
    .brand-icon {
      width: 44px; height: 44px; background: #1D9E75;
      border-radius: 10px; display: flex; align-items: center; justify-content: center;
      font-size: 20px;
    }
    .brand-name { font-size: 20px; font-weight: 700; color: #fff; }
    .brand-sub { font-size: 11px; color: #5DCAA5; text-transform: uppercase; letter-spacing: 0.06em; margin-top: 2px; }
    .invoice-title { text-align: right; }
    .invoice-title h1 { font-size: 28px; font-weight: 700; color: #fff; letter-spacing: 0.04em; }
    .invoice-title .inv-num { font-size: 12px; color: #9AAFC7; margin-top: 4px; }

    .status-bar {
      padding: 14px 2.5rem;
      background: ${isPaid ? "#DCFCE7" : "#FEF3C7"};
      display: flex; align-items: center; gap: 10px;
      border-bottom: 1px solid ${isPaid ? "#86EFAC" : "#FDE68A"};
    }
    .status-dot {
      width: 10px; height: 10px; border-radius: 50%;
      background: ${isPaid ? "#22C55E" : "#F59E0B"};
    }
    .status-text {
      font-size: 13px; font-weight: 700;
      color: ${isPaid ? "#166534" : "#92400E"};
    }
    .status-sub { font-size: 11px; color: ${isPaid ? "#166534" : "#92400E"}; opacity: 0.8; margin-left: auto; }

    .body { padding: 2rem 2.5rem; }

    .section-title {
      font-size: 10px; font-weight: 700; color: #888780;
      text-transform: uppercase; letter-spacing: 0.08em;
      margin-bottom: 12px;
    }
    .info-grid {
      display: grid; grid-template-columns: 1fr 1fr; gap: 12px;
      margin-bottom: 1.75rem;
    }
    .info-card {
      background: #F9FAFB; border-radius: 10px;
      padding: 12px 14px; border: 1px solid #E5E7EB;
    }
    .info-card .label { font-size: 10px; color: #888780; margin-bottom: 4px; }
    .info-card .value { font-size: 13px; font-weight: 600; color: #2C2C2A; word-break: break-word; }

    .divider { border: none; border-top: 1px solid #E5E7EB; margin: 1.5rem 0; }

    .line-items { margin-bottom: 1.5rem; }
    .line-item {
      display: flex; justify-content: space-between; align-items: center;
      padding: 10px 0; border-bottom: 1px solid #F0F2F5;
    }
    .line-item:last-child { border-bottom: none; }
    .line-item .item-name { font-size: 13px; color: #2C2C2A; }
    .line-item .item-val { font-size: 13px; font-weight: 600; color: #2C2C2A; }

    .total-box {
      background: #F0FBF6; border: 1px solid #9FE1CB;
      border-radius: 12px; padding: 16px 20px;
      display: flex; justify-content: space-between; align-items: center;
      margin-bottom: 1.75rem;
    }
    .total-label { font-size: 14px; font-weight: 700; color: #0F6E56; }
    .total-amount { font-size: 26px; font-weight: 700; color: #1D9E75; }

    .tran-box {
      background: #F9FAFB; border-radius: 10px; padding: 14px 16px;
      border: 1px solid #E5E7EB; margin-bottom: 1.75rem;
    }
    .tran-id {
      font-family: monospace; font-size: 11px; color: #888780;
      word-break: break-all; line-height: 1.6;
    }

    .footer {
      background: #F9FAFB; border-top: 1px solid #E5E7EB;
      padding: 1.25rem 2.5rem;
      display: flex; justify-content: space-between; align-items: center;
    }
    .footer-note { font-size: 11px; color: #B4B2A9; }
    .print-btn {
      background: #0A2540; color: #fff; border: none;
      border-radius: 8px; padding: 9px 20px; font-size: 12px;
      font-weight: 700; cursor: pointer; font-family: inherit;
    }
    .print-btn:hover { background: #1D9E75; }

    @media print {
      body { background: #fff; padding: 0; }
      .invoice { box-shadow: none; border-radius: 0; max-width: 100%; }
      .print-btn { display: none; }
    }
  </style>
</head>
<body>
  <div class="invoice">

    <!-- Header -->
    <div class="header">
      <div class="brand">
        <div class="brand-icon">🏠</div>
        <div>
          <div class="brand-name">FixNext Sheba</div>
          <div class="brand-sub">Home Services</div>
        </div>
      </div>
      <div class="invoice-title">
        <h1>INVOICE</h1>
        <div class="inv-num">#${tran_id.slice(-12).toUpperCase()}</div>
      </div>
    </div>

    <!-- Status bar -->
    <div class="status-bar">
      <div class="status-dot"></div>
      <div class="status-text">${isPaid ? "✓ Payment Successful" : "⏳ Payment Pending"}</div>
      <div class="status-sub">${isPaid ? `Paid on ${paidDate}` : `Initiated on ${createdDate}`}</div>
    </div>

    <div class="body">

      <!-- Dates & IDs -->
      <div class="section-title">Transaction Details</div>
      <div class="info-grid">
        <div class="info-card">
          <div class="label">Invoice Date</div>
          <div class="value">${createdDate}</div>
        </div>
        <div class="info-card">
          <div class="label">Payment Date</div>
          <div class="value">${isPaid ? paidDate : "—"}</div>
        </div>
        ${booking ? `
        <div class="info-card">
          <div class="label">Customer Name</div>
          <div class="value">${booking.name || "—"}</div>
        </div>
        <div class="info-card">
          <div class="label">Address</div>
          <div class="value">${booking.address || "—"}</div>
        </div>
        ` : ""}
      </div>

      <hr class="divider" />

      <!-- Line Items -->
      <div class="section-title">Service Details</div>
      <div class="line-items">
        ${booking ? `
        <div class="line-item">
          <span class="item-name">Service</span>
          <span class="item-val">${booking.service || "—"}</span>
        </div>
        <div class="line-item">
          <span class="item-name">Package</span>
          <span class="item-val">${booking.option !== undefined && booking.option !== null ? `Option ${booking.option + 1}` : "—"}</span>
        </div>
        ` : `
        <div class="line-item">
          <span class="item-name">Service Booking</span>
          <span class="item-val">—</span>
        </div>
        `}
        <div class="line-item">
          <span class="item-name">Payment Status</span>
          <span class="item-val" style="color: ${isPaid ? "#1D9E75" : "#F59E0B"}">${isPaid ? "✓ Paid" : "Pending"}</span>
        </div>
      </div>

      <!-- Total -->
      <div class="total-box">
        <div class="total-label">Total Amount</div>
        <div class="total-amount">৳${amount}</div>
      </div>

      <!-- Transaction ID -->
      <div class="section-title">Transaction Reference</div>
      <div class="tran-box">
        <div class="tran-id">${tran_id}</div>
      </div>

    </div>

    <!-- Footer -->
    <div class="footer">
      <div class="footer-note">Thank you for using FixNext Sheba • fixnextsheba.com</div>
      <button class="print-btn" onclick="window.print()">🖨️ Print / Save PDF</button>
    </div>

  </div>
</body>
</html>`;

    return new Response(html, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        // ব্রাউজারে দেখাবে, print করলে PDF হবে
        // download করতে চাইলে নিচের line uncomment করো:
        // "Content-Disposition": `attachment; filename="invoice-${tran_id}.html"`,
      },
    });
  } catch (error) {
    console.error("Invoice error:", error);
    return new Response("Internal server error", { status: 500 });
  }
}