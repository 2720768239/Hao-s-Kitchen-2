import { randomUUID } from "node:crypto";
import { HOLD_DURATION_MS } from "@/lib/domain/constants";
import { ConflictError, DomainError } from "@/lib/domain/errors";
import type { AppDatabase, MealSessionRecord } from "./repositories";
import { mapMealSessionRow } from "./repositories";
import type { EventTopic, RefreshEvent } from "./event-bus";

export type Clock = {
  now: () => Date;
};

export type PublicState =
  | { kind: "closed" }
  | { kind: "gathering"; mealSession: MealSessionRecord };

export type PublicDishState = "available" | "held" | "claimed" | "unavailable";

export type PublicDishRecord = {
  id: string;
  name: string;
  imagePath: string;
  description: string;
  tags: string[];
  state: PublicDishState;
  claimedBy?: string;
};

export type OwnHoldRecord = {
  id: string;
  dishId: string;
};

type CreateHoldInput = {
  inviteToken: string;
  dishId: string;
  clientSessionId: string;
};

type SubmitOrderInput = {
  inviteToken: string;
  clientSessionId: string;
  customerName: string;
  notes: string;
  dishIds: string[];
};

type RemoveHoldInput = {
  inviteToken: string;
  holdId: string;
  clientSessionId: string;
};

type RefreshPublisher = { publish: (topic: EventTopic, event: RefreshEvent["event"]) => unknown };

export type DishHoldRecord = {
  id: string;
  mealSessionId: string;
  dishId: string;
  clientSessionId: string;
  holdStartedAt: Date;
  expiresAt: Date;
};

export function createPublicService(
  database: AppDatabase,
  options: { clock?: Clock; eventBus?: RefreshPublisher } = {},
) {
  const clock = options.clock ?? { now: () => new Date() };
  const publish = options.eventBus;

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

    createHold(input: CreateHoldInput): DishHoldRecord {
      const hold = createHold(database, clock, input);
      publish?.publish(`public:${input.inviteToken}`, "refresh");
      publish?.publish("chef", "refresh");
      return hold;
    },

    removeOwnHold(input: RemoveHoldInput): { removed: boolean } {
      const result = removeOwnHold(database, input);
      publish?.publish(`public:${input.inviteToken}`, "refresh");
      publish?.publish("chef", "refresh");
      return result;
    },

    submitOrder(input: SubmitOrderInput): { id: string } {
      const order = submitOrder(database, clock, input);
      publish?.publish(`public:${input.inviteToken}`, "refresh");
      publish?.publish("chef", "refresh");
      return order;
    },

    listPublicDishes(inviteToken: string): PublicDishRecord[] {
      return listPublicDishes(database, clock, inviteToken);
    },

    listOwnHolds(inviteToken: string, clientSessionId: string): OwnHoldRecord[] {
      return listOwnHolds(database, clock, inviteToken, clientSessionId);
    },
  };
}

function createHold(
  database: AppDatabase,
  clock: Clock,
  input: CreateHoldInput,
): DishHoldRecord {
  return database.sqlite.transaction(() => {
    const now = clock.now();
    const nowMs = now.getTime();
    const meal = findGatheringMealByInviteToken(database, input.inviteToken);

    if (!meal) {
      throw new DomainError("饭局已经群雄归隐");
    }

    database.sqlite
      .prepare("DELETE FROM dish_holds WHERE meal_session_id = ? AND expires_at <= ?")
      .run(meal.id, nowMs);

    const dish = database.sqlite
      .prepare("SELECT id, is_available FROM dishes WHERE id = ? LIMIT 1")
      .get(input.dishId) as { id: string; is_available: number } | undefined;

    if (!dish || !dish.is_available) {
      throw new DomainError("这道菜暂不可选");
    }

    const claimed = database.sqlite
      .prepare(
        `SELECT 1 FROM order_dishes
         WHERE meal_session_id = ? AND dish_id = ?
         LIMIT 1`,
      )
      .get(meal.id, input.dishId);

    if (claimed) {
      throw new ConflictError("这道菜已有馋主");
    }

    const existingHold = database.sqlite
      .prepare(
        `SELECT id, meal_session_id, dish_id, client_session_id, hold_started_at, expires_at
         FROM dish_holds
         WHERE meal_session_id = ? AND dish_id = ? AND expires_at > ?
         LIMIT 1`,
      )
      .get(meal.id, input.dishId, nowMs) as DishHoldRow | undefined;

    if (existingHold) {
      if (existingHold.client_session_id === input.clientSessionId) {
        return mapDishHoldRow(existingHold);
      }

      throw new ConflictError("这道菜有人先盯上了");
    }

    const hold = {
      id: randomUUID(),
      mealSessionId: meal.id,
      dishId: input.dishId,
      clientSessionId: input.clientSessionId,
      holdStartedAt: now,
      expiresAt: new Date(nowMs + HOLD_DURATION_MS),
    };

    database.sqlite
      .prepare(
        `INSERT INTO dish_holds (
          id, meal_session_id, dish_id, client_session_id, hold_started_at, expires_at
        ) VALUES (?, ?, ?, ?, ?, ?)`,
      )
      .run(
        hold.id,
        hold.mealSessionId,
        hold.dishId,
        hold.clientSessionId,
        hold.holdStartedAt.getTime(),
        hold.expiresAt.getTime(),
      );

    return hold;
  })();
}

