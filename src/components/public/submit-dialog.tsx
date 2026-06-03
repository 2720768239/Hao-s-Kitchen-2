"use client";

import { useState } from "react";

type SubmitDialogProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: (input: { customerName: string; notes: string }) => void | Promise<void>;
};

export function SubmitDialog({ open, onClose, onSubmit }: SubmitDialogProps) {
  const [customerName, setCustomerName] = useState(() =>
    typeof window === "undefined" ? "" : (localStorage.getItem("hao-kitchen.customer-name") ?? ""),
  );
  const [notes, setNotes] = useState("");

  if (!open) {
    return null;
  }

  return (
    <div className="dialog-backdrop" role="presentation">
      <form
        className="submit-dialog"
        onSubmit={async (event) => {
          event.preventDefault();
          localStorage.setItem("hao-kitchen.customer-name", customerName);
          await onSubmit({ customerName, notes });
        }}
      >
        <button type="button" className="dialog-close" aria-label="关闭" onClick={onClose}>
          ×
        </button>
        <h2>报上名号，正式馋起！</h2>
        <label>
          名字
          <input value={customerName} onChange={(event) => setCustomerName(event.target.value)} required />
        </label>
        <label>
          备注
          <textarea value={notes} onChange={(event) => setNotes(event.target.value)} maxLength={100} />
        </label>
        <button type="submit" className="submit-main">
          报上名来
        </button>
      </form>
    </div>
  );
}
