import { integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const mealSessions = sqliteTable(
  "meal_sessions",
  {
    id: text("id").primaryKey(),
    inviteToken: text("invite_token").notNull(),
    status: text("status", { enum: ["gathering", "archived"] }).notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
    archivedAt: integer("archived_at", { mode: "timestamp_ms" }),
  },
  (table) => ({
    inviteTokenIdx: uniqueIndex("meal_sessions_invite_token_unique").on(table.inviteToken),
  }),
);

export const chefSessions = sqliteTable("chef_sessions", {
  id: text("id").primaryKey(),
  tokenHash: text("token_hash").notNull(),
  expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
});

export const dishes = sqliteTable("dishes", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  imagePath: text("image_path").notNull(),
  description: text("description").notNull(),
  tags: text("tags").notNull().default("[]"),
  sortOrder: integer("sort_order").notNull(),
  isAvailable: integer("is_available", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
});

export const dishHolds = sqliteTable("dish_holds", {
  id: text("id").primaryKey(),
  mealSessionId: text("meal_session_id").notNull(),
  dishId: text("dish_id").notNull(),
  clientSessionId: text("client_session_id").notNull(),
  holdStartedAt: integer("hold_started_at", { mode: "timestamp_ms" }).notNull(),
  expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
});

export const orders = sqliteTable("orders", {
  id: text("id").primaryKey(),
  mealSessionId: text("meal_session_id").notNull(),
  customerName: text("customer_name").notNull(),
  notes: text("notes"),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
});

export const orderDishes = sqliteTable(
  "order_dishes",
  {
    id: text("id").primaryKey(),
    orderId: text("order_id").notNull(),
    mealSessionId: text("meal_session_id").notNull(),
    dishId: text("dish_id").notNull(),
  },
  (table) => ({
    uniqueDishPerMealIdx: uniqueIndex("unique_order_dish_per_meal").on(
      table.mealSessionId,
      table.dishId,
    ),
  }),
);

export const eventVersions = sqliteTable("event_versions", {
  scope: text("scope").primaryKey(),
  version: integer("version").notNull().default(0),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
});
