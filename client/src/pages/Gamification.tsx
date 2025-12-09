import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Loader2, Trophy, Star, Target, Crown, Award, Zap, TrendingUp, Medal } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { UserXp, Badge as BadgeType, Achievement, User } from "@shared/schema";

interface GamificationProfile {
  xp: UserXp;
  badges: { badge: BadgeType; earnedAt: string }[];
  achievements: { achievement: Achievement; progress: number; unlockedAt: string | null }[];
  allBadges: BadgeType[];
  allAchievements: Achievement[];
  stats: {
    totalBadges: number;
    earnedBadges: number;
    totalAchievements: number;
    unlockedAchievements: number;
  };
}

interface LeaderboardEntry extends UserXp {
  user: User;
}

const rarityColors: Record<string, string> = {
  common: "bg-slate-500/20 text-slate-600 dark:text-slate-400",
  rare: "bg-blue-500/20 text-blue-600 dark:text-blue-400",
  epic: "bg-purple-500/20 text-purple-600 dark:text-purple-400",
  legendary: "bg-amber-500/20 text-amber-600 dark:text-amber-400",
};

const iconMap: Record<string, typeof Trophy> = {
  trophy: Trophy,
  star: Star,
  target: Target,
  crown: Crown,
  award: Award,
  zap: Zap,
  medal: Medal,
};

