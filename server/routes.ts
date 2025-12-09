import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { ObjectStorageService, ObjectNotFoundError } from "./objectStorage";
import { ObjectPermission } from "./objectAcl";
import {
  insertVisionBoardSchema,
  insertAssetSchema,
  insertGoalSchema,
  insertTaskSchema,
  insertCalendarEntrySchema,
  insertJournalEntrySchema,
} from "@shared/schema";
import { z } from "zod";
import { randomBytes } from "crypto";
import OpenAI from "openai";
import { seedGamification } from "./seedGamification";
import { setupCollaboration } from "./collaboration";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  await setupAuth(app);
  
  await seedGamification();
  
  setupCollaboration(httpServer);

  // Auth routes
  app.get("/api/auth/user", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Vision Board routes
  app.get("/api/boards", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const boards = await storage.getBoards(userId);
      res.json(boards);
    } catch (error) {
      console.error("Error fetching boards:", error);
      res.status(500).json({ message: "Failed to fetch boards" });
    }
  });

  app.get("/api/boards/public", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = parseInt(req.query.offset as string) || 0;
      const boards = await storage.getPublicBoards(limit, offset);
      res.json(boards);
    } catch (error) {
      console.error("Error fetching public boards:", error);
      res.status(500).json({ message: "Failed to fetch public boards" });
    }
  });

  app.get("/api/boards/:id", isAuthenticated, async (req: any, res) => {
    try {
      const boardId = parseInt(req.params.id);
      const board = await storage.getBoard(boardId);
      if (!board) {
        return res.status(404).json({ message: "Board not found" });
      }
      const userId = req.user.claims.sub;
      if (board.ownerId !== userId && board.visibility === "private") {
        return res.status(403).json({ message: "Forbidden" });
      }
      res.json(board);
    } catch (error) {
      console.error("Error fetching board:", error);
      res.status(500).json({ message: "Failed to fetch board" });
    }
  });

  app.post("/api/boards", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const data = insertVisionBoardSchema.parse({ ...req.body, ownerId: userId });
      const board = await storage.createBoard(data);
      res.status(201).json(board);
    } catch (error) {
      console.error("Error creating board:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create board" });
    }
  });

  app.patch("/api/boards/:id", isAuthenticated, async (req: any, res) => {
    try {
      const boardId = parseInt(req.params.id);
      const board = await storage.getBoard(boardId);
      if (!board) {
        return res.status(404).json({ message: "Board not found" });
      }
      const userId = req.user.claims.sub;
      if (board.ownerId !== userId) {
        return res.status(403).json({ message: "Forbidden" });
      }
      const updated = await storage.updateBoard(boardId, req.body);
      res.json(updated);
    } catch (error) {
      console.error("Error updating board:", error);
      res.status(500).json({ message: "Failed to update board" });
    }
  });

  app.delete("/api/boards/:id", isAuthenticated, async (req: any, res) => {
    try {
      const boardId = parseInt(req.params.id);
      const board = await storage.getBoard(boardId);
      if (!board) {
        return res.status(404).json({ message: "Board not found" });
      }
      const userId = req.user.claims.sub;
      if (board.ownerId !== userId) {
        return res.status(403).json({ message: "Forbidden" });
      }
      await storage.deleteBoard(boardId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting board:", error);
      res.status(500).json({ message: "Failed to delete board" });
    }
  });

  // Asset routes
  app.get("/api/boards/:id/assets", isAuthenticated, async (req: any, res) => {
    try {
      const boardId = parseInt(req.params.id);
      const assets = await storage.getAssets(boardId);
      res.json(assets);
    } catch (error) {
      console.error("Error fetching assets:", error);
      res.status(500).json({ message: "Failed to fetch assets" });
    }
  });

  app.post("/api/boards/:id/assets", isAuthenticated, async (req: any, res) => {
    try {
      const boardId = parseInt(req.params.id);
      const board = await storage.getBoard(boardId);
      if (!board) {
        return res.status(404).json({ message: "Board not found" });
      }
      const userId = req.user.claims.sub;
      if (board.ownerId !== userId) {
        return res.status(403).json({ message: "Forbidden" });
      }
      const data = insertAssetSchema.parse({ ...req.body, boardId });
      const asset = await storage.createAsset(data);
      res.status(201).json(asset);
    } catch (error) {
      console.error("Error creating asset:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create asset" });
    }
  });

  app.patch("/api/assets/:id", isAuthenticated, async (req: any, res) => {
    try {
      const assetId = parseInt(req.params.id);
      const updated = await storage.updateAsset(assetId, req.body);
      if (!updated) {
        return res.status(404).json({ message: "Asset not found" });
      }
      res.json(updated);
    } catch (error) {
      console.error("Error updating asset:", error);
      res.status(500).json({ message: "Failed to update asset" });
    }
  });

  app.delete("/api/assets/:id", isAuthenticated, async (req: any, res) => {
    try {
      const assetId = parseInt(req.params.id);
      await storage.deleteAsset(assetId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting asset:", error);
      res.status(500).json({ message: "Failed to delete asset" });
    }
  });

  // Goal routes
  app.get("/api/goals", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const goals = await storage.getGoals(userId);
      res.json(goals);
    } catch (error) {
      console.error("Error fetching goals:", error);
      res.status(500).json({ message: "Failed to fetch goals" });
    }
  });

  app.get("/api/goals/:id", isAuthenticated, async (req: any, res) => {
    try {
      const goalId = parseInt(req.params.id);
      const goal = await storage.getGoal(goalId);
      if (!goal) {
        return res.status(404).json({ message: "Goal not found" });
      }
      const userId = req.user.claims.sub;
      if (goal.ownerId !== userId) {
        return res.status(403).json({ message: "Forbidden" });
      }
      res.json(goal);
    } catch (error) {
      console.error("Error fetching goal:", error);
      res.status(500).json({ message: "Failed to fetch goal" });
    }
  });

  app.post("/api/goals", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const data = insertGoalSchema.parse({ ...req.body, ownerId: userId });
      const goal = await storage.createGoal(data);
      res.status(201).json(goal);
    } catch (error) {
      console.error("Error creating goal:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create goal" });
    }
  });

  app.patch("/api/goals/:id", isAuthenticated, async (req: any, res) => {
    try {
      const goalId = parseInt(req.params.id);
      const goal = await storage.getGoal(goalId);
      if (!goal) {
        return res.status(404).json({ message: "Goal not found" });
      }
      const userId = req.user.claims.sub;
      if (goal.ownerId !== userId) {
        return res.status(403).json({ message: "Forbidden" });
      }
      const updated = await storage.updateGoal(goalId, req.body);
      res.json(updated);
    } catch (error) {
      console.error("Error updating goal:", error);
      res.status(500).json({ message: "Failed to update goal" });
    }
  });

  app.delete("/api/goals/:id", isAuthenticated, async (req: any, res) => {
    try {
      const goalId = parseInt(req.params.id);
      const goal = await storage.getGoal(goalId);
      if (!goal) {
        return res.status(404).json({ message: "Goal not found" });
      }
      const userId = req.user.claims.sub;
      if (goal.ownerId !== userId) {
        return res.status(403).json({ message: "Forbidden" });
      }
      await storage.deleteGoal(goalId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting goal:", error);
      res.status(500).json({ message: "Failed to delete goal" });
    }
  });

  // Task routes
  app.get("/api/tasks", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const type = req.query.type as string | undefined;
      let tasks = await storage.getTasks(userId);
      if (type) {
        tasks = tasks.filter((t) => t.type === type);
      }
      res.json(tasks);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      res.status(500).json({ message: "Failed to fetch tasks" });
    }
  });

  app.post("/api/tasks", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const data = insertTaskSchema.parse({ ...req.body, ownerId: userId });
      const task = await storage.createTask(data);
      res.status(201).json(task);
    } catch (error) {
      console.error("Error creating task:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create task" });
    }
  });

  app.patch("/api/tasks/:id", isAuthenticated, async (req: any, res) => {
    try {
      const taskId = parseInt(req.params.id);
      const task = await storage.getTask(taskId);
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
      const userId = req.user.claims.sub;
      if (task.ownerId !== userId) {
        return res.status(403).json({ message: "Forbidden" });
      }
      const updated = await storage.updateTask(taskId, req.body);
      res.json(updated);
    } catch (error) {
      console.error("Error updating task:", error);
      res.status(500).json({ message: "Failed to update task" });
    }
  });

  app.delete("/api/tasks/:id", isAuthenticated, async (req: any, res) => {
    try {
      const taskId = parseInt(req.params.id);
      const task = await storage.getTask(taskId);
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
      const userId = req.user.claims.sub;
      if (task.ownerId !== userId) {
        return res.status(403).json({ message: "Forbidden" });
      }
      await storage.deleteTask(taskId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting task:", error);
      res.status(500).json({ message: "Failed to delete task" });
    }
  });

  // Calendar Entry routes
  app.get("/api/calendar-entries", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const month = req.query.month ? parseInt(req.query.month as string) : undefined;
      const year = req.query.year ? parseInt(req.query.year as string) : undefined;
      const entries = await storage.getCalendarEntries(userId, month, year);
      res.json(entries);
    } catch (error) {
      console.error("Error fetching calendar entries:", error);
      res.status(500).json({ message: "Failed to fetch calendar entries" });
    }
  });

  app.post("/api/calendar-entries", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const data = insertCalendarEntrySchema.parse({ ...req.body, userId });
      const entry = await storage.createCalendarEntry(data);
      res.status(201).json(entry);
    } catch (error) {
      console.error("Error creating calendar entry:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create calendar entry" });
    }
  });

  app.patch("/api/calendar-entries/:id", isAuthenticated, async (req: any, res) => {
    try {
      const entryId = parseInt(req.params.id);
      const updated = await storage.updateCalendarEntry(entryId, req.body);
      if (!updated) {
        return res.status(404).json({ message: "Entry not found" });
      }
      res.json(updated);
    } catch (error) {
      console.error("Error updating calendar entry:", error);
      res.status(500).json({ message: "Failed to update calendar entry" });
    }
  });

  // Toggle task completion
  app.post("/api/tasks/:id/toggle", isAuthenticated, async (req: any, res) => {
    try {
      const taskId = parseInt(req.params.id);
      const task = await storage.getTask(taskId);
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
      const userId = req.user.claims.sub;
      if (task.ownerId !== userId) {
        return res.status(403).json({ message: "Forbidden" });
      }
      const newCompleted = !task.completed;
      const updated = await storage.updateTask(taskId, {
        completed: newCompleted,
        lastDone: newCompleted ? new Date() : null,
        streakCount: newCompleted && task.type === "habit"
          ? (task.streakCount || 0) + 1
          : task.streakCount,
      });
      res.json(updated);
    } catch (error) {
      console.error("Error toggling task:", error);
      res.status(500).json({ message: "Failed to toggle task" });
    }
  });

  // Get tasks for a specific goal
  app.get("/api/goals/:goalId/tasks", isAuthenticated, async (req: any, res) => {
    try {
      const goalId = parseInt(req.params.goalId);
      const goal = await storage.getGoal(goalId);
      if (!goal) {
        return res.status(404).json({ message: "Goal not found" });
      }
      const userId = req.user.claims.sub;
      if (goal.ownerId !== userId) {
        return res.status(403).json({ message: "Forbidden" });
      }
      const tasks = await storage.getTasksByGoal(goalId);
      res.json(tasks);
    } catch (error) {
      console.error("Error fetching goal tasks:", error);
      res.status(500).json({ message: "Failed to fetch tasks" });
    }
  });

  // AI Goal Generation
  app.post("/api/ai/goals", isAuthenticated, async (req: any, res) => {
    try {
      const { prompt } = req.body;
      if (!prompt || typeof prompt !== "string") {
        return res.status(400).json({ message: "Prompt is required" });
      }

      // Use Replit AI Integration credentials
      const openai = new OpenAI({
        apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
        baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
      });

      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are an expert goal-setting coach. Generate 2-4 SMART goals based on the user's vision or request.
            
For each goal, provide:
- id: A unique short string (e.g., "goal-1")
- title: A clear, actionable goal title
- description: A brief explanation of the goal
- category: One of: career, health, finance, relationships, personal, travel, education
- targetDate: ISO date string (YYYY-MM-DD) for a realistic target date
- milestones: Array of 3-5 milestone strings
- dailyHabits: Array of 1-2 daily habits that support this goal

Respond with valid JSON array only. No markdown, no explanation.`
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        max_tokens: 2000,
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) {
        return res.status(500).json({ message: "No response from AI" });
      }

      const parsed = JSON.parse(content);
      const goals = parsed.goals || parsed;
      
      res.json({ goals: Array.isArray(goals) ? goals : [goals] });
    } catch (error) {
      console.error("Error generating AI goals:", error);
      res.status(500).json({ message: "Failed to generate goals" });
    }
  });

  // AI Weekly Coach - Generate personalized weekly summary
  app.post("/api/ai/weekly-summary", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Gather user's progress data
      const [goals, tasks, calendarEntries] = await Promise.all([
        storage.getGoals(userId),
        storage.getTasks(userId),
        storage.getCalendarEntries(userId),
      ]);

      // Calculate metrics
      const completedTasks = tasks.filter(t => t.completed).length;
      const totalTasks = tasks.length;
      const habits = tasks.filter(t => t.type === "habit");
      const activeStreaks = habits.filter(h => (h.streakCount || 0) > 0);
      const maxStreak = Math.max(...habits.map(h => h.streakCount || 0), 0);
      const achievedGoals = goals.filter(g => g.status === "achieved").length;
      const inProgressGoals = goals.filter(g => g.status === "in_progress").length;

      // Recent check-ins (last 7 days)
      const today = new Date();
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);
      const recentEntries = calendarEntries.filter(e => {
        const entryDate = new Date(e.date);
        return entryDate >= weekAgo && entryDate <= today;
      });
      const completedCheckIns = recentEntries.filter(e => e.done).length;

      // Build context for AI
      const progressContext = {
        totalGoals: goals.length,
        achievedGoals,
        inProgressGoals,
        totalTasks,
        completedTasks,
        totalHabits: habits.length,
        activeStreaks: activeStreaks.length,
        maxStreak,
        weeklyCheckIns: completedCheckIns,
        goalTitles: goals.map(g => g.title),
        habitTitles: habits.map(h => h.title),
      };

      // Use Replit AI Integration credentials
      const openai = new OpenAI({
        apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
        baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
      });

      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are a supportive and motivating personal coach. Analyze the user's progress data and provide a personalized weekly summary.

Be encouraging but realistic. Celebrate wins, identify areas for improvement, and provide actionable recommendations.

Respond with valid JSON only:
{
  "summary": "A 2-3 sentence personalized overview of their week",
  "highlights": ["Array of 2-3 specific achievements or positive observations"],
  "focusAreas": ["Array of 1-2 areas that need attention"],
  "recommendations": ["Array of 2-3 specific, actionable suggestions for next week"],
  "motivationalMessage": "A brief encouraging message"
}`
          },
          {
            role: "user",
            content: `Here is the user's progress data: ${JSON.stringify(progressContext)}`
          }
        ],
        response_format: { type: "json_object" },
        max_tokens: 1000,
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) {
        return res.status(500).json({ message: "No response from AI" });
      }

      const parsed = JSON.parse(content);

      // Calculate week start date (Monday)
      const weekStart = new Date(today);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1);
      const weekStartDate = weekStart.toISOString().split("T")[0];

      // Ensure arrays are properly formatted
      const highlights = Array.isArray(parsed.highlights) ? parsed.highlights : [];
      const focusAreas = Array.isArray(parsed.focusAreas) ? parsed.focusAreas : [];
      const recommendations = Array.isArray(parsed.recommendations) ? parsed.recommendations : [];
      const motivationalMessage = typeof parsed.motivationalMessage === "string" ? parsed.motivationalMessage : "";

      // Save the summary with motivationalMessage
      const savedSummary = await storage.createWeeklySummary({
        userId,
        weekStartDate,
        summary: parsed.summary || "",
        highlights,
        recommendations,
        focusAreas,
        metrics: progressContext,
        motivationalMessage,
      });

      res.json(savedSummary);
    } catch (error) {
      console.error("Error generating weekly summary:", error);
      res.status(500).json({ message: "Failed to generate weekly summary" });
    }
  });

  // Get all weekly summaries for the user
  app.get("/api/weekly-summaries", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const summaries = await storage.getWeeklySummaries(userId);
      res.json(summaries);
    } catch (error) {
      console.error("Error fetching weekly summaries:", error);
      res.status(500).json({ message: "Failed to fetch summaries" });
    }
  });

  // ==================== GAMIFICATION ROUTES ====================

  // Get user's XP and level
  app.get("/api/gamification/xp", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      let xp = await storage.getUserXp(userId);
      if (!xp) {
        xp = await storage.upsertUserXp({
          userId,
          totalXp: 0,
          level: 1,
          currentLevelXp: 0,
          xpToNextLevel: 100,
        });
      }
      res.json(xp);
    } catch (error) {
      console.error("Error fetching user XP:", error);
      res.status(500).json({ message: "Failed to fetch XP" });
    }
  });

  // Add XP to user
  app.post("/api/gamification/xp/add", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { amount, reason } = req.body;
      if (!amount || typeof amount !== "number" || amount <= 0) {
        return res.status(400).json({ message: "Valid positive amount is required" });
      }
      const xp = await storage.addXp(userId, amount);
      res.json({ ...xp, xpAdded: amount, reason });
    } catch (error) {
      console.error("Error adding XP:", error);
      res.status(500).json({ message: "Failed to add XP" });
    }
  });

  // Get leaderboard (authenticated to protect user data)
  app.get("/api/gamification/leaderboard", isAuthenticated, async (req: any, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const leaderboard = await storage.getLeaderboard(Math.min(limit, 50));
      res.json(leaderboard);
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
      res.status(500).json({ message: "Failed to fetch leaderboard" });
    }
  });

  // Get all badges (authenticated)
  app.get("/api/gamification/badges", isAuthenticated, async (req: any, res) => {
    try {
      const allBadges = await storage.getBadges();
      res.json(allBadges);
    } catch (error) {
      console.error("Error fetching badges:", error);
      res.status(500).json({ message: "Failed to fetch badges" });
    }
  });

  // Get user's earned badges
  app.get("/api/gamification/badges/user", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const badges = await storage.getUserBadges(userId);
      res.json(badges);
    } catch (error) {
      console.error("Error fetching user badges:", error);
      res.status(500).json({ message: "Failed to fetch user badges" });
    }
  });

  // Get all achievements (authenticated)
  app.get("/api/gamification/achievements", isAuthenticated, async (req: any, res) => {
    try {
      const allAchievements = await storage.getAchievements();
      res.json(allAchievements);
    } catch (error) {
      console.error("Error fetching achievements:", error);
      res.status(500).json({ message: "Failed to fetch achievements" });
    }
  });

  // Get user's achievements with progress
  app.get("/api/gamification/achievements/user", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const achievements = await storage.getUserAchievements(userId);
      res.json(achievements);
    } catch (error) {
      console.error("Error fetching user achievements:", error);
      res.status(500).json({ message: "Failed to fetch user achievements" });
    }
  });

  // Get complete gamification profile
  app.get("/api/gamification/profile", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      let xp = await storage.getUserXp(userId);
      if (!xp) {
        xp = await storage.upsertUserXp({
          userId,
          totalXp: 0,
          level: 1,
          currentLevelXp: 0,
          xpToNextLevel: 100,
        });
      }
      
      const badges = await storage.getUserBadges(userId);
      const achievements = await storage.getUserAchievements(userId);
      const allBadges = await storage.getBadges();
      const allAchievements = await storage.getAchievements();
      
      res.json({
        xp,
        badges,
        achievements,
        allBadges,
        allAchievements,
        stats: {
          totalBadges: allBadges.length,
          earnedBadges: badges.length,
          totalAchievements: allAchievements.length,
          unlockedAchievements: achievements.filter(a => a.progress === 100).length,
        },
      });
    } catch (error) {
      console.error("Error fetching gamification profile:", error);
      res.status(500).json({ message: "Failed to fetch gamification profile" });
    }
  });

  // ==================== END GAMIFICATION ROUTES ====================

  // Object storage routes
  app.get("/public-objects/:filePath(*)", async (req, res) => {
    const filePath = req.params.filePath;
    const objectStorageService = new ObjectStorageService();
    try {
      const file = await objectStorageService.searchPublicObject(filePath);
      if (!file) {
        return res.status(404).json({ error: "File not found" });
      }
      objectStorageService.downloadObject(file, res);
    } catch (error) {
      console.error("Error searching for public object:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/objects/:objectPath(*)", isAuthenticated, async (req: any, res) => {
    const userId = req.user?.claims?.sub;
    const objectStorageService = new ObjectStorageService();
    try {
      const objectFile = await objectStorageService.getObjectEntityFile(req.path);
      const canAccess = await objectStorageService.canAccessObjectEntity({
        objectFile,
        userId: userId,
        requestedPermission: ObjectPermission.READ,
      });
      if (!canAccess) {
        return res.sendStatus(401);
      }
      objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      console.error("Error checking object access:", error);
      if (error instanceof ObjectNotFoundError) {
        return res.sendStatus(404);
      }
      return res.sendStatus(500);
    }
  });

  app.post("/api/objects/upload", isAuthenticated, async (req, res) => {
    const objectStorageService = new ObjectStorageService();
    try {
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      res.json({ uploadURL });
    } catch (error) {
      console.error("Error getting upload URL:", error);
      res.status(500).json({ error: "Failed to get upload URL" });
    }
  });

  app.put("/api/assets/upload", isAuthenticated, async (req: any, res) => {
    if (!req.body.assetURL || !req.body.boardId) {
      return res.status(400).json({ error: "assetURL and boardId are required" });
    }

    const userId = req.user?.claims?.sub;
    const boardId = parseInt(req.body.boardId);

    // Verify board ownership
    const board = await storage.getBoard(boardId);
    if (!board) {
      return res.status(404).json({ error: "Board not found" });
    }
    if (board.ownerId !== userId) {
      return res.status(403).json({ error: "Forbidden - you don't own this board" });
    }

    try {
      const objectStorageService = new ObjectStorageService();
      const objectPath = await objectStorageService.trySetObjectEntityAclPolicy(
        req.body.assetURL,
        {
          owner: userId,
          visibility: "public",
        }
      );

      const asset = await storage.createAsset({
        boardId,
        type: "image",
        url: objectPath,
        altText: req.body.altText || null,
        metadata: req.body.metadata || null,
        tags: req.body.tags || null,
        goalId: req.body.goalId || null,
      });

      res.status(200).json(asset);
    } catch (error) {
      console.error("Error uploading asset:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // ==================== JOURNAL ROUTES ====================
  
  // Get user's journal entries
  app.get("/api/journal", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const limit = parseInt(req.query.limit as string) || 50;
      const entries = await storage.getJournalEntries(userId, limit);
      res.json(entries);
    } catch (error) {
      console.error("Error fetching journal entries:", error);
      res.status(500).json({ message: "Failed to fetch journal entries" });
    }
  });

  // Get single journal entry
  app.get("/api/journal/:id", isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const entry = await storage.getJournalEntry(id);
      if (!entry) {
        return res.status(404).json({ message: "Entry not found" });
      }
      const userId = req.user.claims.sub;
      if (entry.userId !== userId) {
        return res.status(403).json({ message: "Forbidden" });
      }
      res.json(entry);
    } catch (error) {
      console.error("Error fetching journal entry:", error);
      res.status(500).json({ message: "Failed to fetch journal entry" });
    }
  });

  // Create journal entry (with optional sentiment analysis)
  app.post("/api/journal", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { title, transcript, audioUrl, duration, goalId, tags } = req.body;

      // Validate that at least transcript is provided
      if (!transcript || typeof transcript !== "string" || transcript.trim().length === 0) {
        return res.status(400).json({ message: "Transcript is required" });
      }

      // Validate tags if provided
      const validatedTags = Array.isArray(tags) ? tags.filter((t: unknown) => typeof t === "string") : null;

      // Analyze sentiment if transcript is provided
      let mood: string | undefined;
      let sentiment: string | undefined;

      if (transcript && transcript.trim().length > 10) {
        try {
          const analysisResponse = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
              {
                role: "system",
                content: `You are a sentiment analyzer. Analyze the emotional tone of the journal entry and respond with JSON:
{
  "mood": "<one of: happy, excited, grateful, calm, neutral, anxious, sad, frustrated, reflective>",
  "sentiment": "<number between -1.0 and 1.0 representing negative to positive>"
}
Be accurate and empathetic in your analysis. Only return the JSON, nothing else.`
              },
              {
                role: "user",
                content: transcript
              }
            ],
            temperature: 0.3,
            max_tokens: 100,
          });
          
          const analysisText = analysisResponse.choices[0]?.message?.content || "";
          try {
            const analysis = JSON.parse(analysisText.trim());
            mood = analysis.mood;
            sentiment = analysis.sentiment?.toString();
          } catch (parseErr) {
            console.error("Failed to parse sentiment analysis:", parseErr);
          }
        } catch (aiError) {
          console.error("Sentiment analysis failed:", aiError);
          // Continue without sentiment data
        }
      }

      const entry = await storage.createJournalEntry({
        userId,
        title: title || null,
        transcript: transcript.trim(),
        audioUrl: audioUrl || null,
        duration: typeof duration === "number" ? duration : null,
        mood: mood || null,
        sentiment: sentiment || null,
        tags: validatedTags,
        goalId: typeof goalId === "number" ? goalId : null,
        isPrivate: true,
      });

      res.status(201).json(entry);
    } catch (error) {
      console.error("Error creating journal entry:", error);
      res.status(500).json({ message: "Failed to create journal entry" });
    }
  });

  // Transcribe audio (speech-to-text using OpenAI Whisper)
  app.post("/api/journal/transcribe", isAuthenticated, async (req: any, res) => {
    try {
      const { audioUrl } = req.body;
      
      if (!audioUrl) {
        return res.status(400).json({ message: "Audio URL is required" });
      }

      // For now, return a placeholder - real implementation would fetch audio and send to Whisper
      // The frontend will use browser's Web Speech API for real-time transcription
      res.json({ 
        transcript: "", 
        message: "Use browser's Web Speech API for real-time transcription" 
      });
    } catch (error) {
      console.error("Error transcribing audio:", error);
      res.status(500).json({ message: "Failed to transcribe audio" });
    }
  });

  // Update journal entry
  app.patch("/api/journal/:id", isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const entry = await storage.getJournalEntry(id);
      if (!entry) {
        return res.status(404).json({ message: "Entry not found" });
      }
      const userId = req.user.claims.sub;
      if (entry.userId !== userId) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const { title, transcript, tags, goalId, isPrivate } = req.body;
      const updated = await storage.updateJournalEntry(id, {
        title: title !== undefined ? title : entry.title,
        transcript: transcript !== undefined ? transcript : entry.transcript,
        tags: tags !== undefined ? tags : entry.tags,
        goalId: goalId !== undefined ? goalId : entry.goalId,
        isPrivate: isPrivate !== undefined ? isPrivate : entry.isPrivate,
      });
      
      res.json(updated);
    } catch (error) {
      console.error("Error updating journal entry:", error);
      res.status(500).json({ message: "Failed to update journal entry" });
    }
  });

  // Delete journal entry
  app.delete("/api/journal/:id", isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const entry = await storage.getJournalEntry(id);
      if (!entry) {
        return res.status(404).json({ message: "Entry not found" });
      }
      const userId = req.user.claims.sub;
      if (entry.userId !== userId) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      await storage.deleteJournalEntry(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting journal entry:", error);
      res.status(500).json({ message: "Failed to delete journal entry" });
    }
  });

  // Analyze text sentiment only (for text-only entries)
  app.post("/api/journal/analyze", isAuthenticated, async (req: any, res) => {
    try {
      const { text } = req.body;
      
      if (!text || text.trim().length < 10) {
        return res.status(400).json({ message: "Text must be at least 10 characters" });
      }

      const analysisResponse = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are a sentiment analyzer. Analyze the emotional tone and respond with JSON:
{
  "mood": "<one of: happy, excited, grateful, calm, neutral, anxious, sad, frustrated, reflective>",
  "sentiment": <number between -1.0 and 1.0>,
  "insights": "<brief 1-2 sentence observation about the emotional state>"
}
Only return the JSON, nothing else.`
          },
          {
            role: "user",
            content: text
          }
        ],
        temperature: 0.3,
        max_tokens: 200,
      });

      const analysisText = analysisResponse.choices[0]?.message?.content || "";
      try {
        const analysis = JSON.parse(analysisText.trim());
        res.json(analysis);
      } catch (parseErr) {
        console.error("Failed to parse sentiment analysis:", parseErr);
        res.status(500).json({ message: "Failed to parse analysis" });
      }
    } catch (error) {
      console.error("Error analyzing text:", error);
      res.status(500).json({ message: "Failed to analyze text" });
    }
  });

  // ==================== END JOURNAL ROUTES ====================

  // Share link routes
  app.post("/api/boards/:id/share", isAuthenticated, async (req: any, res) => {
    try {
      const boardId = parseInt(req.params.id);
      const board = await storage.getBoard(boardId);
      if (!board) {
        return res.status(404).json({ message: "Board not found" });
      }
      const userId = req.user.claims.sub;
      if (board.ownerId !== userId) {
        return res.status(403).json({ message: "Forbidden" });
      }
      const token = randomBytes(32).toString("hex");
      const expiresAt = req.body.expiresAt ? new Date(req.body.expiresAt) : null;
      const link = await storage.createSharedLink({
        boardId,
        token,
        expiresAt,
      });
      res.status(201).json({ ...link, shareUrl: `/shared/${token}` });
    } catch (error) {
      console.error("Error creating share link:", error);
      res.status(500).json({ message: "Failed to create share link" });
    }
  });

  app.get("/api/shared/:token", async (req, res) => {
    try {
      const link = await storage.getSharedLink(req.params.token);
      if (!link) {
        return res.status(404).json({ message: "Link not found" });
      }
      if (link.expiresAt && new Date(link.expiresAt) < new Date()) {
        return res.status(410).json({ message: "Link expired" });
      }
      const board = await storage.getBoard(link.boardId);
      if (!board) {
        return res.status(404).json({ message: "Board not found" });
      }
      res.json(board);
    } catch (error) {
      console.error("Error fetching shared board:", error);
      res.status(500).json({ message: "Failed to fetch shared board" });
    }
  });

  return httpServer;
}
