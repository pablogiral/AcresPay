import { 
  type User, 
  type UpsertUser,
  type Friend,
  type InsertFriend,
  type BillWithDetails,
  type ParticipantData,
  type LineItemWithClaims,
  type ItemClaimData,
  bills,
  participants,
  lineItems,
  claims,
  users,
  friends
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc } from "drizzle-orm";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Friend operations
  getFriends(userId: string): Promise<Friend[]>;
  addFriend(userId: string, name: string, color: string): Promise<Friend>;
  updateFriend(friendId: string, name: string, color: string): Promise<Friend>;
  removeFriend(friendId: string): Promise<void>;
  
  // Bill operations
  createBill(userId: string, name: string, total: number): Promise<string>;
  getBill(id: string): Promise<BillWithDetails | undefined>;
  getUserBills(userId: string): Promise<{ id: string; name: string; date: string; total: string; }[]>;
  updateBill(id: string, data: { name?: string; payerId?: string; total?: number }): Promise<void>;
  
  // Participant operations
  addParticipant(billId: string, name: string, color: string): Promise<string>;
  removeParticipant(participantId: string): Promise<void>;
  
  // Line item operations
  addLineItem(billId: string, description: string, quantity: number, unitPrice: number, isShared: boolean): Promise<string>;
  updateLineItemShared(lineItemId: string, isShared: boolean): Promise<void>;
  
  // Claim operations
  updateClaim(lineItemId: string, participantId: string, quantity: number, isShared: boolean): Promise<void>;
  removeClaim(lineItemId: string, participantId: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Friend operations
  async getFriends(userId: string): Promise<Friend[]> {
    return await db
      .select()
      .from(friends)
      .where(eq(friends.userId, userId))
      .orderBy(friends.name);
  }

  async addFriend(userId: string, name: string, color: string): Promise<Friend> {
    const [friend] = await db
      .insert(friends)
      .values({ userId, name, color })
      .returning();
    return friend;
  }

  async updateFriend(friendId: string, name: string, color: string): Promise<Friend> {
    const [friend] = await db
      .update(friends)
      .set({ name, color })
      .where(eq(friends.id, friendId))
      .returning();
    return friend;
  }

  async removeFriend(friendId: string): Promise<void> {
    await db.delete(friends).where(eq(friends.id, friendId));
  }

  // Bill operations
  async createBill(userId: string, name: string, total: number): Promise<string> {
    const [bill] = await db
      .insert(bills)
      .values({ userId, name, total: total.toString(), payerId: null })
      .returning();
    return bill.id;
  }

  async getBill(id: string): Promise<BillWithDetails | undefined> {
    const [bill] = await db.select().from(bills).where(eq(bills.id, id));
    if (!bill) return undefined;

    const billParticipants = await db
      .select()
      .from(participants)
      .where(eq(participants.billId, id));

    const billLineItems = await db
      .select()
      .from(lineItems)
      .where(eq(lineItems.billId, id));

    const items: LineItemWithClaims[] = await Promise.all(
      billLineItems.map(async (item) => {
        const itemClaims = await db
          .select()
          .from(claims)
          .where(eq(claims.lineItemId, item.id));

        const claimsData: ItemClaimData[] = itemClaims.map(c => ({
          participantId: c.participantId,
          quantity: c.quantity,
          isShared: c.isShared,
        }));

        return {
          id: item.id,
          description: item.description,
          quantity: item.quantity,
          unitPrice: parseFloat(item.unitPrice),
          totalPrice: parseFloat(item.totalPrice),
          isShared: item.isShared,
          claims: claimsData,
        };
      })
    );

    const participantsData: ParticipantData[] = billParticipants.map(p => ({
      id: p.id,
      name: p.name,
      color: p.color,
    }));

    return {
      id: bill.id,
      name: bill.name,
      date: bill.date.toISOString(),
      payerId: bill.payerId,
      total: bill.total,
      participants: participantsData,
      items,
    };
  }

  async getUserBills(userId: string): Promise<{ id: string; name: string; date: string; total: string; }[]> {
    const userBills = await db
      .select({
        id: bills.id,
        name: bills.name,
        date: bills.date,
        total: bills.total,
      })
      .from(bills)
      .where(eq(bills.userId, userId))
      .orderBy(desc(bills.date));

    return userBills.map(bill => ({
      id: bill.id,
      name: bill.name,
      date: bill.date.toISOString(),
      total: bill.total,
    }));
  }

  async updateBill(id: string, data: { name?: string; payerId?: string; total?: number }): Promise<void> {
    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.payerId !== undefined) updateData.payerId = data.payerId;
    if (data.total !== undefined) updateData.total = data.total.toString();
    
    await db.update(bills).set(updateData).where(eq(bills.id, id));
  }

  async addParticipant(billId: string, name: string, color: string): Promise<string> {
    const [participant] = await db
      .insert(participants)
      .values({ billId, name, color })
      .returning();
    return participant.id;
  }

  async removeParticipant(participantId: string): Promise<void> {
    await db.delete(participants).where(eq(participants.id, participantId));
  }

  async addLineItem(
    billId: string,
    description: string,
    quantity: number,
    unitPrice: number,
    isShared: boolean
  ): Promise<string> {
    const totalPrice = quantity * unitPrice;
    const [item] = await db
      .insert(lineItems)
      .values({
        billId,
        description,
        quantity,
        unitPrice: unitPrice.toString(),
        totalPrice: totalPrice.toString(),
        isShared,
      })
      .returning();
    return item.id;
  }

  async updateLineItemShared(lineItemId: string, isShared: boolean): Promise<void> {
    await db.update(lineItems).set({ isShared }).where(eq(lineItems.id, lineItemId));
  }

  async updateClaim(
    lineItemId: string,
    participantId: string,
    quantity: number,
    isShared: boolean
  ): Promise<void> {
    const existingClaims = await db
      .select()
      .from(claims)
      .where(and(
        eq(claims.lineItemId, lineItemId),
        eq(claims.participantId, participantId)
      ));

    if (existingClaims.length > 0) {
      await db
        .update(claims)
        .set({ quantity, isShared })
        .where(and(
          eq(claims.lineItemId, lineItemId),
          eq(claims.participantId, participantId)
        ));
    } else {
      await db.insert(claims).values({
        lineItemId,
        participantId,
        quantity,
        isShared,
      });
    }
  }

  async removeClaim(lineItemId: string, participantId: string): Promise<void> {
    await db
      .delete(claims)
      .where(and(
        eq(claims.lineItemId, lineItemId),
        eq(claims.participantId, participantId)
      ));
  }
}

export const storage = new DatabaseStorage();
