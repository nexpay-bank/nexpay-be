/* eslint-disable @typescript-eslint/no-unused-vars */
// schema.ts
import { sql } from "drizzle-orm";
import { pgTable, varchar, serial, integer, decimal, timestamp, primaryKey, boolean, text } from "drizzle-orm/pg-core";

// Tabel ROLE
export const role = pgTable("role", {
  roleId: varchar("role_id", { length: 50 }).primaryKey(),
  role: varchar("role", { length: 50 }).notNull(),
});

// Tabel USER
export const user = pgTable("user", {
  uuid: varchar("uuid", { length: 50 }).primaryKey(),
  username: varchar("username", { length: 100 }).notNull(),
  password: varchar("password", { length: 255 }).notNull(),
  roleId: varchar("role_id", { length: 50 }).references(() => role.roleId, {
    onDelete: "set null",
    onUpdate: "cascade",
  }),
  avatar_url: text("avatar_url").default(sql`NULL`), 
  isActive: boolean("is_active").notNull().default(true), // <-- Tambahkan ini
});


// Tabel ACCOUNT
export const account = pgTable("account", {
  accountId: serial("account_id").primaryKey(),
  uuid: varchar("uuid", { length: 50 }).references(() => user.uuid, {
    onDelete: "cascade",
    onUpdate: "cascade",
  }),
  balance: decimal("balance", { precision: 12, scale: 2 }).notNull(),
});

// Tabel TRANSACTION
export const transaction = pgTable("transaction", {
  trcId: serial("trc_id").primaryKey(),
  accountId: integer("account_id").references(() => account.accountId, {
    onDelete: "cascade",
    onUpdate: "cascade",
  }),
  type: varchar("type", { length: 50 }).notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  timestamp: timestamp("timestamp").notNull(),
});

// Tabel MUTATION_HISTORY
export const mutationHistory = pgTable("mutation_history", {
  mutaId: serial("muta_id").primaryKey(),
  accountId: integer("account_id").references(() => account.accountId, {
    onDelete: "cascade",
    onUpdate: "cascade",
  }),
  uuid: varchar("uuid", { length: 50 }).references(() => user.uuid, {
    onDelete: "cascade",
    onUpdate: "cascade",
  }),
  actionType: varchar("action_type", { length: 50 }).notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  timestamp: timestamp("timestamp").notNull(),
  note: varchar("note", { length: 255 }).notNull(),
});
