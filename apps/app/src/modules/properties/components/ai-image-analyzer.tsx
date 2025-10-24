"use client";

import { Badge } from "@kaa/ui/components/badge";
import { Button } from "@kaa/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@kaa/ui/components/card";
import { Progress } from "@kaa/ui/components/progress";
import {
  AlertTriangle,
  Camera,
  CheckCircle,
  Eye,
  Loader2,
  Sparkles,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { ImageAnalysisResult } from "@/modules/ai";
import { useAnalyzePropertyImages } from "@/modules/ai/ai.mutations";

type AIImageAnalyzerProps = {
  images: File[];
  onAnalysisComplete: (result: ImageAnalysisResult) => void;
  className?: string;
};

export function AIImageAnalyzer({
  images,
  onAnalysisComplete,
  className,
}: AIImageAnalyzerProps) {
  const [analysisResult, setAnalysisResult] =
    useState<ImageAnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const analyzeImages = useAnalyzePropertyImages();

  const handleAnalyze = async () => {
    if (images.length === 0) {
      toast.error("Please select images to analyze");
      return;
    }

    setIsAnalyzing(true);
    try {
      const result = await analyzeImages.mutateAsync(images);
      setAnalysisResult(result);
      onAnalysisComplete(result);
      toast.success("Image analysis completed successfully!");
    } catch (error) {
      toast.error("Failed to analyze images");
      console.error("Error analyzing images:", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getQualityColor = (quality: string) => {
    switch (quality) {
      case "excellent":
        return "bg-green-100 text-green-800";
      case "good":
        return "bg-blue-100 text-blue-800";
      case "fair":
        return "bg-yellow-100 text-yellow-800";
      case "poor":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getQualityIcon = (quality: string) => {
    switch (quality) {
      case "excellent":
        return <CheckCircle className="h-4 w-4" />;
      case "good":
        return <Eye className="h-4 w-4" />;
      case "fair":
        return <AlertTriangle className="h-4 w-4" />;
      case "poor":
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <Camera className="h-4 w-4" />;
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-purple-500" />
          AI Image Analysis
        </CardTitle>
        <CardDescription>
          Analyze your property images for quality, content, and optimization
          suggestions
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Image Count */}
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground text-sm">
            {images.length} image{images.length !== 1 ? "s" : ""} selected
          </span>
          <Button
            disabled={isAnalyzing || images.length === 0}
            onClick={handleAnalyze}
            size="sm"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Camera className="mr-2 h-4 w-4" />
                Analyze Images
              </>
            )}
          </Button>
        </div>

        {/* Analysis Results */}
        {analysisResult && (
          <div className="space-y-4">
            {/* Overall Quality Score */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm">
                  Overall Quality Score
                </span>
                <span className="font-bold text-sm">
                  {Math.round(analysisResult.overallQuality * 100)}%
                </span>
              </div>
              <Progress
                className="h-2"
                value={analysisResult.overallQuality * 100}
              />
            </div>

            {/* Individual Image Analysis */}
            <div className="space-y-3">
              <h4 className="font-medium text-sm">Image Analysis</h4>
              {analysisResult.images.map((image, index) => (
                <div
                  className="space-y-2 rounded-lg border p-3"
                  key={index.toString()}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">
                      Image {index + 1}
                    </span>
                    <Badge className={getQualityColor(image.quality)}>
                      {getQualityIcon(image.quality)}
                      <span className="ml-1 capitalize">{image.quality}</span>
                    </Badge>
                  </div>

                  {/* Room Type */}
                  {image.roomType && (
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground text-xs">
                        Room Type:
                      </span>
                      <Badge className="text-xs" variant="outline">
                        {image.roomType}
                      </Badge>
                    </div>
                  )}

                  {/* Tags */}
                  {image.tags.length > 0 && (
                    <div className="space-y-1">
                      <span className="text-muted-foreground text-xs">
                        Detected Features:
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {image.tags.slice(0, 5).map((tag, tagIndex) => (
                          <Badge
                            className="text-xs"
                            key={tagIndex.toString()}
                            variant="secondary"
                          >
                            {tag}
                          </Badge>
                        ))}
                        {image.tags.length > 5 && (
                          <Badge className="text-xs" variant="secondary">
                            +{image.tags.length - 5} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Issues */}
                  {image.issues && image.issues.length > 0 && (
                    <div className="space-y-1">
                      <span className="text-muted-foreground text-xs">
                        Issues:
                      </span>
                      <div className="space-y-1">
                        {image.issues.map((issue, issueIndex) => (
                          <div
                            className="flex items-center gap-2 text-red-600 text-xs"
                            key={issueIndex.toString()}
                          >
                            <AlertTriangle className="h-3 w-3" />
                            {issue}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Suggestions */}
                  {image.suggestions && image.suggestions.length > 0 && (
                    <div className="space-y-1">
                      <span className="text-muted-foreground text-xs">
                        Suggestions:
                      </span>
                      <div className="space-y-1">
                        {image.suggestions.map(
                          (suggestion, suggestionIndex) => (
                            <div
                              className="flex items-center gap-2 text-blue-600 text-xs"
                              key={suggestionIndex.toString()}
                            >
                              <CheckCircle className="h-3 w-3" />
                              {suggestion}
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Overall Recommendations */}
            {analysisResult.recommendations.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Overall Recommendations</h4>
                <div className="space-y-2">
                  {analysisResult.recommendations.map(
                    (recommendation, index) => (
                      <div
                        className="flex items-start gap-2 text-sm"
                        key={index.toString()}
                      >
                        <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
                        <span>{recommendation}</span>
                      </div>
                    )
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Error State */}
        {analyzeImages.isError && (
          <div className="rounded-md bg-red-50 p-3">
            <p className="text-red-600 text-sm">
              Failed to analyze images. Please try again.
            </p>
          </div>
        )}

        {/* Tips */}
        <div className="rounded-md bg-blue-50 p-3">
          <h4 className="mb-2 font-medium text-blue-900 text-sm">
            📸 Tips for Better Images
          </h4>
          <ul className="space-y-1 text-blue-800 text-xs">
            <li>• Use high-resolution images (minimum 1200x800 pixels)</li>
            <li>• Ensure good lighting and clear visibility</li>
            <li>• Include photos of all major rooms and features</li>
            <li>• Avoid blurry or dark images</li>
            <li>• Show the property from multiple angles</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
