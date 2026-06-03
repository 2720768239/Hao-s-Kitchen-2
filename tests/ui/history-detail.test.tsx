import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { HistoryDetailCard } from "@/components/chef/history-detail-card";

afterEach(() => {
  cleanup();
});

describe("history detail card", () => {
  it("shows meal and order timestamps in the read-only history view", () => {
    render(
      <HistoryDetailCard
        history={{
          id: "meal-1",
          inviteToken: "invite-token",
          status: "archived",
          createdAt: new Date("2026-06-03T10:00:00.000Z"),
          archivedAt: new Date("2026-06-03T13:00:00.000Z"),
          orders: [
            {
              id: "order-1",
              customerName: "小红",
              notes: "再来两碗米饭",
              createdAt: new Date("2026-06-03T11:30:00.000Z"),
              dishes: [{ id: "dish-1", name: "辣子鸡丁", imagePath: "/assets/dish-laziji.png" }],
            },
          ],
        }}
      />,
    );

    expect(screen.getByText(/创建时间/)).toBeInTheDocument();
    expect(screen.getByText(/归档时间/)).toBeInTheDocument();
    expect(screen.getByText(/提交时间/)).toBeInTheDocument();
  });
});
