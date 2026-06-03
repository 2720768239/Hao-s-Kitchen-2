import { afterEach, describe, expect, it } from "vitest";
import {
  GET as getHistoryDetail,
  setChefHistoryDetailTestDatabase,
} from "@/app/api/chef/history/[id]/route";
import { createTestApp } from "../helpers/app";
import { createDishFixture } from "../helpers/fixtures";

afterEach(() => {
  setChefHistoryDetailTestDatabase(undefined);
});

describe("history api", () => {
  it("returns archived meals as read-only history", async () => {
    const app = createTestApp();
    const meal = app.chef.setBusinessStatus("gathering");
    const dish = createDishFixture(app);

    if (!meal) {
      throw new Error("expected active meal");
    }

    app.public.createHold({
      inviteToken: meal.inviteToken,
      dishId: dish.id,
      clientSessionId: "client-a",
    });
    app.public.submitOrder({
      inviteToken: meal.inviteToken,
      clientSessionId: "client-a",
      customerName: "小红",
      notes: "再来两碗米饭",
      dishIds: [dish.id],
    });
    app.chef.setBusinessStatus("archived");

    setChefHistoryDetailTestDatabase(app);
    const response = await getHistoryDetail(new Request("http://localhost/api/chef/history/meal"), {
      params: Promise.resolve({ id: meal.id }),
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      id: meal.id,
      status: "archived",
      orders: [{ customerName: "小红", notes: "再来两碗米饭", dishes: [{ name: dish.name }] }],
    });
  });
});
