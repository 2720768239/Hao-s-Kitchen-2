import { createTestDatabase } from "./database";
import { createChefService } from "@/server/chef-service";
import { createPublicService } from "@/server/public-service";
import type { Clock } from "@/server/public-service";

export function createTestApp(options: { clock?: Clock } = {}) {
  const database = createTestDatabase();
  const clock = options.clock ?? { now: () => new Date() };

  return {
    ...database,
    chef: createChefService(database, { clock }),
    public: createPublicService(database, { clock }),
  };
}

export function createTestClock(start: string) {
  let current = new Date(start).getTime();

  return {
    now: () => new Date(current),
    advanceBy: (milliseconds: number) => {
      current += milliseconds;
    },
  };
}
