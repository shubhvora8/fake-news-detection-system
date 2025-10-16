import { useState } from "react";
import { NewsDetectionHeader } from "@/components/NewsDetectionHeader";
import { NewsInputForm } from "@/components/NewsInputForm";
import { AnalysisResults } from "@/components/AnalysisResults";
import { Stage1Results } from "@/components/Stage1Results";
import { NewsAnalysisService } from "@/services/newsAnalysisService";
import { Stage1Service } from "@/services/stage1Service";
import { NewsAnalysis } from "@/types/news";
import { Stage1Result } from "@/types/stage1";
import { useToast } from "@/hooks/use-toast";

const NewsVerification = () => {
  const [stage1Result, setStage1Result] = useState<Stage1Result | null>(null);
  const [analysis, setAnalysis] = useState<NewsAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleAnalyze = async (newsContent: string, sourceUrl?: string) => {
    setIsLoading(true);
    setStage1Result(null);
    setAnalysis(null);

    try {
      toast({
        title: "Stage 1: Pre-Filter",
        description: "Checking source authenticity...",
      });

      const stage1 = await Stage1Service.filterNews(newsContent, sourceUrl);
      setStage1Result(stage1);

      if (!stage1.readyForStage2) {
        toast({
          title: "Analysis Stopped",
          description: "Article did not pass initial quality filters.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      toast({
        title: "Stage 2: Full Verification",
        description: "Running comprehensive analysis...",
      });

      const result = await NewsAnalysisService.analyzeNews(newsContent, sourceUrl);
      setAnalysis(result);

      toast({
        title: "Analysis Complete",
        description: `Final Verdict: ${result.overallVerdict}`,
      });
    } catch (error) {
      console.error('Analysis failed:', error);
      toast({
        title: "Analysis Failed",
        description: "An error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <NewsDetectionHeader />
      <main className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        <section className="max-w-2xl mx-auto">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-foreground mb-2">
              Two-Stage News Verification System
            </h2>
            <p className="text-muted-foreground">
              Stage 1 pre-filters for authenticity, then Stage 2 performs comprehensive analysis
            </p>
          </div>
          <NewsInputForm onAnalyze={handleAnalyze} isLoading={isLoading} />
        </section>

        {stage1Result && (
          <section>
            <Stage1Results result={stage1Result} />
          </section>
        )}

        {stage1Result?.readyForStage2 && (
          <section>
            <AnalysisResults analysis={analysis} isLoading={isLoading} />
          </section>
        )}
      </main>
    </div>
  );
};

export default NewsVerification;