export default function Gamification() {
  const { data: profile, isLoading: profileLoading } = useQuery<GamificationProfile>({
    queryKey: ["/api/gamification/profile"],
  });

  const { data: leaderboard, isLoading: leaderboardLoading } = useQuery<LeaderboardEntry[]>({
    queryKey: ["/api/gamification/leaderboard"],
  });

  if (profileLoading || leaderboardLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const xp = profile?.xp;
  const progressPercent = xp ? (xp.currentLevelXp / xp.xpToNextLevel) * 100 : 0;

  return (
    <div className="p-6 space-y-8 max-w-6xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <Trophy className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold">Achievements</h1>
          <p className="text-sm text-muted-foreground">Track your progress and earn rewards</p>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="bg-gradient-to-br from-primary/5 via-background to-accent/5 border-primary/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Zap className="h-5 w-5 text-primary" />
                Level {xp?.level || 1}
              </CardTitle>
              <CardDescription>
                {xp?.totalXp || 0} total XP earned
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Progress to Level {(xp?.level || 1) + 1}</span>
                  <span className="font-medium">{xp?.currentLevelXp || 0} / {xp?.xpToNextLevel || 100}</span>
                </div>
                <Progress value={progressPercent} className="h-3" data-testid="progress-xp" />
              </div>
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="text-center p-3 rounded-lg bg-muted/50">
                  <div className="text-2xl font-bold" data-testid="text-total-xp">{xp?.totalXp || 0}</div>
                  <div className="text-xs text-muted-foreground">Total XP</div>
                </div>
                <div className="text-center p-3 rounded-lg bg-muted/50">
                  <div className="text-2xl font-bold" data-testid="text-level">{xp?.level || 1}</div>
                  <div className="text-xs text-muted-foreground">Level</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Award className="h-5 w-5 text-amber-500" />
                Badges
              </CardTitle>
              <CardDescription>
                {profile?.stats.earnedBadges || 0} of {profile?.stats.totalBadges || 0} earned
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {profile?.badges && profile.badges.length > 0 ? (
                  profile.badges.slice(0, 6).map((ub) => {
                    const IconComponent = iconMap[ub.badge.icon] || Trophy;
                    return (
                      <Badge
                        key={ub.badge.id}
                        className={`${rarityColors[ub.badge.rarity]} text-xs`}
                        data-testid={`badge-${ub.badge.slug}`}
                      >
                        <IconComponent className="h-3 w-3 mr-1" />
                        {ub.badge.name}
                      </Badge>
                    );
                  })
                ) : (
                  <p className="text-sm text-muted-foreground">No badges earned yet</p>
                )}
              </div>
              {profile?.badges && profile.badges.length > 6 && (
                <p className="text-xs text-muted-foreground mt-2">
                  +{profile.badges.length - 6} more
                </p>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Target className="h-5 w-5 text-green-500" />
                Achievements
              </CardTitle>
              <CardDescription>
                {profile?.stats.unlockedAchievements || 0} of {profile?.stats.totalAchievements || 0} unlocked
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {profile?.achievements && profile.achievements.length > 0 ? (
                  profile.achievements.slice(0, 3).map((ua) => {
                    const IconComponent = iconMap[ua.achievement.icon] || Target;
                    return (
                      <div
                        key={ua.achievement.id}
                        className="flex items-center gap-2 text-sm"
                        data-testid={`achievement-${ua.achievement.id}`}
                      >
                        <IconComponent className="h-4 w-4 text-green-500" />
                        <span className="flex-1 truncate">{ua.achievement.name}</span>
                        {ua.progress === 100 && (
                          <Badge variant="secondary" className="text-xs">Complete</Badge>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <p className="text-sm text-muted-foreground">No achievements yet</p>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-amber-500" />
                Leaderboard
              </CardTitle>
              <CardDescription>Top performers this week</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <AnimatePresence>
                  {leaderboard && leaderboard.length > 0 ? (
                    leaderboard.slice(0, 5).map((entry, index) => (
                      <motion.div
                        key={entry.userId}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.2, delay: index * 0.05 }}
                        className="flex items-center gap-3 p-2 rounded-lg hover-elevate"
                        data-testid={`leaderboard-entry-${index}`}
                      >
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          index === 0 ? "bg-amber-500/20 text-amber-600" :
                          index === 1 ? "bg-slate-400/20 text-slate-600" :
                          index === 2 ? "bg-orange-400/20 text-orange-600" :
                          "bg-muted text-muted-foreground"
                        }`}>
                          {index + 1}
                        </div>
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={entry.user.profileImageUrl || undefined} />
                          <AvatarFallback>
                            {entry.user.firstName?.[0] || entry.user.email?.[0]?.toUpperCase() || "?"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {entry.user.firstName ? `${entry.user.firstName} ${entry.user.lastName || ""}`.trim() : entry.user.email?.split("@")[0]}
                          </p>
                          <p className="text-xs text-muted-foreground">Level {entry.level}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold">{entry.totalXp} XP</p>
                        </div>
                      </motion.div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No entries yet. Be the first!
                    </p>
                  )}
                </AnimatePresence>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.4 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5 text-primary" />
                All Badges
              </CardTitle>
              <CardDescription>Collect them all</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {profile?.allBadges && profile.allBadges.length > 0 ? (
                  profile.allBadges.map((badge) => {
                    const isEarned = profile.badges.some(ub => ub.badge.id === badge.id);
                    const IconComponent = iconMap[badge.icon] || Trophy;
                    return (
                      <div
                        key={badge.id}
                        className={`p-3 rounded-lg border ${isEarned ? "bg-primary/5 border-primary/20" : "bg-muted/30 border-muted opacity-50"}`}
                        data-testid={`badge-display-${badge.slug}`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <IconComponent className={`h-4 w-4 ${isEarned ? "text-primary" : "text-muted-foreground"}`} />
                          <span className="text-sm font-medium">{badge.name}</span>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2">{badge.description}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline" className={`text-xs ${rarityColors[badge.rarity]}`}>
                            {badge.rarity}
                          </Badge>
                          <span className="text-xs text-muted-foreground">+{badge.xpReward} XP</span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="col-span-2 text-center py-4">
                    <p className="text-sm text-muted-foreground">No badges available yet</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.5 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              All Achievements
            </CardTitle>
            <CardDescription>Complete challenges to unlock achievements</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {profile?.allAchievements && profile.allAchievements.length > 0 ? (
                profile.allAchievements.map((achievement) => {
                  const userAchievement = profile.achievements.find(ua => ua.achievement.id === achievement.id);
                  const isUnlocked = userAchievement?.progress === 100;
                  const progress = userAchievement?.progress || 0;
                  const IconComponent = iconMap[achievement.icon] || Target;
                  
                  return (
                    <div
                      key={achievement.id}
                      className={`p-4 rounded-lg border ${isUnlocked ? "bg-green-500/5 border-green-500/20" : "bg-muted/30 border-muted"}`}
                      data-testid={`achievement-display-${achievement.id}`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <IconComponent className={`h-5 w-5 ${isUnlocked ? "text-green-500" : "text-muted-foreground"}`} />
                        <span className="font-medium">{achievement.name}</span>
                        {isUnlocked && (
                          <Badge variant="secondary" className="ml-auto text-xs bg-green-500/20 text-green-600">
                            Unlocked
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">{achievement.description}</p>
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Progress</span>
                          <span>{progress}%</span>
                        </div>
                        <Progress value={progress} className="h-2" />
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline" className="text-xs">Tier {achievement.tier}</Badge>
                        <span className="text-xs text-muted-foreground">+{achievement.xpReward} XP</span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="col-span-full text-center py-8">
                  <Target className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">No achievements available yet</p>
                  <p className="text-sm text-muted-foreground mt-1">Check back soon for new challenges</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
