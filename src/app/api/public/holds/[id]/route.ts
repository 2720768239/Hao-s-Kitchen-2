import { getDatabase } from "@/db/client";
import { DomainError } from "@/lib/domain/errors";
import { jsonError } from "@/lib/http/json";
import { globalEventBus } from "@/server/event-bus";
import { createPublicService } from "@/server/public-service";
import { z } from "zod";

const releaseSchema = z.object({
  inviteToken: z.string().min(1),
  clientSessionId: z.string().min(1),
});

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const body = await request.json().catch(() => null);
  const parsed = releaseSchema.safeParse(body);

  if (!parsed.success) {
    return jsonError(400, "释放信息不完整", parsed.error.flatten());
  }

  try {
    const { id } = await context.params;
    return Response.json(
      createPublicService(getDatabase(), { eventBus: globalEventBus }).removeOwnHold({
        ...parsed.data,
        holdId: id,
      }),
    );
  } catch (error) {
    if (error instanceof DomainError) {
      return jsonError(400, error.message);
    }

    throw error;
  }
}
