import { notFound } from "next/navigation";
import { getDatabase } from "@/db/client";
import { ChefShell } from "@/components/chef/chef-shell";
import { DishEditor } from "@/components/chef/dish-editor";
import { createChefService } from "@/server/chef-service";

export default async function ChefDishEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const dish = createChefService(getDatabase()).listDishes().find((item) => item.id === id);

  if (!dish) {
    notFound();
  }

  return (
    <ChefShell title="编辑菜品">
      <DishEditor dish={dish} />
    </ChefShell>
  );
}
