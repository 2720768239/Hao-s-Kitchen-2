import { getDatabase } from "@/db/client";
import { requireChefPageSession } from "@/lib/auth/chef-guard";
import { ChefShell } from "@/components/chef/chef-shell";
import { DishCreateForm } from "@/components/chef/dish-create-form";
import { DishList } from "@/components/chef/dish-list";
import { createChefService } from "@/server/chef-service";

export default async function ChefDishesPage() {
  await requireChefPageSession();
  const dishes = createChefService(getDatabase()).listDishes();
  const nextSortOrder =
    dishes.length === 0 ? 10 : Math.max(...dishes.map((dish) => dish.sortOrder)) + 10;

  return (
    <ChefShell title="菜单管理">
      <DishCreateForm nextSortOrder={nextSortOrder} />
      <DishList
        key={dishes.map((dish) => `${dish.id}:${dish.sortOrder}:${dish.updatedAt.getTime()}`).join("|")}
        dishes={dishes}
      />
    </ChefShell>
  );
}
