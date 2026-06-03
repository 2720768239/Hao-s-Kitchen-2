"use client";

import Link from "next/link";
import { useCallback } from "react";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useSseRefresh } from "@/hooks/use-sse-refresh";

type ChefShellProps = {
  title: string;
  children: ReactNode;
};

export function ChefShell({ title, children }: ChefShellProps) {
  const router = useRouter();
  const refresh = useCallback(() => router.refresh(), [router]);
  useSseRefresh("/api/chef/events", refresh);

  return (
    <main className="mobile-canvas chef-console">
      <header className="chef-header">
        <div>
          <strong>极饿时代</strong>
          <span>主厨工具台</span>
        </div>
        <Link href="/chef" className="chef-pill">
          首页
        </Link>
      </header>
      <h1 className="chef-title">{title}</h1>
      {children}
      <nav className="chef-tabbar" aria-label="主厨导航">
        <Link href="/chef">首页</Link>
        <Link href="/chef/to-cook">待做清单</Link>
        <Link href="/chef/dishes">菜单管理</Link>
        <Link href="/chef/history">历史</Link>
      </nav>
    </main>
  );
}
