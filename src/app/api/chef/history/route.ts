import { getDatabase } from "@/db/client";
import { requireChefApiSession } from "@/lib/auth/chef-guard";
import { createChefService } from "@/server/chef-service";
import type { AppDatabase } from "@/server/repositories";

let testDatabase: AppDatabase | undefined;

export function setChefHistoryTestDatabase(database: AppDatabase | undefined) {
  testDatabase = database;
}

export async function GET(request: Request) {
  const database = testDatabase ?? getDatabase();
  const unauthorized = requireChefApiSession(request, database);
  if (unauthorized) {
    return unauthorized;
  }

  return Response.json(createChefService(database).getHistory());
}
