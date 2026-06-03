import { getDatabase } from "@/db/client";
import { requireChefApiSession } from "@/lib/auth/chef-guard";
import { createChefService } from "@/server/chef-service";

export async function GET(request: Request) {
  const unauthorized = requireChefApiSession(request);
  if (unauthorized) {
    return unauthorized;
  }

  return Response.json(createChefService(getDatabase()).getToCook());
}
