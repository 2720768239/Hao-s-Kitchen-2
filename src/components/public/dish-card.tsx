"use client";

import Image from "next/image";
import type { PublicDish } from "./types";

type DishCardProps = {
  dish: PublicDish;
  onHold: (dishId: string) => void;
};

export function DishCard({ dish, onHold }: DishCardProps) {
  const disabled = dish.state !== "available";
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
        className="stamp-button"
        disabled={disabled}
        onClick={() => onHold(dish.id)}
      >
        {actionText}
      </button>
    </article>
  );
}

function getActionText(dish: PublicDish): string {
  if (dish.state === "held") {
    return "有人先盯上了";
  }

  if (dish.state === "claimed") {
    return "已有馋主";
  }

  if (dish.state === "unavailable") {
    return "暂不出战";
  }

  return "馋这道";
}
