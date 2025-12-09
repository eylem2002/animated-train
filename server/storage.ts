import {
  users,
  visionBoards,
  assets,
  goals,
  tasks,
  calendarEntries,
  sharedLinks,
  type User,
  type UpsertUser,
  type VisionBoard,
  type InsertVisionBoard,
  type Asset,
  type InsertAsset,
  type Goal,
  type InsertGoal,
  type Task,
  type InsertTask,
  type CalendarEntry,
  type InsertCalendarEntry,
  type SharedLink,
  type InsertSharedLink,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, sql } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;

  // Vision Board operations
  getBoards(userId: string): Promise<VisionBoard[]>;
  getBoard(id: number): Promise<VisionBoard | undefined>;
  createBoard(board: InsertVisionBoard): Promise<VisionBoard>;
  updateBoard(id: number, updates: Partial<InsertVisionBoard>): Promise<VisionBoard | undefined>;
  deleteBoard(id: number): Promise<void>;
  getPublicBoards(limit?: number, offset?: number): Promise<VisionBoard[]>;

  // Asset operations
  getAssets(boardId: number): Promise<Asset[]>;
  getAsset(id: number): Promise<Asset | undefined>;
  createAsset(asset: InsertAsset): Promise<Asset>;
  updateAsset(id: number, updates: Partial<InsertAsset>): Promise<Asset | undefined>;
  deleteAsset(id: number): Promise<void>;

  // Goal operations
  getGoals(userId: string): Promise<Goal[]>;
  getGoal(id: number): Promise<Goal | undefined>;
  createGoal(goal: InsertGoal): Promise<Goal>;
  updateGoal(id: number, updates: Partial<InsertGoal>): Promise<Goal | undefined>;
  deleteGoal(id: number): Promise<void>;

  // Task operations
  getTasks(userId: string): Promise<Task[]>;
  getTasksByGoal(goalId: number): Promise<Task[]>;
  getTask(id: number): Promise<Task | undefined>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: number, updates: Partial<InsertTask>): Promise<Task | undefined>;
  deleteTask(id: number): Promise<void>;

  // Calendar Entry operations
  getCalendarEntries(userId: string, month?: number, year?: number): Promise<CalendarEntry[]>;
  createCalendarEntry(entry: InsertCalendarEntry): Promise<CalendarEntry>;
  updateCalendarEntry(id: number, updates: Partial<InsertCalendarEntry>): Promise<CalendarEntry | undefined>;

  // Shared Link operations
  getSharedLink(token: string): Promise<SharedLink | undefined>;
  createSharedLink(link: InsertSharedLink): Promise<SharedLink>;
  deleteSharedLink(id: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Vision Board operations
  async getBoards(userId: string): Promise<VisionBoard[]> {
    return db
      .select()
      .from(visionBoards)
      .where(eq(visionBoards.ownerId, userId))
      .orderBy(desc(visionBoards.updatedAt));
  }

  async getBoard(id: number): Promise<VisionBoard | undefined> {
    const [board] = await db.select().from(visionBoards).where(eq(visionBoards.id, id));
    return board;
  }

  async createBoard(board: InsertVisionBoard): Promise<VisionBoard> {
    const [newBoard] = await db.insert(visionBoards).values(board).returning();
    return newBoard;
  }

  async updateBoard(id: number, updates: Partial<InsertVisionBoard>): Promise<VisionBoard | undefined> {
    const [updated] = await db
      .update(visionBoards)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(visionBoards.id, id))
      .returning();
    return updated;
  }

  async deleteBoard(id: number): Promise<void> {
    await db.delete(visionBoards).where(eq(visionBoards.id, id));
  }

  async getPublicBoards(limit = 20, offset = 0): Promise<VisionBoard[]> {
    return db
      .select()
      .from(visionBoards)
      .where(eq(visionBoards.visibility, "public"))
      .orderBy(desc(visionBoards.likeCount))
      .limit(limit)
      .offset(offset);
  }

  // Asset operations
  async getAssets(boardId: number): Promise<Asset[]> {
    return db.select().from(assets).where(eq(assets.boardId, boardId));
  }

  async getAsset(id: number): Promise<Asset | undefined> {
    const [asset] = await db.select().from(assets).where(eq(assets.id, id));
    return asset;
  }

  async createAsset(asset: InsertAsset): Promise<Asset> {
    const [newAsset] = await db.insert(assets).values(asset).returning();
    return newAsset;
  }

  async updateAsset(id: number, updates: Partial<InsertAsset>): Promise<Asset | undefined> {
    const [updated] = await db.update(assets).set(updates).where(eq(assets.id, id)).returning();
    return updated;
  }

  async deleteAsset(id: number): Promise<void> {
    await db.delete(assets).where(eq(assets.id, id));
  }

  // Goal operations
  async getGoals(userId: string): Promise<Goal[]> {
    return db
      .select()
      .from(goals)
      .where(eq(goals.ownerId, userId))
      .orderBy(desc(goals.updatedAt));
  }

  async getGoal(id: number): Promise<Goal | undefined> {
    const [goal] = await db.select().from(goals).where(eq(goals.id, id));
    return goal;
  }

  async createGoal(goal: InsertGoal): Promise<Goal> {
    const [newGoal] = await db.insert(goals).values(goal).returning();
    return newGoal;
  }

  async updateGoal(id: number, updates: Partial<InsertGoal>): Promise<Goal | undefined> {
    const [updated] = await db
      .update(goals)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(goals.id, id))
      .returning();
    return updated;
  }

  async deleteGoal(id: number): Promise<void> {
    await db.delete(goals).where(eq(goals.id, id));
  }

  // Task operations
  async getTasks(userId: string): Promise<Task[]> {
    return db.select().from(tasks).where(eq(tasks.ownerId, userId));
  }

  async getTasksByGoal(goalId: number): Promise<Task[]> {
    return db.select().from(tasks).where(eq(tasks.goalId, goalId));
  }

  async getTask(id: number): Promise<Task | undefined> {
    const [task] = await db.select().from(tasks).where(eq(tasks.id, id));
    return task;
  }

  async createTask(task: InsertTask): Promise<Task> {
    const [newTask] = await db.insert(tasks).values(task).returning();
    return newTask;
  }

  async updateTask(id: number, updates: Partial<InsertTask>): Promise<Task | undefined> {
    const [updated] = await db.update(tasks).set(updates).where(eq(tasks.id, id)).returning();
    return updated;
  }

  async deleteTask(id: number): Promise<void> {
    await db.delete(tasks).where(eq(tasks.id, id));
  }

  // Calendar Entry operations
  async getCalendarEntries(userId: string, month?: number, year?: number): Promise<CalendarEntry[]> {
    if (month && year) {
      const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
      const endDate = `${year}-${String(month).padStart(2, "0")}-31`;
      return db
        .select()
        .from(calendarEntries)
        .where(
          and(
            eq(calendarEntries.userId, userId),
            sql`${calendarEntries.date} >= ${startDate}`,
            sql`${calendarEntries.date} <= ${endDate}`
          )
        );
    }
    return db.select().from(calendarEntries).where(eq(calendarEntries.userId, userId));
  }

  async createCalendarEntry(entry: InsertCalendarEntry): Promise<CalendarEntry> {
    const [newEntry] = await db.insert(calendarEntries).values(entry).returning();
    return newEntry;
  }

  async updateCalendarEntry(
    id: number,
    updates: Partial<InsertCalendarEntry>
  ): Promise<CalendarEntry | undefined> {
    const [updated] = await db
      .update(calendarEntries)
      .set(updates)
      .where(eq(calendarEntries.id, id))
      .returning();
    return updated;
  }

  // Shared Link operations
  async getSharedLink(token: string): Promise<SharedLink | undefined> {
    const [link] = await db.select().from(sharedLinks).where(eq(sharedLinks.token, token));
    return link;
  }

  async createSharedLink(link: InsertSharedLink): Promise<SharedLink> {
    const [newLink] = await db.insert(sharedLinks).values(link).returning();
    return newLink;
  }

  async deleteSharedLink(id: number): Promise<void> {
    await db.delete(sharedLinks).where(eq(sharedLinks.id, id));
  }
}

export const storage = new DatabaseStorage();
