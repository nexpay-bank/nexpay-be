/* eslint-disable @typescript-eslint/no-unused-vars */
// schema.ts
import { sql } from "drizzle-orm";
import { pgTable, varchar, serial, integer, decimal, timestamp, primaryKey, boolean, text } from "drizzle-orm/pg-core";

// Tabel ROLE
export const roles = pgTable("role", {
  roleId: varchar("role_id", { length: 50 }).primaryKey(),
  role: varchar("role", { length: 50 }).notNull(),
});

// Tabel USER
export const users = pgTable("user", {
  uuid: varchar("uuid", { length: 50 }).primaryKey(),
  username: varchar("username", { length: 100 }).notNull(),
  password: varchar("password", { length: 255 }).notNull(),
  roleId: varchar("role_id", { length: 50 }).references(() => roles.roleId, {
    onDelete: "set null",
    onUpdate: "cascade",
  }),
  avatarUrl: text("avatar_url").default(sql`NULL`), 
  isActive: boolean("is_active").notNull().default(true), // <-- Tambahkan ini
});


// Tabel ACCOUNT
export const accounts = pgTable("account", {
  accountId: serial("account_id").primaryKey(),
  uuid: varchar("uuid", { length: 50 }).references(() => users.uuid, {
    onDelete: "cascade",
    onUpdate: "cascade",
  }),
  balance: decimal("balance", { precision: 12, scale: 2 }).notNull(),
});

// Tabel TRANSACTION
export const transactions = pgTable("transaction", {
  trcId: serial("trc_id").primaryKey(),
  accountId: integer("account_id").references(() => accounts.accountId, {
    onDelete: "cascade",
    onUpdate: "cascade",
  }),
  relatedAccountId: integer("related_account_id").notNull(),
  type: varchar("type", { length: 50 }).notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  timestamp: timestamp("timestamp").notNull(),
});

// Tabel MUTATION_HISTORY
export const mutationHistory = pgTable("mutation_history", {
  mutaId: serial("muta_id").primaryKey(),
  accountId: integer("account_id").references(() => accounts.accountId, {
    onDelete: "cascade",
    onUpdate: "cascade",
  }),
  relatedAccountId: integer("related_account_id").notNull(),
  uuid: varchar("uuid", { length: 50 }).references(() => users.uuid, {
    onDelete: "cascade",
    onUpdate: "cascade",
  }),
  actionType: varchar("action_type", { length: 50 }).notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  timestamp: timestamp("timestamp").notNull(),
  note: varchar("note", { length: 255 }).notNull(),
});
