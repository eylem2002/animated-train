import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import {
  Bell,
  Check,
  CheckCheck,
  X,
  AlertTriangle,
  Target,
  Calendar,
  Trophy,
  Flame,
  Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Notification, NotificationPreferences } from "@shared/schema";
import { Link } from "wouter";

interface NotificationResponse {
  notifications: Notification[];
  unreadCount: number;
}

const notificationIcons: Record<string, typeof Bell> = {
  streak_warning: Flame,
  goal_reminder: Target,
  habit_prompt: Calendar,
  achievement_unlock: Trophy,
  weekly_review: Bell,
};

const priorityColors: Record<string, string> = {
  low: "bg-muted",
  normal: "bg-primary/10",
  high: "bg-amber-500/20",
  urgent: "bg-red-500/20",
};

function NotificationItem({
  notification,
  onMarkRead,
  onDismiss,
}: {
  notification: Notification;
  onMarkRead: (id: number) => void;
  onDismiss: (id: number) => void;
}) {
  const Icon = notificationIcons[notification.type] || Bell;
  const priorityClass = priorityColors[notification.priority] || priorityColors.normal;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -100 }}
      className={`relative p-3 rounded-lg ${priorityClass} ${
        !notification.read ? "border-l-2 border-l-primary" : ""
      }`}
      data-testid={`notification-${notification.id}`}
    >
      <div className="flex gap-3">
        <div
          className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
            notification.priority === "high" || notification.priority === "urgent"
              ? "bg-amber-500/30 text-amber-600"
              : "bg-primary/20 text-primary"
          }`}
        >
          <Icon className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h4 className="font-medium text-sm truncate">{notification.title}</h4>
            <div className="flex items-center gap-1 flex-shrink-0">
              {!notification.read && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => onMarkRead(notification.id)}
                  data-testid={`button-mark-read-${notification.id}`}
                >
                  <Check className="h-3 w-3" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => onDismiss(notification.id)}
                data-testid={`button-dismiss-${notification.id}`}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
            {notification.message}
          </p>
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-muted-foreground">
              {notification.createdAt &&
                formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
            </span>
            {notification.actionUrl && (
              <Link href={notification.actionUrl}>
                <Button variant="link" size="sm" className="h-auto p-0 text-xs">
                  View
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function NotificationSettings({
  preferences,
  onUpdate,
}: {
  preferences: NotificationPreferences;
  onUpdate: (updates: Partial<NotificationPreferences>) => void;
}) {
  const settings = [
    { key: "goalReminders", label: "Goal reminders", icon: Target },
    { key: "streakWarnings", label: "Streak warnings", icon: Flame },
    { key: "habitPrompts", label: "Habit prompts", icon: Calendar },
    { key: "weeklyReviews", label: "Weekly reviews", icon: Bell },
    { key: "achievementAlerts", label: "Achievement alerts", icon: Trophy },
  ] as const;

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <span className="font-medium">Notifications</span>
        <Switch
          checked={preferences.enabled ?? true}
          onCheckedChange={(checked) => onUpdate({ enabled: checked })}
          data-testid="switch-notifications-enabled"
        />
      </div>

      <Separator />

      <div className="space-y-3">
        {settings.map(({ key, label, icon: SettingIcon }) => (
          <div key={key} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <SettingIcon className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{label}</span>
            </div>
            <Switch
              checked={(preferences[key] as boolean) ?? true}
              onCheckedChange={(checked) => onUpdate({ [key]: checked })}
              disabled={!preferences.enabled}
              data-testid={`switch-${key}`}
            />
          </div>
        ))}
      </div>

      <Separator />

      <div className="space-y-2">
        <label className="text-sm font-medium">Frequency</label>
        <div className="flex gap-2">
          {["minimal", "balanced", "frequent"].map((freq) => (
            <Button
              key={freq}
              variant={preferences.frequency === freq ? "default" : "outline"}
              size="sm"
              onClick={() => onUpdate({ frequency: freq })}
              disabled={!preferences.enabled}
              data-testid={`button-frequency-${freq}`}
            >
              {freq.charAt(0).toUpperCase() + freq.slice(1)}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}

export function NotificationCenter() {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("notifications");

  const { data, isLoading } = useQuery<NotificationResponse>({
    queryKey: ["/api/notifications"],
    refetchInterval: 60000,
  });

  const { data: preferences } = useQuery<NotificationPreferences>({
    queryKey: ["/api/notifications/preferences"],
  });

  const markReadMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("PATCH", `/api/notifications/${id}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/notifications/read-all");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      toast({ title: "All notifications marked as read" });
    },
  });

  const dismissMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/notifications/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
    },
  });

  const updatePreferencesMutation = useMutation({
    mutationFn: async (updates: Partial<NotificationPreferences>) => {
      return apiRequest("PATCH", "/api/notifications/preferences", updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/preferences"] });
      toast({ title: "Preferences updated" });
    },
  });

  const notifications = data?.notifications ?? [];
  const unreadCount = data?.unreadCount ?? 0;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          data-testid="button-notification-center"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 min-w-[20px] px-1 text-xs"
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-96 p-0"
        align="end"
        data-testid="notification-popover"
      >
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="flex items-center justify-between p-3 border-b">
            <h3 className="font-semibold">Notifications</h3>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => markAllReadMutation.mutate()}
                  disabled={markAllReadMutation.isPending}
                  data-testid="button-mark-all-read"
                >
                  <CheckCheck className="h-4 w-4 mr-1" />
                  Mark all read
                </Button>
              )}
              <TabsList className="h-8">
                <TabsTrigger value="notifications" className="h-6 px-2">
                  <Bell className="h-3 w-3" />
                </TabsTrigger>
                <TabsTrigger value="settings" className="h-6 px-2">
                  <Settings className="h-3 w-3" />
                </TabsTrigger>
              </TabsList>
            </div>
          </div>

          <TabsContent value="notifications" className="m-0">
            <ScrollArea className="h-[400px]">
              {isLoading ? (
                <div className="p-8 text-center text-muted-foreground">
                  Loading...
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-8 text-center">
                  <Bell className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-muted-foreground">No notifications</p>
                </div>
              ) : (
                <div className="p-2 space-y-2">
                  <AnimatePresence mode="popLayout">
                    {notifications.map((notification) => (
                      <NotificationItem
                        key={notification.id}
                        notification={notification}
                        onMarkRead={(id) => markReadMutation.mutate(id)}
                        onDismiss={(id) => dismissMutation.mutate(id)}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="settings" className="m-0">
            {preferences && (
              <NotificationSettings
                preferences={preferences}
                onUpdate={(updates) => updatePreferencesMutation.mutate(updates)}
              />
            )}
          </TabsContent>
        </Tabs>
      </PopoverContent>
    </Popover>
  );
}
