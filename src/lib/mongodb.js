import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;

if (!uri) {
  throw new Error("MONGODB_URI is not defined");
}

const options = {
  tls: true,
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 10000,
};

let clientPromise;

if (process.env.NODE_ENV === "development") {
  // Development: global cache রাখো যাতে hot-reload এ বারবার connection না হয়
  if (!global._mongoClientPromise) {
    const client = new MongoClient(uri, options);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  // Production (Vercel serverless): প্রতিটা function invocation এ fresh connection
  // কারণ Vercel এ global state persist করে না
  const client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

export default clientPromise;