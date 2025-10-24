import { Badge } from "@kaa/ui/components/badge";
import { Button } from "@kaa/ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@kaa/ui/components/card";
import { Label } from "@kaa/ui/components/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@kaa/ui/components/select";
import { Textarea } from "@kaa/ui/components/textarea";
import { cn } from "@kaa/ui/lib/utils";
import {
  AlertCircle,
  Brain,
  CheckCircle,
  Copy,
  DollarSign,
  Lightbulb,
  RefreshCw,
  Search,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useAIAssistant } from "../hooks/use-ai-assistant";
import type { PropertyFormData } from "../schema";

type AIAssistantPanelProps = {
  propertyData: Partial<PropertyFormData>;
  onApplyDescription?: (description: string) => void;
  onApplyPricing?: (pricing: number) => void;
  className?: string;
};

export function AIAssistantPanel({
  propertyData,
  onApplyDescription,
  onApplyPricing,
  className,
}: AIAssistantPanelProps) {
  const [selectedTone, setSelectedTone] = useState<
    "professional" | "friendly" | "luxury" | "casual"
  >("professional");
  const [selectedLength, setSelectedLength] = useState<
    "short" | "medium" | "long"
  >("medium");
  const [selectedAudience, setSelectedAudience] = useState<
    "families" | "professionals" | "students" | "general"
  >("general");
  const [contentToAnalyze, setContentToAnalyze] = useState("");

  const {
    generateDescription,
    analyzeContent,
    suggestPricing,
    optimizeForSEO,
    analysis,
    isGenerating,
    isAnalyzing,
    isSuggestingPrice,
    isOptimizing,
    generatedDescription,
    pricingSuggestion,
    seoOptimization,
  } = useAIAssistant();

  const handleGenerateDescription = async () => {
    try {
      const description = await generateDescription(propertyData, {
        tone: selectedTone,
        length: selectedLength,
        targetAudience: selectedAudience,
      });

      toast.success("Description generated successfully!");
    } catch (error) {
      toast.error("Failed to generate description");
    }
  };

  const handleAnalyzeContent = async () => {
    if (!contentToAnalyze.trim()) {
      toast.error("Please enter content to analyze");
      return;
    }

    try {
      await analyzeContent(contentToAnalyze);
      toast.success("Content analyzed successfully!");
    } catch (error) {
      toast.error("Failed to analyze content");
    }
  };

  const handleSuggestPricing = async () => {
    try {
      await suggestPricing(propertyData);
      toast.success("Pricing suggestions generated!");
    } catch (error) {
      toast.error("Failed to generate pricing suggestions");
    }
  };

  const handleOptimizeSEO = async () => {
    if (!contentToAnalyze.trim()) {
      toast.error("Please enter content to optimize");
      return;
    }

    try {
      await optimizeForSEO(
        contentToAnalyze,
        propertyData.basic?.type || "apartment"
      );
      toast.success("Content optimized for SEO!");
    } catch (error) {
      toast.error("Failed to optimize content");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreVariant = (score: number) => {
    if (score >= 80) return "default";
    if (score >= 60) return "secondary";
    return "destructive";
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* AI Description Generator */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
            AI Description Generator
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <Label className="mb-2 block font-medium text-sm">Tone</Label>
              <Select
                onValueChange={(value) =>
                  setSelectedTone(
                    value as "professional" | "friendly" | "luxury" | "casual"
                  )
                }
                value={selectedTone}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="professional">Professional</SelectItem>
                  <SelectItem value="friendly">Friendly</SelectItem>
                  <SelectItem value="luxury">Luxury</SelectItem>
                  <SelectItem value="casual">Casual</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="mb-2 block font-medium text-sm">Length</Label>
              <Select
                onValueChange={(value) =>
                  setSelectedLength(value as "short" | "medium" | "long")
                }
                value={selectedLength}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="short">Short</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="long">Long</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="mb-2 block font-medium text-sm">
                Target Audience
              </Label>
              <Select
                onValueChange={(value) =>
                  setSelectedAudience(
                    value as
                      | "general"
                      | "families"
                      | "professionals"
                      | "students"
                  )
                }
                value={selectedAudience}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="families">Families</SelectItem>
                  <SelectItem value="professionals">Professionals</SelectItem>
                  <SelectItem value="students">Students</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button
            className="w-full"
            disabled={isGenerating}
            onClick={handleGenerateDescription}
          >
            {isGenerating ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Generate Description
              </>
            )}
          </Button>

          {generatedDescription && (
            <div className="rounded-lg bg-gray-50 p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="font-medium text-sm">
                  Generated Description
                </span>
                <div className="flex gap-2">
                  <Button
                    onClick={() => copyToClipboard(generatedDescription)}
                    size="sm"
                    variant="outline"
                  >
                    <Copy className="mr-1 h-3 w-3" />
                    Copy
                  </Button>
                  {onApplyDescription && (
                    <Button
                      onClick={() => onApplyDescription(generatedDescription)}
                      size="sm"
                    >
                      <CheckCircle className="mr-1 h-3 w-3" />
                      Apply
                    </Button>
                  )}
                </div>
              </div>
              <p className="text-gray-700 text-sm">{generatedDescription}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Content Analyzer */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-blue-500" />
            Content Analyzer
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            onChange={(e) => setContentToAnalyze(e.target.value)}
            placeholder="Paste your property description here to analyze..."
            rows={4}
            value={contentToAnalyze}
          />

          <div className="flex gap-2">
            <Button
              className="flex-1"
              disabled={isAnalyzing}
              onClick={handleAnalyzeContent}
              variant="outline"
            >
              {isAnalyzing ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Brain className="mr-2 h-4 w-4" />
                  Analyze Content
                </>
              )}
            </Button>

            <Button
              className="flex-1"
              disabled={isOptimizing}
              onClick={handleOptimizeSEO}
              variant="outline"
            >
              {isOptimizing ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Optimizing...
                </>
              ) : (
                <>
                  <Search className="mr-2 h-4 w-4" />
                  Optimize SEO
                </>
              )}
            </Button>
          </div>

          {analysis && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="text-center">
                  <div
                    className={cn(
                      "font-bold text-2xl",
                      getScoreColor(analysis.score)
                    )}
                  >
                    {analysis.score}%
                  </div>
                  <div className="text-gray-500 text-xs">Overall Score</div>
                </div>
                <div className="text-center">
                  <div
                    className={cn(
                      "font-bold text-2xl",
                      getScoreColor(analysis.readabilityScore)
                    )}
                  >
                    {analysis.readabilityScore}%
                  </div>
                  <div className="text-gray-500 text-xs">Readability</div>
                </div>
                <div className="text-center">
                  <div
                    className={cn(
                      "font-bold text-2xl",
                      getScoreColor(analysis.seoScore)
                    )}
                  >
                    {analysis.seoScore}%
                  </div>
                  <div className="text-gray-500 text-xs">SEO Score</div>
                </div>
              </div>

              {analysis.suggestions.length > 0 && (
                <div>
                  <h4 className="mb-2 flex items-center gap-1 font-medium text-sm">
                    <Lightbulb className="h-4 w-4" />
                    Suggestions
                  </h4>
                  <ul className="space-y-1">
                    {analysis.suggestions.map((suggestion, index) => (
                      <li
                        className="flex items-start gap-2 text-gray-600 text-sm"
                        key={index.toString()}
                      >
                        <AlertCircle className="mt-0.5 h-3 w-3 shrink-0 text-amber-500" />
                        {suggestion}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div>
                <h4 className="mb-2 font-medium text-sm">Sentiment</h4>
                <Badge variant={getScoreVariant(analysis.score)}>
                  {analysis.sentiment.charAt(0).toUpperCase() +
                    analysis.sentiment.slice(1)}
                </Badge>
              </div>
            </div>
          )}

          {seoOptimization && (
            <div className="rounded-lg bg-green-50 p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="font-medium text-green-800 text-sm">
                  SEO Optimized Content
                </span>
                <Button
                  onClick={() =>
                    copyToClipboard(seoOptimization.optimizedContent)
                  }
                  size="sm"
                  variant="outline"
                >
                  <Copy className="mr-1 h-3 w-3" />
                  Copy
                </Button>
              </div>
              <p className="mb-2 text-green-700 text-sm">
                {seoOptimization.optimizedContent}
              </p>
              <div className="text-green-600 text-xs">
                <strong>Improvements:</strong>{" "}
                {seoOptimization.improvements.join(", ")}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pricing Suggestions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-500" />
            Smart Pricing
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            className="w-full"
            disabled={isSuggestingPrice}
            onClick={handleSuggestPricing}
            variant="outline"
          >
            {isSuggestingPrice ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Analyzing Market...
              </>
            ) : (
              <>
                <DollarSign className="mr-2 h-4 w-4" />
                Get Pricing Suggestions
              </>
            )}
          </Button>

          {pricingSuggestion && (
            <div className="space-y-4">
              <div className="rounded-lg bg-blue-50 p-4 text-center">
                <div className="font-bold text-2xl text-blue-600">
                  KES {pricingSuggestion.recommendedPrice.toLocaleString()}
                </div>
                <div className="text-blue-500 text-sm">Recommended Price</div>
                <div className="mt-1 text-gray-500 text-xs">
                  Range: KES {pricingSuggestion.range.min.toLocaleString()} -
                  KES {pricingSuggestion.range.max.toLocaleString()}
                </div>
                <Badge className="mt-2" variant="secondary">
                  <Target className="mr-1 h-3 w-3" />
                  {Math.round(pricingSuggestion.confidence * 100)}% Confidence
                </Badge>
              </div>

              <div>
                <h4 className="mb-2 font-medium text-sm">Pricing Breakdown</h4>
                <ul className="space-y-1">
                  {pricingSuggestion.reasoning.map((reason, index) => (
                    <li
                      className="text-gray-600 text-sm"
                      key={index.toString()}
                    >
                      • {reason}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="mb-2 font-medium text-sm">Market Comparisons</h4>
                <div className="space-y-2">
                  {pricingSuggestion.marketComparisons.map((comp, index) => (
                    <div
                      className="flex items-center justify-between rounded bg-gray-50 p-2"
                      key={index.toString()}
                    >
                      <span className="text-sm">{comp.address}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">
                          KES {comp.price.toLocaleString()}
                        </span>
                        <Badge className="text-xs" variant="outline">
                          {Math.round(comp.similarity * 100)}% match
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {onApplyPricing && (
                <Button
                  className="w-full"
                  onClick={() =>
                    onApplyPricing(pricingSuggestion.recommendedPrice)
                  }
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Apply Recommended Price
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
