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
      
      // Add cache control headers to prevent 304 responses
      res.set({
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      });
      
      const record = await storage.getPrayerRecord(userId, date);
      res.json(record || null);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ message: errorMessage });
    }
  });

  // Update prayer record
  app.post("/api/prayers", async (req, res) => {
    try {
      const userId = "demo-user";
      const validatedData = insertPrayerRecordSchema.parse({ ...req.body, userId });
      
      // Add cache control headers
      res.set({
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      });
      
      const record = await storage.updatePrayerRecord(
        validatedData.userId!,
        validatedData.date,
        validatedData.prayers
      );
      
      res.json(record);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Validation error';
      res.status(400).json({ message: errorMessage });
    }
  });

  // Get prayer records for a date range
  app.get("/api/prayers", async (req, res) => {
    try {
      const userId = "demo-user";
      const { startDate, endDate } = req.query;
      
      // Add cache control headers
      res.set({
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      });
      
      const records = await storage.getPrayerRecords(
        userId,
        typeof startDate === 'string' ? startDate : undefined,
        typeof endDate === 'string' ? endDate : undefined
      );
      
      res.json(records);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ message: errorMessage });
    }
  });

  // Get user achievements
  app.get("/api/achievements", async (req, res) => {
    try {
      const userId = "demo-user";
      
      // Add cache control headers
      res.set({
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      });
      
      const achievements = await storage.getAchievements(userId);
      res.json(achievements);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ message: errorMessage });
    }
  });

  // Create achievement
  app.post("/api/achievements", async (req, res) => {
    try {
      const userId = "demo-user";
      const validatedData = insertAchievementSchema.parse({ ...req.body, userId });
      
      // Add cache control headers
      res.set({
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      });
      
      const achievement = await storage.createAchievement(validatedData);
      res.json(achievement);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Validation error';
      res.status(400).json({ message: errorMessage });
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
      
      // Add cache control headers
      res.set({
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      });
      
      res.json(stats);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ message: errorMessage });
    }
  });

  // Update user statistics
  app.patch("/api/stats", async (req, res) => {
    try {
      const userId = "demo-user";
      const updates = req.body;
      
      // Add cache control headers
      res.set({
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      });
      
      const stats = await storage.updateUserStats(userId, updates);
      res.json(stats);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(400).json({ message: errorMessage });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
