"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { DishRecord } from "@/server/chef-service";

export function DishList({ dishes }: { dishes: DishRecord[] }) {
  const router = useRouter();
  const [items, setItems] = useState(dishes);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  if (dishes.length === 0) {
    return <p className="chef-card">还没有菜品，先新增一道。</p>;
  }

  async function moveDish(index: number, direction: -1 | 1) {
    const targetIndex = index + direction;

    if (targetIndex < 0 || targetIndex >= items.length) {
      return;
    }

    const nextItems = [...items];
    const [moved] = nextItems.splice(index, 1);
    nextItems.splice(targetIndex, 0, moved);

    setBusyId(items[index]?.id ?? null);
    setMessage("");

    const payload = nextItems.map((dish, position) => ({
      id: dish.id,
      sortOrder: (position + 1) * 10,
    }));

    const response = await fetch("/api/chef/dishes/reorder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: payload }),
    });

    if (!response.ok) {
      setMessage("排序失败，请稍后再试");
      setBusyId(null);
      return;
    }

    const reordered = (await response.json()) as DishRecord[];
    setItems(reordered);
    setBusyId(null);
    router.refresh();
  }

  return (
    <section className="chef-list">
      {message ? <p className="chef-card form-message">{message}</p> : null}
      {items.map((dish, index) => (
        <article key={dish.id} className="chef-card row-card">
          <div>
            <h2>{dish.name}</h2>
            <p>{dish.tags.join(" / ") || "未打标签"}</p>
          </div>
          <span className="sort-order-badge">排序 {index + 1}</span>
          <span className={dish.isAvailable ? "state-on" : "state-off"}>
            {dish.isAvailable ? "已上架" : "已下架"}
          </span>
          <div className="chef-row-actions">
            <button
              type="button"
              className="chef-secondary"
              aria-label={`上移 ${dish.name}`}
              disabled={index === 0 || busyId !== null}
              onClick={() => moveDish(index, -1)}
            >
              上移
            </button>
            <button
              type="button"
              className="chef-secondary"
              aria-label={`下移 ${dish.name}`}
              disabled={index === items.length - 1 || busyId !== null}
              onClick={() => moveDish(index, 1)}
            >
              下移
            </button>
          </div>
          <Link href={`/chef/dishes/${dish.id}`} className="chef-link-button">
            编辑
          </Link>
        </article>
      ))}
    </section>
  );
}
