import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertPrayerRecordSchema, insertAchievementSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Get prayer record for a specific date
  app.get("/api/prayers/:date", async (req, res) => {
    try {
      // For demo purposes, using a default user ID
      // In a real app, this would come from authentication
      const userId = "demo-user";
      const { date } = req.params;
      
      const record = await storage.getPrayerRecord(userId, date);
      res.json(record || null);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Update prayer record
  app.post("/api/prayers", async (req, res) => {
    try {
      const userId = "demo-user";
      const validatedData = insertPrayerRecordSchema.parse({ ...req.body, userId });
      
      const record = await storage.updatePrayerRecord(
        validatedData.userId!,
        validatedData.date,
        validatedData.prayers as any
      );
      
      res.json(record);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Get prayer records for a date range
  app.get("/api/prayers", async (req, res) => {
    try {
      const userId = "demo-user";
      const { startDate, endDate } = req.query;
      
      const records = await storage.getPrayerRecords(
        userId,
        startDate as string,
        endDate as string
      );
      
      res.json(records);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Get user achievements
  app.get("/api/achievements", async (req, res) => {
    try {
      const userId = "demo-user";
      const achievements = await storage.getAchievements(userId);
      res.json(achievements);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Create achievement
  app.post("/api/achievements", async (req, res) => {
    try {
      const userId = "demo-user";
      const validatedData = insertAchievementSchema.parse({ ...req.body, userId });
      
      const achievement = await storage.createAchievement(validatedData);
      res.json(achievement);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Get user statistics
  app.get("/api/stats", async (req, res) => {
    try {
      const userId = "demo-user";
      let stats = await storage.getUserStats(userId);
      
      if (!stats) {
        // Create initial stats if they don't exist
        stats = await storage.createUserStats({ userId });
      }
      
      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Update user statistics
  app.patch("/api/stats", async (req, res) => {
    try {
      const userId = "demo-user";
      const updates = req.body;
      
      const stats = await storage.updateUserStats(userId, updates);
      res.json(stats);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
