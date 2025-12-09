import {
  users,
  visionBoards,
  assets,
  goals,
  tasks,
  calendarEntries,
  sharedLinks,
  weeklySummaries,
  userXp,
  badges,
  userBadges,
  achievements,
  userAchievements,
  journalEntries,
  notifications,
  notificationPreferences,
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
  type WeeklySummary,
  type InsertWeeklySummary,
  type UserXp,
  type InsertUserXp,
  type Badge,
  type InsertBadge,
  type UserBadge,
  type InsertUserBadge,
  type Achievement,
  type InsertAchievement,
  type UserAchievement,
  type InsertUserAchievement,
  type JournalEntry,
  type InsertJournalEntry,
  type Notification,
  type InsertNotification,
  type NotificationPreferences,
  type InsertNotificationPreferences,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, sql, asc } from "drizzle-orm";

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

  // Weekly Summary operations
  getWeeklySummaries(userId: string): Promise<WeeklySummary[]>;
  getWeeklySummary(userId: string, weekStartDate: string): Promise<WeeklySummary | undefined>;
  createWeeklySummary(summary: InsertWeeklySummary): Promise<WeeklySummary>;

  // Gamification: XP operations
  getUserXp(userId: string): Promise<UserXp | undefined>;
  upsertUserXp(data: InsertUserXp): Promise<UserXp>;
  addXp(userId: string, amount: number): Promise<UserXp>;
  getLeaderboard(limit?: number): Promise<(UserXp & { user: User })[]>;

  // Gamification: Badge operations
  getBadges(): Promise<Badge[]>;
  getBadge(id: number): Promise<Badge | undefined>;
  getBadgeBySlug(slug: string): Promise<Badge | undefined>;
  createBadge(badge: InsertBadge): Promise<Badge>;
  getUserBadges(userId: string): Promise<(UserBadge & { badge: Badge })[]>;
  awardBadge(userId: string, badgeId: number): Promise<UserBadge | null>;
  hasUserBadge(userId: string, badgeId: number): Promise<boolean>;

  // Gamification: Achievement operations
  getAchievements(): Promise<Achievement[]>;
  getAchievement(id: number): Promise<Achievement | undefined>;
  getUserAchievements(userId: string): Promise<(UserAchievement & { achievement: Achievement })[]>;
  unlockAchievement(userId: string, achievementId: number): Promise<UserAchievement | null>;
  updateAchievementProgress(userId: string, achievementId: number, progress: number): Promise<UserAchievement | undefined>;
  hasUserAchievement(userId: string, achievementId: number): Promise<boolean>;

  // Journal Entry operations
  getJournalEntries(userId: string, limit?: number): Promise<JournalEntry[]>;
  getJournalEntry(id: number): Promise<JournalEntry | undefined>;
  createJournalEntry(entry: InsertJournalEntry): Promise<JournalEntry>;
  updateJournalEntry(id: number, updates: Partial<InsertJournalEntry>): Promise<JournalEntry | undefined>;
  deleteJournalEntry(id: number): Promise<void>;

  // Notification operations
  getNotifications(userId: string, options?: { unreadOnly?: boolean; limit?: number }): Promise<Notification[]>;
  getNotification(id: number): Promise<Notification | undefined>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationRead(id: number): Promise<Notification | undefined>;
  markAllNotificationsRead(userId: string): Promise<void>;
  dismissNotification(id: number): Promise<void>;
  getUnreadNotificationCount(userId: string): Promise<number>;

  // Notification Preferences operations
  getNotificationPreferences(userId: string): Promise<NotificationPreferences | undefined>;
  upsertNotificationPreferences(prefs: InsertNotificationPreferences): Promise<NotificationPreferences>;
  updateEngagement(userId: string, engagementDelta: number): Promise<void>;
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

  // Weekly Summary operations
  async getWeeklySummaries(userId: string): Promise<WeeklySummary[]> {
    return db
      .select()
      .from(weeklySummaries)
      .where(eq(weeklySummaries.userId, userId))
      .orderBy(desc(weeklySummaries.weekStartDate));
  }

  async getWeeklySummary(userId: string, weekStartDate: string): Promise<WeeklySummary | undefined> {
    const [summary] = await db
      .select()
      .from(weeklySummaries)
      .where(
        and(
          eq(weeklySummaries.userId, userId),
          eq(weeklySummaries.weekStartDate, weekStartDate)
        )
      );
    return summary;
  }

  async createWeeklySummary(summary: InsertWeeklySummary): Promise<WeeklySummary> {
    const [newSummary] = await db.insert(weeklySummaries).values(summary).returning();
    return newSummary;
  }

  // Gamification: XP operations
  async getUserXp(userId: string): Promise<UserXp | undefined> {
    const [xp] = await db.select().from(userXp).where(eq(userXp.userId, userId));
    return xp;
  }

  async upsertUserXp(data: InsertUserXp): Promise<UserXp> {
    const [xp] = await db
      .insert(userXp)
      .values(data)
      .onConflictDoUpdate({
        target: userXp.userId,
        set: {
          totalXp: data.totalXp,
          level: data.level,
          currentLevelXp: data.currentLevelXp,
          xpToNextLevel: data.xpToNextLevel,
          updatedAt: new Date(),
        },
      })
      .returning();
    return xp;
  }

  async addXp(userId: string, amount: number): Promise<UserXp> {
    const safeAmount = Math.min(Math.max(0, amount), 10000);
    
    const existing = await this.getUserXp(userId);
    
    if (!existing) {
      return this.upsertUserXp({
        userId,
        totalXp: safeAmount,
        level: 1,
        currentLevelXp: safeAmount,
        xpToNextLevel: 100,
      });
    }

    let newTotalXp = existing.totalXp + safeAmount;
    let newCurrentLevelXp = existing.currentLevelXp + safeAmount;
    let newLevel = existing.level;
    let newXpToNextLevel = existing.xpToNextLevel;

    let iterations = 0;
    const maxIterations = 100;
    while (newCurrentLevelXp >= newXpToNextLevel && iterations < maxIterations) {
      newCurrentLevelXp -= newXpToNextLevel;
      newLevel++;
      newXpToNextLevel = Math.min(100 + (newLevel - 1) * 50, 5000);
      iterations++;
    }

    return this.upsertUserXp({
      userId,
      totalXp: newTotalXp,
      level: newLevel,
      currentLevelXp: newCurrentLevelXp,
      xpToNextLevel: newXpToNextLevel,
    });
  }

  async getLeaderboard(limit: number = 10): Promise<(UserXp & { user: User })[]> {
    const results = await db
      .select()
      .from(userXp)
      .innerJoin(users, eq(userXp.userId, users.id))
      .orderBy(desc(userXp.totalXp))
      .limit(limit);
    
    return results.map(r => ({ ...r.user_xp, user: r.users }));
  }

  // Gamification: Badge operations
  async getBadges(): Promise<Badge[]> {
    return db.select().from(badges).orderBy(asc(badges.name));
  }

  async getBadge(id: number): Promise<Badge | undefined> {
    const [badge] = await db.select().from(badges).where(eq(badges.id, id));
    return badge;
  }

  async getBadgeBySlug(slug: string): Promise<Badge | undefined> {
    const [badge] = await db.select().from(badges).where(eq(badges.slug, slug));
    return badge;
  }

  async createBadge(badge: InsertBadge): Promise<Badge> {
    const [newBadge] = await db.insert(badges).values(badge).returning();
    return newBadge;
  }

  async getUserBadges(userId: string): Promise<(UserBadge & { badge: Badge })[]> {
    const results = await db
      .select()
      .from(userBadges)
      .innerJoin(badges, eq(userBadges.badgeId, badges.id))
      .where(eq(userBadges.userId, userId))
      .orderBy(desc(userBadges.earnedAt));
    
    return results.map(r => ({ ...r.user_badges, badge: r.badges }));
  }

  async awardBadge(userId: string, badgeId: number): Promise<UserBadge | null> {
    const hasBadge = await this.hasUserBadge(userId, badgeId);
    if (hasBadge) {
      const [existing] = await db
        .select()
        .from(userBadges)
        .where(and(eq(userBadges.userId, userId), eq(userBadges.badgeId, badgeId)));
      return existing;
    }
    const [badge] = await db
      .insert(userBadges)
      .values({ userId, badgeId })
      .returning();
    return badge;
  }

  async hasUserBadge(userId: string, badgeId: number): Promise<boolean> {
    const [existing] = await db
      .select()
      .from(userBadges)
      .where(and(eq(userBadges.userId, userId), eq(userBadges.badgeId, badgeId)));
    return !!existing;
  }

  // Gamification: Achievement operations
  async getAchievements(): Promise<Achievement[]> {
    return db.select().from(achievements).orderBy(asc(achievements.tier), asc(achievements.name));
  }

  async getAchievement(id: number): Promise<Achievement | undefined> {
    const [achievement] = await db.select().from(achievements).where(eq(achievements.id, id));
    return achievement;
  }

  async getUserAchievements(userId: string): Promise<(UserAchievement & { achievement: Achievement })[]> {
    const results = await db
      .select()
      .from(userAchievements)
      .innerJoin(achievements, eq(userAchievements.achievementId, achievements.id))
      .where(eq(userAchievements.userId, userId))
      .orderBy(desc(userAchievements.unlockedAt));
    
    return results.map(r => ({ ...r.user_achievements, achievement: r.achievements }));
  }

  async unlockAchievement(userId: string, achievementId: number): Promise<UserAchievement | null> {
    const hasAchievement = await this.hasUserAchievement(userId, achievementId);
    if (hasAchievement) {
      const [existing] = await db
        .select()
        .from(userAchievements)
        .where(and(eq(userAchievements.userId, userId), eq(userAchievements.achievementId, achievementId)));
      return existing;
    }
    const [achievement] = await db
      .insert(userAchievements)
      .values({ userId, achievementId, progress: 100 })
      .returning();
    return achievement;
  }

  async updateAchievementProgress(
    userId: string,
    achievementId: number,
    progress: number
  ): Promise<UserAchievement | undefined> {
    const existing = await db
      .select()
      .from(userAchievements)
      .where(and(eq(userAchievements.userId, userId), eq(userAchievements.achievementId, achievementId)));
    
    if (existing.length === 0) {
      const [newAchievement] = await db
        .insert(userAchievements)
        .values({ userId, achievementId, progress })
        .returning();
      return newAchievement;
    }

    const [updated] = await db
      .update(userAchievements)
      .set({ progress })
      .where(and(eq(userAchievements.userId, userId), eq(userAchievements.achievementId, achievementId)))
      .returning();
    return updated;
  }

  async hasUserAchievement(userId: string, achievementId: number): Promise<boolean> {
    const [existing] = await db
      .select()
      .from(userAchievements)
      .where(
        and(
          eq(userAchievements.userId, userId),
          eq(userAchievements.achievementId, achievementId),
          eq(userAchievements.progress, 100)
        )
      );
    return !!existing;
  }

  // Journal Entry operations
  async getJournalEntries(userId: string, limit = 50): Promise<JournalEntry[]> {
    return db
      .select()
      .from(journalEntries)
      .where(eq(journalEntries.userId, userId))
      .orderBy(desc(journalEntries.createdAt))
      .limit(limit);
  }

  async getJournalEntry(id: number): Promise<JournalEntry | undefined> {
    const [entry] = await db.select().from(journalEntries).where(eq(journalEntries.id, id));
    return entry;
  }

  async createJournalEntry(entry: InsertJournalEntry): Promise<JournalEntry> {
    const [newEntry] = await db.insert(journalEntries).values(entry).returning();
    return newEntry;
  }

  async updateJournalEntry(id: number, updates: Partial<InsertJournalEntry>): Promise<JournalEntry | undefined> {
    const [updated] = await db
      .update(journalEntries)
      .set(updates)
      .where(eq(journalEntries.id, id))
      .returning();
    return updated;
  }

  async deleteJournalEntry(id: number): Promise<void> {
    await db.delete(journalEntries).where(eq(journalEntries.id, id));
  }

  // Notification operations
  async getNotifications(userId: string, options?: { unreadOnly?: boolean; limit?: number }): Promise<Notification[]> {
    const limit = options?.limit ?? 50;
    
    let query = db
      .select()
      .from(notifications)
      .where(
        options?.unreadOnly
          ? and(eq(notifications.userId, userId), eq(notifications.read, false), eq(notifications.dismissed, false))
          : and(eq(notifications.userId, userId), eq(notifications.dismissed, false))
      )
      .orderBy(desc(notifications.createdAt))
      .limit(limit);

    return query;
  }

  async getNotification(id: number): Promise<Notification | undefined> {
    const [notification] = await db.select().from(notifications).where(eq(notifications.id, id));
    return notification;
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    const [newNotification] = await db.insert(notifications).values(notification).returning();
    return newNotification;
  }

  async markNotificationRead(id: number): Promise<Notification | undefined> {
    const [updated] = await db
      .update(notifications)
      .set({ read: true })
      .where(eq(notifications.id, id))
      .returning();
    return updated;
  }

  async markAllNotificationsRead(userId: string): Promise<void> {
    await db
      .update(notifications)
      .set({ read: true })
      .where(and(eq(notifications.userId, userId), eq(notifications.read, false)));
  }

  async dismissNotification(id: number): Promise<void> {
    await db
      .update(notifications)
      .set({ dismissed: true })
      .where(eq(notifications.id, id));
  }

  async getUnreadNotificationCount(userId: string): Promise<number> {
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(notifications)
      .where(and(
        eq(notifications.userId, userId),
        eq(notifications.read, false),
        eq(notifications.dismissed, false)
      ));
    return Number(result[0]?.count ?? 0);
  }

  // Notification Preferences operations
  async getNotificationPreferences(userId: string): Promise<NotificationPreferences | undefined> {
    const [prefs] = await db
      .select()
      .from(notificationPreferences)
      .where(eq(notificationPreferences.userId, userId));
    return prefs;
  }

  async upsertNotificationPreferences(prefs: InsertNotificationPreferences): Promise<NotificationPreferences> {
    const [result] = await db
      .insert(notificationPreferences)
      .values(prefs)
      .onConflictDoUpdate({
        target: notificationPreferences.userId,
        set: {
          ...prefs,
          updatedAt: new Date(),
        },
      })
      .returning();
    return result;
  }

  async updateEngagement(userId: string, engagementDelta: number): Promise<void> {
    const prefs = await this.getNotificationPreferences(userId);
    if (prefs) {
      const newScore = Math.max(0, Math.min(100, (prefs.engagementScore ?? 50) + engagementDelta));
      await db
        .update(notificationPreferences)
        .set({ 
          engagementScore: newScore,
          lastEngagement: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(notificationPreferences.userId, userId));
    } else {
      await this.upsertNotificationPreferences({
        userId,
        engagementScore: Math.max(0, Math.min(100, 50 + engagementDelta)),
        lastEngagement: new Date(),
      });
    }
  }
}

export const storage = new DatabaseStorage();
