import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

const KEY_LENGTH = 64;
const LOCAL_CHEF_PASSWORD = "123456";
const LOCAL_CHEF_PASSWORD_SALT = "hao-kitchen-local-password";

export function createChefPasswordHash(password: string, salt = randomBytes(16).toString("hex")) {
  const derived = scryptSync(password, salt, KEY_LENGTH).toString("hex");
  return `scrypt:${salt}:${derived}`;
}

export const DEFAULT_CHEF_PASSWORD_HASH = createChefPasswordHash(
  LOCAL_CHEF_PASSWORD,
  LOCAL_CHEF_PASSWORD_SALT,
);

export function verifyChefPassword(password: string, storedHash: string | undefined): boolean {
  if (!storedHash) {
    return false;
  }

  const [scheme, salt, hash] = storedHash.split(":");
  if (scheme !== "scrypt" || !salt || !hash) {
    return false;
  }

  const expected = Buffer.from(hash, "hex");
  const actual = scryptSync(password, salt, KEY_LENGTH);

  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

export function resolveChefPasswordHash(storedHash: string | undefined): string {
  return storedHash ?? DEFAULT_CHEF_PASSWORD_HASH;
}
