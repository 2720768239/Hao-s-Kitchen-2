import { notFound } from "next/navigation";
import { getDatabase } from "@/db/client";
import { ChefShell } from "@/components/chef/chef-shell";
import { createChefService } from "@/server/chef-service";

export default async function ChefHistoryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const history = createChefService(getDatabase()).getHistoryDetail(id);

  if (!history) {
    notFound();
  }

  return (
    <ChefShell title="饭局详情">
      <section className="chef-card history-detail">
        <p>归档时间：{history.archivedAt?.toLocaleString("zh-CN") ?? "未记录"}</p>
        {history.orders.map((order) => (
          <article key={order.id}>
            <h2>{order.customerName}</h2>
            <p>{order.notes || "无备注"}</p>
            <ul>
              {order.dishes.map((dish) => (
                <li key={dish.id}>{dish.name}</li>
              ))}
            </ul>
          </article>
        ))}
      </section>
    </ChefShell>
  );
}
