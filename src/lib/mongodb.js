import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;

if (!uri) {
  throw new Error("❌ MONGODB_URI is not defined in .env.local");
}

const options = {
  tls: true, // Ensure secure connection; adjust if using local MongoDB
};

let client;
let clientPromise;

try {
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri, options);
    global._mongoClientPromise = client.connect().catch((err) => {
      console.error("❌ MongoDB connection failed:", err);
      throw err;
    });
  }
  clientPromise = global._mongoClientPromise;
} catch (error) {
  console.error("❌ Error initializing MongoDB client:", error);
  throw error;
}

export default clientPromise;