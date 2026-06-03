import { describe, expect, it } from "vitest";
import { HOLD_DURATION_MS, MEAL_STATUS } from "@/lib/domain/constants";
import { createTestDatabase } from "../helpers/database";
import { createMealSessionFixture } from "../helpers/fixtures";

describe("domain constants", () => {
  it("fixes holds at three minutes and exposes only persisted meal statuses", () => {
    expect(HOLD_DURATION_MS).toBe(3 * 60 * 1000);
    expect(MEAL_STATUS).toEqual({ gathering: "gathering", archived: "archived" });
  });
});

describe("meal sessions", () => {
  it("allows only one gathering meal session", () => {
    const db = createTestDatabase();
    createMealSessionFixture(db, { status: "gathering" });

    expect(() => createMealSessionFixture(db, { status: "gathering" }))
      .toThrow(/one gathering meal session/i);
  });
});
