import { getDatabase } from "@/db/client";
import { ConflictError, DomainError } from "@/lib/domain/errors";
import { jsonError } from "@/lib/http/json";
import { globalEventBus } from "@/server/event-bus";
import { createPublicService } from "@/server/public-service";
import { z } from "zod";

const holdSchema = z.object({
  inviteToken: z.string().min(1),
  dishId: z.string().min(1),
  clientSessionId: z.string().min(1),
});

const listOwnHoldsSchema = z.object({
  inviteToken: z.string().min(1),
  clientSessionId: z.string().min(1),
});

export async function GET(request: Request) {
  const url = new URL(request.url);
  const parsed = listOwnHoldsSchema.safeParse({
    inviteToken: url.searchParams.get("inviteToken"),
    clientSessionId: url.searchParams.get("clientSessionId"),
  });

  if (!parsed.success) {
    return jsonError(400, "占位信息不完整", parsed.error.flatten());
  }

  return Response.json(
    createPublicService(getDatabase(), { eventBus: globalEventBus }).listOwnHolds(
      parsed.data.inviteToken,
      parsed.data.clientSessionId,
    ),
  );
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = holdSchema.safeParse(body);

  if (!parsed.success) {
    return jsonError(400, "占位信息不完整", parsed.error.flatten());
  }

  try {
    return Response.json(
      createPublicService(getDatabase(), { eventBus: globalEventBus }).createHold(parsed.data),
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
