import { randomBytes, randomUUID } from "node:crypto";
import { DomainError } from "@/lib/domain/errors";
import type { AppDatabase, MealSessionRecord } from "./repositories";
import { mapMealSessionRow } from "./repositories";
import type { Clock } from "./public-service";
import type { EventTopic, RefreshEvent } from "./event-bus";

type BusinessStatus = "gathering" | "archived";
type RefreshPublisher = { publish: (topic: EventTopic, event: RefreshEvent["event"]) => unknown };

export function createChefService(
  database: AppDatabase,
  options: { clock?: Clock; eventBus?: RefreshPublisher } = {},
) {
  const clock = options.clock ?? { now: () => new Date() };
  const publish = options.eventBus;

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

        publish?.publish("chef", "refresh");
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

      publish?.publish("chef", "refresh");
      publish?.publish(`public:${active.inviteToken}`, "refresh");

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

    getHistory(): HistoryMealSummary[] {
      return database.sqlite
        .prepare(
          `SELECT
             ms.id,
             ms.invite_token,
             ms.status,
             ms.created_at,
             ms.archived_at,
             COUNT(DISTINCT o.id) AS order_count,
             COUNT(od.id) AS dish_count
           FROM meal_sessions ms
           LEFT JOIN orders o ON o.meal_session_id = ms.id
           LEFT JOIN order_dishes od ON od.order_id = o.id
           WHERE ms.status = 'archived'
           GROUP BY ms.id
           ORDER BY ms.archived_at DESC, ms.created_at DESC`,
        )
        .all()
        .map((row) => {
          const item = row as {
            id: string;
            invite_token: string;
            status: "archived";
            created_at: number;
            archived_at: number | null;
            order_count: number;
            dish_count: number;
          };

          return {
            id: item.id,
            inviteToken: item.invite_token,
            status: item.status,
            createdAt: new Date(item.created_at),
            archivedAt: item.archived_at ? new Date(item.archived_at) : null,
            orderCount: item.order_count,
            dishCount: item.dish_count,
          };
        });
    },

    getHistoryDetail(id: string): HistoryMealDetail | null {
      const mealRow = database.sqlite
        .prepare(
          `SELECT id, invite_token, status, created_at, archived_at
           FROM meal_sessions
           WHERE id = ? AND status = 'archived'
           LIMIT 1`,
        )
        .get(id) as Parameters<typeof mapMealSessionRow>[0] | undefined;

      if (!mealRow) {
        return null;
      }

      const orders = database.sqlite
        .prepare(
          `SELECT id, customer_name, notes, created_at
           FROM orders
           WHERE meal_session_id = ?
           ORDER BY created_at ASC`,
        )
        .all(id)
        .map((row) => {
          const order = row as {
            id: string;
            customer_name: string;
            notes: string | null;
            created_at: number;
          };

          return {
            id: order.id,
            customerName: order.customer_name,
            notes: order.notes ?? "",
            createdAt: new Date(order.created_at),
            dishes: database.sqlite
              .prepare(
                `SELECT d.id, d.name, d.image_path
                 FROM order_dishes od
                 INNER JOIN dishes d ON d.id = od.dish_id
                 WHERE od.order_id = ?
                 ORDER BY d.sort_order ASC`,
              )
              .all(order.id)
              .map((dishRow) => {
                const dish = dishRow as { id: string; name: string; image_path: string };

                return {
                  id: dish.id,
                  name: dish.name,
                  imagePath: dish.image_path,
                };
              }),
          };
        });

      const meal = mapMealSessionRow(mealRow);

      return {
        id: meal.id,
        inviteToken: meal.inviteToken,
        status: meal.status,
        createdAt: meal.createdAt,
        archivedAt: meal.archivedAt,
        orders,
      };
    },

    listDishes(): DishRecord[] {
      return database.sqlite
        .prepare(
          `SELECT id, name, image_path, description, tags, sort_order, is_available, created_at, updated_at
           FROM dishes
           ORDER BY sort_order ASC, created_at ASC`,
        )
        .all()
        .map(mapDishRow);
    },

    createDish(input: CreateDishInput): DishRecord {
      const now = clock.now().getTime();
      const dish = {
        id: randomUUID(),
        name: input.name.trim(),
        imagePath: input.imagePath.trim(),
        description: input.description.trim(),
        tags: input.tags.map((tag) => tag.trim()).filter(Boolean),
        sortOrder: input.sortOrder,
        isAvailable: input.isAvailable,
        createdAt: new Date(now),
        updatedAt: new Date(now),
      };

      if (!dish.name) {
        throw new DomainError("菜名不能为空");
      }

      database.sqlite
        .prepare(
          `INSERT INTO dishes (id, name, image_path, description, tags, sort_order, is_available, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .run(
          dish.id,
          dish.name,
          dish.imagePath,
          dish.description,
          JSON.stringify(dish.tags),
          dish.sortOrder,
          dish.isAvailable ? 1 : 0,
          now,
          now,
        );

      publishActiveMeal(database, publish);
      publish?.publish("chef", "refresh");
      return dish;
    },

    updateDish(id: string, input: UpdateDishInput): DishRecord | null {
      const current = findDish(database, id);

      if (!current) {
        return null;
      }

      const updated = {
        ...current,
        ...input,
        name: input.name?.trim() ?? current.name,
        imagePath: input.imagePath?.trim() ?? current.imagePath,
        description: input.description?.trim() ?? current.description,
        tags: input.tags?.map((tag) => tag.trim()).filter(Boolean) ?? current.tags,
        updatedAt: clock.now(),
      };

      if (!updated.name) {
        throw new DomainError("菜名不能为空");
      }

      database.sqlite
        .prepare(
          `UPDATE dishes
           SET name = ?, image_path = ?, description = ?, tags = ?, sort_order = ?, is_available = ?, updated_at = ?
           WHERE id = ?`,
        )
        .run(
          updated.name,
          updated.imagePath,
          updated.description,
          JSON.stringify(updated.tags),
          updated.sortOrder,
          updated.isAvailable ? 1 : 0,
          updated.updatedAt.getTime(),
          id,
        );

      publishActiveMeal(database, publish);
      publish?.publish("chef", "refresh");
      return updated;
    },

    reorderDishes(items: ReorderDishInput[]): DishRecord[] {
      const reorder = database.sqlite.transaction(() => {
        const statement = database.sqlite.prepare(
          `UPDATE dishes SET sort_order = ?, updated_at = ? WHERE id = ?`,
        );
        const now = clock.now().getTime();

        for (const item of items) {
          statement.run(item.sortOrder, now, item.id);
        }
      });

      reorder();

      publishActiveMeal(database, publish);
      publish?.publish("chef", "refresh");
      return this.listDishes();
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

export type HistoryMealSummary = {
  id: string;
  inviteToken: string;
  status: "archived";
  createdAt: Date;
  archivedAt: Date | null;
  orderCount: number;
  dishCount: number;
};

export type HistoryMealDetail = {
  id: string;
  inviteToken: string;
  status: "gathering" | "archived";
  createdAt: Date;
  archivedAt: Date | null;
  orders: Array<{
    id: string;
    customerName: string;
    notes: string;
    createdAt: Date;
    dishes: Array<{
      id: string;
      name: string;
      imagePath: string;
    }>;
  }>;
};

export type DishRecord = {
  id: string;
  name: string;
  imagePath: string;
  description: string;
  tags: string[];
  sortOrder: number;
  isAvailable: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type CreateDishInput = {
  name: string;
  imagePath: string;
  description: string;
  tags: string[];
  sortOrder: number;
  isAvailable: boolean;
};

export type UpdateDishInput = Partial<CreateDishInput>;

export type ReorderDishInput = {
  id: string;
  sortOrder: number;
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

function findDish(database: AppDatabase, id: string): DishRecord | null {
  const row = database.sqlite
    .prepare(
      `SELECT id, name, image_path, description, tags, sort_order, is_available, created_at, updated_at
       FROM dishes
       WHERE id = ?`,
    )
    .get(id) as DishRow | undefined;

  return row ? mapDishRow(row) : null;
}

type DishRow = {
  id: string;
  name: string;
  image_path: string;
  description: string;
  tags: string;
  sort_order: number;
  is_available: number;
  created_at: number;
  updated_at: number;
};

function mapDishRow(row: unknown): DishRecord {
  const dish = row as DishRow;

  return {
    id: dish.id,
    name: dish.name,
    imagePath: dish.image_path,
    description: dish.description,
    tags: parseTags(dish.tags),
    sortOrder: dish.sort_order,
    isAvailable: Boolean(dish.is_available),
    createdAt: new Date(dish.created_at),
    updatedAt: new Date(dish.updated_at),
  };
}

function parseTags(value: string): string[] {
  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === "string")
      : [];
  } catch {
    return [];
  }
}

function publishActiveMeal(database: AppDatabase, publish: RefreshPublisher | undefined) {
  const active = findActiveMeal(database);

  if (active) {
    publish?.publish(`public:${active.inviteToken}`, "refresh");
  }
}
