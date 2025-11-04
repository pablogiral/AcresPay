import { sql } from "drizzle-orm";
import { pgTable, text, varchar, decimal, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Bill splitting database tables
export const bills = pgTable("bills", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  date: timestamp("date").notNull().defaultNow(),
  payerId: varchar("payer_id"),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
});

export const participants = pgTable("participants", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  billId: varchar("bill_id").notNull().references(() => bills.id, { onDelete: 'cascade' }),
  name: text("name").notNull(),
  color: text("color").notNull(),
});

export const lineItems = pgTable("line_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  billId: varchar("bill_id").notNull().references(() => bills.id, { onDelete: 'cascade' }),
  description: text("description").notNull(),
  quantity: integer("quantity").notNull(),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  totalPrice: decimal("total_price", { precision: 10, scale: 2 }).notNull(),
  isShared: boolean("is_shared").notNull().default(false),
});

export const claims = pgTable("claims", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  lineItemId: varchar("line_item_id").notNull().references(() => lineItems.id, { onDelete: 'cascade' }),
  participantId: varchar("participant_id").notNull().references(() => participants.id, { onDelete: 'cascade' }),
  quantity: integer("quantity").notNull(),
  isShared: boolean("is_shared").notNull().default(false),
});

// Relations
export const billsRelations = relations(bills, ({ many }) => ({
  participants: many(participants),
  lineItems: many(lineItems),
}));

export const participantsRelations = relations(participants, ({ one, many }) => ({
  bill: one(bills, {
    fields: [participants.billId],
    references: [bills.id],
  }),
  claims: many(claims),
}));

export const lineItemsRelations = relations(lineItems, ({ one, many }) => ({
  bill: one(bills, {
    fields: [lineItems.billId],
    references: [bills.id],
  }),
  claims: many(claims),
}));

export const claimsRelations = relations(claims, ({ one }) => ({
  lineItem: one(lineItems, {
    fields: [claims.lineItemId],
    references: [lineItems.id],
  }),
  participant: one(participants, {
    fields: [claims.participantId],
    references: [participants.id],
  }),
}));

// Zod schemas
export const insertBillSchema = createInsertSchema(bills).omit({ id: true });
export const insertParticipantSchema = createInsertSchema(participants).omit({ id: true });
export const insertLineItemSchema = createInsertSchema(lineItems).omit({ id: true });
export const insertClaimSchema = createInsertSchema(claims).omit({ id: true });

// Types
export type Bill = typeof bills.$inferSelect;
export type InsertBill = z.infer<typeof insertBillSchema>;
export type Participant = typeof participants.$inferSelect;
export type InsertParticipant = z.infer<typeof insertParticipantSchema>;
export type LineItem = typeof lineItems.$inferSelect;
export type InsertLineItem = z.infer<typeof insertLineItemSchema>;
export type Claim = typeof claims.$inferSelect;
export type InsertClaim = z.infer<typeof insertClaimSchema>;

// Frontend types with nested data
export interface BillWithDetails {
  id: string;
  name: string;
  date: string;
  payerId: string | null;
  total: string;
  participants: ParticipantData[];
  items: LineItemWithClaims[];
}

export interface ParticipantData {
  id: string;
  name: string;
  color: string;
}

export interface LineItemWithClaims {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  isShared: boolean;
  claims: ItemClaimData[];
}

export interface ItemClaimData {
  participantId: string;
  quantity: number;
  isShared: boolean;
}

export interface Settlement {
  from: string;
  to: string;
  amount: number;
}
