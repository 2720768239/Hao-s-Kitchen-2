import { getDatabase } from "@/db/client";
import { ChefShell } from "@/components/chef/chef-shell";
import { DishCreateForm } from "@/components/chef/dish-create-form";
import { DishList } from "@/components/chef/dish-list";
import { createChefService } from "@/server/chef-service";

export default function ChefDishesPage() {
  const dishes = createChefService(getDatabase()).listDishes();
  const nextSortOrder =
    dishes.length === 0 ? 10 : Math.max(...dishes.map((dish) => dish.sortOrder)) + 10;

  return (
    <ChefShell title="菜单管理">
      <DishCreateForm nextSortOrder={nextSortOrder} />
      <DishList dishes={dishes} />
    </ChefShell>
  );
}
