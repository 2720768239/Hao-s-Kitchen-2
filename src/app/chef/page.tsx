import { getDatabase } from "@/db/client";
import { BusinessStatusCard } from "@/components/chef/business-status-card";
import { ChefShell } from "@/components/chef/chef-shell";
import { createChefService } from "@/server/chef-service";

export default function ChefHomePage() {
  const chef = createChefService(getDatabase());

  return (
    <ChefShell title="晚上好，主厨！">
      <BusinessStatusCard activeMeal={chef.getActiveMeal()} />
      <section className="chef-card reminder-card">
        <h2>今日提醒</h2>
        <p>英雄集结代表开启饭局；群雄归隐后，本场饭局永久归档。</p>
      </section>
    </ChefShell>
  );
}
