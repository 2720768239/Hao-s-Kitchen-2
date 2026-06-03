import { afterEach, describe, expect, it } from "vitest";
import { CHEF_SESSION_COOKIE, createChefSession } from "@/lib/auth/chef-session";
import {
  GET as listDishes,
  POST as createDish,
  setChefDishesTestDatabase,
} from "@/app/api/chef/dishes/route";
import { createTestDatabase } from "../helpers/database";

afterEach(() => {
  setChefDishesTestDatabase(undefined);
});

describe("dishes api", () => {
  it("creates and lists chef-managed dishes", async () => {
    const database = createTestDatabase();
    setChefDishesTestDatabase(database);
    const token = createChefSession(database);
    const authCookie = `${CHEF_SESSION_COOKIE}=${token}`;

    const created = await createDish(
      new Request("http://localhost/api/chef/dishes", {
        method: "POST",
        body: JSON.stringify({
          name: "辣子鸡丁",
          imagePath: "/uploads/laziji.png",
          description: "香辣过瘾，米饭杀手",
          tags: ["招牌", "下饭"],
          sortOrder: 1,
          isAvailable: true,
        }),
        headers: {
          "Content-Type": "application/json",
          cookie: authCookie,
        },
      }),
    );

    expect(created.status).toBe(201);

    const listed = await listDishes(
      new Request("http://localhost/api/chef/dishes", {
        headers: { cookie: authCookie },
      }),
    );

    expect(await listed.json()).toMatchObject([
      { name: "辣子鸡丁", tags: ["招牌", "下饭"], isAvailable: true },
    ]);
  });
});
