import { randomUUID } from "node:crypto";
import { HOLD_DURATION_MS } from "@/lib/domain/constants";
import { ConflictError, DomainError } from "@/lib/domain/errors";
import type { AppDatabase, MealSessionRecord } from "./repositories";
import { mapMealSessionRow } from "./repositories";

export type Clock = {
  now: () => Date;
};

export type PublicState =
  | { kind: "closed" }
  | { kind: "gathering"; mealSession: MealSessionRecord };

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
  options: { clock?: Clock } = {},
) {
  const clock = options.clock ?? { now: () => new Date() };

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
      return createHold(database, clock, input);
    },

    submitOrder(input: SubmitOrderInput): { id: string } {
      return submitOrder(database, clock, input);
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
