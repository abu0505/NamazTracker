import { type User, type InsertUser, type PrayerRecord, type InsertPrayerRecord, type Achievement, type InsertAchievement, type UserStats, type InsertUserStats } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // User management
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

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

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    
    // Initialize user stats
    const userStats: UserStats = {
      id: randomUUID(),
      userId: id,
      totalPrayers: 0,
      onTimePrayers: 0,
      qazaPrayers: 0,
      currentStreak: 0,
      bestStreak: 0,
      perfectWeeks: 0,
      lastStreakUpdate: null,
      updatedAt: new Date(),
    };
    this.userStats.set(id, userStats);
    
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
    const record: PrayerRecord = {
      id,
      userId: insertRecord.userId || null,
      date: insertRecord.date,
      prayers: insertRecord.prayers,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    this.prayerRecords.set(`${record.userId}-${record.date}`, record);
    return record;
  }

  async updatePrayerRecord(userId: string, date: string, prayers: any): Promise<PrayerRecord> {
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
    const id = randomUUID();
    const achievement: Achievement = {
      id,
      userId: insertAchievement.userId || null,
      type: insertAchievement.type,
      title: insertAchievement.title,
      description: insertAchievement.description,
      earnedDate: insertAchievement.earnedDate,
      metadata: insertAchievement.metadata || null,
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

export const storage = new MemStorage();
