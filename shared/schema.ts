import { sql } from "drizzle-orm";
import { pgTable, text, varchar, decimal, integer } from "drizzle-orm/pg-core";
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

// Bill splitting types
export interface Participant {
  id: string;
  name: string;
  color: string;
}

export interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  isShared: boolean;
  claims: ItemClaim[];
}

export interface ItemClaim {
  participantId: string;
  quantity: number;
  isShared: boolean;
}

export interface Bill {
  id: string;
  name: string;
  date: string;
  payerId: string;
  participants: Participant[];
  items: LineItem[];
  total: number;
}

export interface Settlement {
  from: string;
  to: string;
  amount: number;
}
