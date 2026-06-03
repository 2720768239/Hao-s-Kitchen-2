export type EventTopic = `public:${string}` | "chef";
export type RefreshEvent = { event: "refresh"; version: number };

type Subscriber = {
  queue: RefreshEvent[];
  resolve?: (value: IteratorResult<RefreshEvent>) => void;
  closed: boolean;
};

export function createEventBus() {
  const subscribers = new Map<EventTopic, Set<Subscriber>>();
  const versions = new Map<EventTopic, number>();

  return {
    publish(topic: EventTopic, event: RefreshEvent["event"]): RefreshEvent {
      const next: RefreshEvent = {
        event,
        version: (versions.get(topic) ?? 0) + 1,
      };
      versions.set(topic, next.version);

      for (const subscriber of subscribers.get(topic) ?? []) {
        if (subscriber.closed) {
          continue;
        }

        if (subscriber.resolve) {
          const resolve = subscriber.resolve;
          subscriber.resolve = undefined;
          resolve({ value: next, done: false });
        } else {
          subscriber.queue.push(next);
        }
      }

      return next;
    },

    subscribe(topic: EventTopic): AsyncIterableIterator<RefreshEvent> {
      const subscriber: Subscriber = { queue: [], closed: false };
      const topicSubscribers = subscribers.get(topic) ?? new Set<Subscriber>();
      topicSubscribers.add(subscriber);
      subscribers.set(topic, topicSubscribers);

      const iterator: AsyncIterableIterator<RefreshEvent> = {
        [Symbol.asyncIterator]() {
          return iterator;
        },
        next() {
          if (subscriber.queue.length > 0) {
            return Promise.resolve({ value: subscriber.queue.shift()!, done: false });
          }

          if (subscriber.closed) {
            return Promise.resolve({ value: undefined, done: true });
          }

          return new Promise<IteratorResult<RefreshEvent>>((resolve) => {
            subscriber.resolve = resolve;
          });
        },
        return() {
          subscriber.closed = true;
          topicSubscribers.delete(subscriber);
          subscriber.resolve?.({ value: undefined, done: true });
          subscriber.resolve = undefined;
          return Promise.resolve({ value: undefined, done: true });
        },
      };

      return iterator;
    },
  };
}

export const globalEventBus = createEventBus();

export function encodeServerSentEvent(event: RefreshEvent): string {
  return `event: ${event.event}\ndata: ${JSON.stringify({ version: event.version })}\n\n`;
}

export function createSseResponse(topic: EventTopic): Response {
  const encoder = new TextEncoder();
  const events = globalEventBus.subscribe(topic);
  let heartbeat: ReturnType<typeof setInterval> | undefined;

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      heartbeat = setInterval(() => {
        controller.enqueue(encoder.encode(": keepalive\n\n"));
      }, 20_000);

      void (async () => {
        for await (const event of events) {
          controller.enqueue(encoder.encode(encodeServerSentEvent(event)));
        }
      })();
    },
    cancel() {
      if (heartbeat) {
        clearInterval(heartbeat);
      }
      void events.return?.();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
