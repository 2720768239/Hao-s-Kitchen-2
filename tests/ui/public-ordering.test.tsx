import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ClosedView } from "@/components/public/closed-view";
import { DishCard } from "@/components/public/dish-card";
import { SelectionDrawer } from "@/components/public/selection-drawer";

describe("public ordering ui", () => {
  it("renders 群雄归隐 for a closed public state", () => {
    render(<ClosedView />);

    expect(screen.getByRole("heading", { name: "群雄归隐" })).toBeInTheDocument();
  });

  it("groups the drawer as 你已经馋上的 and 已有馋主", () => {
    render(
      <SelectionDrawer
        ownHolds={[{ id: "hold-1", dishName: "辣子鸡丁" }]}
        claimed={[{ id: "claim-1", dishName: "鱼香肉丝", customerName: "小红" }]}
        onSubmit={vi.fn()}
      />,
    );

    expect(screen.getByText("你已经馋上的")).toBeInTheDocument();
    expect(screen.getByText("已有馋主")).toBeInTheDocument();
  });

  it("disables a held dish and explains that someone got there first", () => {
    render(
      <DishCard
        dish={{
          id: "dish-laziji",
          name: "辣子鸡丁",
          imagePath: "/assets/dish-laziji.png",
          description: "香辣过瘾，米饭杀手",
          tags: ["推荐"],
          state: "held",
        }}
        onHold={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: "有人先盯上了" })).toBeDisabled();
    expect(screen.getByText("有人先盯上了")).toBeInTheDocument();
  });
});
