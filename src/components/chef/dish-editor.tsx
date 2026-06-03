"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { DishRecord } from "@/server/chef-service";

export function DishEditor({ dish }: { dish: DishRecord }) {
  const router = useRouter();
  const [name, setName] = useState(dish.name);
  const [description, setDescription] = useState(dish.description);
  const [isAvailable, setIsAvailable] = useState(dish.isAvailable);

  return (
    <form
      className="chef-card editor-form"
      onSubmit={async (event) => {
        event.preventDefault();
        await fetch(`/api/chef/dishes/${dish.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, description, isAvailable }),
        });
        router.push("/chef/dishes");
        router.refresh();
      }}
    >
      <label>
        菜名
        <input value={name} onChange={(event) => setName(event.target.value)} maxLength={20} required />
      </label>
      <label>
        描述
        <textarea value={description} onChange={(event) => setDescription(event.target.value)} maxLength={100} />
      </label>
      <label className="switch-line">
        是否上架
        <input type="checkbox" checked={isAvailable} onChange={(event) => setIsAvailable(event.target.checked)} />
      </label>
      <button className="chef-primary" type="submit">
        保存
      </button>
    </form>
  );
}
