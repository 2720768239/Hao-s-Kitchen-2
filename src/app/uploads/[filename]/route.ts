import { readFile } from "node:fs/promises";
import path from "node:path";
import { jsonError } from "@/lib/http/json";
import { getUploadDir } from "@/lib/uploads/images";

const contentTypes = new Map([
  [".png", "image/png"],
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".webp", "image/webp"],
]);

export async function GET(
  _request: Request,
  context: { params: Promise<{ filename: string }> },
) {
  const { filename } = await context.params;

  if (filename.includes("/") || filename.includes("\\") || filename.includes("..")) {
    return jsonError(400, "非法文件名");
  }

  const extension = path.extname(filename).toLowerCase();
  const contentType = contentTypes.get(extension);

  if (!contentType) {
    return jsonError(404, "文件不存在");
  }

  try {
    const bytes = await readFile(path.join(getUploadDir(), filename));
    return new Response(bytes, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return jsonError(404, "文件不存在");
  }
}
