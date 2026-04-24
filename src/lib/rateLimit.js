import clientPromise from "@/lib/mongodb";

export async function checkRateLimit(ip, action = "login", maxAttempts = 5, windowMinutes = 5) {
  const client = await clientPromise;
  const db = client.db("fixnext-sheba");

  const windowStart = new Date(Date.now() - windowMinutes * 60 * 1000);

  // এই IP এর recent attempts count করো
  const attempts = await db.collection("rate_limits").countDocuments({
    ip,
    action,
    createdAt: { $gte: windowStart },
  });

  if (attempts >= maxAttempts) {
    return { allowed: false, remaining: 0 };
  }

  // নতুন attempt save করো
  await db.collection("rate_limits").insertOne({
    ip,
    action,
    createdAt: new Date(),
  });

  return { allowed: true, remaining: maxAttempts - attempts - 1 };
}