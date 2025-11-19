import { sql } from "drizzle-orm";
import { pgTable, text, varchar, decimal, integer, boolean, timestamp, index, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

// Friends table - users can save frequently used names
export const friends = pgTable("friends", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: text("name").notNull(),
  color: text("color").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Events table - group bills from same trip/night
export const events = pgTable("events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Event participants - friends who are part of an event
export const eventParticipants = pgTable("event_participants", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  eventId: varchar("event_id").notNull().references(() => events.id, { onDelete: 'cascade' }),
  friendId: varchar("friend_id").notNull().references(() => friends.id, { onDelete: 'cascade' }),
});

// Bill splitting database tables
export const bills = pgTable("bills", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  eventId: varchar("event_id").references(() => events.id, { onDelete: 'set null' }),
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

// Payments table - track which transfers have been marked as paid
export const payments = pgTable("payments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  billId: varchar("bill_id").notNull().references(() => bills.id, { onDelete: 'cascade' }),
  fromParticipantId: varchar("from_participant_id").notNull().references(() => participants.id, { onDelete: 'cascade' }),
  toParticipantId: varchar("to_participant_id").notNull().references(() => participants.id, { onDelete: 'cascade' }),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  isPaid: boolean("is_paid").notNull().default(false),
  paidAt: timestamp("paid_at"),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  friends: many(friends),
  bills: many(bills),
  events: many(events),
}));

export const friendsRelations = relations(friends, ({ one, many }) => ({
  user: one(users, {
    fields: [friends.userId],
    references: [users.id],
  }),
  eventParticipants: many(eventParticipants),
}));

export const eventsRelations = relations(events, ({ one, many }) => ({
  user: one(users, {
    fields: [events.userId],
    references: [users.id],
  }),
  participants: many(eventParticipants),
  bills: many(bills),
}));

export const eventParticipantsRelations = relations(eventParticipants, ({ one }) => ({
  event: one(events, {
    fields: [eventParticipants.eventId],
    references: [events.id],
  }),
  friend: one(friends, {
    fields: [eventParticipants.friendId],
    references: [friends.id],
  }),
}));

export const billsRelations = relations(bills, ({ one, many }) => ({
  user: one(users, {
    fields: [bills.userId],
    references: [users.id],
  }),
  event: one(events, {
    fields: [bills.eventId],
    references: [events.id],
  }),
  participants: many(participants),
  lineItems: many(lineItems),
  payments: many(payments),
}));

export const participantsRelations = relations(participants, ({ one, many }) => ({
  bill: one(bills, {
    fields: [participants.billId],
    references: [bills.id],
  }),
  claims: many(claims),
  paymentsFrom: many(payments, { relationName: "fromParticipant" }),
  paymentsTo: many(payments, { relationName: "toParticipant" }),
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

export const paymentsRelations = relations(payments, ({ one }) => ({
  bill: one(bills, {
    fields: [payments.billId],
    references: [bills.id],
  }),
  fromParticipant: one(participants, {
    fields: [payments.fromParticipantId],
    references: [participants.id],
    relationName: "fromParticipant",
  }),
  toParticipant: one(participants, {
    fields: [payments.toParticipantId],
    references: [participants.id],
    relationName: "toParticipant",
  }),
}));

// Zod schemas
export const insertFriendSchema = createInsertSchema(friends).omit({ id: true, createdAt: true });
export const insertEventSchema = createInsertSchema(events).omit({ id: true, createdAt: true });
export const insertEventParticipantSchema = createInsertSchema(eventParticipants).omit({ id: true });
export const insertBillSchema = createInsertSchema(bills).omit({ id: true, date: true });
export const insertParticipantSchema = createInsertSchema(participants).omit({ id: true });
export const insertLineItemSchema = createInsertSchema(lineItems).omit({ id: true });
export const insertClaimSchema = createInsertSchema(claims).omit({ id: true });
export const insertPaymentSchema = createInsertSchema(payments).omit({ id: true, paidAt: true });

// Types
export type Friend = typeof friends.$inferSelect;
export type InsertFriend = z.infer<typeof insertFriendSchema>;
export type Event = typeof events.$inferSelect;
export type InsertEvent = z.infer<typeof insertEventSchema>;
export type EventParticipant = typeof eventParticipants.$inferSelect;
export type InsertEventParticipant = z.infer<typeof insertEventParticipantSchema>;
export type Bill = typeof bills.$inferSelect;
export type InsertBill = z.infer<typeof insertBillSchema>;
export type Participant = typeof participants.$inferSelect;
export type InsertParticipant = z.infer<typeof insertParticipantSchema>;
export type LineItem = typeof lineItems.$inferSelect;
export type InsertLineItem = z.infer<typeof insertLineItemSchema>;
export type Claim = typeof claims.$inferSelect;
export type InsertClaim = z.infer<typeof insertClaimSchema>;
export type Payment = typeof payments.$inferSelect;
export type InsertPayment = z.infer<typeof insertPaymentSchema>;

// Frontend types with nested data
export interface EventWithDetails {
  id: string;
  name: string;
  userId: string;
  createdAt: string;
  participants: Friend[];
  billCount?: number;
}

export interface BillWithDetails {
  id: string;
  name: string;
  date: string;
  payerId: string | null;
  total: string;
  eventId?: string | null;
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
