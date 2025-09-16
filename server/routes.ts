import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertPrayerRecordSchema, insertAchievementSchema, dateParamSchema, dateRangeQuerySchema, userStatsUpdateSchema } from "@shared/schema";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { z } from "zod";

// Helper function to calculate and update user statistics
async function updateUserStatistics(userId: string): Promise<void> {
  try {
    // Get all prayer records for the user
    const allRecords = await storage.getPrayerRecords(userId);
    
    let totalPrayers = 0;
    let onTimePrayers = 0;
    let qazaPrayers = 0;
    let currentStreak = 0;
    let bestStreak = 0;
    let perfectWeeks = 0;
    
    // Sort records by date for streak calculation
    const sortedRecords = allRecords.sort((a, b) => b.date.localeCompare(a.date));
    
    // Calculate current streak (from most recent date backwards)
    let streakBroken = false;
    for (const record of sortedRecords) {
      if (!streakBroken && record.prayers) {
        const dayPrayers = Object.values(record.prayers);
        const allCompleted = dayPrayers.every(prayer => prayer.completed);
        
        if (allCompleted) {
          currentStreak++;
        } else {
          streakBroken = true;
        }
      }
    }
    
    // Calculate historical streaks to find best streak
    let tempStreak = 0;
    const chronologicalRecords = allRecords.sort((a, b) => a.date.localeCompare(b.date));
    
    for (const record of chronologicalRecords) {
      if (record.prayers) {
        const dayPrayers = Object.values(record.prayers);
        
        // Count prayers for totals
        dayPrayers.forEach(prayer => {
          totalPrayers++;
          if (prayer.completed) {
            if (prayer.onTime) {
              onTimePrayers++;
            }
          } else {
            qazaPrayers++;
          }
        });
        
        // Check streak
        const allCompleted = dayPrayers.every(prayer => prayer.completed);
        if (allCompleted) {
          tempStreak++;
          bestStreak = Math.max(bestStreak, tempStreak);
        } else {
          tempStreak = 0;
        }
      }
    }
    
    // Calculate perfect weeks
    const weekGroups = groupRecordsByWeek(chronologicalRecords);
    perfectWeeks = weekGroups.filter(week => week.completionRate === 100).length;
    
    // Ensure best streak includes current streak
    bestStreak = Math.max(bestStreak, currentStreak);
    
    // Update or create user statistics
    let userStats = await storage.getUserStats(userId);
    
    if (userStats) {
      await storage.updateUserStats(userId, {
        totalPrayers: totalPrayers - qazaPrayers, // Only count completed prayers
        onTimePrayers,
        qazaPrayers,
        currentStreak,
        bestStreak,
        perfectWeeks,
        lastStreakUpdate: new Date().toISOString().split('T')[0],
        updatedAt: new Date(),
      });
    } else {
      await storage.createUserStats({
        userId,
        totalPrayers: totalPrayers - qazaPrayers,
        onTimePrayers,
        qazaPrayers,
        currentStreak,
        bestStreak,
        perfectWeeks,
        lastStreakUpdate: new Date().toISOString().split('T')[0],
      });
    }
  } catch (error) {
    console.error('Failed to update user statistics:', error);
  }
}

// Helper function to group records by week
function groupRecordsByWeek(records: any[]): Array<{ completionRate: number }> {
  const weeks: { [key: string]: { completed: number; total: number } } = {};
  
  records.forEach(record => {
    const date = new Date(record.date);
    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() - (date.getDay() === 0 ? 6 : date.getDay() - 1));
    const weekKey = weekStart.toISOString().split('T')[0];
    
    if (!weeks[weekKey]) {
      weeks[weekKey] = { completed: 0, total: 0 };
    }
    
    if (record.prayers) {
      Object.values(record.prayers).forEach((prayer: any) => {
        weeks[weekKey].total++;
        if (prayer.completed) {
          weeks[weekKey].completed++;
        }
      });
    }
  });
  
  return Object.values(weeks)
    .filter(week => week.total >= 35) // Only count complete weeks (7 days * 5 prayers)
    .map(week => ({
      completionRate: week.total > 0 ? Math.round((week.completed / week.total) * 100) : 0
    }));
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Get prayer record for a specific date
  app.get("/api/prayers/:date", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Validate date parameter
      const validatedParams = dateParamSchema.parse(req.params);
      const { date } = validatedParams;
      
      // Add cache control headers to prevent 304 responses
      res.set({
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      });
      
      const record = await storage.getPrayerRecord(userId, date);
      res.json(record || null);
    } catch (error: unknown) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: 'Invalid date parameter', 
          errors: error.errors.map(e => e.message) 
        });
      }
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ message: errorMessage });
    }
  });

  // Update prayer record
  app.post("/api/prayers", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
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
        validatedData.prayers as any
      );
      
      // Automatically update user statistics after saving prayer record
      await updateUserStatistics(userId);
      
      res.json(record);
    } catch (error: unknown) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: 'Invalid prayer record data', 
          errors: error.errors.map(e => e.message) 
        });
      }
      const errorMessage = error instanceof Error ? error.message : 'Validation error';
      res.status(400).json({ message: errorMessage });
    }
  });

  // Get prayer records for a date range
  app.get("/api/prayers", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Validate query parameters
      const validatedQuery = dateRangeQuerySchema.parse(req.query);
      const { startDate, endDate } = validatedQuery;
      
      // Add cache control headers
      res.set({
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      });
      
      const records = await storage.getPrayerRecords(
        userId,
        startDate,
        endDate
      );
      
      res.json(records);
    } catch (error: unknown) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: 'Invalid query parameters', 
          errors: error.errors.map(e => e.message) 
        });
      }
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ message: errorMessage });
    }
  });

  // Get user achievements
  app.get("/api/achievements", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
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
  app.post("/api/achievements", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
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
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: 'Invalid achievement data', 
          errors: error.errors.map(e => e.message) 
        });
      }
      const errorMessage = error instanceof Error ? error.message : 'Validation error';
      res.status(400).json({ message: errorMessage });
    }
  });

  // Get user statistics
  app.get("/api/stats", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
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
  app.patch("/api/stats", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Validate request body
      const validatedUpdates = userStatsUpdateSchema.parse(req.body);
      
      // Add cache control headers
      res.set({
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      });
      
      const stats = await storage.updateUserStats(userId, validatedUpdates);
      res.json(stats);
    } catch (error: unknown) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: 'Invalid user statistics data', 
          errors: error.errors.map(e => e.message) 
        });
      }
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(400).json({ message: errorMessage });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
