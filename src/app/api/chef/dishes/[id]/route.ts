import { getDatabase } from "@/db/client";
import { DomainError } from "@/lib/domain/errors";
import { jsonError } from "@/lib/http/json";
import { createChefService } from "@/server/chef-service";
import { globalEventBus } from "@/server/event-bus";
import { z } from "zod";

const dishPatchSchema = z.object({
  name: z.string().min(1).max(20).optional(),
  imagePath: z.string().min(1).optional(),
  description: z.string().max(100).optional(),
  tags: z.array(z.string().min(1)).optional(),
  sortOrder: z.number().int().optional(),
  isAvailable: z.boolean().optional(),
});

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const body = await request.json().catch(() => null);
  const parsed = dishPatchSchema.safeParse(body);

  if (!parsed.success) {
    return jsonError(400, "菜品信息不完整", parsed.error.flatten());
  }

  try {
    const { id } = await context.params;
    const updated = createChefService(getDatabase(), { eventBus: globalEventBus }).updateDish(
      id,
      parsed.data,
    );

    if (!updated) {
      return jsonError(404, "菜品不存在");
    }

    return Response.json(updated);
  } catch (error) {
    if (error instanceof DomainError) {
      return jsonError(400, error.message);
    }

    throw error;
  }
}
