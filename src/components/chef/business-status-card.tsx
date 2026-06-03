"use client";

import { useRouter } from "next/navigation";
import type { MealSessionRecord } from "@/server/repositories";

type BusinessStatusCardProps = {
  activeMeal: MealSessionRecord | null;
};

export function BusinessStatusCard({ activeMeal }: BusinessStatusCardProps) {
  const router = useRouter();

  async function setStatus(status: "gathering" | "archived") {
    await fetch("/api/chef/business-status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    router.refresh();
  }

  return (
    <section className="chef-card business-card">
      <p className="eyebrow">营业状态</p>
      <div className="status-actions">
        <button
          type="button"
          className={`status-button ${activeMeal ? "active" : ""}`}
          onClick={() => setStatus("gathering")}
          disabled={Boolean(activeMeal)}
        >
          英雄集结
        </button>
        <button
          type="button"
          className="status-button dark"
          onClick={() => setStatus("archived")}
          disabled={!activeMeal}
        >
          群雄归隐
        </button>
      </div>
      <p className="current-status">
        当前状态：
        <strong>{activeMeal ? "英雄集结中" : "群雄归隐"}</strong>
      </p>
      {activeMeal ? (
        <label className="invite-field">
          邀请链接
          <input readOnly value={`/invite/${activeMeal.inviteToken}`} />
        </label>
      ) : (
        <p className="muted-dark">点击“英雄集结”创建下一场饭局。关闭的饭局不会重新打开。</p>
      )}
    </section>
  );
}
