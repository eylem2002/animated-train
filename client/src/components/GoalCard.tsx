import { motion } from "framer-motion";
import { Calendar, Target, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ProgressRing } from "./ProgressRing";
import type { Goal } from "@shared/schema";

interface GoalCardProps {
  goal: Goal;
  onClick?: () => void;
}

const statusColors: Record<string, string> = {
  planned: "bg-muted text-muted-foreground",
  in_progress: "bg-primary/10 text-primary",
  achieved: "bg-green-500/10 text-green-600 dark:text-green-400",
  stalled: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
};

const categoryColors: Record<string, string> = {
  career: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  health: "bg-green-500/10 text-green-600 dark:text-green-400",
  finance: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
  relationships: "bg-pink-500/10 text-pink-600 dark:text-pink-400",
  personal: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
  travel: "bg-teal-500/10 text-teal-600 dark:text-teal-400",
  education: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
};

export function GoalCard({ goal, onClick }: GoalCardProps) {
  const progress = Number(goal.progress) || 0;
  const targetDate = goal.targetDate ? new Date(goal.targetDate) : null;
  const daysLeft = targetDate
    ? Math.ceil((targetDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <motion.div
      className="group cursor-pointer p-4 rounded-xl bg-card border border-card-border hover-elevate"
      whileHover={{ scale: 1.01 }}
      transition={{ duration: 0.2 }}
      onClick={onClick}
      data-testid={`card-goal-${goal.id}`}
    >
      <div className="flex items-start gap-4">
        <ProgressRing progress={progress} size={64} strokeWidth={6} />

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 className="font-semibold text-base line-clamp-1">{goal.title}</h3>
            <ChevronRight className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
          </div>

          {goal.description && (
            <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
              {goal.description}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-2">
            <Badge className={statusColors[goal.status] || statusColors.planned}>
              {goal.status.replace("_", " ")}
            </Badge>

            {goal.category && (
              <Badge className={categoryColors[goal.category] || "bg-muted text-muted-foreground"}>
                {goal.category}
              </Badge>
            )}

            {targetDate && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                <span>
                  {daysLeft !== null && daysLeft >= 0
                    ? `${daysLeft} days left`
                    : targetDate.toLocaleDateString()}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
