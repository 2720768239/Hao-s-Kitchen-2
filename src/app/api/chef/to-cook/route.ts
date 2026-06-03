import { getDatabase } from "@/db/client";
import { createChefService } from "@/server/chef-service";

export async function GET() {
  return Response.json(createChefService(getDatabase()).getToCook());
}
