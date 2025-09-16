import {
  users,
  prayerRecords,
  achievements,
  userStats,
  type User,
  type UpsertUser,
  type PrayerRecord,
  type InsertPrayerRecord,
  type Achievement,
  type InsertAchievement,
  type UserStats,
  type InsertUserStats,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, gte, lte } from "drizzle-orm";
import { randomUUID } from "crypto";

export interface IStorage {
  // User management (IMPORTANT: these are mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;

  // Prayer records
  getPrayerRecord(userId: string, date: string): Promise<PrayerRecord | undefined>;
  getPrayerRecords(userId: string, startDate?: string, endDate?: string): Promise<PrayerRecord[]>;
  createPrayerRecord(record: InsertPrayerRecord): Promise<PrayerRecord>;
  updatePrayerRecord(userId: string, date: string, prayers: any): Promise<PrayerRecord>;

  // Achievements
  getAchievements(userId: string): Promise<Achievement[]>;
  createAchievement(achievement: InsertAchievement): Promise<Achievement>;

  // User statistics
  getUserStats(userId: string): Promise<UserStats | undefined>;
  createUserStats(stats: InsertUserStats): Promise<UserStats>;
  updateUserStats(userId: string, updates: Partial<UserStats>): Promise<UserStats>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private prayerRecords: Map<string, PrayerRecord>; // key: userId-date
  private achievements: Map<string, Achievement>;
  private userStats: Map<string, UserStats>; // key: userId

