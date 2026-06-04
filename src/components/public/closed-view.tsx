import Image from "next/image";

export function ClosedView() {
  return (
    <main className="mobile-canvas closed-view">
      <section className="closed-poster" aria-labelledby="closed-title">
        <header className="closed-nav" aria-label="极饿时代停业状态">
          <div className="closed-brand-mark">
            <strong>极饿时代</strong>
            <span>全员饿人！</span>
          </div>
          <span className="closed-menu-icon" aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
        </header>

        <div className="closed-message">
          <h1 id="closed-title" className="closed-brush-title">
            群雄归隐
          </h1>
          <p className="closed-red-banner">再会！</p>

        </div>

        <div className="closed-hero-art" aria-hidden="true">
          <Image
            className="closed-chef-image"
            src="/assets/chef-closed-no-headband.png"
            alt=""
            fill
            priority
          />
          <div className="closed-back-character">饿</div>
          <div className="closed-art-fade" />
        </div>

        {/* <div className="closed-sticker closed-sticker-left">吃饱才有底气</div> */}
        {/* <div className="closed-sticker closed-sticker-round">厨房才是主场</div> */}

        {/* <footer className="closed-footer">
          <p>营业时间：11:30-14:00　17:30-21:30</p>
          <strong>拔住屏幕，回到江湖</strong>
        </footer> */}
      </section>
    </main>
  );
}
