import { readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";

export type AppDatabase = DatabaseSync;

export function openDatabase(filename: string): AppDatabase {
  const database = new DatabaseSync(filename);
  database.exec("PRAGMA foreign_keys = ON");
  return database;
}

export function migrate(database: AppDatabase): void {
  const migration = readFileSync(
    new URL("../../../migrations/001_core.sql", import.meta.url),
    "utf8"
  );
  database.exec(migration);
}
