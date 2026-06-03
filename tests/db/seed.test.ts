import { describe, expect, it } from "vitest";
import { dishes } from "@/db/schema";
import { seedDishes } from "@/db/seed";
import { createTestDatabase } from "../helpers/database";

describe("dish seed data", () => {
  it("populates the default menu into an empty database", () => {
    const database = createTestDatabase();

    seedDishes(database);

    const rows = database.db.select().from(dishes).all();
    expect(rows).toHaveLength(5);
    expect(rows.map((row) => row.id)).toContain("dish-laziji");
  });

  it("does not overwrite existing menu data", () => {
    const database = createTestDatabase();
    const now = new Date("2026-06-03T12:00:00.000Z");

    database.db
      .insert(dishes)
      .values({
        id: "dish-laziji",
        name: "主厨自定义辣子鸡",
        imagePath: "/uploads/custom-laziji.png",
        description: "已经被主厨改过的版本",
        tags: JSON.stringify(["私房"]),
        sortOrder: 999,
        isAvailable: false,
        createdAt: now,
        updatedAt: now,
      })
      .run();

    seedDishes(database);

    const rows = database.db.select().from(dishes).all();
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      id: "dish-laziji",
      name: "主厨自定义辣子鸡",
      imagePath: "/uploads/custom-laziji.png",
      description: "已经被主厨改过的版本",
      sortOrder: 999,
      isAvailable: false,
    });
  });
});
