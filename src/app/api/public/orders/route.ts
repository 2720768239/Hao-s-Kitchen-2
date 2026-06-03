import { getDatabase } from "@/db/client";
import { ConflictError, DomainError } from "@/lib/domain/errors";
import { jsonError } from "@/lib/http/json";
import { globalEventBus } from "@/server/event-bus";
import { createPublicService } from "@/server/public-service";
import { z } from "zod";

const orderSchema = z.object({
  inviteToken: z.string().min(1),
  clientSessionId: z.string().min(1),
  customerName: z.string().trim().min(1).max(20),
  notes: z.string().trim().max(100).default(""),
  dishIds: z.array(z.string().min(1)).min(1),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = orderSchema.safeParse(body);

  if (!parsed.success) {
    return jsonError(400, "报名信息不完整", parsed.error.flatten());
  }

  try {
    return Response.json(
      createPublicService(getDatabase(), { eventBus: globalEventBus }).submitOrder(parsed.data),
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof ConflictError) {
      return jsonError(409, error.message);
    }

    if (error instanceof DomainError) {
      return jsonError(400, error.message);
    }

    throw error;
  }
}
