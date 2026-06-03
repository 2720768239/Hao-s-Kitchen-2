import { pathToFileURL } from "node:url";
import { getDatabase } from "./client";
import { dishes } from "./schema";

type SeedDishRow = Omit<
  typeof dishes.$inferInsert,
  "createdAt" | "updatedAt" | "isAvailable"
>;

const seedDishRows = [
  {
    id: "dish-laziji",
    name: "辣子鸡丁",
    imagePath: "/seed/dish-laziji.png",
    description: "香辣过瘾，米饭杀手",
    tags: JSON.stringify(["招牌", "下饭神器"]),
    sortOrder: 10,
  },
  {
    id: "dish-lemon-chicken",
    name: "柠檬手撕鸡",
    imagePath: "/seed/dish-lemon-chicken.png",
    description: "酸辣清爽，低脂高蛋白",
    tags: JSON.stringify(["清爽", "凉菜"]),
    sortOrder: 20,
  },
  {
    id: "dish-yuxiang",
    name: "鱼香肉丝",
    imagePath: "/seed/dish-yuxiang.png",
    description: "酸甜咸鲜，超级下饭",
    tags: JSON.stringify(["经典", "下饭"]),
    sortOrder: 30,
  },
  {
    id: "dish-tomato-egg",
    name: "番茄炒蛋",
    imagePath: "/seed/dish-tomato-egg.png",
    description: "酸甜多汁，经典不翻车",
    tags: JSON.stringify(["家常", "经典"]),
    sortOrder: 40,
  },
  {
    id: "dish-beans",
    name: "干煸四季豆",
    imagePath: "/seed/dish-beans.png",
    description: "干香入味，越嚼越上头",
    tags: JSON.stringify(["素菜", "干香"]),
    sortOrder: 50,
  },
] satisfies SeedDishRow[];

export function seedDishes(database = getDatabase()): void {
  const now = new Date();

  for (const row of seedDishRows) {
    database.db
      .insert(dishes)
      .values({
        ...row,
        isAvailable: true,
        createdAt: now,
        updatedAt: now,
      })
      .onConflictDoNothing()
      .run();
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  seedDishes();
}
