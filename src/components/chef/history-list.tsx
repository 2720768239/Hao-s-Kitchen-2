import Link from "next/link";
import type { HistoryMealSummary } from "@/server/chef-service";

export function HistoryList({ meals }: { meals: HistoryMealSummary[] }) {
  if (meals.length === 0) {
    return <p className="chef-card">还没有归档饭局。</p>;
  }

  return (
    <section className="chef-list">
      {meals.map((meal) => (
        <Link key={meal.id} href={`/chef/history/${meal.id}`} className="chef-card history-row">
          <strong>{meal.archivedAt?.toLocaleString("zh-CN") ?? "未记录时间"}</strong>
          <span>
            {meal.orderCount} 单 · {meal.dishCount} 道菜
          </span>
        </Link>
      ))}
    </section>
  );
}
