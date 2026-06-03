import { createSseResponse } from "@/server/event-bus";

export async function GET() {
  return createSseResponse("chef");
}
