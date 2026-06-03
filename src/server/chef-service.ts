import { randomBytes, randomUUID } from "node:crypto";
import type { AppDatabase, MealSessionRecord } from "./repositories";
import { mapMealSessionRow } from "./repositories";
import type { Clock } from "./public-service";

type BusinessStatus = "gathering" | "archived";

export function createChefService(
  database: AppDatabase,
  options: { clock?: Clock } = {},
) {
  const clock = options.clock ?? { now: () => new Date() };

  return {
    setBusinessStatus(status: BusinessStatus): MealSessionRecord | null {
      if (status === "gathering") {
        const active = findActiveMeal(database);
        if (active) {
          return active;
        }

        const now = clock.now().getTime();
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

      const archivedAt = clock.now().getTime();
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

    getToCook(): ToCookItem[] {
      return database.sqlite
        .prepare(
          `SELECT
             d.id AS dish_id,
             d.name AS dish_name,
             o.customer_name,
             o.notes,
             o.created_at
           FROM orders o
           INNER JOIN order_dishes od ON od.order_id = o.id
           INNER JOIN dishes d ON d.id = od.dish_id
           INNER JOIN meal_sessions ms ON ms.id = o.meal_session_id
           WHERE ms.status = 'gathering'
           ORDER BY o.created_at ASC, d.sort_order ASC`,
        )
        .all()
        .map((row) => {
          const item = row as {
            dish_id: string;
            dish_name: string;
            customer_name: string;
            notes: string | null;
            created_at: number;
          };

          return {
            dishId: item.dish_id,
            dishName: item.dish_name,
            customerName: item.customer_name,
            notes: item.notes ?? "",
            createdAt: new Date(item.created_at),
          };
        });
    },
  };
}

export type ToCookItem = {
  dishId: string;
  dishName: string;
  customerName: string;
  notes: string;
  createdAt: Date;
};

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
