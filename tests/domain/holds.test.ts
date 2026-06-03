import { describe, expect, it } from "vitest";
import { createDishFixture } from "../helpers/fixtures";
import { createTestApp, createTestClock } from "../helpers/app";

describe("dish holds", () => {
  it("gives the first client a three-minute hold and rejects the second", () => {
    const app = createTestApp({ clock: createTestClock("2026-06-02T12:00:00.000Z") });
    const meal = app.chef.setBusinessStatus("gathering");
    const dish = createDishFixture(app);

    const hold = app.public.createHold({
      inviteToken: meal.inviteToken,
      dishId: dish.id,
      clientSessionId: "client-a",
    });

    expect(hold.expiresAt.getTime() - hold.holdStartedAt.getTime()).toBe(180000);
    expect(() =>
      app.public.createHold({
        inviteToken: meal.inviteToken,
        dishId: dish.id,
        clientSessionId: "client-b",
      }),
    ).toThrow(/有人先盯上了/);
  });

  it("releases an expired hold before accepting a new client", () => {
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

    expect(
      app.public.createHold({
        inviteToken: meal.inviteToken,
        dishId: dish.id,
        clientSessionId: "client-b",
      }).clientSessionId,
    ).toBe("client-b");
  });

  it("lists the current client's active holds for hydration after refresh", () => {
    const app = createTestApp();
    const meal = app.chef.setBusinessStatus("gathering");
    const firstDish = createDishFixture(app, { name: "杈ｅ瓙楦′竵" });
    const secondDish = createDishFixture(app, { name: "楸奸鑲変笣" });

    const firstHold = app.public.createHold({
      inviteToken: meal.inviteToken,
      dishId: firstDish.id,
      clientSessionId: "client-a",
    });
    const secondHold = app.public.createHold({
      inviteToken: meal.inviteToken,
      dishId: secondDish.id,
      clientSessionId: "client-a",
    });

    expect(app.public.listOwnHolds(meal.inviteToken, "client-a")).toEqual([
      { id: firstHold.id, dishId: firstDish.id },
      { id: secondHold.id, dishId: secondDish.id },
    ]);
    expect(app.public.listOwnHolds(meal.inviteToken, "client-b")).toEqual([]);
  });
});
