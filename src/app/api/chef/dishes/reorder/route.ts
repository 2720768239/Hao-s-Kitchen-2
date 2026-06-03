import { getDatabase } from "@/db/client";
import { requireChefApiSession } from "@/lib/auth/chef-guard";
import { jsonError } from "@/lib/http/json";
import { createChefService } from "@/server/chef-service";
import { globalEventBus } from "@/server/event-bus";
import { z } from "zod";

const reorderSchema = z.object({
  items: z.array(
    z.object({
      id: z.string().min(1),
      sortOrder: z.number().int(),
    }),
  ),
});

export async function POST(request: Request) {
  const unauthorized = requireChefApiSession(request);
  if (unauthorized) {
    return unauthorized;
  }

  const body = await request.json().catch(() => null);
  const parsed = reorderSchema.safeParse(body);

  if (!parsed.success) {
    return jsonError(400, "排序信息不完整", parsed.error.flatten());
  }

  return Response.json(
    createChefService(getDatabase(), { eventBus: globalEventBus }).reorderDishes(parsed.data.items),
  );
}
