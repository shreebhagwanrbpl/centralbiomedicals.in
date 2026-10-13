import { MongoClient } from "mongodb";
import dns from "dns";

try {
  dns.setServers(["8.8.8.8", "1.1.1.1"]);
} catch {
  // ignore
}

const MONGODB_URI =
  process.env.MONGODB_URI ||
  "mongodb+srv://rajbiosis15_db_user:R7jmlgZ3RfeB0MEz@superadminrbpl.aneatej.mongodb.net/company_master_cms?retryWrites=true&w=majority";

const DB_NAME = "company_master_cms";

let cachedClient = globalThis.__mongoClient || null;
let cachedDb = globalThis.__mongoDb || null;

export async function getMongoClient() {
  if (cachedClient) return cachedClient;

  cachedClient = new MongoClient(MONGODB_URI, {
    maxPoolSize: 15,
    serverSelectionTimeoutMS: 6000,
    connectTimeoutMS: 6000,
  });

  await cachedClient.connect();
  globalThis.__mongoClient = cachedClient;
  return cachedClient;
}

export async function getDb() {
  if (cachedDb) return cachedDb;
  const client = await getMongoClient();
  cachedDb = client.db(DB_NAME);
  globalThis.__mongoDb = cachedDb;
  return cachedDb;
}
