import { Badge } from "@kaa/ui/components/badge";
import { Button } from "@kaa/ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@kaa/ui/components/card";
import { ScrollArea } from "@kaa/ui/components/scroll-area";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@kaa/ui/components/tabs";
import { cn } from "@kaa/ui/lib/utils";
import {
  AlertTriangle,
  BarChart3,
  Calendar,
  CheckCircle,
  Clock,
  DollarSign,
  Eye,
  Info,
  Loader2,
  MapPin,
  Sparkles,
  Star,
  Target,
  TrendingDown,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useAIAssistant } from "../hooks/use-ai-assistant";
import type { PropertyFormData } from "../schema";

type PropertyInsightsWidgetProps = {
  propertyData: Partial<PropertyFormData>;
  className?: string;
};

type MarketInsight = {
  type: "pricing" | "demand" | "competition" | "location" | "timing";
  title: string;
  value: string | number;
  change?: number;
  trend?: "up" | "down" | "stable";
  description: string;
  confidence: number;
  actionable: boolean;
};

type CompetitorProperty = {
  title: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  location: string;
  similarity: number;
  advantages: string[];
  disadvantages: string[];
};

type LocationScore = {
  category: string;
  score: number;
  description: string;
  factors: string[];
};

export function PropertyInsightsWidget({
  propertyData,
  className,
}: PropertyInsightsWidgetProps) {
  const [activeTab, setActiveTab] = useState("overview");
  const [insights, setInsights] = useState<MarketInsight[]>([]);
  const [competitors, setCompetitors] = useState<CompetitorProperty[]>([]);
  const [locationScores, setLocationScores] = useState<LocationScore[]>([]);
  const [loading, setLoading] = useState(false);

  const { getMarketAnalysis, isAnalyzingMarket, marketAnalysis } =
    useAIAssistant(propertyData);

  // Generate mock insights (would be replaced with real API calls)
  // biome-ignore lint/correctness/useExhaustiveDependencies: ignore
  useEffect(() => {
    if (propertyData.location?.address.town) {
      generateInsights();
    }
  }, [propertyData.location?.address.town]);

  const generateInsights = async () => {
    setLoading(true);

    try {
      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Mock market insights
      const mockInsights: MarketInsight[] = [
        {
          type: "pricing",
          title: "Price Competitiveness",
          value: "Above Average",
          change: 12,
          trend: "up",
          description:
            "Your property is priced 12% above similar properties in the area",
          confidence: 85,
          actionable: true,
        },
        {
          type: "demand",
          title: "Market Demand",
          value: "High",
          change: 8,
          trend: "up",
          description: "Demand has increased by 8% in the last 3 months",
          confidence: 92,
          actionable: false,
        },
        {
          type: "competition",
          title: "Competition Level",
          value: "Moderate",
          change: -5,
          trend: "down",
          description:
            "15 similar properties available, down 5% from last month",
          confidence: 78,
          actionable: true,
        },
        {
          type: "location",
          title: "Location Score",
          value: "8.5/10",
          change: 0.3,
          trend: "up",
          description: "Excellent location with good transport links",
          confidence: 95,
          actionable: false,
        },
        {
          type: "timing",
          title: "Market Timing",
          value: "Favorable",
          change: 15,
          trend: "up",
          description: "Good time to list - seasonal demand is increasing",
          confidence: 82,
          actionable: true,
        },
      ];

      // Mock competitor data
      const mockCompetitors: CompetitorProperty[] = [
        {
          title: "Modern 2BR in Kilimani Heights",
          price: 85_000,
          bedrooms: 2,
          bathrooms: 2,
          location: "Kilimani",
          similarity: 89,
          advantages: ["Swimming pool", "Newer building", "Gym"],
          disadvantages: ["Smaller size", "No parking"],
        },
        {
          title: "Executive Apartment - Kileleshwa",
          price: 95_000,
          bedrooms: 2,
          bathrooms: 2,
          location: "Kileleshwa",
          similarity: 76,
          advantages: ["Garden view", "Backup generator"],
          disadvantages: ["Further from CBD", "Older fixtures"],
        },
        {
          title: "Luxury 2BR - Westlands",
          price: 110_000,
          bedrooms: 2,
          bathrooms: 3,
          location: "Westlands",
          similarity: 82,
          advantages: ["Premium location", "Rooftop terrace", "Concierge"],
          disadvantages: ["Higher price", "Traffic area"],
        },
      ];

      // Mock location scores
      const mockLocationScores: LocationScore[] = [
        {
          category: "Transport & Accessibility",
          score: 85,
          description: "Excellent public transport and road connectivity",
          factors: [
            "Near major highway",
            "Multiple matatu routes",
            "Uber/Bolt availability",
          ],
        },
        {
          category: "Amenities & Services",
          score: 78,
          description: "Good access to shopping and essential services",
          factors: [
            "Nearby shopping mall",
            "Hospitals within 5km",
            "Schools nearby",
          ],
        },
        {
          category: "Safety & Security",
          score: 82,
          description: "Safe neighborhood with good security measures",
          factors: ["Low crime rate", "Well-lit streets", "Security patrols"],
        },
        {
          category: "Investment Potential",
          score: 88,
          description: "High growth potential and rental demand",
          factors: [
            "Property appreciation",
            "Rental yield",
            "Development plans",
          ],
        },
      ];

      setInsights(mockInsights);
      setCompetitors(mockCompetitors);
      setLocationScores(mockLocationScores);
    } catch (error) {
      console.error("Failed to generate insights:", error);
    } finally {
      setLoading(false);
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case "pricing":
        return <DollarSign className="h-4 w-4" />;
      case "demand":
        return <TrendingUp className="h-4 w-4" />;
      case "competition":
        return <Users className="h-4 w-4" />;
      case "location":
        return <MapPin className="h-4 w-4" />;
      case "timing":
        return <Calendar className="h-4 w-4" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "up":
        return <TrendingUp className="h-3 w-3 text-green-500" />;
      case "down":
        return <TrendingDown className="h-3 w-3 text-red-500" />;
      default:
        return <div className="h-3 w-3 rounded-full bg-gray-400" />;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return "bg-green-500";
    if (score >= 60) return "bg-yellow-500";
    return "bg-red-500";
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="flex flex-col items-center justify-center space-y-4 py-8">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            <div className="text-center">
              <p className="font-medium">Analyzing Market Data</p>
              <p className="text-gray-500 text-sm">
                Generating insights for your property...
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!propertyData.location?.address.town) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="py-8 text-center text-gray-500">
            <BarChart3 className="mx-auto mb-2 h-8 w-8 opacity-50" />
            <p>Add location information to see market insights</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-purple-500" />
          Property Market Insights
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs onValueChange={setActiveTab} value={activeTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="competition">Competition</TabsTrigger>
            <TabsTrigger value="location">Location</TabsTrigger>
            <TabsTrigger value="recommendations">Tips</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent className="space-y-4" value="overview">
            <div className="grid gap-4">
              {insights.map((insight, index) => (
                <Card
                  className="border-l-4 border-l-blue-500"
                  key={index.toString()}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className="rounded-lg bg-blue-50 p-2">
                          {getInsightIcon(insight.type)}
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium">{insight.title}</h4>
                            {insight.change &&
                              getTrendIcon(insight.trend || "stable")}
                          </div>
                          <p className="font-semibold text-blue-600 text-lg">
                            {insight.value}
                            {insight.change && (
                              <span
                                className={cn(
                                  "ml-2 text-sm",
                                  insight.trend === "up"
                                    ? "text-green-600"
                                    : insight.trend === "down"
                                      ? "text-red-600"
                                      : "text-gray-600"
                                )}
                              >
                                ({insight.trend === "up" ? "+" : ""}
                                {insight.change}%)
                              </span>
                            )}
                          </p>
                          <p className="text-gray-600 text-sm">
                            {insight.description}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">
                          {insight.confidence}% confident
                        </Badge>
                        {insight.actionable && (
                          <Badge variant="secondary">
                            <Target className="mr-1 h-3 w-3" />
                            Actionable
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Competition Tab */}
          <TabsContent className="space-y-4" value="competition">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">Similar Properties</h3>
                <Badge variant="outline">
                  {competitors.length} competitors found
                </Badge>
              </div>

              <ScrollArea className="h-80">
                <div className="space-y-4">
                  {competitors.map((competitor, index) => (
                    <Card key={index.toString()}>
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="font-medium">
                                {competitor.title}
                              </h4>
                              <p className="text-gray-600 text-sm">
                                {competitor.location}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-lg">
                                KES {competitor.price.toLocaleString()}/month
                              </p>
                              <Badge variant="outline">
                                {competitor.similarity}% similar
                              </Badge>
                            </div>
                          </div>

                          <div className="flex items-center gap-4 text-gray-600 text-sm">
                            <span>{competitor.bedrooms} bed</span>
                            <span>{competitor.bathrooms} bath</span>
                          </div>

                          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                            {competitor.advantages.length > 0 && (
                              <div>
                                <h5 className="mb-1 font-medium text-green-600 text-sm">
                                  <CheckCircle className="mr-1 inline h-3 w-3" />
                                  Advantages
                                </h5>
                                <ul className="space-y-0.5 text-gray-600 text-xs">
                                  {competitor.advantages.map((advantage, i) => (
                                    <li key={i.toString()}>• {advantage}</li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {competitor.disadvantages.length > 0 && (
                              <div>
                                <h5 className="mb-1 font-medium text-red-600 text-sm">
                                  <AlertTriangle className="mr-1 inline h-3 w-3" />
                                  Disadvantages
                                </h5>
                                <ul className="space-y-0.5 text-gray-600 text-xs">
                                  {competitor.disadvantages.map(
                                    (disadvantage, i) => (
                                      <li key={i.toString()}>
                                        • {disadvantage}
                                      </li>
                                    )
                                  )}
                                </ul>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </TabsContent>

          {/* Location Tab */}
          <TabsContent className="space-y-4" value="location">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-blue-500" />
                <h3 className="font-medium">Location Analysis</h3>
              </div>

              <div className="grid gap-4">
                {locationScores.map((score, index) => (
                  <Card key={index.toString()}>
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">{score.category}</h4>
                          <div className="flex items-center gap-2">
                            <span
                              className={cn(
                                "font-semibold",
                                getScoreColor(score.score)
                              )}
                            >
                              {score.score}/100
                            </span>
                          </div>
                        </div>

                        <div className="h-2 w-full rounded-full bg-gray-200">
                          <div
                            className={cn(
                              "h-2 rounded-full transition-all",
                              getScoreBgColor(score.score)
                            )}
                            style={{ width: `${score.score}%` }}
                          />
                        </div>

                        <p className="text-gray-600 text-sm">
                          {score.description}
                        </p>

                        <div className="flex flex-wrap gap-1">
                          {score.factors.map((factor, i) => (
                            <Badge
                              className="text-xs"
                              key={i.toString()}
                              variant="outline"
                            >
                              {factor}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Recommendations Tab */}
          <TabsContent className="space-y-4" value="recommendations">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-orange-500" />
                <h3 className="font-medium">AI Recommendations</h3>
              </div>

              <div className="space-y-3">
                <Card className="border-l-4 border-l-green-500">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="mt-0.5 h-5 w-5 text-green-500" />
                      <div>
                        <h4 className="font-medium text-green-700">
                          Optimize Pricing
                        </h4>
                        <p className="mt-1 text-gray-600 text-sm">
                          Consider reducing price by 5-8% to match market
                          average and attract more inquiries.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-blue-500">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Info className="mt-0.5 h-5 w-5 text-blue-500" />
                      <div>
                        <h4 className="font-medium text-blue-700">
                          Highlight Unique Features
                        </h4>
                        <p className="mt-1 text-gray-600 text-sm">
                          Emphasize your property's parking space and security
                          features - these are rare in the area.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-yellow-500">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Clock className="mt-0.5 h-5 w-5 text-yellow-500" />
                      <div>
                        <h4 className="font-medium text-yellow-700">
                          Best Listing Time
                        </h4>
                        <p className="mt-1 text-gray-600 text-sm">
                          List within the next 2 weeks to take advantage of
                          seasonal demand increase.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-purple-500">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Star className="mt-0.5 h-5 w-5 text-purple-500" />
                      <div>
                        <h4 className="font-medium text-purple-700">
                          Improve Photography
                        </h4>
                        <p className="mt-1 text-gray-600 text-sm">
                          Professional photos showing natural lighting can
                          increase inquiries by up to 40%.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Button className="w-full" onClick={generateInsights}>
                <Eye className="mr-2 h-4 w-4" />
                Get More Insights
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
