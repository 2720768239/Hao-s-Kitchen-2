import Link from "next/link";
import type { DishRecord } from "@/server/chef-service";

export function DishList({ dishes }: { dishes: DishRecord[] }) {
  return (
    <section className="chef-list">
      {dishes.map((dish) => (
        <article key={dish.id} className="chef-card row-card">
          <div>
            <h2>{dish.name}</h2>
            <p>{dish.tags.join(" / ") || "未打标签"}</p>
          </div>
          <span className={dish.isAvailable ? "state-on" : "state-off"}>
            {dish.isAvailable ? "已上架" : "已下架"}
          </span>
          <Link href={`/chef/dishes/${dish.id}`} className="chef-link-button">
            编辑
          </Link>
        </article>
      ))}
    </section>
  );
}
