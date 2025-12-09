import { useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import {
  Plus,
  Layout,
  Target,
  TrendingUp,
  Calendar,
  Sparkles,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { BoardCard } from "@/components/BoardCard";
import { GoalCard } from "@/components/GoalCard";
import { ProgressRing } from "@/components/ProgressRing";
import { StreakCounter } from "@/components/StreakCounter";
import { AIGoalModal } from "@/components/AIGoalModal";
import type { VisionBoard, Goal } from "@shared/schema";

export default function Home() {
  const { user } = useAuth();
  const [showAIModal, setShowAIModal] = useState(false);

  const { data: boards, isLoading: boardsLoading } = useQuery<VisionBoard[]>({
    queryKey: ["/api/boards"],
  });

  const { data: goals, isLoading: goalsLoading } = useQuery<Goal[]>({
    queryKey: ["/api/goals"],
  });

  const displayName =
    user?.firstName || user?.email?.split("@")[0] || "there";

  // Calculate stats
  const totalGoals = goals?.length || 0;
  const completedGoals = goals?.filter((g) => g.status === "achieved").length || 0;
  const inProgressGoals = goals?.filter((g) => g.status === "in_progress").length || 0;
  const overallProgress = totalGoals > 0
    ? (completedGoals / totalGoals) * 100
    : 0;

  // Get current streak (placeholder - will be calculated from tasks)
  const currentStreak = 7;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {/* Welcome Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold mb-1">
            Welcome back, {displayName}!
          </h1>
          <p className="text-muted-foreground">
            Let's make progress on your vision today.
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => setShowAIModal(true)}
            data-testid="button-ai-assistant"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            AI Assistant
          </Button>
          <Link href="/boards/new">
            <Button data-testid="button-create-board">
              <Plus className="h-4 w-4 mr-2" />
              New Board
            </Button>
          </Link>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Layout className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{boards?.length || 0}</p>
                  <p className="text-sm text-muted-foreground">Vision Boards</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center">
                  <Target className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{inProgressGoals}</p>
                  <p className="text-sm text-muted-foreground">Active Goals</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <ProgressRing
                  progress={overallProgress}
                  size={48}
                  strokeWidth={5}
                  showPercentage={false}
                />
                <div>
                  <p className="text-2xl font-bold">{completedGoals}/{totalGoals}</p>
                  <p className="text-sm text-muted-foreground">Goals Done</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center">
                  <Calendar className="h-6 w-6 text-orange-500" />
                </div>
                <div>
                  <StreakCounter streak={currentStreak} size="md" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Recent Boards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4 pb-2">
            <CardTitle className="text-lg font-semibold">Recent Boards</CardTitle>
            <Link href="/boards">
              <Button variant="ghost" size="sm">
                View All
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {boardsLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-48 rounded-xl" />
                ))}
              </div>
            ) : boards && boards.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {boards.slice(0, 3).map((board) => (
                  <Link key={board.id} href={`/boards/${board.id}`}>
                    <BoardCard board={board} />
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
                  <Layout className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="font-medium mb-2">No boards yet</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Create your first vision board to get started
                </p>
                <Link href="/boards/new">
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Board
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Active Goals */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
      >
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4 pb-2">
            <CardTitle className="text-lg font-semibold">Active Goals</CardTitle>
            <Link href="/goals">
              <Button variant="ghost" size="sm">
                View All
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {goalsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-24 rounded-xl" />
                ))}
              </div>
            ) : goals && goals.length > 0 ? (
              <div className="space-y-3">
                {goals
                  .filter((g) => g.status === "in_progress" || g.status === "planned")
                  .slice(0, 4)
                  .map((goal) => (
                    <Link key={goal.id} href={`/goals/${goal.id}`}>
                      <GoalCard goal={goal} />
                    </Link>
                  ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
                  <Target className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="font-medium mb-2">No goals yet</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Let AI help you create actionable goals
                </p>
                <Button onClick={() => setShowAIModal(true)}>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate Goals with AI
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      <AIGoalModal
        open={showAIModal}
        onOpenChange={setShowAIModal}
        onAcceptGoals={(goals) => {
          console.log("Accepted goals:", goals);
          // Will be connected to API
        }}
      />
    </div>
  );
}
