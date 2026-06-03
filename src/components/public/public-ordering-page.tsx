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
  const selectedIds = useMemo(() => new Set(ownHolds.map((item) => item.id)), [ownHolds]);

  const refresh = useCallback(() => router.refresh(), [router]);
  useSseRefresh(`/api/events/${inviteToken}`, refresh);

  const visibleDishes = dishes.map((dish) =>
    selectedIds.has(dish.id) ? { ...dish, state: "held" as const } : dish,
  );
  const claimed = visibleDishes
    .filter((dish) => dish.state === "claimed")
    .map((dish) => ({ id: dish.id, dishName: dish.name, customerName: dish.claimedBy }));

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

      <section className="dish-list" aria-label="今晚菜单">
        {visibleDishes.map((dish) => (
          <DishCard
            key={dish.id}
            dish={dish}
            onHold={(dishId) => {
              const selected = visibleDishes.find((item) => item.id === dishId);
              if (selected && !selectedIds.has(selected.id)) {
                setOwnHolds((items) => [...items, { id: selected.id, dishName: selected.name }]);
              }
            }}
          />
        ))}
      </section>

      <SelectionDrawer ownHolds={ownHolds} claimed={claimed} onSubmit={() => setDialogOpen(true)} />
      <SubmitDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSubmit={() => {
          setDialogOpen(false);
          router.refresh();
        }}
      />
    </main>
  );
}