  constructor() {
    this.users = new Map();
    this.prayerRecords = new Map();
    this.achievements = new Map();
    this.userStats = new Map();
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const existingUser = this.users.get(userData.id!);
    if (existingUser) {
      const updatedUser: User = {
        ...existingUser,
        ...userData,
        updatedAt: new Date(),
      };
      this.users.set(userData.id!, updatedUser);
      return updatedUser;
    }
    
    const user: User = {
      id: userData.id!,
      email: userData.email ?? null,
      firstName: userData.firstName ?? null,
      lastName: userData.lastName ?? null,
      profileImageUrl: userData.profileImageUrl ?? null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.users.set(user.id, user);
    
    // Initialize user stats
    const userStatsData: UserStats = {
      id: randomUUID(),
      userId: user.id,
      totalPrayers: 0,
      onTimePrayers: 0,
      qazaPrayers: 0,
      currentStreak: 0,
      bestStreak: 0,
      perfectWeeks: 0,
      lastStreakUpdate: null,
      updatedAt: new Date(),
    };
    this.userStats.set(user.id, userStatsData);
    
    return user;
  }

  async getPrayerRecord(userId: string, date: string): Promise<PrayerRecord | undefined> {
    return this.prayerRecords.get(`${userId}-${date}`);
  }

  async getPrayerRecords(userId: string, startDate?: string, endDate?: string): Promise<PrayerRecord[]> {
    const records = Array.from(this.prayerRecords.values())
      .filter(record => record.userId === userId);
    
    if (startDate && endDate) {
      return records.filter(record => 
        record.date >= startDate && record.date <= endDate
      );
    }
    
    return records;
  }

  async createPrayerRecord(insertRecord: InsertPrayerRecord): Promise<PrayerRecord> {
    const id = randomUUID();
    const userId = insertRecord.userId || "demo-user"; // Ensure userId is never null
    const record: PrayerRecord = {
      id,
      userId,
      date: insertRecord.date,
      prayers: insertRecord.prayers as PrayerRecord["prayers"],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    this.prayerRecords.set(`${record.userId}-${record.date}`, record);
    return record;
  }

  async updatePrayerRecord(userId: string, date: string, prayers: PrayerRecord["prayers"]): Promise<PrayerRecord> {
    const key = `${userId}-${date}`;
    const existing = this.prayerRecords.get(key);
    
    if (existing) {
      const updated: PrayerRecord = {
        ...existing,
        prayers,
        updatedAt: new Date(),
      };
      this.prayerRecords.set(key, updated);
      return updated;
    }
    
    // Create new record if it doesn't exist
    return this.createPrayerRecord({ userId, date, prayers });
  }

  async getAchievements(userId: string): Promise<Achievement[]> {
    return Array.from(this.achievements.values())
      .filter(achievement => achievement.userId === userId)
      .sort((a, b) => new Date(b.earnedDate).getTime() - new Date(a.earnedDate).getTime());
  }

  async createAchievement(insertAchievement: InsertAchievement): Promise<Achievement> {
    const userId = insertAchievement.userId || "demo-user"; // Ensure userId is never null
    
    // Check for existing achievement with same userId, type, and earnedDate (idempotency)
    const existingAchievement = Array.from(this.achievements.values()).find(
      achievement => 
        achievement.userId === userId &&
        achievement.type === insertAchievement.type &&
        achievement.earnedDate === insertAchievement.earnedDate
    );
    
    if (existingAchievement) {
      return existingAchievement; // Return existing achievement instead of creating duplicate
    }
    
    const id = randomUUID();
    const achievement: Achievement = {
      id,
      userId,
      type: insertAchievement.type,
      title: insertAchievement.title,
      description: insertAchievement.description,
      earnedDate: insertAchievement.earnedDate,
      metadata: insertAchievement.metadata as Achievement["metadata"] || null,
      createdAt: new Date(),
    };
    
    this.achievements.set(id, achievement);
    return achievement;
  }

  async getUserStats(userId: string): Promise<UserStats | undefined> {
    return this.userStats.get(userId);
  }

  async createUserStats(insertStats: InsertUserStats): Promise<UserStats> {
    const id = randomUUID();
    const stats: UserStats = {
      ...insertStats,
      id,
      userId: insertStats.userId || null,
      totalPrayers: insertStats.totalPrayers || 0,
      onTimePrayers: insertStats.onTimePrayers || 0,
      qazaPrayers: insertStats.qazaPrayers || 0,
      currentStreak: insertStats.currentStreak || 0,
      bestStreak: insertStats.bestStreak || 0,
      perfectWeeks: insertStats.perfectWeeks || 0,
      lastStreakUpdate: insertStats.lastStreakUpdate || null,
      updatedAt: new Date(),
    };
    
    this.userStats.set(stats.userId!, stats);
    return stats;
  }

  async updateUserStats(userId: string, updates: Partial<UserStats>): Promise<UserStats> {
    const existing = this.userStats.get(userId);
    if (!existing) {
      throw new Error("User stats not found");
    }
    
    const updated: UserStats = {
      ...existing,
      ...updates,
      updatedAt: new Date(),
    };
    
    this.userStats.set(userId, updated);
    return updated;
  }
}

// Database storage implementation
export class DatabaseStorage implements IStorage {
  // User operations (IMPORTANT: these are mandatory for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values({
        ...userData,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    
    // Initialize user stats if it's a new user
    const existingStats = await this.getUserStats(user.id);
    if (!existingStats) {
      await this.createUserStats({ userId: user.id });
    }
    
    return user;
  }

  // Prayer records
  async getPrayerRecord(userId: string, date: string): Promise<PrayerRecord | undefined> {
    const [record] = await db
      .select()
      .from(prayerRecords)
      .where(and(
        eq(prayerRecords.userId, userId),
        eq(prayerRecords.date, date)
      ));
    return record;
  }

  async getPrayerRecords(userId: string, startDate?: string, endDate?: string): Promise<PrayerRecord[]> {
    const conditions = [eq(prayerRecords.userId, userId)];
    
    if (startDate && endDate) {
      conditions.push(
        gte(prayerRecords.date, startDate),
        lte(prayerRecords.date, endDate)
      );
    }
    
    return await db
      .select()
      .from(prayerRecords)
      .where(and(...conditions));
  }

  async createPrayerRecord(record: InsertPrayerRecord): Promise<PrayerRecord> {
    const [created] = await db
      .insert(prayerRecords)
      .values([record as any])
      .returning();
    return created;
  }

  async updatePrayerRecord(userId: string, date: string, prayers: PrayerRecord["prayers"]): Promise<PrayerRecord> {
    const existing = await this.getPrayerRecord(userId, date);
    
    if (existing) {
      const [updated] = await db
        .update(prayerRecords)
        .set({
          prayers,
          updatedAt: new Date(),
        })
        .where(eq(prayerRecords.id, existing.id))
        .returning();
      return updated;
    }
    
    return this.createPrayerRecord({ 
      userId, 
      date, 
      prayers: prayers as PrayerRecord["prayers"]
    });
  }

  // Achievements
  async getAchievements(userId: string): Promise<Achievement[]> {
    return await db
      .select()
      .from(achievements)
      .where(eq(achievements.userId, userId));
  }

  async createAchievement(achievement: InsertAchievement): Promise<Achievement> {
    // Check for existing achievement with same userId, type, and earnedDate (idempotency)
    const [existingAchievement] = await db
      .select()
      .from(achievements)
      .where(and(
        eq(achievements.userId, achievement.userId!),
        eq(achievements.type, achievement.type),
        eq(achievements.earnedDate, achievement.earnedDate)
      ));
    
    if (existingAchievement) {
      return existingAchievement; // Return existing achievement instead of creating duplicate
    }
    
    const [created] = await db
      .insert(achievements)
      .values([achievement as any])
      .returning();
    return created;
  }

  // User statistics
  async getUserStats(userId: string): Promise<UserStats | undefined> {
    const [stats] = await db
      .select()
      .from(userStats)
      .where(eq(userStats.userId, userId));
    return stats;
  }

  async createUserStats(stats: InsertUserStats): Promise<UserStats> {
    const [created] = await db
      .insert(userStats)
      .values([stats])
      .returning();
    return created;
  }

  async updateUserStats(userId: string, updates: Partial<UserStats>): Promise<UserStats> {
    const [updated] = await db
      .update(userStats)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(userStats.userId, userId))
      .returning();
    
    if (!updated) {
      throw new Error("User stats not found");
    }
    
    return updated;
  }
}

// Use database storage instead of memory storage
export const storage = process.env.DATABASE_URL ? new DatabaseStorage() : new MemStorage();
