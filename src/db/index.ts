import "server-only";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema";

// A local SQLite file by default. Point DATABASE_URL at a Turso URL
// (plus DATABASE_AUTH_TOKEN) to move to a hosted database later.
const client = createClient({
    url: process.env.DATABASE_URL ?? "file:local.db",
    authToken: process.env.DATABASE_AUTH_TOKEN,
});

// SQLite leaves foreign keys off unless each connection turns them on.
await client.execute("PRAGMA foreign_keys = ON");

export const db = drizzle(client, { schema });
