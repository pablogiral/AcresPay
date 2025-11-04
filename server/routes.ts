import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Create a new bill
  app.post("/api/bills", async (req, res) => {
    try {
      const { name, total } = req.body;
      const billId = await storage.createBill(name, total);
      res.json({ id: billId });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get a bill by ID
  app.get("/api/bills/:id", async (req, res) => {
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

  // Update bill (name, payer, total)
  app.patch("/api/bills/:id", async (req, res) => {
    try {
      const { name, payerId, total } = req.body;
      await storage.updateBill(req.params.id, { name, payerId, total });
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Add participant to a bill
  app.post("/api/bills/:billId/participants", async (req, res) => {
    try {
      const { name, color } = req.body;
      const participantId = await storage.addParticipant(req.params.billId, name, color);
      res.json({ id: participantId });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Remove participant
  app.delete("/api/participants/:id", async (req, res) => {
    try {
      await storage.removeParticipant(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Add line item to a bill
  app.post("/api/bills/:billId/items", async (req, res) => {
    try {
      const { description, quantity, unitPrice, isShared } = req.body;
      const itemId = await storage.addLineItem(
        req.params.billId,
        description,
        quantity,
        unitPrice,
        isShared
      );
      res.json({ id: itemId });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Update line item shared status
  app.patch("/api/items/:id/shared", async (req, res) => {
    try {
      const { isShared } = req.body;
      await storage.updateLineItemShared(req.params.id, isShared);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Update or create claim
  app.put("/api/items/:itemId/claims/:participantId", async (req, res) => {
    try {
      const { quantity, isShared } = req.body;
      await storage.updateClaim(req.params.itemId, req.params.participantId, quantity, isShared);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Remove claim
  app.delete("/api/items/:itemId/claims/:participantId", async (req, res) => {
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
