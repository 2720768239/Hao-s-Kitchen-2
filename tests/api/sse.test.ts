import { describe, expect, it } from "vitest";
import { createEventBus, encodeServerSentEvent } from "@/server/event-bus";

describe("sse refresh notifications", () => {
  it("publishes refresh notifications with monotonically increasing versions", async () => {
    const bus = createEventBus();
    const events = bus.subscribe("public:meal-1");

    bus.publish("public:meal-1", "refresh");

    await expect(events.next()).resolves.toMatchObject({
      value: { event: "refresh", version: 1 },
      done: false,
    });

    events.return?.();
  });

  it("encodes refresh messages as server-sent events", () => {
    expect(encodeServerSentEvent({ event: "refresh", version: 12 })).toBe(
      'event: refresh\ndata: {"version":12}\n\n',
    );
  });
});
