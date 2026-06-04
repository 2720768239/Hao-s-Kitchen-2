import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PublicOrderingPage } from "@/components/public/public-ordering-page";

const refresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh }),
}));

vi.mock("@/hooks/use-sse-refresh", () => ({
  useSseRefresh: vi.fn(),
}));

beforeEach(() => {
  refresh.mockReset();
  localStorage.clear();
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("public invite page", () => {
  it("renders the active invite menu", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [],
      }),
    );

    render(
      <PublicOrderingPage
        inviteToken="invite-token"
        dishes={[
          {
            id: "dish-laziji",
            name: "辣子鸡丁",
            imagePath: "/assets/dish-laziji.png",
            description: "香辣过瘾，米饭杀手",
            tags: ["推荐"],
            state: "available",
          },
        ]}
      />,
    );

    expect(screen.getByText("极饿时代")).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "今晚菜单" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "辣子鸡丁" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /选择 辣子鸡丁/ })).toBeInTheDocument();
    expect(screen.getByRole("complementary", { name: "嘴馋清单" })).toBeInTheDocument();
  });

  it("shows 懂你意思 after a successful submit", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === "string" ? input : input.toString();

      if (url.startsWith("/api/public/holds?")) {
        return {
          ok: true,
          json: async () => [{ id: "hold-1", dishId: "dish-laziji" }],
        };
      }

      if (url === "/api/public/orders" && init?.method === "POST") {
        return {
          ok: true,
          json: async () => ({ id: "order-1" }),
        };
      }

      return {
        ok: true,
        json: async () => ({ id: "hold-1", dishId: "dish-laziji" }),
      };
    });
    vi.stubGlobal("fetch", fetchMock);

    render(
      <PublicOrderingPage
        inviteToken="invite-token"
        dishes={[
          {
            id: "dish-laziji",
            name: "辣子鸡丁",
            imagePath: "/assets/dish-laziji.png",
            description: "香辣过瘾，米饭杀手",
            tags: ["推荐"],
            state: "held",
          },
        ]}
      />,
    );

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "馋", exact: true })).toBeEnabled();
    });

    fireEvent.click(screen.getByRole("button", { name: "馋", exact: true }));
    fireEvent.change(screen.getByLabelText("名字"), { target: { value: "小红" } });
    fireEvent.click(screen.getByRole("button", { name: "报上名来" }));

    await waitFor(() => {
      expect(screen.getByText("懂你意思")).toBeInTheDocument();
    });
  });
});
