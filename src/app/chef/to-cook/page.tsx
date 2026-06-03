import { getDatabase } from "@/db/client";
import { ChefShell } from "@/components/chef/chef-shell";
import { ToCookList } from "@/components/chef/to-cook-list";
import { createChefService } from "@/server/chef-service";

export default function ToCookPage() {
  return (
    <ChefShell title="待做清单">
      <ToCookList items={createChefService(getDatabase()).getToCook()} />
    </ChefShell>
  );
}
