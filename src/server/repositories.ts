import type Database from "better-sqlite3";
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import type { getDatabase } from "@/db/client";
import type * as schema from "@/db/schema";

export type AppDatabase =
  | ReturnType<typeof getDatabase>
  | {
      sqlite: Database.Database;
      db: BetterSQLite3Database<typeof schema>;
    };

export type MealSessionRecord = {
  id: string;
  inviteToken: string;
  status: "gathering" | "archived";
  createdAt: Date;
  archivedAt: Date | null;
};

export function mapMealSessionRow(row: {
  id: string;
  invite_token: string;
  status: "gathering" | "archived";
  created_at: number;
  archived_at: number | null;
}): MealSessionRecord {
  return {
    id: row.id,
    inviteToken: row.invite_token,
    status: row.status,
    createdAt: new Date(row.created_at),
    archivedAt: row.archived_at === null ? null : new Date(row.archived_at),
  };
}
