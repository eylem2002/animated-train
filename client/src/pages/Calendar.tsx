import { useState } from "react";
import { motion } from "framer-motion";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  ChevronLeft,
  ChevronRight,
  Check,
  Flame,
  Calendar as CalendarIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { StreakCounter } from "@/components/StreakCounter";
import { ProgressRing } from "@/components/ProgressRing";
import type { Task, CalendarEntry } from "@shared/schema";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

export default function Calendar() {
  const today = new Date();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(today);

  const { data: habits, isLoading: habitsLoading } = useQuery<Task[]>({
    queryKey: ["/api/tasks", { type: "habit" }],
  });

  const { data: entries, isLoading: entriesLoading } = useQuery<CalendarEntry[]>({
    queryKey: ["/api/calendar-entries", {
      month: currentDate.getMonth() + 1,
      year: currentDate.getFullYear(),
    }],
  });

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const isToday = (day: number) => {
    return (
      today.getDate() === day &&
      today.getMonth() === month &&
      today.getFullYear() === year
    );
  };

  const isSelected = (day: number) => {
    return (
      selectedDate.getDate() === day &&
      selectedDate.getMonth() === month &&
      selectedDate.getFullYear() === year
    );
  };

  const getEntriesForDay = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return entries?.filter((e) => e.date === dateStr) || [];
  };

  const selectedDateStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, "0")}-${String(selectedDate.getDate()).padStart(2, "0")}`;
  const selectedEntries = entries?.filter((e) => e.date === selectedDateStr) || [];

  // Calculate stats
  const totalHabits = habits?.length || 0;
  const completedToday = selectedEntries.filter((e) => e.done).length;
  const completionRate = totalHabits > 0 ? (completedToday / totalHabits) * 100 : 0;

  // Get current streak (placeholder)
  const currentStreak = 7;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h1 className="text-2xl sm:text-3xl font-bold mb-1">Habit Calendar</h1>
        <p className="text-muted-foreground">
          Track your daily habits and build consistent streaks
        </p>
      </motion.div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-2"
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-4 pb-4">
              <Button variant="ghost" size="icon" onClick={prevMonth}>
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <h2 className="text-lg font-semibold">
                {MONTHS[month]} {year}
              </h2>
              <Button variant="ghost" size="icon" onClick={nextMonth}>
                <ChevronRight className="h-5 w-5" />
              </Button>
            </CardHeader>
            <CardContent>
              {/* Day headers */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {DAYS.map((day) => (
                  <div
                    key={day}
                    className="text-center text-sm font-medium text-muted-foreground py-2"
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar grid */}
              <div className="grid grid-cols-7 gap-1">
                {/* Empty cells for days before first of month */}
                {Array.from({ length: firstDay }).map((_, i) => (
                  <div key={`empty-${i}`} className="aspect-square" />
                ))}

                {/* Day cells */}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1;
                  const dayEntries = getEntriesForDay(day);
                  const allDone = dayEntries.length > 0 && dayEntries.every((e) => e.done);
                  const someDone = dayEntries.some((e) => e.done);

                  return (
                    <motion.button
                      key={day}
                      className={`aspect-square rounded-lg flex flex-col items-center justify-center relative transition-all
                        ${isSelected(day) ? "bg-primary text-primary-foreground" : "hover-elevate"}
                        ${isToday(day) && !isSelected(day) ? "ring-2 ring-primary" : ""}
                      `}
                      onClick={() => setSelectedDate(new Date(year, month, day))}
                      whileTap={{ scale: 0.95 }}
                      data-testid={`calendar-day-${day}`}
                    >
                      <span className="text-sm font-medium">{day}</span>
                      {dayEntries.length > 0 && (
                        <div className="absolute bottom-1 flex gap-0.5">
                          {allDone ? (
                            <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                          ) : someDone ? (
                            <div className="w-1.5 h-1.5 rounded-full bg-yellow-500" />
                          ) : (
                            <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50" />
                          )}
                        </div>
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Right sidebar */}
        <div className="space-y-4">
          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <ProgressRing
                    progress={completionRate}
                    size={64}
                    strokeWidth={6}
                  />
                  <div>
                    <p className="text-sm text-muted-foreground">Today's Progress</p>
                    <p className="text-xl font-bold">
                      {completedToday}/{totalHabits} habits
                    </p>
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
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
                    <Flame className="h-5 w-5 text-orange-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Current Streak</p>
                    <StreakCounter streak={currentStreak} size="lg" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Selected day habits */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4" />
                  {selectedDate.toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "short",
                    day: "numeric",
                  })}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {habitsLoading ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-10 rounded-lg" />
                    ))}
                  </div>
                ) : habits && habits.length > 0 ? (
                  <div className="space-y-2">
                    {habits.map((habit) => {
                      const entry = selectedEntries.find(
                        (e) => e.taskId === habit.id
                      );
                      const isDone = entry?.done || false;

                      return (
                        <div
                          key={habit.id}
                          className="flex items-center gap-3 p-2 rounded-lg hover-elevate"
                        >
                          <Checkbox
                            checked={isDone}
                            className="h-5 w-5"
                            data-testid={`checkbox-habit-${habit.id}`}
                          />
                          <span
                            className={`flex-1 text-sm ${
                              isDone ? "line-through text-muted-foreground" : ""
                            }`}
                          >
                            {habit.title}
                          </span>
                          {isDone && (
                            <Check className="h-4 w-4 text-green-500" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <p className="text-sm text-muted-foreground">
                      No habits to track yet.
                    </p>
                    <Button variant="link" size="sm" className="mt-2">
                      Add your first habit
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