function findGatheringMealByInviteToken(
  database: AppDatabase,
  inviteToken: string,
): MealSessionRecord | null {
  const row = database.sqlite
    .prepare(
      `SELECT id, invite_token, status, created_at, archived_at
       FROM meal_sessions
       WHERE invite_token = ? AND status = 'gathering'
       LIMIT 1`,
    )
    .get(inviteToken) as Parameters<typeof mapMealSessionRow>[0] | undefined;

  return row ? mapMealSessionRow(row) : null;
}

function submitOrder(
  database: AppDatabase,
  clock: Clock,
  input: SubmitOrderInput,
): { id: string } {
  return database.sqlite.transaction(() => {
    const now = clock.now();
    const nowMs = now.getTime();
    const customerName = input.customerName.trim();
    const notes = input.notes.trim();
    const dishIds = Array.from(new Set(input.dishIds));

    if (!customerName || customerName.length > 20) {
      throw new DomainError("名字不可提交");
    }

    if (notes.length > 100 || dishIds.length === 0) {
      throw new DomainError("这次选择不可提交");
    }

    const meal = findGatheringMealByInviteToken(database, input.inviteToken);
    if (!meal) {
      throw new DomainError("饭局已经群雄归隐");
    }

    database.sqlite
      .prepare("DELETE FROM dish_holds WHERE meal_session_id = ? AND expires_at <= ?")
      .run(meal.id, nowMs);

    const invalidDishIds: string[] = [];

    for (const dishId of dishIds) {
      const hold = database.sqlite
        .prepare(
          `SELECT id FROM dish_holds
           WHERE meal_session_id = ?
             AND dish_id = ?
             AND client_session_id = ?
             AND expires_at > ?
           LIMIT 1`,
        )
        .get(meal.id, dishId, input.clientSessionId, nowMs);

      const claimed = database.sqlite
        .prepare(
          `SELECT 1 FROM order_dishes
           WHERE meal_session_id = ? AND dish_id = ?
           LIMIT 1`,
        )
        .get(meal.id, dishId);

      if (!hold || claimed) {
        invalidDishIds.push(dishId);
      }
    }

    if (invalidDishIds.length > 0) {
      throw new ConflictError(`这些菜已不可提交：${invalidDishIds.join(",")}`);
    }

    const orderId = randomUUID();
    database.sqlite
      .prepare(
        `INSERT INTO orders (id, meal_session_id, customer_name, notes, created_at)
         VALUES (?, ?, ?, ?, ?)`,
      )
      .run(orderId, meal.id, customerName, notes, nowMs);

    const insertOrderDish = database.sqlite.prepare(
      `INSERT INTO order_dishes (id, order_id, meal_session_id, dish_id)
       VALUES (?, ?, ?, ?)`,
    );

    for (const dishId of dishIds) {
      insertOrderDish.run(randomUUID(), orderId, meal.id, dishId);
      database.sqlite
        .prepare(
          `DELETE FROM dish_holds
           WHERE meal_session_id = ?
             AND dish_id = ?
             AND client_session_id = ?`,
        )
        .run(meal.id, dishId, input.clientSessionId);
    }

    return { id: orderId };
  })();
}

