import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { setupAuth, isAuthenticated } from "./replitAuth";

const createBillSchema = z.object({
  name: z.string().min(1),
  total: z.number().min(0),
});

const updateBillSchema = z.object({
  name: z.string().min(1).optional(),
  payerId: z.string().optional(),
  total: z.number().min(0).optional(),
});

const addParticipantSchema = z.object({
  name: z.string().min(1),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
});

const addLineItemSchema = z.object({
  description: z.string().min(1),
  quantity: z.number().int().min(1),
  unitPrice: z.number().min(0),
  isShared: z.boolean(),
});

const updateLineItemSharedSchema = z.object({
  isShared: z.boolean(),
});

const updateClaimSchema = z.object({
  quantity: z.number().int().min(0),
  isShared: z.boolean(),
});

const addFriendSchema = z.object({
  name: z.string().min(1),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
});

const updateFriendSchema = z.object({
  name: z.string().min(1),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error: any) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Friend routes (protected)
  app.get("/api/friends", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const userFriends = await storage.getFriends(userId);
      res.json(userFriends);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/friends", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const data = addFriendSchema.parse(req.body);
      const friend = await storage.addFriend(userId, data.name, data.color);
      res.json(friend);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid request data", details: error.errors });
        return;
      }
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/friends/:id", isAuthenticated, async (req, res) => {
    try {
      const data = updateFriendSchema.parse(req.body);
      const friend = await storage.updateFriend(req.params.id, data.name, data.color);
      res.json(friend);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid request data", details: error.errors });
        return;
      }
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/friends/:id", isAuthenticated, async (req, res) => {
    try {
      await storage.removeFriend(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // My bills route (protected)
  app.get("/api/my-bills", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const userBills = await storage.getUserBills(userId);
      res.json(userBills);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Create a new bill (protected)
  app.post("/api/bills", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const data = createBillSchema.parse(req.body);
      const billId = await storage.createBill(userId, data.name, data.total);
      res.json({ id: billId });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid request data", details: error.errors });
        return;
      }
      res.status(500).json({ error: error.message });
    }
  });

  // Get a bill by ID (protected)
  app.get("/api/bills/:id", isAuthenticated, async (req, res) => {
    try {
      const bill = await storage.getBill(req.params.id);
      if (!bill) {
        res.status(404).json({ error: "Bill not found" });
        return;
      }
      res.json(bill);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Update bill (name, payer, total) (protected)
  app.patch("/api/bills/:id", isAuthenticated, async (req, res) => {
    try {
      const data = updateBillSchema.parse(req.body);
      await storage.updateBill(req.params.id, data);
      res.json({ success: true });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid request data", details: error.errors });
        return;
      }
      res.status(500).json({ error: error.message });
    }
  });

  // Add participant to a bill (protected)
  app.post("/api/bills/:billId/participants", isAuthenticated, async (req, res) => {
    try {
      const data = addParticipantSchema.parse(req.body);
      const participantId = await storage.addParticipant(req.params.billId, data.name, data.color);
      res.json({ id: participantId });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid request data", details: error.errors });
        return;
      }
      res.status(500).json({ error: error.message });
    }
  });

  // Remove participant (protected)
  app.delete("/api/participants/:id", isAuthenticated, async (req, res) => {
    try {
      await storage.removeParticipant(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Add line item to a bill (protected)
  app.post("/api/bills/:billId/items", isAuthenticated, async (req, res) => {
    try {
      const data = addLineItemSchema.parse(req.body);
      const itemId = await storage.addLineItem(
        req.params.billId,
        data.description,
        data.quantity,
        data.unitPrice,
        data.isShared
      );
      res.json({ id: itemId });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid request data", details: error.errors });
        return;
      }
      res.status(500).json({ error: error.message });
    }
  });

  // Update line item shared status (protected)
  app.patch("/api/items/:id/shared", isAuthenticated, async (req, res) => {
    try {
      const data = updateLineItemSharedSchema.parse(req.body);
      await storage.updateLineItemShared(req.params.id, data.isShared);
      res.json({ success: true });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid request data", details: error.errors });
        return;
      }
      res.status(500).json({ error: error.message });
    }
  });

  // Update or create claim (protected)
  app.put("/api/items/:itemId/claims/:participantId", isAuthenticated, async (req, res) => {
    try {
      const data = updateClaimSchema.parse(req.body);
      await storage.updateClaim(req.params.itemId, req.params.participantId, data.quantity, data.isShared);
      res.json({ success: true });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid request data", details: error.errors });
        return;
      }
      res.status(500).json({ error: error.message });
    }
  });

  // Remove claim (protected)
  app.delete("/api/items/:itemId/claims/:participantId", isAuthenticated, async (req, res) => {
    try {
      await storage.removeClaim(req.params.itemId, req.params.participantId);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
