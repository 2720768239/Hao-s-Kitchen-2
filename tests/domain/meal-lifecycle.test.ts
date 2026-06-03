import { describe, expect, it } from "vitest";
import { createTestApp } from "../helpers/app";

describe("meal lifecycle", () => {
  it("creates a fresh invite when the chef chooses 英雄集结", () => {
    const app = createTestApp();
    const meal = app.chef.setBusinessStatus("gathering");

    expect(meal.status).toBe("gathering");
    expect(meal.inviteToken).toMatch(/^[A-Za-z0-9_-]{32,}$/);
  });

  it("permanently invalidates an invite when the chef chooses 群雄归隐", () => {
    const app = createTestApp();
    const meal = app.chef.setBusinessStatus("gathering");

    app.chef.setBusinessStatus("archived");
    const nextMeal = app.chef.setBusinessStatus("gathering");

    expect(app.public.getState(meal.inviteToken)).toEqual({ kind: "closed" });
    expect(nextMeal.id).not.toBe(meal.id);
    expect(nextMeal.inviteToken).not.toBe(meal.inviteToken);
  });

  it("returns the closed view for a missing or unknown invite", () => {
    const app = createTestApp();

    expect(app.public.getState()).toEqual({ kind: "closed" });
    expect(app.public.getState("unknown")).toEqual({ kind: "closed" });
  });
});
