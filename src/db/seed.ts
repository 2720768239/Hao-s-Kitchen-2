import { pathToFileURL } from "node:url";
import { getDatabase } from "./client";

const seedDishRows = [
  {
    id: "dish-laziji",
    name: "辣子鸡丁",
    imagePath: "/assets/dish-laziji.png",
    description: "香辣过瘾，米饭杀手",
    tags: ["推荐", "下饭神器"],
    sortOrder: 10,
  },
  {
    id: "dish-lemon-chicken",
    name: "柠檬手撕鸡",
    imagePath: "/assets/dish-lemon-chicken.png",
    description: "酸辣清爽，低脂高蛋白",
    tags: ["热门", "清爽"],
    sortOrder: 20,
  },
  {
    id: "dish-yuxiang",
    name: "鱼香肉丝",
    imagePath: "/assets/dish-yuxiang.png",
    description: "酸甜咸鲜，超强下饭",
    tags: ["经典", "下饭"],
    sortOrder: 30,
  },
  {
    id: "dish-tomato-egg",
    name: "番茄炒蛋",
    imagePath: "/assets/dish-tomato-egg.png",
    description: "酸甜多汁，经典不翻车",
    tags: ["家常", "经典"],
    sortOrder: 40,
  },
  {
    id: "dish-beans",
    name: "干煸四季豆",
    imagePath: "/assets/dish-beans.png",
    description: "干香入味，越嚼越上头",
    tags: ["素菜", "干香"],
    sortOrder: 50,
  },
];

export function seedDishes(database = getDatabase()): void {
  const now = Date.now();
  const upsert = database.sqlite.prepare(
    `INSERT INTO dishes (
       id, name, image_path, description, tags, sort_order, is_available, created_at, updated_at
     ) VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       name = excluded.name,
       image_path = excluded.image_path,
       description = excluded.description,
       tags = excluded.tags,
       sort_order = excluded.sort_order,
       is_available = 1,
       updated_at = excluded.updated_at`,
  );

  for (const row of seedDishRows) {
    upsert.run(
      row.id,
      row.name,
      row.imagePath,
      row.description,
      JSON.stringify(row.tags),
      row.sortOrder,
      now,
      now,
    );
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  seedDishes();
}
