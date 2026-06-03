import { getDatabase } from "@/db/client";
import { requireChefPageSession } from "@/lib/auth/chef-guard";
import { ChefShell } from "@/components/chef/chef-shell";
import { HistoryList } from "@/components/chef/history-list";
import { createChefService } from "@/server/chef-service";

export default async function ChefHistoryPage() {
  await requireChefPageSession();
  return (
    <ChefShell title="历史饭局">
      <HistoryList meals={createChefService(getDatabase()).getHistory()} />
    </ChefShell>
  );
}
