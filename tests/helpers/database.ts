import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { runMigrations } from "@/db/migrate";
import * as schema from "@/db/schema";

export function createTestDatabase() {
  const sqlite = new Database(":memory:");
  runMigrations(sqlite);

  return {
    sqlite,
    db: drizzle(sqlite, { schema }),
  };
}
