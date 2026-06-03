import { getDatabase } from "@/db/client";
import { ChefShell } from "@/components/chef/chef-shell";
import { HistoryList } from "@/components/chef/history-list";
import { createChefService } from "@/server/chef-service";

export default function ChefHistoryPage() {
  return (
    <ChefShell title="历史饭局">
      <HistoryList meals={createChefService(getDatabase()).getHistory()} />
    </ChefShell>
  );
}
