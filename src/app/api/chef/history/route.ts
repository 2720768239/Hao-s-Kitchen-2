import { getDatabase } from "@/db/client";
import { createChefService } from "@/server/chef-service";
import type { AppDatabase } from "@/server/repositories";

let testDatabase: AppDatabase | undefined;

export function setChefHistoryTestDatabase(database: AppDatabase | undefined) {
  testDatabase = database;
}

export async function GET() {
  const database = testDatabase ?? getDatabase();

  return Response.json(createChefService(database).getHistory());
}
