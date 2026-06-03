"use client";

import Image from "next/image";
import type { PublicDish } from "./types";

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

type DishCardProps = {
  dish: PublicDish;
  onAction: (dish: PublicDish) => void;
};

export function DishCard({ dish, onAction }: DishCardProps) {
  const disabled = dish.state === "held" || dish.state === "claimed" || dish.state === "unavailable";
  const actionText = getActionText(dish);

  return (
    <article className={`dish-card dish-card-${dish.state}`}>
      <Image src={dish.imagePath} alt="" className="dish-image" width={92} height={74} />
      <div className="dish-body">
        <div className="dish-title-line">
          <h3>{dish.name}</h3>
          {dish.tags[0] ? <span className="stamp-small">{dish.tags[0]}</span> : null}
        </div>
        <p>{dish.description}</p>
        {dish.claimedBy ? <strong className="claimed-by">已被 {dish.claimedBy} 拿下</strong> : null}
      </div>
      <button
        type="button"
        className={`stamp-button ${dish.state === "selected" ? "stamp-button-selected" : ""}`}
        disabled={disabled}
        aria-label={getAriaLabel(dish, actionText)}
        onClick={() => onAction(dish)}
      >
        {actionText}
      </button>
    </article>
  );
}

function getActionText(dish: PublicDish): string {
  if (dish.state === "selected") {
    return dish.actionText ?? "已经馋上了";
  }

  if (dish.state === "held") {
    return "有人先盯上了";
  }

  if (dish.state === "claimed") {
    return "已有馋主";
  }

  if (dish.state === "unavailable") {
    return "暂不出战";
  }

  return dish.actionText ?? pickStableText(AVAILABLE_ACTION_TEXTS, dish.id);
}

function getAriaLabel(dish: PublicDish, actionText: string): string {
  if (dish.state === "selected") {
    return `取消已选 ${dish.name}`;
  }

  if (dish.state === "available") {
    return `选择 ${dish.name}：${actionText}`;
  }

  return actionText;
}

function pickStableText(pool: string[], seed: string): string {
  let hash = 0;

  for (const char of seed) {
    hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  }

  return pool[hash % pool.length];
}
