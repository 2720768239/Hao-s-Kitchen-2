import { getDatabase } from "@/db/client";
import { ChefShell } from "@/components/chef/chef-shell";
import { DishList } from "@/components/chef/dish-list";
import { createChefService } from "@/server/chef-service";

export default function ChefDishesPage() {
  return (
    <ChefShell title="菜单管理">
      <div className="toolbar-line">
        <span className="muted-dark">先编辑已导入菜品；新增菜品可通过 API 上传图片后创建。</span>
      </div>
      <DishList dishes={createChefService(getDatabase()).listDishes()} />
    </ChefShell>
  );
}
