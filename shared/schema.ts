import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, timestamp, jsonb, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
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

export const upsertUserSchema = createInsertSchema(users).pick({
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  profileImageUrl: true,
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

export type UpsertUser = z.infer<typeof upsertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertPrayerRecord = z.infer<typeof insertPrayerRecordSchema>;
export type PrayerRecord = typeof prayerRecords.$inferSelect;
export type InsertAchievement = z.infer<typeof insertAchievementSchema>;
export type Achievement = typeof achievements.$inferSelect;
export type InsertUserStats = z.infer<typeof insertUserStatsSchema>;
export type UserStats = typeof userStats.$inferSelect;

// Additional validation schemas for API routes
export const dateParamSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format")
});

export const dateRangeQuerySchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Start date must be in YYYY-MM-DD format").optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "End date must be in YYYY-MM-DD format").optional()
}).refine(
  (data) => {
    if (data.startDate && data.endDate) {
      return data.startDate <= data.endDate;
    }
    return true;
  },
  { message: "Start date must be before or equal to end date" }
);

export const userStatsUpdateSchema = z.object({
  totalPrayers: z.number().int().min(0).optional(),
  onTimePrayers: z.number().int().min(0).optional(),
  qazaPrayers: z.number().int().min(0).optional(),
  currentStreak: z.number().int().min(0).optional(),
  bestStreak: z.number().int().min(0).optional(),
  perfectWeeks: z.number().int().min(0).optional(),
  lastStreakUpdate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format").nullable().optional()
});

export type PrayerType = 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';
export type PrayerStatus = {
  completed: boolean;
  onTime: boolean;
  completedAt?: string;
};

export type DailyPrayers = {
  fajr: { completed: boolean; onTime: boolean; completedAt?: string };
  dhuhr: { completed: boolean; onTime: boolean; completedAt?: string };
  asr: { completed: boolean; onTime: boolean; completedAt?: string };
  maghrib: { completed: boolean; onTime: boolean; completedAt?: string };
  isha: { completed: boolean; onTime: boolean; completedAt?: string };
};

// Schema for individual prayer status
const prayerStatusSchema = z.object({
  completed: z.boolean(),
  onTime: z.boolean(),
  completedAt: z.string().optional(),
});

// Schema for daily prayers object
const dailyPrayersSchema = z.object({
  fajr: prayerStatusSchema,
  dhuhr: prayerStatusSchema,
  asr: prayerStatusSchema,
  maghrib: prayerStatusSchema,
  isha: prayerStatusSchema,
});

// Schema for batch update request
export const batchUpdatePrayersSchema = z.object({
  updates: z.array(z.object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
    prayers: dailyPrayersSchema,
  })).min(1, "At least one update is required").max(7, "Maximum 7 updates per batch"),
});

export type BatchUpdatePrayers = z.infer<typeof batchUpdatePrayersSchema>;
