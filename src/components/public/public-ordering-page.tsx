"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSseRefresh } from "@/hooks/use-sse-refresh";
import { DishCard } from "./dish-card";
import { SelectionDrawer } from "./selection-drawer";
import { SubmitDialog } from "./submit-dialog";
import type { DrawerDish, PublicDish } from "./types";

const HOLD_SUCCESS_TEXTS = [
  "已经记你头上了",
  "行，算你会吃",
  "这道给你留着",
  "你果然识货",
  "已经馋上了",
  "这口你跑不掉了",
];

const AVAILABLE_ACTION_TEXTS = [
  "我馋这个",
  "给我这个",
  "就它了",
  "快做这个",
  "这个先上",
  "我要吃这个",
  "先记一嘴",
  "这个必须吃",
  "馋不住了",
  "我要这个！！",
];

type PublicOrderingPageProps = {
  inviteToken: string;
  dishes: PublicDish[];
};

export function PublicOrderingPage({
  inviteToken,
  dishes,
}: PublicOrderingPageProps) {
  const router = useRouter();
  const [ownHolds, setOwnHolds] = useState<DrawerDish[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");
  const serverDishStateById = useMemo(
    () => new Map(dishes.map((dish) => [dish.id, dish.state])),
    [dishes],
  );
  const activeOwnHolds = useMemo(
    () =>
      ownHolds.filter((item) => {
        const dishId = item.dishId ?? item.id;
        return serverDishStateById.get(dishId) === "held";
      }),
    [ownHolds, serverDishStateById],
  );
  const selectedDishIds = useMemo(
    () => new Set(activeOwnHolds.map((item) => item.dishId ?? item.id)),
    [activeOwnHolds],
  );

  const refresh = useCallback(() => router.refresh(), [router]);
  useSseRefresh(`/api/events/${inviteToken}`, refresh);

  useEffect(() => {
    if (!feedback) {
      return;
    }

    const timer = window.setTimeout(() => {
      setFeedback("");
    }, 2200);

    return () => window.clearTimeout(timer);
  }, [feedback]);

  useEffect(() => {
    let cancelled = false;

    async function loadOwnHolds() {
      const clientSessionId = getClientSessionId();
      const response = await fetch(
        `/api/public/holds?inviteToken=${encodeURIComponent(inviteToken)}&clientSessionId=${encodeURIComponent(clientSessionId)}`,
      );

      if (!response.ok || cancelled) {
        return;
      }

      const holds = (await response.json()) as Array<{
        id: string;
        dishId: string;
      }>;

      setOwnHolds((current) => {
        const merged = new Map<string, DrawerDish>();

        for (const item of current) {
          const dishId = item.dishId ?? item.id;
          merged.set(dishId, item);
        }

        for (const hold of holds) {
          const dish = dishes.find((item) => item.id === hold.dishId);
          if (!dish) {
            continue;
          }

          merged.set(hold.dishId, {
            id: hold.id,
            dishId: hold.dishId,
            dishName: dish.name,
            actionText: pickStableText(HOLD_SUCCESS_TEXTS, hold.dishId),
          });
        }

        return Array.from(merged.values());
      });
    }

    void loadOwnHolds();

    return () => {
      cancelled = true;
    };
  }, [inviteToken, dishes]);

  const visibleDishes = dishes.map((dish) => {
    const selected = activeOwnHolds.find(
      (item) => (item.dishId ?? item.id) === dish.id,
    );

    if (selected) {
      return {
        ...dish,
        state: "selected" as const,
        actionText: selected.actionText,
      };
    }

    return {
      ...dish,
      actionText:
        dish.state === "available"
          ? pickStableText(AVAILABLE_ACTION_TEXTS, dish.id)
          : undefined,
    };
  });

  const claimed = visibleDishes
    .filter((dish) => dish.state === "claimed")
    .map((dish) => ({
      id: dish.id,
      dishName: dish.name,
      customerName: dish.claimedBy,
    }));

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
      const body = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;
      setError(body?.error ?? "这道菜有人先盯上了");
      router.refresh();
      return;
    }

    const hold = (await response.json()) as { id: string; dishId: string };
    setOwnHolds((items) => [
      ...items,
      {
        id: hold.id,
        dishId: hold.dishId,
        dishName: selected.name,
        actionText: pickStableText(HOLD_SUCCESS_TEXTS, hold.dishId),
      },
    ]);
  }

  async function removeHold(holdId: string) {
    const hold = activeOwnHolds.find((item) => item.id === holdId);

    if (!hold) {
      return;
    }

    setError("");
    const response = await fetch(`/api/public/holds/${holdId}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        inviteToken,
        clientSessionId: getClientSessionId(),
      }),
    });

    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;
      setError(body?.error ?? "这道菜暂时不能取消");
      router.refresh();
      return;
    }

    setOwnHolds((items) => items.filter((item) => item.id !== holdId));
    router.refresh();
  }

  async function handleDishAction(dish: PublicDish) {
    if (dish.state === "selected") {
      const hold = activeOwnHolds.find(
        (item) => (item.dishId ?? item.id) === dish.id,
      );

      if (hold) {
        await removeHold(hold.id);
      }
      return;
    }

    await holdDish(dish.id);
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
        dishIds: activeOwnHolds.map((item) => item.dishId ?? item.id),
      }),
    });

    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;
      setError(body?.error ?? "这次选择不可提交");
      return;
    }

    setOwnHolds([]);
    setDialogOpen(false);
    setFeedback("懂你意思");
    router.refresh();
  }

  return (
    <main className="mobile-canvas public-ordering">
      <header className="brand-line">
        <strong>极饿世代</strong>
        <span>全员饿人！</span>
      </header>

      {error ? <p className="public-error">{error}</p> : null}
      {feedback ? <p className="public-feedback">{feedback}</p> : null}

      <section className="dish-list" aria-label="今晚菜单">
        {visibleDishes.map((dish) => (
          <DishCard key={dish.id} dish={dish} onAction={handleDishAction} />
        ))}
      </section>

      <SelectionDrawer
        ownHolds={activeOwnHolds}
        claimed={claimed}
        onSubmit={() => setDialogOpen(true)}
        onRemoveHold={removeHold}
      />
      <SubmitDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSubmit={submitOrder}
      />
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

function pickStableText(pool: string[], seed: string): string {
  let hash = 0;

  for (const char of seed) {
    hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  }

  return pool[hash % pool.length];
}
