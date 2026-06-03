import { createHash, randomBytes, randomUUID } from "node:crypto";
import type { AppDatabase } from "@/server/repositories";
import { getDatabase } from "@/db/client";

export const CHEF_SESSION_COOKIE = "chef_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 14;

export function createChefSession(database: AppDatabase = getDatabase()) {
  const token = randomBytes(32).toString("base64url");
  const now = Date.now();

  database.sqlite
    .prepare(
      `INSERT INTO chef_sessions (id, token_hash, expires_at, created_at)
       VALUES (?, ?, ?, ?)`,
    )
    .run(
      randomUUID(),
      hashSessionToken(token),
      now + SESSION_MAX_AGE_SECONDS * 1000,
      now,
    );

  return token;
}

export function buildChefSessionCookie(token: string) {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return [
    `${CHEF_SESSION_COOKIE}=${token}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${SESSION_MAX_AGE_SECONDS}`,
    secure,
  ]
    .filter(Boolean)
    .join("; ");
}

export function hashSessionToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}
