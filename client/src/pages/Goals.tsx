import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Plus,
  Target,
  Sparkles,
  Search,
  Filter,
  ChevronDown,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { GoalCard } from "@/components/GoalCard";
import { TaskItem } from "@/components/TaskItem";
import { AIGoalModal } from "@/components/AIGoalModal";
import { ProgressRing } from "@/components/ProgressRing";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Goal, Task } from "@shared/schema";

const categories = [
  { value: "all", label: "All Categories" },
  { value: "career", label: "Career" },
  { value: "health", label: "Health" },
  { value: "finance", label: "Finance" },
  { value: "relationships", label: "Relationships" },
  { value: "personal", label: "Personal" },
  { value: "travel", label: "Travel" },
  { value: "education", label: "Education" },
];

const statuses = [
  { value: "all", label: "All Status" },
  { value: "planned", label: "Planned" },
  { value: "in_progress", label: "In Progress" },
  { value: "achieved", label: "Achieved" },
  { value: "stalled", label: "Stalled" },
];

export default function Goals() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showAIModal, setShowAIModal] = useState(false);
  const [expandedGoalId, setExpandedGoalId] = useState<number | null>(null);

  const { data: goals, isLoading } = useQuery<Goal[]>({
    queryKey: ["/api/goals"],
  });

  const { data: tasks } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
  });

  const toggleTaskMutation = useMutation({
    mutationFn: async (taskId: number) => {
      const response = await apiRequest("POST", `/api/tasks/${taskId}/toggle`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
    },
    onError: () => {
      toast({ title: "Failed to update task", variant: "destructive" });
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: async (taskId: number) => {
      await apiRequest("DELETE", `/api/tasks/${taskId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      toast({ title: "Task deleted" });
    },
    onError: () => {
      toast({ title: "Failed to delete task", variant: "destructive" });
    },
  });

  const createGoalMutation = useMutation({
    mutationFn: async (goal: { title: string; description: string; category: string; targetDate: string }) => {
      const response = await apiRequest("POST", "/api/goals", {
        title: goal.title,
        description: goal.description,
        category: goal.category,
        targetDate: goal.targetDate,
        status: "planned",
        progress: "0",
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/goals"] });
    },
  });

  const filteredGoals = goals?.filter((goal) => {
    const matchesSearch = goal.title
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesCategory =
      categoryFilter === "all" || goal.category === categoryFilter;
    const matchesStatus =
      statusFilter === "all" || goal.status === statusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const totalGoals = goals?.length || 0;
  const achievedGoals = goals?.filter((g) => g.status === "achieved").length || 0;
  const inProgressGoals = goals?.filter((g) => g.status === "in_progress").length || 0;
  const overallProgress = totalGoals > 0 ? (achievedGoals / totalGoals) * 100 : 0;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">My Goals</h1>
          <p className="text-muted-foreground">
            Track and achieve your SMART goals
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => setShowAIModal(true)}>
            <Sparkles className="h-4 w-4 mr-2" />
            AI Generate
          </Button>
          <Button data-testid="button-add-goal">
            <Plus className="h-4 w-4 mr-2" />
            Add Goal
          </Button>
        </div>
      </motion.div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <ProgressRing progress={overallProgress} size={56} strokeWidth={5} />
              <div>
                <p className="text-2xl font-bold">{Math.round(overallProgress)}%</p>
                <p className="text-sm text-muted-foreground">Overall</p>
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
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                  <Target className="h-6 w-6 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{totalGoals}</p>
                  <p className="text-sm text-muted-foreground">Total Goals</p>
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
                <div className="w-12 h-12 rounded-xl bg-yellow-500/10 flex items-center justify-center">
                  <Target className="h-6 w-6 text-yellow-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{inProgressGoals}</p>
                  <p className="text-sm text-muted-foreground">In Progress</p>
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
                <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center">
                  <Check className="h-6 w-6 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{achievedGoals}</p>
                  <p className="text-sm text-muted-foreground">Achieved</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="flex flex-col sm:flex-row gap-3"
      >
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search goals..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
            data-testid="input-search-goals"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((cat) => (
              <SelectItem key={cat.value} value={cat.value}>
                {cat.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            {statuses.map((status) => (
              <SelectItem key={status.value} value={status.value}>
                {status.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </motion.div>

      {/* Goals List */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      ) : filteredGoals && filteredGoals.length > 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35 }}
          className="space-y-4"
        >
          {filteredGoals.map((goal, index) => {
            const goalTasks = tasks?.filter((t) => t.goalId === goal.id) || [];
            const completedTasks = goalTasks.filter((t) => t.completed).length;

            return (
              <motion.div
                key={goal.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 * index }}
              >
                <Collapsible
                  open={expandedGoalId === goal.id}
                  onOpenChange={(open) =>
                    setExpandedGoalId(open ? goal.id : null)
                  }
                >
                  <Card>
                    <CollapsibleTrigger asChild>
                      <CardContent className="p-4 cursor-pointer">
                        <div className="flex items-center gap-4">
                          <ProgressRing
                            progress={Number(goal.progress) || 0}
                            size={64}
                            strokeWidth={6}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold truncate">
                                {goal.title}
                              </h3>
                              <ChevronDown
                                className={`h-4 w-4 transition-transform ${
                                  expandedGoalId === goal.id ? "rotate-180" : ""
                                }`}
                              />
                            </div>
                            {goal.description && (
                              <p className="text-sm text-muted-foreground line-clamp-1">
                                {goal.description}
                              </p>
                            )}
                            <div className="flex items-center gap-2 mt-2">
                              <Badge variant="secondary">{goal.status}</Badge>
                              {goal.category && (
                                <Badge variant="outline">{goal.category}</Badge>
                              )}
                              {goalTasks.length > 0 && (
                                <span className="text-xs text-muted-foreground">
                                  {completedTasks}/{goalTasks.length} tasks
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="px-4 pb-4 pt-0 border-t">
                        <div className="pt-4 space-y-2">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="text-sm font-medium">Tasks</h4>
                            <Button variant="ghost" size="sm">
                              <Plus className="h-3 w-3 mr-1" />
                              Add Task
                            </Button>
                          </div>
                          {goalTasks.length > 0 ? (
                            <AnimatePresence>
                              {goalTasks.map((task) => (
                                <TaskItem
                                  key={task.id}
                                  task={task}
                                  onToggle={(id) => {
                                    toggleTaskMutation.mutate(id);
                                  }}
                                  onDelete={(id) => {
                                    deleteTaskMutation.mutate(id);
                                  }}
                                />
                              ))}
                            </AnimatePresence>
                          ) : (
                            <p className="text-sm text-muted-foreground py-2">
                              No tasks yet. Add tasks to track your progress.
                            </p>
                          )}
                        </div>
                      </div>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>
              </motion.div>
            );
          })}
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="text-center py-20"
        >
          <div className="w-20 h-20 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-6">
            <Target className="h-10 w-10 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold mb-2">
            {searchQuery || categoryFilter !== "all" || statusFilter !== "all"
              ? "No goals found"
              : "No goals yet"}
          </h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            {searchQuery || categoryFilter !== "all" || statusFilter !== "all"
              ? "Try adjusting your filters"
              : "Let AI help you create actionable SMART goals"}
          </p>
          {!searchQuery &&
            categoryFilter === "all" &&
            statusFilter === "all" && (
              <Button size="lg" onClick={() => setShowAIModal(true)}>
                <Sparkles className="h-5 w-5 mr-2" />
                Generate Goals with AI
              </Button>
            )}
        </motion.div>
      )}

      <AIGoalModal
        open={showAIModal}
        onOpenChange={setShowAIModal}
        onAcceptGoals={async (generatedGoals) => {
          for (const goal of generatedGoals) {
            await createGoalMutation.mutateAsync({
              title: goal.title,
              description: goal.description,
              category: goal.category,
              targetDate: goal.targetDate,
            });
          }
          toast({ title: `Added ${generatedGoals.length} goal${generatedGoals.length !== 1 ? "s" : ""}!` });
        }}
      />
    </div>
  );
}
