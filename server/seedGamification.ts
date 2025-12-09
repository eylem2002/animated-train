import { db } from "./db";
import { badges, achievements } from "@shared/schema";

const initialBadges = [
  {
    slug: "first-board",
    name: "First Vision",
    description: "Create your first vision board",
    icon: "star",
    color: "primary",
    xpReward: 50,
    rarity: "common" as const,
    category: "boards",
  },
  {
    slug: "streak-7",
    name: "Week Warrior",
    description: "Maintain a 7-day streak",
    icon: "zap",
    color: "amber",
    xpReward: 100,
    rarity: "rare" as const,
    category: "habits",
  },
  {
    slug: "streak-30",
    name: "Monthly Master",
    description: "Maintain a 30-day streak",
    icon: "crown",
    color: "purple",
    xpReward: 500,
    rarity: "epic" as const,
    category: "habits",
  },
  {
    slug: "goal-achiever",
    name: "Goal Getter",
    description: "Complete your first goal",
    icon: "target",
    color: "green",
    xpReward: 75,
    rarity: "common" as const,
    category: "goals",
  },
  {
    slug: "task-master",
    name: "Task Master",
    description: "Complete 10 tasks",
    icon: "trophy",
    color: "blue",
    xpReward: 100,
    rarity: "rare" as const,
    category: "tasks",
  },
  {
    slug: "ai-explorer",
    name: "AI Explorer",
    description: "Generate your first AI coaching summary",
    icon: "star",
    color: "primary",
    xpReward: 50,
    rarity: "common" as const,
    category: "ai",
  },
  {
    slug: "vision-collector",
    name: "Vision Collector",
    description: "Create 5 vision boards",
    icon: "medal",
    color: "amber",
    xpReward: 200,
    rarity: "rare" as const,
    category: "boards",
  },
  {
    slug: "legend",
    name: "VisionFlow Legend",
    description: "Reach level 10",
    icon: "crown",
    color: "amber",
    xpReward: 1000,
    rarity: "legendary" as const,
    category: "general",
  },
];

const initialAchievements = [
  {
    slug: "first-steps",
    name: "First Steps",
    description: "Complete your first task",
    icon: "target",
    xpReward: 25,
    requirement: { type: "tasks_completed", count: 1 },
    tier: 1,
  },
  {
    slug: "productive-5",
    name: "Getting Productive",
    description: "Complete 5 tasks",
    icon: "target",
    xpReward: 50,
    requirement: { type: "tasks_completed", count: 5 },
    tier: 1,
  },
  {
    slug: "productive-25",
    name: "Productivity Pro",
    description: "Complete 25 tasks",
    icon: "target",
    xpReward: 150,
    requirement: { type: "tasks_completed", count: 25 },
    tier: 2,
  },
  {
    slug: "productive-100",
    name: "Task Champion",
    description: "Complete 100 tasks",
    icon: "trophy",
    xpReward: 500,
    requirement: { type: "tasks_completed", count: 100 },
    tier: 3,
  },
  {
    slug: "goal-setter",
    name: "Goal Setter",
    description: "Set your first goal",
    icon: "star",
    xpReward: 25,
    requirement: { type: "goals_completed", count: 1 },
    tier: 1,
  },
  {
    slug: "visionary-1",
    name: "Visionary",
    description: "Create your first vision board",
    icon: "star",
    xpReward: 25,
    requirement: { type: "boards_created", count: 1 },
    tier: 1,
  },
  {
    slug: "visionary-5",
    name: "Dream Builder",
    description: "Create 5 vision boards",
    icon: "star",
    xpReward: 100,
    requirement: { type: "boards_created", count: 5 },
    tier: 2,
  },
  {
    slug: "streak-3",
    name: "Consistency Starter",
    description: "Maintain a 3-day streak",
    icon: "zap",
    xpReward: 50,
    requirement: { type: "streak", count: 3 },
    tier: 1,
  },
  {
    slug: "streak-7",
    name: "Week Warrior",
    description: "Maintain a 7-day streak",
    icon: "zap",
    xpReward: 100,
    requirement: { type: "streak", count: 7 },
    tier: 2,
  },
  {
    slug: "streak-30",
    name: "Monthly Master",
    description: "Maintain a 30-day streak",
    icon: "crown",
    xpReward: 300,
    requirement: { type: "streak", count: 30 },
    tier: 3,
  },
];

export async function seedGamification() {
  try {
    for (const badge of initialBadges) {
      await db
        .insert(badges)
        .values(badge)
        .onConflictDoNothing({ target: badges.slug });
    }
    console.log(`Seeded ${initialBadges.length} badges`);

    for (const achievement of initialAchievements) {
      await db
        .insert(achievements)
        .values(achievement)
        .onConflictDoNothing({ target: achievements.slug });
    }
    console.log(`Seeded ${initialAchievements.length} achievements`);

    return true;
  } catch (error) {
    console.error("Error seeding gamification data:", error);
    return false;
  }
}
