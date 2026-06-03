import type { HistoryMealDetail } from "@/server/chef-service";

export function HistoryDetailCard({ history }: { history: HistoryMealDetail }) {
  return (
    <section className="chef-card history-detail">
      <p>创建时间：{history.createdAt.toLocaleString("zh-CN")}</p>
      <p>归档时间：{history.archivedAt?.toLocaleString("zh-CN") ?? "未记录"}</p>
      {history.orders.map((order) => (
        <article key={order.id}>
          <div className="history-order-head">
            <h2>{order.customerName}</h2>
            <time>提交时间：{order.createdAt.toLocaleString("zh-CN")}</time>
          </div>
          <p>{order.notes || "无备注"}</p>
          <ul>
            {order.dishes.map((dish) => (
              <li key={dish.id}>{dish.name}</li>
            ))}
          </ul>
        </article>
      ))}
    </section>
  );
}
