import Image from "next/image";

export function ClosedView() {
  return (
    <main className="mobile-canvas closed-view">
      <header className="brand-line">
        <strong>极饿时代</strong>
        <span>好好吃饭，反抗平庸！</span>
      </header>

      <section className="poster closed-poster" aria-labelledby="closed-title">
        <h1 id="closed-title" className="brush-title">
          群雄归隐
        </h1>
        <p className="red-banner">酒足饭饱，江湖不见！</p>
        <p className="closed-copy">今日的战局，已是圆满。明日再战，干饭不散！</p>
        <Image
          className="poster-chef"
          src="/assets/chef-closed.png"
          alt=""
          width={280}
          height={280}
          priority
        />
        <div className="paper-tags">
          <span>吃饱才有底气</span>
          <span>明天继续！</span>
        </div>
      </section>
    </main>
  );
}
