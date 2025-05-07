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
  recommendations: string[];
}

export function SpendingRecommendation({
  similarityScore,
  recommendations,
}: SpendingInsightsProps) {
  const similarityPercentage = Number((similarityScore * 100).toFixed(2));
  console.log(recommendations);
  return (
    <Card className="w-full">
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
            <ul className="space-y-2 text-sm text-muted-foreground">
              {recommendations?.map((rec, index) => (
                <li key={index} className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
