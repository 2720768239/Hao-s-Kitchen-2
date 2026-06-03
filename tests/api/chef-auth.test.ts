import { afterEach, describe, expect, it } from "vitest";
import { createChefPasswordHash } from "@/lib/auth/password";
import { POST as login } from "@/app/api/chef/login/route";

const originalPasswordHash = process.env.CHEF_PASSWORD_HASH;

afterEach(() => {
  process.env.CHEF_PASSWORD_HASH = originalPasswordHash;
});

function loginRequest(password: string) {
  return new Request("http://localhost/api/chef/login", {
    method: "POST",
    body: JSON.stringify({ password }),
    headers: { "Content-Type": "application/json" },
  });
}

describe("chef auth", () => {
  it("creates a chef session only for the configured password", async () => {
    process.env.CHEF_PASSWORD_HASH = createChefPasswordHash(
      "correct horse battery staple",
      "test-salt",
    );

    const response = await login(loginRequest("correct horse battery staple"));

    expect(response.status).toBe(204);
    expect(response.headers.get("set-cookie")).toMatch(/chef_session=/);
    expect(response.headers.get("set-cookie")).toMatch(/HttpOnly/);
  });

  it("rejects a wrong chef password", async () => {
    process.env.CHEF_PASSWORD_HASH = createChefPasswordHash(
      "correct horse battery staple",
      "test-salt",
    );

    const response = await login(loginRequest("wrong"));

    expect(response.status).toBe(401);
    expect(response.headers.get("set-cookie")).toBeNull();
  });

  it("defaults to 123456 when no chef password hash is configured", async () => {
    delete process.env.CHEF_PASSWORD_HASH;

    const response = await login(loginRequest("123456"));

    expect(response.status).toBe(204);
    expect(response.headers.get("set-cookie")).toMatch(/chef_session=/);
  });
});
