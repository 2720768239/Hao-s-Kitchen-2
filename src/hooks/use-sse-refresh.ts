"use client";

import { useEffect } from "react";

export function useSseRefresh(url: string | null, onRefresh: () => void) {
  useEffect(() => {
    if (!url) {
      return;
    }

    const events = new EventSource(url);
    events.addEventListener("refresh", onRefresh);

    return () => {
      events.removeEventListener("refresh", onRefresh);
      events.close();
    };
  }, [url, onRefresh]);
}
