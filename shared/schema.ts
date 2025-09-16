import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const prayerRecords = pgTable("prayer_records", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  date: text("date").notNull(), // YYYY-MM-DD format
  prayers: jsonb("prayers").$type<{
    fajr: { completed: boolean; onTime: boolean; completedAt?: string };
    dhuhr: { completed: boolean; onTime: boolean; completedAt?: string };
    asr: { completed: boolean; onTime: boolean; completedAt?: string };
    maghrib: { completed: boolean; onTime: boolean; completedAt?: string };
    isha: { completed: boolean; onTime: boolean; completedAt?: string };
  }>().notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const achievements = pgTable("achievements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  type: text("type").notNull(), // 'perfect_week', 'streak_milestone', etc.
  title: text("title").notNull(),
  description: text("description").notNull(),
  earnedDate: text("earned_date").notNull(), // YYYY-MM-DD format
  metadata: jsonb("metadata").$type<{
    weekNumber?: number;
    year?: number;
    streakDays?: number;
    onTimePrayers?: number;
    qazaPrayers?: number;
    dateRange?: { start: string; end: string };
  }>(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const userStats = pgTable("user_stats", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).unique(),
  totalPrayers: integer("total_prayers").default(0),
  onTimePrayers: integer("on_time_prayers").default(0),
  qazaPrayers: integer("qaza_prayers").default(0),
  currentStreak: integer("current_streak").default(0),
  bestStreak: integer("best_streak").default(0),
  perfectWeeks: integer("perfect_weeks").default(0),
  lastStreakUpdate: text("last_streak_update"), // YYYY-MM-DD format
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertPrayerRecordSchema = createInsertSchema(prayerRecords).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAchievementSchema = createInsertSchema(achievements).omit({
  id: true,
  createdAt: true,
});

export const insertUserStatsSchema = createInsertSchema(userStats).omit({
  id: true,
  updatedAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertPrayerRecord = z.infer<typeof insertPrayerRecordSchema>;
export type PrayerRecord = typeof prayerRecords.$inferSelect;
export type InsertAchievement = z.infer<typeof insertAchievementSchema>;
export type Achievement = typeof achievements.$inferSelect;
export type InsertUserStats = z.infer<typeof insertUserStatsSchema>;
export type UserStats = typeof userStats.$inferSelect;

export type PrayerType = 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';
export type PrayerStatus = {
  completed: boolean;
  onTime: boolean;
  completedAt?: string;
};
