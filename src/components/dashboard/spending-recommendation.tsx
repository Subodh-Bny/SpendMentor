import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface SpendingInsightsProps {
  similarityScore: number;
  recommendations: string;
}

export function SpendingRecommendation({
  similarityScore,
  recommendations,
}: SpendingInsightsProps) {
  const similarityPercentage = Number((similarityScore * 100).toFixed(2));

  return (
    <Card className="w-full ">
      <CardHeader>
        <CardTitle>Spending Insights</CardTitle>
        <CardDescription>
          Based on your recent spending patterns
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">
                Similarity to Last Month
              </span>
              <span className="text-sm font-medium">
                {similarityPercentage}%
              </span>
            </div>
            <Progress value={similarityPercentage} className="w-full" />
          </div>
          <div>
            <h4 className="text-sm font-semibold mb-2">Recommendations</h4>
            <p className="text-sm text-muted-foreground">{recommendations}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
