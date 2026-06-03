import { afterEach, describe, expect, it } from "vitest";
import {
  GET as listDishes,
  POST as createDish,
  setChefDishesTestDatabase,
} from "@/app/api/chef/dishes/route";
import { createTestDatabase } from "../helpers/database";

afterEach(() => {
  setChefDishesTestDatabase(undefined);
});

function jsonRequest(path: string, body?: unknown) {
  return new Request(`http://localhost${path}`, {
    method: "POST",
    body: JSON.stringify(body ?? {}),
    headers: { "Content-Type": "application/json" },
  });
}

describe("dishes api", () => {
  it("creates and lists chef-managed dishes", async () => {
    const database = createTestDatabase();
    setChefDishesTestDatabase(database);

    const created = await createDish(
      jsonRequest("/api/chef/dishes", {
        name: "辣子鸡丁",
        imagePath: "/uploads/laziji.png",
        description: "香辣过瘾，米饭杀手",
        tags: ["招牌", "下饭"],
        sortOrder: 1,
        isAvailable: true,
      }),
    );

    expect(created.status).toBe(201);
    const listed = await listDishes();
    expect(await listed.json()).toMatchObject([
      { name: "辣子鸡丁", tags: ["招牌", "下饭"], isAvailable: true },
    ]);
  });
});
