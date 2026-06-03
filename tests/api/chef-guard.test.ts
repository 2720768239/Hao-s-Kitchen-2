import { afterEach, describe, expect, it } from "vitest";
import { CHEF_SESSION_COOKIE, createChefSession } from "@/lib/auth/chef-session";
import { POST as businessStatus, setChefStatusTestDatabase } from "@/app/api/chef/business-status/route";
import { createTestDatabase } from "../helpers/database";

afterEach(() => {
  setChefStatusTestDatabase(undefined);
});

function statusRequest(status: "gathering" | "archived", cookie?: string) {
  return new Request("http://localhost/api/chef/business-status", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(cookie ? { cookie } : {}),
    },
    body: JSON.stringify({ status }),
  });
}

describe("chef route guards", () => {
  it("rejects unauthenticated business status changes", async () => {
    const database = createTestDatabase();
    setChefStatusTestDatabase(database);

    const response = await businessStatus(statusRequest("gathering"));

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toMatchObject({
      error: "请先登录主厨工具台",
    });
  });

  it("allows authenticated business status changes", async () => {
    const database = createTestDatabase();
    setChefStatusTestDatabase(database);
    const token = createChefSession(database);

    const response = await businessStatus(
      statusRequest("gathering", `${CHEF_SESSION_COOKIE}=${token}`),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      status: "gathering",
    });
  });
});