function removeOwnHold(database: AppDatabase, input: RemoveHoldInput): { removed: boolean } {
  const meal = findGatheringMealByInviteToken(database, input.inviteToken);

  if (!meal) {
    throw new DomainError("饭局已经群雄归隐");
  }

  const result = database.sqlite
    .prepare(
      `DELETE FROM dish_holds
       WHERE id = ?
         AND meal_session_id = ?
         AND client_session_id = ?`,
    )
    .run(input.holdId, meal.id, input.clientSessionId);

  return { removed: result.changes > 0 };
}

function listPublicDishes(
  database: AppDatabase,
  clock: Clock,
  inviteToken: string,
): PublicDishRecord[] {
  const meal = findGatheringMealByInviteToken(database, inviteToken);

  if (!meal) {
    return [];
  }

  const nowMs = clock.now().getTime();

  database.sqlite
    .prepare("DELETE FROM dish_holds WHERE meal_session_id = ? AND expires_at <= ?")
    .run(meal.id, nowMs);

  const claimedRows = database.sqlite
    .prepare(
      `SELECT od.dish_id, o.customer_name
       FROM order_dishes od
       INNER JOIN orders o ON o.id = od.order_id
       WHERE od.meal_session_id = ?`,
    )
    .all(meal.id) as Array<{ dish_id: string; customer_name: string }>;

  const claimedByDishId = new Map<string, string>();
  for (const row of claimedRows) {
    claimedByDishId.set(row.dish_id, row.customer_name);
  }

  const heldDishIds = new Set(
    database.sqlite
      .prepare(
        `SELECT dish_id
         FROM dish_holds
         WHERE meal_session_id = ? AND expires_at > ?`,
      )
      .all(meal.id, nowMs)
      .map((row) => {
        const item = row as { dish_id: string };
        return item.dish_id;
      }),
  );

  return database.sqlite
    .prepare(
      `SELECT id, name, image_path, description, tags, sort_order, is_available, created_at, updated_at
       FROM dishes
       ORDER BY sort_order ASC, created_at ASC`,
    )
    .all()
    .map((row) => {
      const dish = row as {
        id: string;
        name: string;
        image_path: string;
        description: string;
        tags: string;
        is_available: number;
      };

      if (!dish.is_available) {
        return {
          id: dish.id,
          name: dish.name,
          imagePath: dish.image_path,
          description: dish.description,
          tags: parseTags(dish.tags),
          state: "unavailable" as const,
        };
      }

      const claimedBy = claimedByDishId.get(dish.id);
      if (claimedBy) {
        return {
          id: dish.id,
          name: dish.name,
          imagePath: dish.image_path,
          description: dish.description,
          tags: parseTags(dish.tags),
          state: "claimed" as const,
          claimedBy,
        };
      }

      if (heldDishIds.has(dish.id)) {
        return {
          id: dish.id,
          name: dish.name,
          imagePath: dish.image_path,
          description: dish.description,
          tags: parseTags(dish.tags),
          state: "held" as const,
        };
      }

      return {
        id: dish.id,
        name: dish.name,
        imagePath: dish.image_path,
        description: dish.description,
        tags: parseTags(dish.tags),
        state: "available" as const,
      };
    });
}

function listOwnHolds(
  database: AppDatabase,
  clock: Clock,
  inviteToken: string,
  clientSessionId: string,
): OwnHoldRecord[] {
  const meal = findGatheringMealByInviteToken(database, inviteToken);

  if (!meal) {
    return [];
  }

  const nowMs = clock.now().getTime();
  database.sqlite
    .prepare("DELETE FROM dish_holds WHERE meal_session_id = ? AND expires_at <= ?")
    .run(meal.id, nowMs);

  return database.sqlite
    .prepare(
      `SELECT id, dish_id
       FROM dish_holds
       WHERE meal_session_id = ? AND client_session_id = ? AND expires_at > ?
       ORDER BY hold_started_at ASC`,
    )
    .all(meal.id, clientSessionId, nowMs)
    .map((row) => {
      const hold = row as { id: string; dish_id: string };
      return { id: hold.id, dishId: hold.dish_id };
    });
}

type DishHoldRow = {
  id: string;
  meal_session_id: string;
  dish_id: string;
  client_session_id: string;
  hold_started_at: number;
  expires_at: number;
};

function mapDishHoldRow(row: DishHoldRow): DishHoldRecord {
  return {
    id: row.id,
    mealSessionId: row.meal_session_id,
    dishId: row.dish_id,
    clientSessionId: row.client_session_id,
    holdStartedAt: new Date(row.hold_started_at),
    expiresAt: new Date(row.expires_at),
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
