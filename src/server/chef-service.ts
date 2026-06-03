import { randomBytes, randomUUID } from "node:crypto";
import type { AppDatabase, MealSessionRecord } from "./repositories";
import { mapMealSessionRow } from "./repositories";

type BusinessStatus = "gathering" | "archived";

export function createChefService(database: AppDatabase) {
  return {
    setBusinessStatus(status: BusinessStatus): MealSessionRecord | null {
      if (status === "gathering") {
        const active = findActiveMeal(database);
        if (active) {
          return active;
        }

        const now = Date.now();
        const meal = {
          id: randomUUID(),
          inviteToken: randomBytes(24).toString("base64url"),
          status: "gathering" as const,
          createdAt: new Date(now),
          archivedAt: null,
        };

        database.sqlite
          .prepare(
            `INSERT INTO meal_sessions (id, invite_token, status, created_at, archived_at)
             VALUES (?, ?, ?, ?, ?)`,
          )
          .run(meal.id, meal.inviteToken, meal.status, now, null);

        return meal;
      }

      const active = findActiveMeal(database);
      if (!active) {
        return null;
      }

      const archivedAt = Date.now();
      const archive = database.sqlite.transaction(() => {
        database.sqlite
          .prepare("DELETE FROM dish_holds WHERE meal_session_id = ?")
          .run(active.id);
        database.sqlite
          .prepare(
            `UPDATE meal_sessions
             SET status = 'archived', archived_at = ?
             WHERE id = ? AND status = 'gathering'`,
          )
          .run(archivedAt, active.id);
      });

      archive();

      return {
        ...active,
        status: "archived",
        archivedAt: new Date(archivedAt),
      };
    },
  };
}

function findActiveMeal(database: AppDatabase): MealSessionRecord | null {
  const row = database.sqlite
    .prepare(
      `SELECT id, invite_token, status, created_at, archived_at
       FROM meal_sessions
       WHERE status = 'gathering'
       LIMIT 1`,
    )
    .get() as Parameters<typeof mapMealSessionRow>[0] | undefined;

  return row ? mapMealSessionRow(row) : null;
}
