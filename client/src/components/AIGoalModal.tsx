import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Loader2, Check, ChevronRight, Wand2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

interface GeneratedGoal {
  id: string;
  title: string;
  description: string;
  category: string;
  targetDate: string;
  milestones: string[];
  dailyHabits: string[];
}

interface AIGoalModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAcceptGoals?: (goals: GeneratedGoal[]) => void;
}

const suggestedPrompts = [
  "Make my 3-year career vision into 5 SMART goals",
  "Turn this board into a 30-day fitness plan",
  "Create a 12-week learning plan for web development",
  "Help me save $10,000 in the next year",
];

export function AIGoalModal({
  open,
  onOpenChange,
  onAcceptGoals,
}: AIGoalModalProps) {
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedGoals, setGeneratedGoals] = useState<GeneratedGoal[]>([]);
  const [selectedGoals, setSelectedGoals] = useState<Set<string>>(new Set());

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    
    // Simulate AI generation - will be connected to backend
    setTimeout(() => {
      setGeneratedGoals([
        {
          id: "1",
          title: "Complete Advanced React Course",
          description: "Master React patterns, hooks, and state management",
          category: "education",
          targetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
          milestones: [
            "Complete React fundamentals review",
            "Master custom hooks",
            "Build 3 practice projects",
            "Learn testing with Jest",
          ],
          dailyHabits: ["Study 1 hour of React", "Code 30 minutes daily"],
        },
        {
          id: "2",
          title: "Build Portfolio Website",
          description: "Create a stunning portfolio to showcase projects",
          category: "career",
          targetDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
          milestones: [
            "Design wireframes",
            "Set up development environment",
            "Build homepage",
            "Add project showcase section",
            "Deploy to production",
          ],
          dailyHabits: ["Work on portfolio 45 mins", "Review one portfolio example"],
        },
        {
          id: "3",
          title: "Network with 10 Industry Professionals",
          description: "Expand professional network for career opportunities",
          category: "career",
          targetDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
          milestones: [
            "Update LinkedIn profile",
            "Attend 2 virtual meetups",
            "Reach out to 5 professionals",
            "Schedule informational interviews",
          ],
          dailyHabits: ["Engage on LinkedIn 15 mins", "Send one connection request"],
        },
      ]);
      setIsGenerating(false);
    }, 2000);
  };

  const toggleGoalSelection = (goalId: string) => {
    const newSelected = new Set(selectedGoals);
    if (newSelected.has(goalId)) {
      newSelected.delete(goalId);
    } else {
      newSelected.add(goalId);
    }
    setSelectedGoals(newSelected);
  };

  const handleAccept = () => {
    const goalsToAccept = generatedGoals.filter((g) => selectedGoals.has(g.id));
    onAcceptGoals?.(goalsToAccept);
    onOpenChange(false);
    setGeneratedGoals([]);
    setSelectedGoals(new Set());
    setPrompt("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI Goal Builder
          </DialogTitle>
          <DialogDescription>
            Describe your vision and let AI generate actionable SMART goals with plans
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4">
          {generatedGoals.length === 0 ? (
            <>
              <div>
                <Textarea
                  placeholder="Describe your vision, dream, or what you want to achieve..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="min-h-[120px] resize-none"
                  data-testid="input-ai-prompt"
                />
              </div>

              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Try these prompts:</p>
                <div className="flex flex-wrap gap-2">
                  {suggestedPrompts.map((suggestion, i) => (
                    <Button
                      key={i}
                      variant="outline"
                      size="sm"
                      onClick={() => setPrompt(suggestion)}
                      className="text-xs"
                      data-testid={`button-suggestion-${i}`}
                    >
                      {suggestion}
                    </Button>
                  ))}
                </div>
              </div>

              <Button
                onClick={handleGenerate}
                disabled={!prompt.trim() || isGenerating}
                className="w-full"
                data-testid="button-generate-goals"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating Goals...
                  </>
                ) : (
                  <>
                    <Wand2 className="h-4 w-4 mr-2" />
                    Generate Goals
                  </>
                )}
              </Button>
            </>
          ) : (
            <AnimatePresence>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-3"
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">
                    Generated {generatedGoals.length} goals
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setGeneratedGoals([]);
                      setSelectedGoals(new Set());
                    }}
                  >
                    Start Over
                  </Button>
                </div>

                {generatedGoals.map((goal, index) => (
                  <motion.div
                    key={goal.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card
                      className={`p-4 cursor-pointer transition-all ${
                        selectedGoals.has(goal.id)
                          ? "ring-2 ring-primary bg-primary/5"
                          : "hover-elevate"
                      }`}
                      onClick={() => toggleGoalSelection(goal.id)}
                      data-testid={`card-generated-goal-${index}`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 ${
                            selectedGoals.has(goal.id)
                              ? "bg-primary border-primary"
                              : "border-muted-foreground/50"
                          }`}
                        >
                          {selectedGoals.has(goal.id) && (
                            <Check className="h-3 w-3 text-primary-foreground" />
                          )}
                        </div>
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium">{goal.title}</h4>
                            <Badge variant="secondary" className="text-xs">
                              {goal.category}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {goal.description}
                          </p>
                          <div className="text-xs text-muted-foreground">
                            <span className="font-medium">Target:</span>{" "}
                            {new Date(goal.targetDate).toLocaleDateString()}
                          </div>
                          <div className="pt-2 space-y-1">
                            <p className="text-xs font-medium text-muted-foreground">
                              Milestones:
                            </p>
                            <ul className="text-xs text-muted-foreground space-y-0.5">
                              {goal.milestones.slice(0, 3).map((m, i) => (
                                <li key={i} className="flex items-center gap-1">
                                  <ChevronRight className="h-3 w-3" />
                                  {m}
                                </li>
                              ))}
                              {goal.milestones.length > 3 && (
                                <li className="text-muted-foreground/70">
                                  +{goal.milestones.length - 3} more
                                </li>
                              )}
                            </ul>
                          </div>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </motion.div>
            </AnimatePresence>
          )}
        </div>

        {generatedGoals.length > 0 && (
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAccept}
              disabled={selectedGoals.size === 0}
              data-testid="button-accept-goals"
            >
              <Check className="h-4 w-4 mr-2" />
              Add {selectedGoals.size} Goal{selectedGoals.size !== 1 ? "s" : ""}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
