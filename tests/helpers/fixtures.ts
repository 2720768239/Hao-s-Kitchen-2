import { randomUUID } from "node:crypto";
import { dishes, mealSessions } from "@/db/schema";
import type { createTestDatabase } from "./database";

type TestDatabase = ReturnType<typeof createTestDatabase>;

export function createMealSessionFixture(
  testDb: TestDatabase,
  overrides: Partial<typeof mealSessions.$inferInsert> = {},
) {
  const row = {
    id: randomUUID(),
    inviteToken: randomUUID(),
    status: "gathering",
    createdAt: new Date(),
    archivedAt: null,
    ...overrides,
  } satisfies typeof mealSessions.$inferInsert;

  try {
    testDb.db.insert(mealSessions).values(row).run();
  } catch (error) {
    if (error instanceof Error && /unique/i.test(error.message)) {
      throw new Error("one gathering meal session already exists");
    }

    throw error;
  }

  return row;
}

export function createDishFixture(
  testDb: TestDatabase,
  overrides: Partial<typeof dishes.$inferInsert> = {},
) {
  const now = new Date();
  const row = {
    id: randomUUID(),
    name: "Test Dish",
    imagePath: "/images/dishes/test-dish.png",
    description: "A test dish.",
    tags: "[]",
    sortOrder: 0,
    isAvailable: true,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  } satisfies typeof dishes.$inferInsert;

  testDb.db.insert(dishes).values(row).run();

  return row;
}
