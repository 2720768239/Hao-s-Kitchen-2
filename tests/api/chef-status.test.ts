import { afterEach, describe, expect, it } from "vitest";
import {
  GET as publicState,
  setPublicStateTestDatabase,
} from "@/app/api/public/state/[inviteToken]/route";
import { POST as businessStatus, setChefStatusTestDatabase } from "@/app/api/chef/business-status/route";
import { createTestDatabase } from "../helpers/database";

afterEach(() => {
  setChefStatusTestDatabase(undefined);
  setPublicStateTestDatabase(undefined);
});

function jsonRequest(path: string, body?: unknown) {
  return new Request(`http://localhost${path}`, {
    method: "POST",
    body: JSON.stringify(body ?? {}),
    headers: { "Content-Type": "application/json" },
  });
}

describe("chef business status api", () => {
  it("creates a new invite through 英雄集结 and archives it through 群雄归隐", async () => {
    const database = createTestDatabase();
    setChefStatusTestDatabase(database);
    setPublicStateTestDatabase(database);

    const gathering = await businessStatus(
      jsonRequest("/api/chef/business-status", { status: "gathering" }),
    );
    expect(gathering.status).toBe(200);
    const meal = (await gathering.json()) as { inviteToken: string };

    const archived = await businessStatus(
      jsonRequest("/api/chef/business-status", { status: "archived" }),
    );
    expect(archived.status).toBe(200);

    const state = await publicState(
      new Request(`http://localhost/api/public/state/${meal.inviteToken}`),
      { params: Promise.resolve({ inviteToken: meal.inviteToken }) },
    );
    expect(await state.json()).toEqual({ kind: "closed" });
  });
});
