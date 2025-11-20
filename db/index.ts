import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
import * as schema from "./schema";

if (!process.env.DATABASE_URL) {
  console.warn("DATABASE_URL not set. Database features will be unavailable.");
  throw new Error("DATABASE_URL not configured");
}

export const db = drizzle({
  connection: process.env.DATABASE_URL,
  ws: ws,
  schema,
});
