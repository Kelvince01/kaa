import { Badge } from "@kaa/ui/components/badge";
import { Button } from "@kaa/ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@kaa/ui/components/card";
import { Input } from "@kaa/ui/components/input";
import { ScrollArea } from "@kaa/ui/components/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@kaa/ui/components/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@kaa/ui/components/tabs";
import { Textarea } from "@kaa/ui/components/textarea";
import { cn } from "@kaa/ui/lib/utils";
import {
  AlertCircle,
  AlertTriangle,
  BarChart3,
  Bot,
  Brain,
  CheckCircle,
  Copy,
  DollarSign,
  Eye,
  Info,
  Lightbulb,
  Loader2,
  MessageSquare,
  Send,
  Sparkles,
  TrendingUp,
  User,
  Wand2,
  Zap,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useAIAssistant } from "../hooks/use-ai-assistant";
import type { PropertyFormData } from "../schema";

type EnhancedAIAssistantPanelProps = {
  propertyData: Partial<PropertyFormData>;
  onApplyDescription?: (description: string) => void;
  onApplyPricing?: (pricing: number) => void;
  onApplyOptimization?: (field: string, value: any) => void;
  className?: string;
};

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  type?: "text" | "suggestion" | "analysis";
};

export function EnhancedAIAssistantPanel({
  propertyData,
  onApplyDescription,
  onApplyPricing,
  onApplyOptimization,
  className,
}: EnhancedAIAssistantPanelProps) {
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
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [activeTab, setActiveTab] = useState("assistant");

  const {
    generateDescription,
    analyzeContent,
    suggestPricing,
    optimizeForSEO,
    processStreamingQuery,
    getSmartSuggestions,
    validatePropertyData,
    analysis,
    isGenerating,
    isAnalyzing,
    isSuggestingPrice,
    isOptimizing,
    generatedDescription,
    pricingSuggestion,
    seoOptimization,
    streamingState,
    conversationId,
    clearConversation,
    getConversationHistory,
    // Errors
    generationError,
    analysisError,
    pricingError,
    seoError,
  } = useAIAssistant(propertyData);

  // Load conversation history on mount
  useEffect(() => {
    const history = getConversationHistory();
    setChatMessages(
      history.map((msg, index) => ({
        id: `msg-${index}`,
        role: msg.role,
        content: msg.content,
        timestamp: msg.timestamp,
        type: "text",
      }))
    );
  }, [getConversationHistory]);

  // Handle streaming updates
  useEffect(() => {
    if (streamingState.isStreaming && streamingState.streamedText) {
      setChatMessages((prev) => {
        const lastMessage = prev.at(-1);
        if (
          lastMessage &&
          lastMessage.role === "assistant" &&
          !lastMessage.content
        ) {
          // Update the last assistant message with streamed content
          return prev.map((msg, index) =>
            index === prev.length - 1
              ? { ...msg, content: streamingState.streamedText }
              : msg
          );
        }
        // Add new streaming message
        return [
          ...prev,
          {
            id: `stream-${Date.now()}`,
            role: "assistant",
            content: streamingState.streamedText,
            timestamp: new Date(),
            type: "text",
          },
        ];
      });
    }
  }, [streamingState]);

  const handleGenerateDescription = async () => {
    try {
      const description = await generateDescription(propertyData, {
        tone: selectedTone,
        length: selectedLength,
        targetAudience: selectedAudience,
      });

      // Add to chat
      addChatMessage(
        "assistant",
        `Generated description: ${description}`,
        "suggestion"
      );

      toast.success("Description generated successfully!");

      if (onApplyDescription) {
        onApplyDescription(description);
      }
    } catch (error) {
      toast.error("Failed to generate description");
      addChatMessage(
        "assistant",
        `Error generating description: ${error}`,
        "text"
      );
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

      // Add analysis results to chat
      if (analysis) {
        addChatMessage(
          "assistant",
          `Content Analysis Results:\n- Quality Score: ${analysis.score}/100\n- Sentiment: ${analysis.sentiment}\n- Readability: ${analysis.readabilityScore}/100\n- SEO Score: ${analysis.seoScore}/100\n\nSuggestions:\n${analysis.suggestions.join("\n- ")}`,
          "analysis"
        );
      }
    } catch (error) {
      toast.error("Failed to analyze content");
    }
  };

  const handleSuggestPricing = async () => {
    try {
      await suggestPricing(propertyData);
      toast.success("Pricing suggestions generated!");

      if (pricingSuggestion) {
        const message = `Pricing Recommendation:\n• Recommended Price: KES ${pricingSuggestion.recommendedPrice.toLocaleString()}\n• Range: KES ${pricingSuggestion.range.min.toLocaleString()} - ${pricingSuggestion.range.max.toLocaleString()}\n• Confidence: ${Math.round(pricingSuggestion.confidence * 100)}%\n\nReasoning:\n${pricingSuggestion.reasoning.join("\n• ")}`;

        addChatMessage("assistant", message, "analysis");

        if (onApplyPricing) {
          onApplyPricing(pricingSuggestion.recommendedPrice);
        }
      }
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

      if (seoOptimization) {
        const message = `SEO Optimization Results:\n\nOptimized Content:\n"${seoOptimization.optimizedContent}"\n\nImprovements Made:\n${seoOptimization.improvements.join("\n• ")}`;

        addChatMessage("assistant", message, "suggestion");

        if (onApplyOptimization) {
          onApplyOptimization("description", seoOptimization.optimizedContent);
        }
      }
    } catch (error) {
      toast.error("Failed to optimize content");
    }
  };

  const handleChatSubmit = async () => {
    if (!chatInput.trim()) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: chatInput,
      timestamp: new Date(),
      type: "text",
    };

    setChatMessages((prev) => [...prev, userMessage]);

    // Add placeholder for assistant response
    const assistantPlaceholder: ChatMessage = {
      id: `assistant-${Date.now()}`,
      role: "assistant",
      content: "",
      timestamp: new Date(),
      type: "text",
    };

    setChatMessages((prev) => [...prev, assistantPlaceholder]);

    const query = chatInput;
    setChatInput("");

    try {
      await processStreamingQuery(query);
    } catch (error) {
      setChatMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantPlaceholder.id
            ? { ...msg, content: `Sorry, I encountered an error: ${error}` }
            : msg
        )
      );
    }
  };

  const addChatMessage = (
    role: "user" | "assistant",
    content: string,
    type: "text" | "suggestion" | "analysis" = "text"
  ) => {
    const message: ChatMessage = {
      id: `${role}-${Date.now()}`,
      role,
      content,
      timestamp: new Date(),
      type,
    };
    setChatMessages((prev) => [...prev, message]);
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

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "error":
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case "warning":
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      default:
        return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  return (
    <div className={cn("space-y-4", className)}>
      <Tabs className="w-full" onValueChange={setActiveTab} value={activeTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger className="flex items-center gap-2" value="assistant">
            <MessageSquare className="h-4 w-4" />
            Chat
          </TabsTrigger>
          <TabsTrigger className="flex items-center gap-2" value="generation">
            <Sparkles className="h-4 w-4" />
            Generate
          </TabsTrigger>
          <TabsTrigger className="flex items-center gap-2" value="analysis">
            <Brain className="h-4 w-4" />
            Analyze
          </TabsTrigger>
          <TabsTrigger className="flex items-center gap-2" value="insights">
            <TrendingUp className="h-4 w-4" />
            Insights
          </TabsTrigger>
        </TabsList>

        {/* Chat Assistant Tab */}
        <TabsContent className="space-y-4" value="assistant">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Bot className="h-5 w-5 text-blue-500" />
                  AI Property Assistant
                </span>
                <Button
                  className="text-xs"
                  onClick={clearConversation}
                  size="sm"
                  variant="outline"
                >
                  Clear Chat
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Chat Messages */}
                <ScrollArea className="h-96 w-full rounded-lg border p-4">
                  {chatMessages.length === 0 ? (
                    <div className="py-8 text-center text-muted-foreground">
                      <Bot className="mx-auto mb-2 h-8 w-8 opacity-50" />
                      <p>Ask me anything about your property!</p>
                      <p className="mt-1 text-xs">
                        Try: "Help me optimize this description" or "What's the
                        best price range?"
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {chatMessages.map((message) => (
                        <div
                          className={cn(
                            "flex gap-3",
                            message.role === "user"
                              ? "justify-end"
                              : "justify-start"
                          )}
                          key={message.id}
                        >
                          <div
                            className={cn(
                              "max-w-[80%] rounded-lg px-3 py-2",
                              message.role === "user"
                                ? "bg-blue-500 text-white"
                                : message.type === "suggestion"
                                  ? "border border-green-200 bg-green-50 text-green-900"
                                  : message.type === "analysis"
                                    ? "border border-purple-200 bg-purple-50 text-purple-900"
                                    : "bg-gray-100 text-gray-900"
                            )}
                          >
                            <div className="flex items-start gap-2">
                              {message.role === "user" ? (
                                <User className="mt-0.5 h-4 w-4 shrink-0" />
                              ) : (
                                <Bot className="mt-0.5 h-4 w-4 shrink-0" />
                              )}
                              <div className="flex-1">
                                <pre className="whitespace-pre-wrap font-sans text-sm">
                                  {message.content}
                                </pre>
                                {message.role === "assistant" &&
                                  message.content && (
                                    <Button
                                      className="mt-1 h-6 text-xs"
                                      onClick={() =>
                                        copyToClipboard(message.content)
                                      }
                                      size="sm"
                                      variant="ghost"
                                    >
                                      <Copy className="mr-1 h-3 w-3" />
                                      Copy
                                    </Button>
                                  )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                      {streamingState.isStreaming && (
                        <div className="flex gap-3">
                          <div className="flex items-center gap-2 rounded-lg bg-gray-100 px-3 py-2">
                            <Bot className="h-4 w-4" />
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span className="text-sm">AI is thinking...</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </ScrollArea>

                {/* Chat Input */}
                <div className="flex gap-2">
                  <Input
                    disabled={streamingState.isStreaming}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        handleChatSubmit();
                      }
                    }}
                    placeholder="Ask about your property..."
                    value={chatInput}
                  />
                  <Button
                    disabled={!chatInput.trim() || streamingState.isStreaming}
                    onClick={handleChatSubmit}
                    size="sm"
                  >
                    {streamingState.isStreaming ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Generation Tab */}
        <TabsContent className="space-y-4" value="generation">
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
                  <label
                    className="mb-2 block font-medium text-sm"
                    htmlFor="tone"
                  >
                    Tone
                  </label>
                  <Select
                    onValueChange={(value) =>
                      setSelectedTone(
                        value as
                          | "professional"
                          | "friendly"
                          | "luxury"
                          | "casual"
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
                  <label
                    className="mb-2 block font-medium text-sm"
                    htmlFor="length"
                  >
                    Length
                  </label>
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
                  <label
                    className="mb-2 block font-medium text-sm"
                    htmlFor="target-audience"
                  >
                    Target Audience
                  </label>
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
                      <SelectItem value="professionals">
                        Professionals
                      </SelectItem>
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
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Wand2 className="mr-2 h-4 w-4" />
                    Generate Description
                  </>
                )}
              </Button>

              {generatedDescription && (
                <div className="mt-4 space-y-2">
                  <h4 className="font-medium">Generated Description:</h4>
                  <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                    <p className="text-green-800 text-sm">
                      {generatedDescription}
                    </p>
                    <div className="mt-2 flex gap-2">
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
                          onClick={() =>
                            onApplyDescription(generatedDescription)
                          }
                          size="sm"
                        >
                          <CheckCircle className="mr-1 h-3 w-3" />
                          Apply
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {generationError && (
                <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4">
                  <p className="text-red-800 text-sm">
                    <AlertTriangle className="mr-1 inline h-4 w-4" />
                    Error: {generationError.message}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Pricing Suggestions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-green-500" />
                Smart Pricing
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Button
                className="w-full"
                disabled={isSuggestingPrice}
                onClick={handleSuggestPricing}
              >
                {isSuggestingPrice ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing Market...
                  </>
                ) : (
                  <>
                    <TrendingUp className="mr-2 h-4 w-4" />
                    Get Pricing Suggestions
                  </>
                )}
              </Button>

              {pricingSuggestion && (
                <div className="mt-4 space-y-4">
                  <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                    <div className="mb-2 flex items-center justify-between">
                      <h4 className="font-medium text-blue-900">
                        Recommended Price
                      </h4>
                      <Badge variant="secondary">
                        {Math.round(pricingSuggestion.confidence * 100)}%
                        confident
                      </Badge>
                    </div>
                    <p className="mb-2 font-bold text-2xl text-blue-900">
                      KES {pricingSuggestion.recommendedPrice.toLocaleString()}
                    </p>
                    <p className="text-blue-700 text-sm">
                      Range: KES {pricingSuggestion.range.min.toLocaleString()}{" "}
                      - {pricingSuggestion.range.max.toLocaleString()}
                    </p>

                    <div className="mt-3">
                      <h5 className="mb-2 font-medium text-blue-900">
                        Reasoning:
                      </h5>
                      <ul className="space-y-1 text-blue-800 text-sm">
                        {pricingSuggestion.reasoning.map((reason, index) => (
                          <li
                            className="flex items-start gap-1"
                            key={index.toString()}
                          >
                            <span className="mt-1 text-blue-500">•</span>
                            {reason}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {onApplyPricing && (
                      <Button
                        className="mt-3"
                        onClick={() =>
                          onApplyPricing(pricingSuggestion.recommendedPrice)
                        }
                        size="sm"
                      >
                        <CheckCircle className="mr-1 h-3 w-3" />
                        Apply Price
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analysis Tab */}
        <TabsContent className="space-y-4" value="analysis">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-indigo-500" />
                Content Analysis & SEO
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label
                  className="mb-2 block font-medium text-sm"
                  htmlFor="content-to-analyze"
                >
                  Content to Analyze
                </label>
                <Textarea
                  onChange={(e) => setContentToAnalyze(e.target.value)}
                  placeholder="Paste your property description here..."
                  rows={4}
                  value={contentToAnalyze}
                />
              </div>

              <div className="flex gap-2">
                <Button
                  className="flex-1"
                  disabled={isAnalyzing || !contentToAnalyze.trim()}
                  onClick={handleAnalyzeContent}
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Eye className="mr-2 h-4 w-4" />
                      Analyze Content
                    </>
                  )}
                </Button>

                <Button
                  className="flex-1"
                  disabled={isOptimizing || !contentToAnalyze.trim()}
                  onClick={handleOptimizeSEO}
                  variant="outline"
                >
                  {isOptimizing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Optimizing...
                    </>
                  ) : (
                    <>
                      <Zap className="mr-2 h-4 w-4" />
                      Optimize for SEO
                    </>
                  )}
                </Button>
              </div>

              {/* Analysis Results */}
              {analysis && (
                <div className="mt-6 space-y-4">
                  <h4 className="font-medium">Analysis Results</h4>

                  {/* Score Cards */}
                  <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                    <div className="rounded-lg border bg-white p-3 text-center">
                      <div
                        className={cn(
                          "font-bold text-2xl",
                          getScoreColor(analysis.score)
                        )}
                      >
                        {analysis.score}
                      </div>
                      <div className="text-muted-foreground text-xs">
                        Overall Quality
                      </div>
                    </div>
                    <div className="rounded-lg border bg-white p-3 text-center">
                      <div
                        className={cn(
                          "font-bold text-2xl",
                          getScoreColor(analysis.readabilityScore)
                        )}
                      >
                        {analysis.readabilityScore}
                      </div>
                      <div className="text-muted-foreground text-xs">
                        Readability
                      </div>
                    </div>
                    <div className="rounded-lg border bg-white p-3 text-center">
                      <div
                        className={cn(
                          "font-bold text-2xl",
                          getScoreColor(analysis.seoScore)
                        )}
                      >
                        {analysis.seoScore}
                      </div>
                      <div className="text-muted-foreground text-xs">
                        SEO Score
                      </div>
                    </div>
                    <div className="rounded-lg border bg-white p-3 text-center">
                      <Badge
                        variant={
                          analysis.sentiment === "positive"
                            ? "default"
                            : analysis.sentiment === "neutral"
                              ? "secondary"
                              : "destructive"
                        }
                      >
                        {analysis.sentiment}
                      </Badge>
                      <div className="mt-1 text-muted-foreground text-xs">
                        Sentiment
                      </div>
                    </div>
                  </div>

                  {/* Suggestions */}
                  {analysis.suggestions.length > 0 && (
                    <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
                      <h5 className="mb-2 flex items-center gap-2 font-medium text-yellow-900">
                        <Lightbulb className="h-4 w-4" />
                        Suggestions for Improvement
                      </h5>
                      <ul className="space-y-1 text-sm text-yellow-800">
                        {analysis.suggestions.map((suggestion, index) => (
                          <li
                            className="flex items-start gap-1"
                            key={index.toString()}
                          >
                            <span className="mt-1 text-yellow-600">•</span>
                            {suggestion}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Keywords */}
                  {analysis.keywords.length > 0 && (
                    <div>
                      <h5 className="mb-2 font-medium">Detected Keywords</h5>
                      <div className="flex flex-wrap gap-2">
                        {analysis.keywords.map((keyword, index) => (
                          <Badge key={index.toString()} variant="outline">
                            {keyword}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* SEO Optimization Results */}
              {seoOptimization && (
                <div className="mt-6 space-y-4">
                  <h4 className="font-medium">SEO Optimization Results</h4>

                  <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                    <h5 className="mb-2 font-medium text-green-900">
                      Optimized Content:
                    </h5>
                    <p className="mb-3 text-green-800 text-sm">
                      "{seoOptimization.optimizedContent}"
                    </p>

                    <div className="mb-3 flex gap-2">
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
                      {onApplyOptimization && (
                        <Button
                          onClick={() =>
                            onApplyOptimization(
                              "description",
                              seoOptimization.optimizedContent
                            )
                          }
                          size="sm"
                        >
                          <CheckCircle className="mr-1 h-3 w-3" />
                          Apply
                        </Button>
                      )}
                    </div>

                    <div>
                      <h6 className="mb-2 font-medium text-green-900">
                        Improvements Made:
                      </h6>
                      <ul className="space-y-1 text-green-800 text-sm">
                        {seoOptimization.improvements.map(
                          (improvement, index) => (
                            <li
                              className="flex items-start gap-1"
                              key={index.toString()}
                            >
                              <CheckCircle className="mt-1 h-3 w-3 shrink-0 text-green-600" />
                              {improvement}
                            </li>
                          )
                        )}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Insights Tab */}
        <TabsContent className="space-y-4" value="insights">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-orange-500" />
                Property Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="py-8 text-center text-muted-foreground">
                <TrendingUp className="mx-auto mb-2 h-8 w-8 opacity-50" />
                <p>Market insights and competitive analysis</p>
                <p className="mt-1 text-xs">Coming soon...</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
