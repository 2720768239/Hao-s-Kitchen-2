import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ChefShell } from "@/components/chef/chef-shell";
import { DishList } from "@/components/chef/dish-list";

const refresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh }),
}));

class MockEventSource {
  static instances: MockEventSource[] = [];

  listeners = new Map<string, Set<EventListener>>();
  url: string;

  constructor(url: string) {
    this.url = url;
    MockEventSource.instances.push(this);
  }

  addEventListener(type: string, listener: EventListener) {
    const group = this.listeners.get(type) ?? new Set<EventListener>();
    group.add(listener);
    this.listeners.set(type, group);
  }

  removeEventListener(type: string, listener: EventListener) {
    this.listeners.get(type)?.delete(listener);
  }

  emit(type: string) {
    for (const listener of this.listeners.get(type) ?? []) {
      listener(new Event(type));
    }
  }

  close() {}
}

beforeEach(() => {
  MockEventSource.instances = [];
  refresh.mockReset();
  vi.stubGlobal("EventSource", MockEventSource as unknown as typeof EventSource);
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("chef live refresh and sorting", () => {
  it("subscribes the chef shell to chef refresh events", () => {
    render(
      <ChefShell title="主厨工具台">
        <div>待做内容</div>
      </ChefShell>,
    );

    expect(MockEventSource.instances).toHaveLength(1);
    expect(MockEventSource.instances[0]?.url).toBe("/api/chef/events");

    MockEventSource.instances[0]?.emit("refresh");
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it("lets the chef move dishes down from the dish list", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [],
    });
    vi.stubGlobal("fetch", fetchMock);

    render(
      <DishList
        dishes={[
          {
            id: "dish-a",
            name: "辣子鸡丁",
            imagePath: "/assets/dish-laziji.png",
            description: "香辣过瘾",
            tags: ["招牌"],
            sortOrder: 10,
            isAvailable: true,
            createdAt: new Date("2026-06-03T12:00:00.000Z"),
            updatedAt: new Date("2026-06-03T12:00:00.000Z"),
          },
          {
            id: "dish-b",
            name: "番茄炒蛋",
            imagePath: "/assets/dish-tomato-egg.png",
            description: "经典不翻车",
            tags: ["家常"],
            sortOrder: 20,
            isAvailable: true,
            createdAt: new Date("2026-06-03T12:00:00.000Z"),
            updatedAt: new Date("2026-06-03T12:00:00.000Z"),
          },
        ]}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "下移 辣子鸡丁" }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/chef/dishes/reorder",
        expect.objectContaining({
          method: "POST",
        }),
      );
    });
  });
});
