import { WeeklyCoach } from "@/components/WeeklyCoach";

export default function Coach() {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold" data-testid="text-page-title">AI Weekly Coach</h1>
        <p className="text-muted-foreground mt-1">
          Get personalized insights and recommendations based on your progress
        </p>
      </div>
      
      <WeeklyCoach />
    </div>
  );
}
