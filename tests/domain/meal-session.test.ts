import { describe, expect, it } from "vitest";
import { HOLD_DURATION_MS, MEAL_STATUS } from "@/lib/domain/constants";

describe("domain constants", () => {
  it("fixes holds at three minutes and exposes only persisted meal statuses", () => {
    expect(HOLD_DURATION_MS).toBe(3 * 60 * 1000);
    expect(MEAL_STATUS).toEqual({ gathering: "gathering", archived: "archived" });
  });
});
