"use client";

import { useCallback, useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useSseRefresh } from "@/hooks/use-sse-refresh";
import { DishCard } from "./dish-card";
import { SelectionDrawer } from "./selection-drawer";
import { SubmitDialog } from "./submit-dialog";
import type { DrawerDish, PublicDish } from "./types";

type PublicOrderingPageProps = {
  inviteToken: string;
  dishes: PublicDish[];
};

export function PublicOrderingPage({ inviteToken, dishes }: PublicOrderingPageProps) {
  const router = useRouter();
  const [ownHolds, setOwnHolds] = useState<DrawerDish[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [error, setError] = useState("");
  const selectedDishIds = useMemo(
    () => new Set(ownHolds.map((item) => item.dishId ?? item.id)),
    [ownHolds],
  );

  const refresh = useCallback(() => router.refresh(), [router]);
  useSseRefresh(`/api/events/${inviteToken}`, refresh);

  const visibleDishes = dishes.map((dish) =>
    selectedDishIds.has(dish.id) ? { ...dish, state: "held" as const } : dish,
  );
  const claimed = visibleDishes
    .filter((dish) => dish.state === "claimed")
    .map((dish) => ({ id: dish.id, dishName: dish.name, customerName: dish.claimedBy }));

  async function holdDish(dishId: string) {
    const selected = visibleDishes.find((item) => item.id === dishId);

    if (!selected || selectedDishIds.has(selected.id)) {
      return;
    }

    setError("");
    const response = await fetch("/api/public/holds", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        inviteToken,
        dishId,
        clientSessionId: getClientSessionId(),
      }),
    });

    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as { error?: string } | null;
      setError(body?.error ?? "这道菜有人先盯上了");
      router.refresh();
      return;
    }

    const hold = (await response.json()) as { id: string; dishId: string };
    setOwnHolds((items) => [
      ...items,
      { id: hold.id, dishId: hold.dishId, dishName: selected.name },
    ]);
  }

  async function submitOrder(input: { customerName: string; notes: string }) {
    setError("");
    const response = await fetch("/api/public/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        inviteToken,
        clientSessionId: getClientSessionId(),
        customerName: input.customerName,
        notes: input.notes,
        dishIds: ownHolds.map((item) => item.dishId ?? item.id),
      }),
    });

    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as { error?: string } | null;
      setError(body?.error ?? "这次选择不可提交");
      return;
    }

    setOwnHolds([]);
    setDialogOpen(false);
    router.refresh();
  }

  return (
    <main className="mobile-canvas public-ordering">
      <header className="brand-line">
        <strong>极饿时代</strong>
        <span>好好吃饭，反抗平庸！</span>
      </header>

      <section className="hero-panel">
        <Image src="/assets/chef-hero-v2.png" alt="" width={112} height={112} priority />
        <div>
          <p className="paper-stamp">厨房才是主场</p>
          <h1>今晚吃这些</h1>
          <p>每道菜，只能被一个人正式拿下！</p>
        </div>
      </section>

      {error ? <p className="public-error">{error}</p> : null}

      <section className="dish-list" aria-label="今晚菜单">
        {visibleDishes.map((dish) => (
          <DishCard key={dish.id} dish={dish} onHold={holdDish} />
        ))}
      </section>

      <SelectionDrawer ownHolds={ownHolds} claimed={claimed} onSubmit={() => setDialogOpen(true)} />
      <SubmitDialog open={dialogOpen} onClose={() => setDialogOpen(false)} onSubmit={submitOrder} />
    </main>
  );
}

function getClientSessionId(): string {
  const key = "hao-kitchen.client-session-id";
  const existing = localStorage.getItem(key);

  if (existing) {
    return existing;
  }

  const next = crypto.randomUUID();
  localStorage.setItem(key, next);
  return next;
}
