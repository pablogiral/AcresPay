import { 
  type User, 
  type UpsertUser,
  type Friend,
  type InsertFriend,
  type Event,
  type EventWithDetails,
  type EventParticipant,
  type Payment,
  type BillWithDetails,
  type ParticipantData,
  type LineItemWithClaims,
  type ItemClaimData,
  bills,
  participants,
  lineItems,
  claims,
  users,
  friends,
  events,
  eventParticipants,
  payments
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, inArray } from "drizzle-orm";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Friend operations
  getFriends(userId: string): Promise<Friend[]>;
  addFriend(userId: string, name: string, color: string): Promise<Friend>;
  updateFriend(friendId: string, name: string, color: string): Promise<Friend>;
  removeFriend(friendId: string): Promise<void>;
  
  // Event operations
  createEvent(userId: string, name: string): Promise<string>;
  getEvent(id: string): Promise<EventWithDetails | undefined>;
  getUserEvents(userId: string): Promise<EventWithDetails[]>;
  updateEvent(id: string, name: string): Promise<Event>;
  deleteEvent(id: string): Promise<void>;
  checkEventOwnership(eventId: string, userId: string): Promise<boolean>;
  addEventParticipant(eventId: string, friendId: string): Promise<EventParticipant>;
  removeEventParticipant(eventId: string, friendId: string): Promise<void>;
  getEventBills(eventId: string): Promise<Array<BillWithDetails & { payments: Payment[] }>>;
  
  // Bill operations
  createBill(userId: string, name: string, total: number, eventId?: string | null): Promise<string>;
  getBill(id: string): Promise<BillWithDetails | undefined>;
  getUserBills(userId: string): Promise<{ id: string; name: string; date: string; total: string; isFullyPaid: boolean; eventId?: string | null; }[]>;
  updateBill(id: string, data: { name?: string; payerId?: string; total?: number }): Promise<void>;
  deleteBill(id: string): Promise<void>;
  checkBillOwnership(billId: string, userId: string): Promise<boolean>;
  
  // Participant operations
  addParticipant(billId: string, name: string, color: string): Promise<string>;
  removeParticipant(participantId: string): Promise<void>;
  
  // Line item operations
  addLineItem(billId: string, description: string, quantity: number, unitPrice: number, isShared: boolean): Promise<string>;
  updateLineItemShared(lineItemId: string, isShared: boolean): Promise<void>;
  
  // Claim operations
  updateClaim(lineItemId: string, participantId: string, quantity: number, isShared: boolean): Promise<void>;
  removeClaim(lineItemId: string, participantId: string): Promise<void>;
  
  // Payment operations
  getPayments(billId: string): Promise<Payment[]>;
  upsertPayment(billId: string, fromParticipantId: string, toParticipantId: string, amount: number, isPaid: boolean): Promise<Payment>;
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

  // Event operations
  async createEvent(userId: string, name: string): Promise<string> {
    const [event] = await db
      .insert(events)
      .values({ userId, name })
      .returning();
    return event.id;
  }

  async getEvent(id: string): Promise<EventWithDetails | undefined> {
    const [event] = await db.select().from(events).where(eq(events.id, id));
    if (!event) return undefined;

    const eventParticipantRecords = await db
      .select()
      .from(eventParticipants)
      .where(eq(eventParticipants.eventId, id));

    const friendIds = eventParticipantRecords.map(ep => ep.friendId);
    const participantFriends = friendIds.length > 0
      ? await db.select().from(friends).where(inArray(friends.id, friendIds))
      : [];

    const billsCount = await db
      .select()
      .from(bills)
      .where(eq(bills.eventId, id));

    return {
      id: event.id,
      name: event.name,
      userId: event.userId,
      createdAt: event.createdAt?.toISOString() || new Date().toISOString(),
      participants: participantFriends,
      billCount: billsCount.length,
    };
  }

  async getUserEvents(userId: string): Promise<EventWithDetails[]> {
    const userEvents = await db
      .select()
      .from(events)
      .where(eq(events.userId, userId))
      .orderBy(desc(events.createdAt));

    return await Promise.all(
      userEvents.map(async (event) => {
        const eventData = await this.getEvent(event.id);
        return eventData!;
      })
    );
  }

  async updateEvent(id: string, name: string): Promise<Event> {
    const [event] = await db
      .update(events)
      .set({ name })
      .where(eq(events.id, id))
      .returning();
    return event;
  }

  async deleteEvent(id: string): Promise<void> {
    await db.delete(events).where(eq(events.id, id));
  }

  async checkEventOwnership(eventId: string, userId: string): Promise<boolean> {
    const [event] = await db
      .select()
      .from(events)
      .where(and(eq(events.id, eventId), eq(events.userId, userId)));
    return !!event;
  }

  async addEventParticipant(eventId: string, friendId: string): Promise<EventParticipant> {
    const [participant] = await db
      .insert(eventParticipants)
      .values({ eventId, friendId })
      .returning();
    return participant;
  }

  async removeEventParticipant(eventId: string, friendId: string): Promise<void> {
    await db
      .delete(eventParticipants)
      .where(and(
        eq(eventParticipants.eventId, eventId),
        eq(eventParticipants.friendId, friendId)
      ));
  }

  async getEventBills(eventId: string): Promise<Array<BillWithDetails & { payments: Payment[] }>> {
    const eventBills = await db
      .select()
      .from(bills)
      .where(eq(bills.eventId, eventId))
      .orderBy(desc(bills.date));

    return await Promise.all(
      eventBills.map(async (bill) => {
        const billData = await this.getBill(bill.id);
        const billPayments = await this.getPayments(bill.id);
        return {
          ...billData!,
          payments: billPayments
        };
      })
    );
  }

  // Bill operations
  async createBill(userId: string, name: string, total: number, eventId?: string | null): Promise<string> {
    const [bill] = await db
      .insert(bills)
      .values({ userId, name, total: total.toString(), payerId: null, eventId: eventId || null })
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
      eventId: bill.eventId,
      participants: participantsData,
      items,
    };
  }

  async getUserBills(userId: string): Promise<{ id: string; name: string; date: string; total: string; isFullyPaid: boolean; eventId?: string | null; }[]> {
    const userBills = await db
      .select({
        id: bills.id,
        name: bills.name,
        date: bills.date,
        total: bills.total,
        eventId: bills.eventId,
      })
      .from(bills)
      .where(eq(bills.userId, userId))
      .orderBy(desc(bills.date));

    if (userBills.length === 0) {
      return [];
    }

    const billIds = userBills.map(b => b.id);
    const allPayments = await db
      .select()
      .from(payments)
      .where(inArray(payments.billId, billIds));
    
    const paymentsMap = new Map<string, typeof allPayments>();
    for (const payment of allPayments) {
      if (!paymentsMap.has(payment.billId)) {
        paymentsMap.set(payment.billId, []);
      }
      paymentsMap.get(payment.billId)!.push(payment);
    }

    return userBills.map(bill => {
      const billPayments = paymentsMap.get(bill.id) || [];
      const isFullyPaid = billPayments.length > 0 && billPayments.every(p => p.isPaid);

      return {
        id: bill.id,
        name: bill.name,
        date: bill.date.toISOString(),
        total: bill.total,
        isFullyPaid,
        eventId: bill.eventId,
      };
    });
  }

  async updateBill(id: string, data: { name?: string; payerId?: string; total?: number }): Promise<void> {
    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.payerId !== undefined) updateData.payerId = data.payerId;
    if (data.total !== undefined) updateData.total = data.total.toString();
    
    await db.update(bills).set(updateData).where(eq(bills.id, id));
  }

  async deleteBill(id: string): Promise<void> {
    await db.transaction(async (tx) => {
      await tx.delete(payments).where(eq(payments.billId, id));
      
      const billLineItems = await tx.select({ id: lineItems.id }).from(lineItems).where(eq(lineItems.billId, id));
      for (const item of billLineItems) {
        await tx.delete(claims).where(eq(claims.lineItemId, item.id));
      }
      
      await tx.delete(lineItems).where(eq(lineItems.billId, id));
      await tx.delete(participants).where(eq(participants.billId, id));
      await tx.delete(bills).where(eq(bills.id, id));
    });
  }

  async checkBillOwnership(billId: string, userId: string): Promise<boolean> {
    const [bill] = await db
      .select({ userId: bills.userId })
      .from(bills)
      .where(eq(bills.id, billId));
    
    return bill?.userId === userId;
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

  // Payment operations
  async getPayments(billId: string): Promise<Payment[]> {
    return await db
      .select()
      .from(payments)
      .where(eq(payments.billId, billId));
  }

  async upsertPayment(
    billId: string,
    fromParticipantId: string,
    toParticipantId: string,
    amount: number,
    isPaid: boolean
  ): Promise<Payment> {
    // Check if payment already exists
    const existingPayments = await db
      .select()
      .from(payments)
      .where(and(
        eq(payments.billId, billId),
        eq(payments.fromParticipantId, fromParticipantId),
        eq(payments.toParticipantId, toParticipantId)
      ));

    if (existingPayments.length > 0) {
      // Update existing payment
      const [updated] = await db
        .update(payments)
        .set({ 
          amount: amount.toString(),
          isPaid,
          paidAt: isPaid ? new Date() : null
        })
        .where(eq(payments.id, existingPayments[0].id))
        .returning();
      return updated;
    } else {
      // Insert new payment
      const [created] = await db
        .insert(payments)
        .values({
          billId,
          fromParticipantId,
          toParticipantId,
          amount: amount.toString(),
          isPaid,
          paidAt: isPaid ? new Date() : null
        })
        .returning();
      return created;
    }
  }
}

export const storage = new DatabaseStorage();
