import { motion } from "framer-motion";
import { Check, RotateCcw, Trash2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StreakCounter } from "./StreakCounter";
import type { Task } from "@shared/schema";

interface TaskItemProps {
  task: Task;
  onToggle?: (taskId: number, completed: boolean) => void;
  onDelete?: (taskId: number) => void;
}

export function TaskItem({ task, onToggle, onDelete }: TaskItemProps) {
  const isHabit = task.type === "habit";

  return (
    <motion.div
      className="group flex items-center gap-3 p-3 rounded-lg hover-elevate"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      data-testid={`task-item-${task.id}`}
    >
      <Checkbox
        checked={task.completed || false}
        onCheckedChange={(checked) => onToggle?.(task.id, checked as boolean)}
        className="h-5 w-5"
        data-testid={`checkbox-task-${task.id}`}
      />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span
            className={`text-sm ${
              task.completed ? "line-through text-muted-foreground" : ""
            }`}
          >
            {task.title}
          </span>
          {isHabit && (
            <Badge variant="outline" className="text-xs">
              <RotateCcw className="h-2.5 w-2.5 mr-1" />
              Habit
            </Badge>
          )}
        </div>
        {task.notes && (
          <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
            {task.notes}
          </p>
        )}
      </div>

      {isHabit && task.streakCount !== null && task.streakCount > 0 && (
        <StreakCounter streak={task.streakCount} size="sm" />
      )}

      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {task.completed && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="text-green-500"
          >
            <Check className="h-4 w-4" />
          </motion.div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={(e) => {
            e.stopPropagation();
            onDelete?.(task.id);
          }}
          data-testid={`button-delete-task-${task.id}`}
        >
          <Trash2 className="h-3.5 w-3.5 text-destructive" />
        </Button>
      </div>
    </motion.div>
  );
}
