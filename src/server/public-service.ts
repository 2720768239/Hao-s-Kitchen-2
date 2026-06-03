import type { AppDatabase, MealSessionRecord } from "./repositories";
import { mapMealSessionRow } from "./repositories";

export type PublicState =
  | { kind: "closed" }
  | { kind: "gathering"; mealSession: MealSessionRecord };

export function createPublicService(database: AppDatabase) {
  return {
    getState(inviteToken?: string): PublicState {
      if (!inviteToken) {
        return { kind: "closed" };
      }

      const row = database.sqlite
        .prepare(
          `SELECT id, invite_token, status, created_at, archived_at
           FROM meal_sessions
           WHERE invite_token = ? AND status = 'gathering'
           LIMIT 1`,
        )
        .get(inviteToken) as Parameters<typeof mapMealSessionRow>[0] | undefined;

      if (!row) {
        return { kind: "closed" };
      }

      return {
        kind: "gathering",
        mealSession: mapMealSessionRow(row),
      };
    },
  };
}
