// @vitest-environment node

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { CHEF_SESSION_COOKIE, createChefSession } from "@/lib/auth/chef-session";
import { POST as upload, setChefUploadsTestDatabase } from "@/app/api/chef/uploads/route";
import { createTestDatabase } from "../helpers/database";

let uploadDir: string;
let authCookie: string;
const originalUploadDir = process.env.UPLOAD_DIR;

beforeEach(() => {
  uploadDir = fs.mkdtempSync(path.join(os.tmpdir(), "hao-upload-"));
  process.env.UPLOAD_DIR = uploadDir;

  const database = createTestDatabase();
  setChefUploadsTestDatabase(database);
  authCookie = `${CHEF_SESSION_COOKIE}=${createChefSession(database)}`;
});

afterEach(() => {
  process.env.UPLOAD_DIR = originalUploadDir;
  fs.rmSync(uploadDir, { recursive: true, force: true });
  setChefUploadsTestDatabase(undefined);
});

function fileUploadRequest(file: File) {
  const form = new FormData();
  form.set("file", file);
  return new Request("http://localhost/api/chef/uploads", {
    method: "POST",
    body: form,
    headers: { cookie: authCookie },
  });
}

describe("uploads api", () => {
  it("uploads a validated image into the persistent directory", async () => {
    const response = await upload(
      fileUploadRequest(new File([new Uint8Array([137, 80, 78, 71])], "laziji.png", { type: "image/png" })),
    );

    expect(response.status).toBe(201);
    const body = (await response.json()) as { path: string };
    expect(body.path).toMatch(/^\/uploads\/[a-f0-9-]+\.png$/);
    expect(fs.existsSync(path.join(uploadDir, path.basename(body.path)))).toBe(true);
  });

  it("rejects unsupported uploads without writing a file", async () => {
    const response = await upload(
      fileUploadRequest(new File(["no"], "notes.txt", { type: "text/plain" })),
    );

    expect(response.status).toBe(400);
    expect(fs.readdirSync(uploadDir)).toHaveLength(0);
  });
});
