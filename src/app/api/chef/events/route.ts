import { requireChefApiSession } from "@/lib/auth/chef-guard";
import { createSseResponse } from "@/server/event-bus";

export async function GET(request: Request) {
  const unauthorized = requireChefApiSession(request);
  if (unauthorized) {
    return unauthorized;
  }

  return createSseResponse("chef");
}
