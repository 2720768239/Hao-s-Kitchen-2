import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { runMigrations } from "./migrate";
import * as schema from "./schema";

export type DatabaseClient = ReturnType<typeof createDatabaseClient>;

let database: DatabaseClient | undefined;

function createDatabaseClient(databasePath: string) {
  const sqlite = new Database(databasePath);
  runMigrations(sqlite);

  return {
    sqlite,
    db: drizzle(sqlite, { schema }),
  };
}

export function getDatabase(): DatabaseClient {
  if (!database) {
    const databasePath = process.env.DATABASE_PATH ?? "data/hao-kitchen.sqlite";
    const databaseDir = path.dirname(databasePath);

    if (databaseDir !== ".") {
      fs.mkdirSync(databaseDir, { recursive: true });
    }

    database = createDatabaseClient(databasePath);
  }

  return database;
}
