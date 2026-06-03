import { describe, expect, it } from "vitest";
import { createDishFixture } from "../helpers/fixtures";
import { createTestApp, createTestClock } from "../helpers/app";

describe("public dishes", () => {
  it("exposes held, claimed, and unavailable states for the invite page", () => {
    const clock = createTestClock("2026-06-02T12:00:00.000Z");
    const app = createTestApp({ clock });
    const meal = app.chef.setBusinessStatus("gathering");
    const heldDish = createDishFixture(app, { name: "杈ｅ瓙楦′竵" });
    const claimedDish = createDishFixture(app, { name: "楸奸鑲変笣" });
    const unavailableDish = createDishFixture(app, {
      name: "鐣寗鐐掕泲",
      isAvailable: false,
    });

    app.public.createHold({
      inviteToken: meal.inviteToken,
      dishId: heldDish.id,
      clientSessionId: "client-a",
    });
    app.public.createHold({
      inviteToken: meal.inviteToken,
      dishId: claimedDish.id,
      clientSessionId: "client-a",
    });
    app.public.submitOrder({
      inviteToken: meal.inviteToken,
      clientSessionId: "client-a",
      customerName: "灏忕孩",
      notes: "",
      dishIds: [claimedDish.id],
    });

    expect(app.public.listPublicDishes(meal.inviteToken)).toMatchObject([
      {
        id: heldDish.id,
        state: "held",
      },
      {
        id: claimedDish.id,
        state: "claimed",
        claimedBy: "灏忕孩",
      },
      {
        id: unavailableDish.id,
        state: "unavailable",
      },
    ]);
  });
});
