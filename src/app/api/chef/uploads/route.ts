import { DomainError } from "@/lib/domain/errors";
import { jsonError } from "@/lib/http/json";
import { saveUploadedImage } from "@/lib/uploads/images";

export async function POST(request: Request) {
  const form = await request.formData().catch(() => null);
  const file = form?.get("file");

  if (!(file instanceof File)) {
    return jsonError(400, "请上传图片文件");
  }

  try {
    return Response.json(await saveUploadedImage(file), { status: 201 });
  } catch (error) {
    if (error instanceof DomainError) {
      return jsonError(400, error.message);
    }

    throw error;
  }
}
