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
import { Textarea } from "@kaa/ui/components/textarea";
import { Check, Copy, Loader2, RefreshCw, Sparkles } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useGeneratePropertyDescription } from "../property.queries";
import type { Property } from "../property.type";

type AIDescriptionGeneratorProps = {
  propertyData: Partial<Property>;
  onDescriptionGenerated: (description: string) => void;
  className?: string;
};

export function AIDescriptionGenerator({
  propertyData,
  onDescriptionGenerated,
  className,
}: AIDescriptionGeneratorProps) {
  const [generatedDescription, setGeneratedDescription] = useState<string>("");
  const [isCopied, setIsCopied] = useState(false);

  const generateDescription = useGeneratePropertyDescription();

  const handleGenerate = async () => {
    try {
      const description = await generateDescription.mutateAsync(propertyData);
      setGeneratedDescription(description);
      onDescriptionGenerated(description);
      toast.success("AI description generated successfully!");
    } catch (error) {
      toast.error("Failed to generate AI description");
      console.error("Error generating description:", error);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(generatedDescription);
      setIsCopied(true);
      toast.success("Description copied to clipboard!");
      setTimeout(() => setIsCopied(false), 2000);
    } catch (error) {
      toast.error("Failed to copy description");
    }
  };

  const handleRefresh = () => {
    setGeneratedDescription("");
    generateDescription.reset();
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-purple-500" />
          AI Description Generator
        </CardTitle>
        <CardDescription>
          Generate a compelling property description using AI based on your
          property details
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Property Summary */}
        <div className="space-y-2">
          <h4 className="font-medium text-sm">Property Summary</h4>
          <div className="flex flex-wrap gap-2">
            {propertyData.type && (
              <Badge variant="secondary">{propertyData.type}</Badge>
            )}
            {propertyData.specifications?.bedrooms && (
              <Badge variant="secondary">
                {propertyData.specifications.bedrooms} Bedrooms
              </Badge>
            )}
            {propertyData.specifications?.bathrooms && (
              <Badge variant="secondary">
                {propertyData.specifications.bathrooms} Bathrooms
              </Badge>
            )}
            {propertyData.specifications?.totalArea && (
              <Badge variant="secondary">
                {propertyData.specifications.totalArea} sqm
              </Badge>
            )}
            {propertyData.pricing?.rent && (
              <Badge variant="secondary">
                KES {propertyData.pricing.rent.toLocaleString()}/month
              </Badge>
            )}
          </div>
        </div>

        {/* Generate Button */}
        <Button
          className="w-full"
          disabled={generateDescription.isPending}
          onClick={handleGenerate}
        >
          {generateDescription.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Generate AI Description
            </>
          )}
        </Button>

        {/* Generated Description */}
        {generatedDescription && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-sm">Generated Description</h4>
              <div className="flex gap-2">
                <Button
                  disabled={isCopied}
                  onClick={handleCopy}
                  size="sm"
                  variant="outline"
                >
                  {isCopied ? (
                    <>
                      <Check className="mr-1 h-3 w-3" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="mr-1 h-3 w-3" />
                      Copy
                    </>
                  )}
                </Button>
                <Button onClick={handleRefresh} size="sm" variant="outline">
                  <RefreshCw className="mr-1 h-3 w-3" />
                  Regenerate
                </Button>
              </div>
            </div>
            <Textarea
              className="min-h-[120px] resize-none"
              placeholder="AI-generated description will appear here..."
              readOnly
              value={generatedDescription}
            />
          </div>
        )}

        {/* Error State */}
        {generateDescription.isError && (
          <div className="rounded-md bg-red-50 p-3">
            <p className="text-red-600 text-sm">
              Failed to generate description. Please try again.
            </p>
          </div>
        )}

        {/* Tips */}
        <div className="rounded-md bg-blue-50 p-3">
          <h4 className="mb-2 font-medium text-blue-900 text-sm">
            💡 Tips for Better Results
          </h4>
          <ul className="space-y-1 text-blue-800 text-xs">
            <li>• Ensure all property details are filled in</li>
            <li>• Include amenities and features for richer descriptions</li>
            <li>• Add location information for context-aware generation</li>
            <li>• Use the regenerate button to get different variations</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
