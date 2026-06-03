import { notFound } from "next/navigation";
import { getDatabase } from "@/db/client";
import { requireChefPageSession } from "@/lib/auth/chef-guard";
import { ChefShell } from "@/components/chef/chef-shell";
import { HistoryDetailCard } from "@/components/chef/history-detail-card";
import { createChefService } from "@/server/chef-service";

export default async function ChefHistoryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireChefPageSession();
  const { id } = await params;
  const history = createChefService(getDatabase()).getHistoryDetail(id);

  if (!history) {
    notFound();
  }

  return (
    <ChefShell title="饭局详情">
      <HistoryDetailCard history={history} />
    </ChefShell>
  );
}
