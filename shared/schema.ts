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

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  visionBoards: many(visionBoards),
  goals: many(goals),
  tasks: many(tasks),
  calendarEntries: many(calendarEntries),
  weeklySummaries: many(weeklySummaries),
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
