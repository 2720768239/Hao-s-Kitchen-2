import { createSseResponse } from "@/server/event-bus";

export async function GET(
  _request: Request,
  context: { params: Promise<{ inviteToken: string }> },
) {
  const { inviteToken } = await context.params;

  return createSseResponse(`public:${inviteToken}`);
}
