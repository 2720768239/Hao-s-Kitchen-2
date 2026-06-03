import type { ToCookItem } from "@/server/chef-service";

export function ToCookList({ items }: { items: ToCookItem[] }) {
  if (items.length === 0) {
    return <p className="chef-card">还没有新单，先备好锅。</p>;
  }

  return (
    <section className="chef-list">
      {items.map((item) => (
        <article
          key={`${item.dishId}-${item.customerName}-${item.createdAt.toISOString()}`}
          className="chef-card row-card"
        >
          <div>
            <h2>{item.dishName}</h2>
            <p>
              {item.customerName}
              {item.notes ? `：${item.notes}` : ""}
            </p>
          </div>
          <time>{item.createdAt.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}</time>
        </article>
      ))}
    </section>
  );
}
