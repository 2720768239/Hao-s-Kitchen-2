import { getDatabase } from "@/db/client";
import type { AppDatabase } from "@/server/repositories";
import { createPublicService } from "@/server/public-service";

let testDatabase: AppDatabase | undefined;

export function setPublicStateTestDatabase(database: AppDatabase | undefined) {
  testDatabase = database;
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ inviteToken: string }> },
) {
  const { inviteToken } = await context.params;
  const database = testDatabase ?? getDatabase();
  const state = createPublicService(database).getState(inviteToken);

  if (state.kind === "closed") {
    return Response.json({ kind: "closed" });
  }

  return Response.json({
    kind: "gathering",
    mealSession: {
      id: state.mealSession.id,
      inviteToken: state.mealSession.inviteToken,
      status: state.mealSession.status,
      createdAt: state.mealSession.createdAt.toISOString(),
      archivedAt: state.mealSession.archivedAt?.toISOString() ?? null,
    },
  });
}
