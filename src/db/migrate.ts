import Database from "better-sqlite3";

export function runMigrations(sqlite: Database.Database): void {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS meal_sessions (
      id TEXT PRIMARY KEY,
      invite_token TEXT NOT NULL UNIQUE,
      status TEXT NOT NULL CHECK (status IN ('gathering', 'archived')),
      created_at INTEGER NOT NULL,
      archived_at INTEGER
    );

    CREATE UNIQUE INDEX IF NOT EXISTS one_gathering_meal_session
      ON meal_sessions(status)
      WHERE status = 'gathering';

    CREATE TABLE IF NOT EXISTS chef_sessions (
      id TEXT PRIMARY KEY,
      token_hash TEXT NOT NULL,
      expires_at INTEGER NOT NULL,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS dishes (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      image_path TEXT NOT NULL,
      description TEXT NOT NULL,
      tags TEXT NOT NULL DEFAULT '[]',
      sort_order INTEGER NOT NULL,
      is_available INTEGER NOT NULL DEFAULT 1,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS dish_holds (
      id TEXT PRIMARY KEY,
      meal_session_id TEXT NOT NULL,
      dish_id TEXT NOT NULL,
      client_session_id TEXT NOT NULL,
      hold_started_at INTEGER NOT NULL,
      expires_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      meal_session_id TEXT NOT NULL,
      customer_name TEXT NOT NULL,
      notes TEXT,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS order_dishes (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL,
      meal_session_id TEXT NOT NULL,
      dish_id TEXT NOT NULL
    );

    CREATE UNIQUE INDEX IF NOT EXISTS unique_order_dish_per_meal
      ON order_dishes(meal_session_id, dish_id);

    CREATE TABLE IF NOT EXISTS event_versions (
      scope TEXT PRIMARY KEY,
      version INTEGER NOT NULL DEFAULT 0,
      updated_at INTEGER NOT NULL
    );
  `);
}
