import { Flame } from "lucide-react";
import { motion } from "framer-motion";

interface StreakCounterProps {
  streak: number;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function StreakCounter({ streak, className = "", size = "md" }: StreakCounterProps) {
  const sizeClasses = {
    sm: "text-sm gap-1",
    md: "text-base gap-1.5",
    lg: "text-xl gap-2",
  };

  const iconSizes = {
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-6 w-6",
  };

  return (
    <motion.div
      className={`inline-flex items-center ${sizeClasses[size]} ${className}`}
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <motion.div
        animate={streak > 0 ? { scale: [1, 1.2, 1] } : {}}
        transition={{ duration: 0.3, repeat: streak > 7 ? Infinity : 0, repeatDelay: 2 }}
      >
        <Flame
          className={`${iconSizes[size]} ${
            streak > 0 ? "text-orange-500" : "text-muted-foreground"
          }`}
        />
      </motion.div>
      <span className="font-bold tabular-nums">{streak}</span>
      <span className="text-muted-foreground">day{streak !== 1 ? "s" : ""}</span>
    </motion.div>
  );
}
