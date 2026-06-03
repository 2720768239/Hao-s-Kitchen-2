"use client";

import type { DrawerDish } from "./types";

type SelectionDrawerProps = {
  ownHolds: DrawerDish[];
  claimed: DrawerDish[];
  onSubmit: () => void;
};

export function SelectionDrawer({ ownHolds, claimed, onSubmit }: SelectionDrawerProps) {
  return (
    <aside className="selection-drawer" aria-label="已选菜品">
      <section>
        <h2>你已经馋上的</h2>
        {ownHolds.length > 0 ? (
          <ul>
            {ownHolds.map((item) => (
              <li key={item.id}>
                <span>{item.dishName}</span>
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
          <p className="muted">暂无人拿下。</p>
        )}
      </section>

      <button type="button" className="round-submit" disabled={ownHolds.length === 0} onClick={onSubmit}>
        馋
      </button>
    </aside>
  );
}
