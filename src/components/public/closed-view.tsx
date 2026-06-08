import Image from "next/image";

export function ClosedView() {
  return (
    <main className="mobile-canvas closed-view">
      <section className="closed-poster" aria-labelledby="closed-title">
        <h1 className="sr-only" id="closed-title">
          饿疯了
        </h1>
        <p className="sr-only">今日休息，明天再开饭。</p>

        <div className="closed-poster-frame">
          <Image
            src="/assets/poster-hunger.png"
            alt="电影海报风格的暂停营业页，主题为饿疯了"
            fill
            priority
            sizes="100vw"
            className="closed-poster-image"
          />
        </div>
      </section>
    </main>
  );
}
