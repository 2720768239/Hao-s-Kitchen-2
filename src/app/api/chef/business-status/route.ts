import { getDatabase } from "@/db/client";
import { jsonError } from "@/lib/http/json";
import { createChefService } from "@/server/chef-service";
import type { AppDatabase } from "@/server/repositories";

let testDatabase: AppDatabase | undefined;

export function setChefStatusTestDatabase(database: AppDatabase | undefined) {
  testDatabase = database;
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { status?: unknown } | null;

  if (body?.status !== "gathering" && body?.status !== "archived") {
    return jsonError(400, "状态不可用");
  }

  const database = testDatabase ?? getDatabase();
  const meal = createChefService(database).setBusinessStatus(body.status);

  return Response.json(
    meal
      ? {
          id: meal.id,
          inviteToken: meal.inviteToken,
          status: meal.status,
          createdAt: meal.createdAt.toISOString(),
          archivedAt: meal.archivedAt?.toISOString() ?? null,
        }
      : { kind: "closed" },
  );
}
