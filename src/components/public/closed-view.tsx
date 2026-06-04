import Image from "next/image";

export function ClosedView() {
  return (
    <main className="mobile-canvas closed-view">
      <header className="brand-line">
        <strong>极饿时代</strong>
        <span>全员饿人！</span>
      </header>

      <section className="poster closed-poster" aria-labelledby="closed-title">
        <h1 id="closed-title" className="brush-title">
          群雄归隐
        </h1>
        {/* <p className="red-banner">酒足饭饱，江湖不见！</p> */}
        {/* <div className="poster-chef-frame">
          <Image
            className="poster-chef"
            src="/assets/chef-closed.png"
            alt=""
            fill
            priority
          />
        </div> */}
      </section>
    </main>
  );
}
