import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { BusinessStatusCard } from "@/components/chef/business-status-card";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

describe("chef pages", () => {
  it("uses 英雄集结 as the action that creates the next meal", () => {
    render(<BusinessStatusCard activeMeal={null} />);

    expect(screen.getByRole("button", { name: "英雄集结" })).toBeInTheDocument();
    expect(screen.queryByText("开启新饭局")).not.toBeInTheDocument();
  });

  it("shows the current invite link while a meal is gathering", () => {
    const meal = {
      id: "meal-1",
      inviteToken: "invite-token",
      status: "gathering" as const,
      createdAt: new Date("2026-06-03T10:00:00.000Z"),
      archivedAt: null,
    };

    render(<BusinessStatusCard activeMeal={meal} />);

    expect(screen.getByDisplayValue(`/invite/${meal.inviteToken}`)).toBeInTheDocument();
  });
});
