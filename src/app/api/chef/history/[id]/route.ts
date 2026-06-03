import { getDatabase } from "@/db/client";
import { jsonError } from "@/lib/http/json";
import { createChefService } from "@/server/chef-service";
import type { AppDatabase } from "@/server/repositories";

let testDatabase: AppDatabase | undefined;

export function setChefHistoryDetailTestDatabase(database: AppDatabase | undefined) {
  testDatabase = database;
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const database = testDatabase ?? getDatabase();
  const history = createChefService(database).getHistoryDetail(id);

  if (!history) {
    return jsonError(404, "历史饭局不存在");
  }

  return Response.json(history);
}
