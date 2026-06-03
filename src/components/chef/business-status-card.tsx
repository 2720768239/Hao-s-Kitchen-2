"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { MealSessionRecord } from "@/server/repositories";

type BusinessStatusCardProps = {
  activeMeal: MealSessionRecord | null;
};

async function copyText(text: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "true");
  textarea.style.position = "absolute";
  textarea.style.left = "-9999px";
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  document.body.removeChild(textarea);
}

export function BusinessStatusCard({ activeMeal }: BusinessStatusCardProps) {
  const router = useRouter();
  const [copyMessage, setCopyMessage] = useState("");

  async function setStatus(status: "gathering" | "archived") {
    await fetch("/api/chef/business-status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setCopyMessage("");
    router.refresh();
  }

  async function copyInviteLink() {
    if (!activeMeal) {
      return;
    }

    const inviteUrl = `${window.location.origin}/invite/${activeMeal.inviteToken}`;

    try {
      await copyText(inviteUrl);
      setCopyMessage("已复制完整链接");
    } catch {
      setCopyMessage("复制失败");
    }
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
        <div className="invite-block">
          <label className="invite-field">
            邀请链接
            <input readOnly value={`/invite/${activeMeal.inviteToken}`} />
          </label>
          <button type="button" className="invite-copy-button" onClick={copyInviteLink} aria-label="复制邀请链接">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <rect x="9" y="9" width="10" height="10" rx="2" />
              <path d="M7 15H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2v1" />
            </svg>
          </button>
          {copyMessage ? <p className="form-message invite-copy-message">{copyMessage}</p> : null}
        </div>
      ) : (
        <p className="muted-dark">点击“英雄集结”创建下一场饭局。关闭的饭局不会重新打开。</p>
      )}
    </section>
  );
}
