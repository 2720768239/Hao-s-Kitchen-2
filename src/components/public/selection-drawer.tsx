"use client";

import { useMemo, useState } from "react";
import type { DrawerDish } from "./types";

type SelectionDrawerProps = {
  ownHolds: DrawerDish[];
  claimed: DrawerDish[];
  onSubmit: () => void;
  onRemoveHold: (holdId: string) => void;
};

export function SelectionDrawer({ ownHolds, claimed, onSubmit, onRemoveHold }: SelectionDrawerProps) {
  const [expanded, setExpanded] = useState(false);
  const summary = useMemo(() => `我馋上的（${ownHolds.length}）`, [ownHolds.length]);

  return (
    <aside className={`selection-drawer ${expanded ? "expanded" : "collapsed"}`} aria-label="嘴馋清单">
      <div className="drawer-bar">
        <button
          type="button"
          className="drawer-toggle"
          aria-expanded={expanded}
          aria-controls="selection-drawer-panel"
          onClick={() => setExpanded((value) => !value)}
        >
          <strong>{summary}</strong>
          <span>{expanded ? "点这里收起清单" : "点这里展开清单"}</span>
        </button>
        <button type="button" className="round-submit" disabled={ownHolds.length === 0} onClick={onSubmit}>
          馋
        </button>
      </div>

      {expanded ? (
        <div id="selection-drawer-panel" className="drawer-panel">
          <div className="drawer-panel-header">
            <strong>馋好了就报上名来</strong>
            <button type="button" className="drawer-close" onClick={() => setExpanded(false)}>
              收起
            </button>
          </div>

          <section>
            <h2>你已经馋上的</h2>
            {ownHolds.length > 0 ? (
              <ul>
                {ownHolds.map((item) => (
                  <li key={item.id}>
                    <div className="drawer-item-copy">
                      <span>{item.dishName}</span>
                      {item.actionText ? <strong>{item.actionText}</strong> : null}
                    </div>
                    <button type="button" className="drawer-remove" onClick={() => onRemoveHold(item.id)}>
                      取消
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="muted">还没馋上，先挑一道。</p>
            )}
          </section>

          <section>
            <h2>已有馋主</h2>
            {claimed.length > 0 ? (
              <ul>
                {claimed.map((item) => (
                  <li key={item.id}>
                    <span>{item.dishName}</span>
                    {item.customerName ? <strong>{item.customerName}</strong> : null}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="muted">暂时还没人拿下。</p>
            )}
          </section>
        </div>
      ) : null}
    </aside>
  );
}
