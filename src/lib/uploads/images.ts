import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { DomainError } from "@/lib/domain/errors";

const allowedImageTypes = new Map([
  ["image/png", ".png"],
  ["image/jpeg", ".jpg"],
  ["image/webp", ".webp"],
]);

const maxImageBytes = 5 * 1024 * 1024;

export async function saveUploadedImage(file: File): Promise<{ path: string }> {
  const extension = allowedImageTypes.get(file.type);

  if (!extension) {
    throw new DomainError("只支持 PNG、JPG 或 WEBP 图片");
  }

  if (file.size > maxImageBytes) {
    throw new DomainError("图片不能超过 5MB");
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const filename = `${randomUUID()}${extension}`;
  const uploadDir = getUploadDir();

  await mkdir(uploadDir, { recursive: true });
  await writeFile(path.join(uploadDir, filename), bytes);

  return { path: `/uploads/${filename}` };
}

export function getUploadDir(): string {
  if (process.env.UPLOAD_DIR) {
    return process.env.UPLOAD_DIR;
  }

  return path.join(/*turbopackIgnore: true*/ process.cwd(), "data", "uploads");
}
