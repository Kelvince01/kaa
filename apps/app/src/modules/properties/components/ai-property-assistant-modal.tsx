import { Badge } from "@kaa/ui/components/badge";
import { Button } from "@kaa/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@kaa/ui/components/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@kaa/ui/components/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@kaa/ui/components/tabs";
import { Bot, Sparkles, Zap } from "lucide-react";
import type React from "react";
import { useState } from "react";
import { toast } from "sonner";
import { AIChatAssistant } from "@/modules/ai/components/ai-assistant";
import { useAIAssistant } from "../../ai/hooks/use-ai-assistant";

type AIPropertyAssistantModalProps = {
  propertyData?: any;
  onApplyDescription?: (description: string) => void;
  onApplyPricing?: (pricing: number) => void;
  onApplyValuation?: (valuation: any) => void;
  children?: React.ReactNode;
};

export function AIPropertyAssistantModal({
  propertyData,
  onApplyPricing,
  onApplyValuation,
  children,
}: AIPropertyAssistantModalProps) {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("chat");

  const {
    performValuation,
    fetchMarketInsights,
    analyzePropertyImage,
    processDocument,
    checkLegalCompliance,
    isPerformingValuation,
    isAnalyzingImage,
    isProcessingDocument,
    isCheckingCompliance,
    valuation,
    imageAnalysis,
    documentAnalysis,
    complianceCheck,
  } = useAIAssistant(propertyData);

  const handleQuickValuation = async () => {
    if (!propertyData) {
      toast.error("Property data is required for valuation");
      return;
    }

    try {
      const result = await performValuation({
        location: {
          lat: propertyData.location?.coordinates?.[1] || 0,
          lng: propertyData.location?.coordinates?.[0] || 0,
          county: propertyData.location?.county || "",
          city: propertyData.location?.city || "",
        },
        physical: {
          bedrooms: propertyData.details?.bedrooms || 1,
          bathrooms: propertyData.details?.bathrooms || 1,
          size: propertyData.details?.size || 50,
          age: propertyData.details?.age,
        },
        features: propertyData.amenities || [],
        condition: propertyData.condition || "good",
      });

      if (onApplyValuation) {
        onApplyValuation(result);
      }
    } catch (error) {
      console.error("Valuation failed:", error);
    }
  };

  const handleImageAnalysis = async (file: File) => {
    try {
      const analysis = await analyzePropertyImage({
        file,
        context: propertyData,
      });

      toast.success("Property image analyzed successfully!");

      // You can display the analysis results or apply them to the property form
      console.log("Image Analysis:", analysis);
    } catch (error) {
      console.error("Image analysis failed:", error);
    }
  };

  const handleActionTrigger = async (action: string, _data?: any) => {
    switch (action) {
      case "quick_valuation":
        await handleQuickValuation();
        break;
      case "analyze_property":
        if (propertyData) {
          // Trigger comprehensive property analysis
          toast.info("Starting comprehensive property analysis...");

          // You could chain multiple AI operations here
          await handleQuickValuation();

          if (propertyData.documents?.length > 0) {
            // Process any available documents
            console.log("Processing property documents...");
          }
        }
        break;
      case "suggest_pricing":
        if (valuation?.valuationRange?.most_likely) {
          onApplyPricing?.(valuation.valuationRange.most_likely);
          toast.success("Pricing suggestion applied!");
        }
        break;
      default:
        break;
    }
  };

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogTrigger asChild>
        {children || (
          <Button className="bg-emerald-600 text-white hover:bg-emerald-700">
            <Bot className="mr-2 h-4 w-4" />
            AI Assistant
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="h-[90vh] max-w-6xl p-0">
        <div className="flex h-full">
          {/* Main Chat Area */}
          <div className="flex-1">
            <DialogHeader className="border-gray-200 border-b p-6 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <DialogTitle className="font-semibold text-emerald-900 text-xl">
                    AI Property Assistant
                  </DialogTitle>
                  <DialogDescription className="text-emerald-600">
                    Get intelligent assistance with property analysis, pricing,
                    and market insights
                  </DialogDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    className="border-emerald-300 text-emerald-700"
                    variant="outline"
                  >
                    <Sparkles className="mr-1 h-3 w-3" />
                    Enhanced AI
                  </Badge>
                </div>
              </div>
            </DialogHeader>

            <Tabs
              className="flex h-full flex-col"
              onValueChange={setActiveTab}
              value={activeTab}
            >
              <TabsList className="m-4 mb-0 grid w-full grid-cols-3">
                <TabsTrigger value="chat">AI Chat</TabsTrigger>
                <TabsTrigger value="analysis">Analysis Tools</TabsTrigger>
                <TabsTrigger value="results">Results</TabsTrigger>
              </TabsList>

              <TabsContent className="m-0 flex-1 p-4" value="chat">
                <AIChatAssistant
                  contextualSuggestions={true}
                  onActionTrigger={handleActionTrigger}
                  propertyContext={propertyData}
                />
              </TabsContent>

              <TabsContent
                className="m-0 flex-1 space-y-4 p-4"
                value="analysis"
              >
                <div className="grid grid-cols-2 gap-4">
                  {/* Quick Valuation */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Quick Valuation</CardTitle>
                      <CardDescription>
                        Get an AI-powered property valuation estimate
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button
                        className="w-full"
                        disabled={isPerformingValuation || !propertyData}
                        onClick={handleQuickValuation}
                      >
                        {isPerformingValuation ? (
                          <>Processing...</>
                        ) : (
                          <>
                            <Zap className="mr-2 h-4 w-4" />
                            Get Valuation
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Image Analysis */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Image Analysis</CardTitle>
                      <CardDescription>
                        Analyze property images with AI vision
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <input
                        accept="image/*"
                        className="w-full text-sm file:mr-4 file:rounded-lg file:border-0 file:bg-emerald-50 file:px-4 file:py-2 file:text-emerald-700 hover:file:bg-emerald-100"
                        disabled={isAnalyzingImage}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleImageAnalysis(file);
                        }}
                        type="file"
                      />
                    </CardContent>
                  </Card>

                  {/* Legal Compliance */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">
                        Legal Compliance
                      </CardTitle>
                      <CardDescription>
                        Check legal compliance for property transactions
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button
                        className="w-full"
                        disabled={isCheckingCompliance || !propertyData}
                        onClick={() =>
                          propertyData && checkLegalCompliance(propertyData)
                        }
                        variant="outline"
                      >
                        {isCheckingCompliance
                          ? "Checking..."
                          : "Check Compliance"}
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Market Insights */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Market Insights</CardTitle>
                      <CardDescription>
                        Get current market data and trends
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button
                        className="w-full"
                        disabled={!propertyData?.location?.city}
                        onClick={() => {
                          if (propertyData?.location?.city) {
                            fetchMarketInsights(
                              `${propertyData.location.city}, ${propertyData.location.county || ""}`
                            );
                          } else {
                            toast.error("Property location is required");
                          }
                        }}
                        variant="outline"
                      >
                        Get Market Data
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent className="m-0 flex-1 space-y-4 p-4" value="results">
                <div className="grid gap-4">
                  {/* Valuation Results */}
                  {valuation && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-green-700 text-sm">
                          Property Valuation
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-sm">
                            Estimated Value:
                          </span>
                          <span className="font-bold text-green-600 text-lg">
                            KES{" "}
                            {valuation.valuationRange?.most_likely?.toLocaleString() ||
                              "N/A"}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span>Range:</span>
                          <span>
                            {valuation.valuationRange?.min?.toLocaleString()} -{" "}
                            {valuation.valuationRange?.max?.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span>Confidence:</span>
                          <Badge variant="secondary">
                            {Math.round((valuation.confidence || 0) * 100)}%
                          </Badge>
                        </div>
                        {onApplyValuation && (
                          <Button
                            className="mt-2 w-full"
                            onClick={() => onApplyValuation(valuation)}
                            size="sm"
                          >
                            Apply Valuation
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  )}

                  {/* Image Analysis Results */}
                  {imageAnalysis && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-blue-700 text-sm">
                          Image Analysis
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="text-sm">
                          <strong>Condition:</strong> {imageAnalysis.condition}
                        </div>
                        <div className="text-sm">
                          <strong>Confidence:</strong>{" "}
                          {Math.round(imageAnalysis.aiConfidence * 100)}%
                        </div>
                        {imageAnalysis.recommendations?.length > 0 && (
                          <div className="text-sm">
                            <strong>Recommendations:</strong>
                            <ul className="mt-1 ml-4 list-disc">
                              {imageAnalysis.recommendations.map((rec, idx) => (
                                <li className="text-xs" key={idx.toString()}>
                                  {rec}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}

                  {/* Compliance Check Results */}
                  {complianceCheck && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-purple-700 text-sm">
                          Legal Compliance
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-sm">
                            Overall Score:
                          </span>
                          <Badge
                            variant={
                              complianceCheck.overallCompliance >= 80
                                ? "default"
                                : "destructive"
                            }
                          >
                            {complianceCheck.overallCompliance}%
                          </Badge>
                        </div>
                        {complianceCheck.criticalIssues?.length > 0 && (
                          <div className="text-sm">
                            <strong className="text-red-600">
                              Critical Issues:
                            </strong>
                            <ul className="mt-1 ml-4 list-disc">
                              {complianceCheck.criticalIssues
                                .slice(0, 3)
                                .map((issue: any, idx: number) => (
                                  <li className="text-xs" key={idx.toString()}>
                                    {issue.issue}
                                  </li>
                                ))}
                            </ul>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
