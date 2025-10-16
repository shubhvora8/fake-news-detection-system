import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Eye } from "lucide-react";
import { Trustworthiness } from "@/types/news";

interface TrustworthinessCompartmentProps {
  data: Trustworthiness;
  isLoading: boolean;
}

export const TrustworthinessCompartment = ({ data, isLoading }: TrustworthinessCompartmentProps) => {
  if (isLoading) {
    return (
      <Card className="p-6 h-full">
        <div className="flex items-center gap-2 mb-4">
          <Eye className="w-5 h-5 text-warning animate-pulse" />
          <h3 className="text-lg font-semibold">Compartment 3: Trustworthiness</h3>
        </div>
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-muted rounded"></div>
          <div className="h-20 bg-muted rounded"></div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 h-full border-l-4 border-l-warning">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Eye className="w-5 h-5 text-warning" />
          <h3 className="text-lg font-semibold">Compartment 3: Trustworthiness</h3>
        </div>
      </div>

      <div className="space-y-6">
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-sm">Bias Score</span>
            <span className="text-sm font-medium">{data.languageAnalysis.bias}%</span>
          </div>
          <Progress value={data.languageAnalysis.bias} className="h-2" />
        </div>

        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-sm">Credibility</span>
            <span className="text-sm font-medium">{data.languageAnalysis.credibilityScore}%</span>
          </div>
          <Progress value={data.languageAnalysis.credibilityScore} className="h-2" />
        </div>

        <div className="pt-4 border-t">
          <div className="flex justify-between items-center">
            <span className="font-medium">Overall Score</span>
            <span className="text-2xl font-bold text-warning">{data.overallScore}%</span>
          </div>
          <Progress value={data.overallScore} className="h-3 mt-2" />
        </div>
      </div>
    </Card>
  );
};