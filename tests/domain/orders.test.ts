import { describe, expect, it } from "vitest";
import { createDishFixture } from "../helpers/fixtures";
import { createTestApp, createTestClock } from "../helpers/app";

describe("orders", () => {
  it("turns the current client's valid holds into one formal order", () => {
    const app = createTestApp();
    const meal = app.chef.setBusinessStatus("gathering");
    const dish = createDishFixture(app, { name: "辣子鸡丁" });
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

    expect(app.chef.getToCook()).toMatchObject([
      { dishName: "辣子鸡丁", customerName: "小红", notes: "再来两碗米饭" },
    ]);
  });

  it("rejects submission when any hold has expired", () => {
    const clock = createTestClock("2026-06-02T12:00:00.000Z");
    const app = createTestApp({ clock });
    const meal = app.chef.setBusinessStatus("gathering");
    const dish = createDishFixture(app);
    app.public.createHold({
      inviteToken: meal.inviteToken,
      dishId: dish.id,
      clientSessionId: "client-a",
    });
    clock.advanceBy(180001);

    expect(() =>
      app.public.submitOrder({
        inviteToken: meal.inviteToken,
        clientSessionId: "client-a",
        customerName: "小红",
        notes: "",
        dishIds: [dish.id],
      }),
    ).toThrow(/不可提交/);
  });
});
