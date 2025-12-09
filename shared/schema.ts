import { sql, relations } from "drizzle-orm";
import {
  pgTable,
  varchar,
  text,
  timestamp,
  integer,
  boolean,
  numeric,
  date,
  jsonb,
  index,
  serial,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)]
);

// Users table for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  preferences: jsonb("preferences"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Vision Boards
export const visionBoards = pgTable("vision_boards", {
  id: serial("id").primaryKey(),
  ownerId: varchar("owner_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  visibility: varchar("visibility", { length: 20 }).notNull().default("private"),
  coverAssetUrl: text("cover_asset_url"),
  metadata: jsonb("metadata"),
  viewCount: integer("view_count").default(0),
  likeCount: integer("like_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Assets (images, videos, audio, text blocks)
export const assets = pgTable("assets", {
  id: serial("id").primaryKey(),
  boardId: integer("board_id").notNull().references(() => visionBoards.id, { onDelete: "cascade" }),
  type: varchar("type", { length: 20 }).notNull().default("image"),
  url: text("url").notNull(),
  altText: text("alt_text"),
  metadata: jsonb("metadata"), // position, rotation, scale for 3D
  tags: text("tags").array(),
  goalId: integer("goal_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Goals
export const goals = pgTable("goals", {
  id: serial("id").primaryKey(),
  boardId: integer("board_id").references(() => visionBoards.id, { onDelete: "set null" }),
  ownerId: varchar("owner_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  category: varchar("category", { length: 50 }),
  targetDate: date("target_date"),
  progress: numeric("progress", { precision: 5, scale: 2 }).default("0"),
  status: varchar("status", { length: 20 }).notNull().default("planned"),
  priority: integer("priority").default(1),
  milestones: jsonb("milestones"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Tasks and Habits
export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  goalId: integer("goal_id").references(() => goals.id, { onDelete: "cascade" }),
  ownerId: varchar("owner_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: varchar("type", { length: 20 }).notNull().default("task"),
  title: text("title").notNull(),
  notes: text("notes"),
  frequency: jsonb("frequency"), // daily, weekly patterns
  streakCount: integer("streak_count").default(0),
  lastDone: timestamp("last_done"),
  completed: boolean("completed").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Calendar Entries (check-ins)
export const calendarEntries = pgTable("calendar_entries", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  taskId: integer("task_id").references(() => tasks.id, { onDelete: "cascade" }),
  date: date("date").notNull(),
  done: boolean("done").default(false),
  metadata: jsonb("metadata"),
});

// Shared Links
export const sharedLinks = pgTable("shared_links", {
  id: serial("id").primaryKey(),
  boardId: integer("board_id").notNull().references(() => visionBoards.id, { onDelete: "cascade" }),
  token: varchar("token", { length: 64 }).notNull().unique(),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Weekly Summaries (AI Coach)
export const weeklySummaries = pgTable("weekly_summaries", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  weekStartDate: date("week_start_date").notNull(),
  summary: text("summary").notNull(),
  highlights: jsonb("highlights"), // achievements, completed goals, etc.
  recommendations: jsonb("recommendations"), // AI-generated suggestions
  focusAreas: jsonb("focus_areas"), // areas needing attention
  metrics: jsonb("metrics"), // completion rates, streaks, etc.
  motivationalMessage: text("motivational_message"), // encouraging message
  createdAt: timestamp("created_at").defaultNow(),
});

// Gamification: User XP and Level
export const userXp = pgTable("user_xp", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }).unique(),
  totalXp: integer("total_xp").notNull().default(0),
  level: integer("level").notNull().default(1),
  currentLevelXp: integer("current_level_xp").notNull().default(0),
  xpToNextLevel: integer("xp_to_next_level").notNull().default(100),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Gamification: Badge Definitions
export const badges = pgTable("badges", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 50 }).notNull().unique(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description").notNull(),
  icon: varchar("icon", { length: 50 }).notNull(), // lucide icon name
  color: varchar("color", { length: 20 }).notNull().default("primary"),
  xpReward: integer("xp_reward").notNull().default(0),
  rarity: varchar("rarity", { length: 20 }).notNull().default("common"), // common, rare, epic, legendary
  category: varchar("category", { length: 50 }).notNull().default("general"),
});

// Gamification: User Earned Badges
export const userBadges = pgTable("user_badges", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  badgeId: integer("badge_id").notNull().references(() => badges.id, { onDelete: "cascade" }),
  earnedAt: timestamp("earned_at").defaultNow(),
}, (table) => [
  index("IDX_user_badges_unique").on(table.userId, table.badgeId),
]);

// Gamification: Achievement Definitions
export const achievements = pgTable("achievements", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 50 }).notNull().unique(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description").notNull(),
  icon: varchar("icon", { length: 50 }).notNull(),
  xpReward: integer("xp_reward").notNull().default(0),
  requirement: jsonb("requirement").notNull(), // { type: "streak", count: 7 } or { type: "tasks_completed", count: 10 }
  tier: integer("tier").notNull().default(1), // achievement tier/level
});

// Gamification: User Unlocked Achievements
export const userAchievements = pgTable("user_achievements", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  achievementId: integer("achievement_id").notNull().references(() => achievements.id, { onDelete: "cascade" }),
  unlockedAt: timestamp("unlocked_at").defaultNow(),
  progress: integer("progress").notNull().default(0), // for tracking progress toward achievement
}, (table) => [
  index("IDX_user_achievements_unique").on(table.userId, table.achievementId),
]);

// Voice Journal Entries
export const journalEntries = pgTable("journal_entries", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title"),
  transcript: text("transcript"), // Speech-to-text result
  audioUrl: text("audio_url"), // Stored audio file
  duration: integer("duration"), // Duration in seconds
  mood: varchar("mood", { length: 20 }), // detected mood: happy, sad, neutral, excited, anxious, etc.
  sentiment: numeric("sentiment", { precision: 4, scale: 3 }), // -1 to 1 sentiment score
  tags: text("tags").array(),
  goalId: integer("goal_id").references(() => goals.id, { onDelete: "set null" }),
  isPrivate: boolean("is_private").default(true),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("IDX_journal_entries_user").on(table.userId),
  index("IDX_journal_entries_created").on(table.createdAt),
]);

// Relations
export const usersRelations = relations(users, ({ many, one }) => ({
  visionBoards: many(visionBoards),
  goals: many(goals),
  tasks: many(tasks),
  calendarEntries: many(calendarEntries),
  weeklySummaries: many(weeklySummaries),
  xp: one(userXp),
  badges: many(userBadges),
  achievements: many(userAchievements),
  journalEntries: many(journalEntries),
}));

export const journalEntriesRelations = relations(journalEntries, ({ one }) => ({
  user: one(users, {
    fields: [journalEntries.userId],
    references: [users.id],
  }),
  goal: one(goals, {
    fields: [journalEntries.goalId],
    references: [goals.id],
  }),
}));

export const userXpRelations = relations(userXp, ({ one }) => ({
  user: one(users, {
    fields: [userXp.userId],
    references: [users.id],
  }),
}));

export const badgesRelations = relations(badges, ({ many }) => ({
  userBadges: many(userBadges),
}));

export const userBadgesRelations = relations(userBadges, ({ one }) => ({
  user: one(users, {
    fields: [userBadges.userId],
    references: [users.id],
  }),
  badge: one(badges, {
    fields: [userBadges.badgeId],
    references: [badges.id],
  }),
}));

export const achievementsRelations = relations(achievements, ({ many }) => ({
  userAchievements: many(userAchievements),
}));

export const userAchievementsRelations = relations(userAchievements, ({ one }) => ({
  user: one(users, {
    fields: [userAchievements.userId],
    references: [users.id],
  }),
  achievement: one(achievements, {
    fields: [userAchievements.achievementId],
    references: [achievements.id],
  }),
}));

export const weeklySummariesRelations = relations(weeklySummaries, ({ one }) => ({
  user: one(users, {
    fields: [weeklySummaries.userId],
    references: [users.id],
  }),
}));

export const visionBoardsRelations = relations(visionBoards, ({ one, many }) => ({
  owner: one(users, {
    fields: [visionBoards.ownerId],
    references: [users.id],
  }),
  assets: many(assets),
  goals: many(goals),
  sharedLinks: many(sharedLinks),
}));

export const assetsRelations = relations(assets, ({ one }) => ({
  board: one(visionBoards, {
    fields: [assets.boardId],
    references: [visionBoards.id],
  }),
  goal: one(goals, {
    fields: [assets.goalId],
    references: [goals.id],
  }),
}));

export const goalsRelations = relations(goals, ({ one, many }) => ({
  owner: one(users, {
    fields: [goals.ownerId],
    references: [users.id],
  }),
  board: one(visionBoards, {
    fields: [goals.boardId],
    references: [visionBoards.id],
  }),
  tasks: many(tasks),
  assets: many(assets),
}));

export const tasksRelations = relations(tasks, ({ one, many }) => ({
  owner: one(users, {
    fields: [tasks.ownerId],
    references: [users.id],
  }),
  goal: one(goals, {
    fields: [tasks.goalId],
    references: [goals.id],
  }),
  calendarEntries: many(calendarEntries),
}));

export const calendarEntriesRelations = relations(calendarEntries, ({ one }) => ({
  user: one(users, {
    fields: [calendarEntries.userId],
    references: [users.id],
  }),
  task: one(tasks, {
    fields: [calendarEntries.taskId],
    references: [tasks.id],
  }),
}));

export const sharedLinksRelations = relations(sharedLinks, ({ one }) => ({
  board: one(visionBoards, {
    fields: [sharedLinks.boardId],
    references: [visionBoards.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  createdAt: true,
  updatedAt: true,
});

export const insertVisionBoardSchema = createInsertSchema(visionBoards).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  viewCount: true,
  likeCount: true,
});

export const insertAssetSchema = createInsertSchema(assets).omit({
  id: true,
  createdAt: true,
});

export const insertGoalSchema = createInsertSchema(goals).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTaskSchema = createInsertSchema(tasks).omit({
  id: true,
  createdAt: true,
});

export const insertCalendarEntrySchema = createInsertSchema(calendarEntries).omit({
  id: true,
});

export const insertSharedLinkSchema = createInsertSchema(sharedLinks).omit({
  id: true,
  createdAt: true,
});

export const insertWeeklySummarySchema = createInsertSchema(weeklySummaries).omit({
  id: true,
  createdAt: true,
});

export const insertUserXpSchema = createInsertSchema(userXp).omit({
  id: true,
  updatedAt: true,
});

export const insertBadgeSchema = createInsertSchema(badges).omit({
  id: true,
});

export const insertUserBadgeSchema = createInsertSchema(userBadges).omit({
  id: true,
  earnedAt: true,
});

export const insertAchievementSchema = createInsertSchema(achievements).omit({
  id: true,
});

export const insertUserAchievementSchema = createInsertSchema(userAchievements).omit({
  id: true,
  unlockedAt: true,
});

export const insertJournalEntrySchema = createInsertSchema(journalEntries).omit({
  id: true,
  createdAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type UpsertUser = typeof users.$inferInsert;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type VisionBoard = typeof visionBoards.$inferSelect;
export type InsertVisionBoard = z.infer<typeof insertVisionBoardSchema>;

export type Asset = typeof assets.$inferSelect;
export type InsertAsset = z.infer<typeof insertAssetSchema>;

export type Goal = typeof goals.$inferSelect;
export type InsertGoal = z.infer<typeof insertGoalSchema>;

export type Task = typeof tasks.$inferSelect;
export type InsertTask = z.infer<typeof insertTaskSchema>;

export type CalendarEntry = typeof calendarEntries.$inferSelect;
export type InsertCalendarEntry = z.infer<typeof insertCalendarEntrySchema>;

export type SharedLink = typeof sharedLinks.$inferSelect;
export type InsertSharedLink = z.infer<typeof insertSharedLinkSchema>;

export type WeeklySummary = typeof weeklySummaries.$inferSelect;
export type InsertWeeklySummary = z.infer<typeof insertWeeklySummarySchema>;

export type UserXp = typeof userXp.$inferSelect;
export type InsertUserXp = z.infer<typeof insertUserXpSchema>;

export type Badge = typeof badges.$inferSelect;
export type InsertBadge = z.infer<typeof insertBadgeSchema>;

export type UserBadge = typeof userBadges.$inferSelect;
export type InsertUserBadge = z.infer<typeof insertUserBadgeSchema>;

export type Achievement = typeof achievements.$inferSelect;
export type InsertAchievement = z.infer<typeof insertAchievementSchema>;

export type UserAchievement = typeof userAchievements.$inferSelect;
export type InsertUserAchievement = z.infer<typeof insertUserAchievementSchema>;

export type JournalEntry = typeof journalEntries.$inferSelect;
export type InsertJournalEntry = z.infer<typeof insertJournalEntrySchema>;

// Achievement requirement type
export interface AchievementRequirement {
  type: "streak" | "tasks_completed" | "goals_completed" | "boards_created" | "login_days" | "xp_earned";
  count: number;
}

// Asset metadata type for 3D positioning
export interface AssetMetadata {
  position?: { x: number; y: number; z: number };
  rotation?: { x: number; y: number; z: number };
  scale?: { x: number; y: number; z: number };
  wallIndex?: number;
}

// Goal milestone type
export interface Milestone {
  id: string;
  title: string;
  completed: boolean;
  targetDate?: string;
}

// Task frequency type
export interface TaskFrequency {
  type: "daily" | "weekly" | "custom";
  daysOfWeek?: number[];
  customDays?: number;
}
