"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";

export type ImageAnalysis = {
  tags: string[];
  quality: {
    score: number;
    issues: string[];
    suggestions: string[];
  };
  metadata: {
    dimensions: { width: number; height: number };
    lighting: "excellent" | "good" | "poor";
    composition: number; // 0-100
    blur: boolean;
    exposure: "overexposed" | "underexposed" | "good";
  };
  roomType?: string;
  features: string[];
  colors: string[];
  accessibility?: {
    altText: string;
    description: string;
  };
};

export type ImageEnhancementSuggestions = {
  shouldCrop?: { x: number; y: number; width: number; height: number };
  brightnessAdjustment?: number;
  contrastAdjustment?: number;
  saturationAdjustment?: number;
  rotationAngle?: number;
  autoEnhance?: boolean;
};

export function useAIImageAnalyzer() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<
    Map<string, ImageAnalysis>
  >(new Map());

  const analyzeImage = useCallback(
    async (
      file: File,
      photoId: string,
      options: {
        includeEnhancement?: boolean;
        generateAltText?: boolean;
        detectRoomType?: boolean;
      } = {}
    ): Promise<ImageAnalysis> => {
      setIsAnalyzing(true);

      try {
        // Create FormData for image analysis
        const formData = new FormData();
        formData.append("image", file);
        formData.append("options", JSON.stringify(options));

        // Call AI analysis API
        const response = await fetch("/api/ai/analyze-image", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          throw new Error("Image analysis failed");
        }

        const analysis: ImageAnalysis = await response.json();

        // Store results
        setAnalysisResults((prev) => new Map(prev.set(photoId, analysis)));

        // Provide user feedback based on analysis
        if (analysis.quality.score < 60) {
          toast.warning(
            `Image quality could be improved. ${analysis.quality.suggestions[0]}`
          );
        }

        if (analysis.metadata.blur) {
          toast.error("Image appears blurry. Consider retaking the photo.");
        }

        return analysis;
      } catch (error) {
        console.error("Image analysis failed:", error);
        toast.error("Failed to analyze image. Please try again.");
        throw error;
      } finally {
        setIsAnalyzing(false);
      }
    },
    []
  );

  const getEnhancementSuggestions = useCallback(
    async (
      file: File,
      analysis: ImageAnalysis
    ): Promise<ImageEnhancementSuggestions> => {
      try {
        const response = await fetch("/api/ai/enhance-suggestions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            analysis,
            fileName: file.name,
            fileSize: file.size,
          }),
        });

        return await response.json();
      } catch (error) {
        console.error("Enhancement suggestions failed:", error);
        return {};
      }
    },
    []
  );

  const generateAutomaticTags = useCallback(
    async (
      imageAnalysis: ImageAnalysis,
      propertyType?: string
    ): Promise<string[]> => {
      const baseTags = [...imageAnalysis.tags];

      // Add room-specific tags
      if (imageAnalysis.roomType) {
        baseTags.push(imageAnalysis.roomType);
      }

      // Add feature tags
      baseTags.push(...imageAnalysis.features);

      // Add quality-based tags
      if (imageAnalysis.quality.score > 80) {
        baseTags.push("high-quality");
      }

      if (imageAnalysis.metadata.lighting === "excellent") {
        baseTags.push("well-lit");
      }

      // Property type specific tags
      if (propertyType) {
        const typeSpecificTags = await getPropertyTypeSpecificTags(
          propertyType,
          imageAnalysis
        );
        baseTags.push(...typeSpecificTags);
      }

      // Remove duplicates and return
      return [...new Set(baseTags)];
    },
    []
  );

  const batchAnalyzeImages = useCallback(
    async (
      files: { file: File; photoId: string }[],
      onProgress?: (completed: number, total: number) => void
    ) => {
      const results: Map<string, ImageAnalysis> = new Map();

      for (let i = 0; i < files.length; i++) {
        const { file, photoId } = files[i] as { file: File; photoId: string };

        try {
          const analysis = await analyzeImage(file, photoId, {
            includeEnhancement: true,
            generateAltText: true,
            detectRoomType: true,
          });

          results.set(photoId, analysis);
          onProgress?.(i + 1, files.length);

          // Small delay to prevent overwhelming the API
          await new Promise((resolve) => setTimeout(resolve, 200));
        } catch (error) {
          console.error(`Analysis failed for ${photoId}:`, error);
          onProgress?.(i + 1, files.length);
        }
      }

      return results;
    },
    [analyzeImage]
  );

  return {
    isAnalyzing,
    analysisResults,
    analyzeImage,
    getEnhancementSuggestions,
    generateAutomaticTags,
    batchAnalyzeImages,
  };
}

function getPropertyTypeSpecificTags(
  propertyType: string,
  _analysis: ImageAnalysis
): string[] {
  const typeTagMap: Record<string, string[]> = {
    apartment: ["apartment", "flat", "unit"],
    house: ["house", "home", "residential"],
    commercial: ["commercial", "business", "office"],
    land: ["land", "plot", "vacant"],
  };

  return typeTagMap[propertyType] || [];
}

// Component for displaying AI analysis results
export function AIAnalysisDisplay({
  analysis,
}: {
  photoId: string;
  analysis: ImageAnalysis;
}) {
  return (
    <div className="space-y-3 rounded-lg bg-muted/50 p-3 text-sm">
      <div className="flex items-center justify-between">
        <span className="font-medium">AI Analysis</span>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground text-xs">Quality:</span>
          <span
            className={`font-medium ${
              analysis.quality.score > 80
                ? "text-green-600"
                : analysis.quality.score > 60
                  ? "text-yellow-600"
                  : "text-red-600"
            }`}
          >
            {analysis.quality.score}/100
          </span>
        </div>
      </div>

      {analysis.roomType && (
        <div>
          <span className="text-muted-foreground text-xs">Room:</span>
          <span className="ml-2 capitalize">{analysis.roomType}</span>
        </div>
      )}

      {analysis.tags.length > 0 && (
        <div>
          <span className="text-muted-foreground text-xs">Tags:</span>
          <div className="mt-1 flex flex-wrap gap-1">
            {analysis.tags.slice(0, 5).map((tag, index) => (
              <span
                className="rounded bg-primary/10 px-2 py-1 text-xs"
                key={index.toString()}
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {analysis.quality.suggestions.length > 0 && (
        <div>
          <span className="text-muted-foreground text-xs">Suggestions:</span>
          <p className="mt-1 text-xs">{analysis.quality.suggestions[0]}</p>
        </div>
      )}
    </div>
  );
}
