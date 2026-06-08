import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ClosedView } from "@/components/public/closed-view";
import { DishCard } from "@/components/public/dish-card";
import { SelectionDrawer } from "@/components/public/selection-drawer";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("public ordering ui", () => {
  it("renders the poster-based closed state", () => {
    render(<ClosedView />);

    expect(screen.getByRole("heading", { name: "饿疯了" })).toBeInTheDocument();
    expect(
      screen.getByAltText("电影海报风格的暂停营业页，主题为饿疯了"),
    ).toBeInTheDocument();
  });

  it("groups the drawer as 你已经馋上的 and 已有馋主", () => {
    render(
      <SelectionDrawer
        ownHolds={[{ id: "hold-1", dishName: "杈ｅ瓙楦′竵" }]}
        claimed={[{ id: "claim-1", dishName: "楸奸鑲変笣", customerName: "灏忕孩" }]}
        onSubmit={vi.fn()}
        onRemoveHold={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /我馋上的/ }));

    expect(screen.getByText("你已经馋上的")).toBeInTheDocument();
    expect(screen.getByText("已有馋主")).toBeInTheDocument();
  });

  it("allows the expanded drawer to be closed explicitly", () => {
    render(
      <SelectionDrawer
        ownHolds={[{ id: "hold-1", dishName: "杈ｅ瓙楦′竵" }]}
        claimed={[]}
        onSubmit={vi.fn()}
        onRemoveHold={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /我馋上的/ }));
    fireEvent.click(screen.getByRole("button", { name: "收起" }));

    expect(screen.queryByText("你已经馋上的")).not.toBeInTheDocument();
  });

  it("allows removing own holds from the drawer", () => {
    const onRemoveHold = vi.fn();

    render(
      <SelectionDrawer
        ownHolds={[{ id: "hold-1", dishName: "杈ｅ瓙楦′竵", actionText: "杩欓亾缁欎綘鐣欑潃" }]}
        claimed={[]}
        onSubmit={vi.fn()}
        onRemoveHold={onRemoveHold}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /我馋上的/ }));
    fireEvent.click(screen.getByRole("button", { name: "取消" }));

    expect(onRemoveHold).toHaveBeenCalledWith("hold-1");
  });

  it("keeps selected dishes clickable so the user can cancel from the list", () => {
    const onAction = vi.fn();

    render(
      <DishCard
        dish={{
          id: "dish-laziji",
          name: "杈ｅ瓙楦′竵",
          imagePath: "/assets/dish-laziji.png",
          description: "棣欒荆杩囩樉锛岀背楗潃鎵?",
          tags: ["鎺ㄨ崘"],
          state: "selected",
          actionText: "杩欓亾缁欎綘鐣欑潃",
        }}
        onAction={onAction}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "取消已选 杈ｅ瓙楦′竵" }));

    expect(onAction).toHaveBeenCalledTimes(1);
  });

  it("disables a held dish and explains that someone got there first", () => {
    render(
      <DishCard
        dish={{
          id: "dish-laziji",
          name: "杈ｅ瓙楦′竵",
          imagePath: "/assets/dish-laziji.png",
          description: "棣欒荆杩囩樉锛岀背楗潃鎵?",
          tags: ["鎺ㄨ崘"],
          state: "held",
        }}
        onAction={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: "有人先盯上了" })).toBeDisabled();
    expect(screen.getByText("有人先盯上了")).toBeInTheDocument();
  });
});
