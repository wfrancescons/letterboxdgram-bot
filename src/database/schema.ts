import { DatabaseSync } from "node:sqlite";
import { type Generated, Kysely } from "kysely";
import config from "@/config.ts";
import { NodeSqliteDialect } from "./dialect.ts";

export type UsersTable = {
  telegram_id: number;
  letterboxd_username: string;
  created_at: string;
  updated_at: string;
};

export type CommandUsageLogsTable = {
  id: Generated<number>;
  telegram_id: number;
  chat_id: number;
  command: string;
  timestamp: string;
};

export type DatabaseSchema = {
  users: UsersTable;
  command_usage_logs: CommandUsageLogsTable;
};

const sqlite = new DatabaseSync(config.database.path);

// Configure SQLite for high concurrency and avoid locks
sqlite.exec("PRAGMA busy_timeout = 5000;");
sqlite.exec("PRAGMA journal_mode = WAL;");
sqlite.exec("PRAGMA synchronous = NORMAL;");

export const db = new Kysely<DatabaseSchema>({
  dialect: new NodeSqliteDialect(sqlite),
});

export async function initDatabase(): Promise<void> {
  await db.schema.createTable("users")
    .ifNotExists()
    .addColumn("telegram_id", "integer", (col) => col.primaryKey().notNull())
    .addColumn("letterboxd_username", "text", (col) => col.notNull())
    .addColumn("created_at", "text", (col) => col.notNull())
    .addColumn("updated_at", "text", (col) => col.notNull())
    .execute();

  await db.schema.createTable("command_usage_logs")
    .ifNotExists()
    .addColumn("id", "integer", (col) => col.primaryKey().autoIncrement())
    .addColumn("telegram_id", "integer", (col) => col.notNull())
    .addColumn("chat_id", "integer", (col) => col.notNull())
    .addColumn("command", "text", (col) => col.notNull())
    .addColumn("timestamp", "text", (col) => col.notNull())
    .execute();

  await db.schema.createIndex("idx_command_usage_logs_timestamp")
    .ifNotExists()
    .on("command_usage_logs")
    .column("timestamp")
    .execute();
}
