import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Sparkles, Trophy, Target, Lightbulb, TrendingUp, Calendar, ArrowRight } from "lucide-react";
import { format } from "date-fns";
import type { WeeklySummary } from "@shared/schema";
import { motion, AnimatePresence } from "framer-motion";

export function WeeklyCoach() {
  const [isGenerating, setIsGenerating] = useState(false);

  const { data: summaries, isLoading } = useQuery<WeeklySummary[]>({
    queryKey: ["/api/weekly-summaries"],
  });

  const generateMutation = useMutation({
    mutationFn: async (): Promise<WeeklySummary> => {
      const res = await fetch("/api/ai/weekly-summary", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) throw new Error("Failed to generate summary");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/weekly-summaries"] });
      setIsGenerating(false);
    },
    onError: () => {
      setIsGenerating(false);
    },
  });

  const handleGenerate = () => {
    setIsGenerating(true);
    generateMutation.mutate();
  };

  const latestSummary = summaries?.[0];

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-br from-primary/5 via-background to-accent/5 border-primary/20">
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle>AI Weekly Coach</CardTitle>
                <CardDescription>Get personalized insights and recommendations</CardDescription>
              </div>
            </div>
            <Button
              onClick={handleGenerate}
              disabled={isGenerating || generateMutation.isPending}
              data-testid="button-generate-summary"
            >
              {isGenerating || generateMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate Summary
                </>
              )}
            </Button>
          </div>
        </CardHeader>

        <AnimatePresence mode="wait">
          {generateMutation.data && isGenerating === false && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <CardContent className="space-y-6">
                <div className="p-4 rounded-lg bg-primary/5 border border-primary/10">
                  <p className="text-base leading-relaxed" data-testid="text-summary">
                    {generateMutation.data.summary}
                  </p>
                  {generateMutation.data.motivationalMessage && (
                    <p className="text-sm text-muted-foreground mt-3 italic">
                      {generateMutation.data.motivationalMessage}
                    </p>
                  )}
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                      <Trophy className="h-4 w-4 text-green-500" />
                      Highlights
                    </div>
                    <ul className="space-y-2">
                      {(generateMutation.data.highlights as string[] || []).map((highlight, i) => (
                        <li key={i} className="text-sm flex items-start gap-2">
                          <span className="text-green-500 mt-0.5">+</span>
                          <span data-testid={`text-highlight-${i}`}>{highlight}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                      <Target className="h-4 w-4 text-amber-500" />
                      Focus Areas
                    </div>
                    <ul className="space-y-2">
                      {(generateMutation.data.focusAreas as string[] || []).map((area, i) => (
                        <li key={i} className="text-sm flex items-start gap-2">
                          <ArrowRight className="h-3 w-3 text-amber-500 mt-1" />
                          <span data-testid={`text-focus-${i}`}>{area}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                      <Lightbulb className="h-4 w-4 text-blue-500" />
                      Recommendations
                    </div>
                    <ul className="space-y-2">
                      {(generateMutation.data.recommendations as string[] || []).map((rec, i) => (
                        <li key={i} className="text-sm flex items-start gap-2">
                          <span className="text-blue-500 mt-0.5">-</span>
                          <span data-testid={`text-recommendation-${i}`}>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>

      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {!isLoading && summaries && summaries.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Previous Summaries
          </h3>
          <div className="grid gap-4">
            {summaries.slice(0, 4).map((summary) => (
              <Card key={summary.id} className="hover-elevate" data-testid={`card-summary-${summary.id}`}>
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="secondary" className="text-xs">
                          Week of {format(new Date(summary.weekStartDate), "MMM d, yyyy")}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {summary.summary}
                      </p>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      {summary.metrics && (
                        <div className="flex items-center gap-1">
                          <TrendingUp className="h-3 w-3" />
                          <span>{(summary.metrics as Record<string, number>).completedTasks || 0} tasks</span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {!isLoading && (!summaries || summaries.length === 0) && !generateMutation.data && (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <Sparkles className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="font-medium mb-1">No summaries yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Generate your first weekly summary to get personalized insights
            </p>
            <Button onClick={handleGenerate} disabled={isGenerating}>
              <Sparkles className="h-4 w-4 mr-2" />
              Generate Your First Summary
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
