import { createTestDatabase } from "./database";
import { createChefService } from "@/server/chef-service";
import { createPublicService } from "@/server/public-service";

export function createTestApp() {
  const database = createTestDatabase();

  return {
    ...database,
    chef: createChefService(database),
    public: createPublicService(database),
  };
}
