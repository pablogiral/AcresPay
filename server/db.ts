import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

const connectionString = process.env.DATABASE_URL;

// Use local `pg` client for localhost connections (no websockets).
// For remote Neon serverless URLs, fall back to the neon websocket client.
let pool: any;
let db: any;

if (connectionString.includes("localhost") || connectionString.includes("127.0.0.1")) {
  // Local Postgres via node-postgres
  const pgModule = await import("pg");
  const PgPool: any = pgModule.Pool || pgModule.default?.Pool;
  const { drizzle: drizzlePg } = await import("drizzle-orm/node-postgres");
  pool = new PgPool({ connectionString });
  db = drizzlePg(pool, { schema });
} else {
  // Neon serverless (websocket)
  const { Pool: NeonPool, neonConfig } = await import("@neondatabase/serverless");
  const { drizzle: drizzleNeon } = await import("drizzle-orm/neon-serverless");
  const ws = (await import("ws")).default;
  neonConfig.webSocketConstructor = ws;
  pool = new NeonPool({ connectionString });
  db = drizzleNeon({ client: pool, schema });
}

export { pool, db };
