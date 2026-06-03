import { getDatabase } from "@/db/client";
import { DomainError } from "@/lib/domain/errors";
import { jsonError } from "@/lib/http/json";
import { createChefService } from "@/server/chef-service";
import { globalEventBus } from "@/server/event-bus";
import type { AppDatabase } from "@/server/repositories";
import { z } from "zod";

const dishSchema = z.object({
  name: z.string().min(1).max(20),
  imagePath: z.string().min(1),
  description: z.string().max(100).default(""),
  tags: z.array(z.string().min(1)).default([]),
  sortOrder: z.number().int(),
  isAvailable: z.boolean().default(true),
});

let testDatabase: AppDatabase | undefined;

export function setChefDishesTestDatabase(database: AppDatabase | undefined) {
  testDatabase = database;
}

export async function GET() {
  const database = testDatabase ?? getDatabase();

  return Response.json(createChefService(database).listDishes());
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = dishSchema.safeParse(body);

  if (!parsed.success) {
    return jsonError(400, "菜品信息不完整", parsed.error.flatten());
  }

  try {
    const database = testDatabase ?? getDatabase();
    return Response.json(
      createChefService(database, { eventBus: globalEventBus }).createDish(parsed.data),
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof DomainError) {
      return jsonError(400, error.message);
    }

    throw error;
  }
}
