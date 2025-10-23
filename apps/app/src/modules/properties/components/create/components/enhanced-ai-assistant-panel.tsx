import { useState, useEffect, useCallback } from "react";
import { Button } from "@kaa/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@kaa/ui/components/card";
import { Badge } from "@kaa/ui/components/badge";
import { Progress } from "@kaa/ui/components/progress";
import { Textarea } from "@kaa/ui/components/textarea";
import { Input } from "@kaa/ui/components/input";
import { ScrollArea } from "@kaa/ui/components/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@kaa/ui/components/tabs";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@kaa/ui/components/select";
import {
	Sparkles,
	Brain,
	TrendingUp,
	Search,
	Copy,
	RefreshCw,
	CheckCircle,
	AlertCircle,
	DollarSign,
	Target,
	Lightbulb,
	MessageSquare,
	Wand2,
	BarChart3,
	Eye,
	Send,
	Bot,
	User,
	Loader2,
	AlertTriangle,
	Info,
	Zap,
} from "lucide-react";
import { cn } from "@kaa/ui/lib/utils";
import { toast } from "sonner";
import { useAIAssistant } from "../hooks/use-ai-assistant";
import type { PropertyFormData } from "../schema";

interface EnhancedAIAssistantPanelProps {
	propertyData: Partial<PropertyFormData>;
	onApplyDescription?: (description: string) => void;
	onApplyPricing?: (pricing: number) => void;
	onApplyOptimization?: (field: string, value: any) => void;
	className?: string;
}

interface ChatMessage {
	id: string;
	role: "user" | "assistant";
	content: string;
	timestamp: Date;
	type?: "text" | "suggestion" | "analysis";
}

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
	const [selectedLength, setSelectedLength] = useState<"short" | "medium" | "long">("medium");
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
				const lastMessage = prev[prev.length - 1];
				if (lastMessage && lastMessage.role === "assistant" && !lastMessage.content) {
					// Update the last assistant message with streamed content
					return prev.map((msg, index) =>
						index === prev.length - 1 ? { ...msg, content: streamingState.streamedText } : msg
					);
				} else {
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
				}
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
			addChatMessage("assistant", `Generated description: ${description}`, "suggestion");

			toast.success("Description generated successfully!");

			if (onApplyDescription) {
				onApplyDescription(description);
			}
		} catch (error) {
			toast.error("Failed to generate description");
			addChatMessage("assistant", `Error generating description: ${error}`, "text");
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
			await optimizeForSEO(contentToAnalyze, propertyData.basic?.type || "apartment");
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
			<Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
				<TabsList className="grid w-full grid-cols-4">
					<TabsTrigger value="assistant" className="flex items-center gap-2">
						<MessageSquare className="h-4 w-4" />
						Chat
					</TabsTrigger>
					<TabsTrigger value="generation" className="flex items-center gap-2">
						<Sparkles className="h-4 w-4" />
						Generate
					</TabsTrigger>
					<TabsTrigger value="analysis" className="flex items-center gap-2">
						<Brain className="h-4 w-4" />
						Analyze
					</TabsTrigger>
					<TabsTrigger value="insights" className="flex items-center gap-2">
						<TrendingUp className="h-4 w-4" />
						Insights
					</TabsTrigger>
				</TabsList>

				{/* Chat Assistant Tab */}
				<TabsContent value="assistant" className="space-y-4">
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center justify-between">
								<span className="flex items-center gap-2">
									<Bot className="h-5 w-5 text-blue-500" />
									AI Property Assistant
								</span>
								<Button variant="outline" size="sm" onClick={clearConversation} className="text-xs">
									Clear Chat
								</Button>
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="space-y-4">
								{/* Chat Messages */}
								<ScrollArea className="h-96 w-full border rounded-lg p-4">
									{chatMessages.length === 0 ? (
										<div className="text-center text-muted-foreground py-8">
											<Bot className="h-8 w-8 mx-auto mb-2 opacity-50" />
											<p>Ask me anything about your property!</p>
											<p className="text-xs mt-1">
												Try: "Help me optimize this description" or "What's the best price range?"
											</p>
										</div>
									) : (
										<div className="space-y-4">
											{chatMessages.map((message) => (
												<div
													key={message.id}
													className={cn(
														"flex gap-3",
														message.role === "user" ? "justify-end" : "justify-start"
													)}
												>
													<div
														className={cn(
															"max-w-[80%] rounded-lg px-3 py-2",
															message.role === "user"
																? "bg-blue-500 text-white"
																: message.type === "suggestion"
																	? "bg-green-50 border border-green-200 text-green-900"
																	: message.type === "analysis"
																		? "bg-purple-50 border border-purple-200 text-purple-900"
																		: "bg-gray-100 text-gray-900"
														)}
													>
														<div className="flex items-start gap-2">
															{message.role === "user" ? (
																<User className="h-4 w-4 mt-0.5 flex-shrink-0" />
															) : (
																<Bot className="h-4 w-4 mt-0.5 flex-shrink-0" />
															)}
															<div className="flex-1">
																<pre className="whitespace-pre-wrap text-sm font-sans">
																	{message.content}
																</pre>
																{message.role === "assistant" && message.content && (
																	<Button
																		variant="ghost"
																		size="sm"
																		onClick={() => copyToClipboard(message.content)}
																		className="mt-1 h-6 text-xs"
																	>
																		<Copy className="h-3 w-3 mr-1" />
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
													<div className="bg-gray-100 rounded-lg px-3 py-2 flex items-center gap-2">
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
										placeholder="Ask about your property..."
										value={chatInput}
										onChange={(e) => setChatInput(e.target.value)}
										onKeyPress={(e) => {
											if (e.key === "Enter") {
												handleChatSubmit();
											}
										}}
										disabled={streamingState.isStreaming}
									/>
									<Button
										onClick={handleChatSubmit}
										disabled={!chatInput.trim() || streamingState.isStreaming}
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
				<TabsContent value="generation" className="space-y-4">
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
									<label className="mb-2 block font-medium text-sm">Tone</label>
									<Select
										value={selectedTone}
										onValueChange={(value) =>
											setSelectedTone(value as "professional" | "friendly" | "luxury" | "casual")
										}
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
									<label className="mb-2 block font-medium text-sm">Length</label>
									<Select
										value={selectedLength}
										onValueChange={(value) =>
											setSelectedLength(value as "short" | "medium" | "long")
										}
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
									<label className="mb-2 block font-medium text-sm">Target Audience</label>
									<Select
										value={selectedAudience}
										onValueChange={(value) =>
											setSelectedAudience(
												value as "general" | "families" | "professionals" | "students"
											)
										}
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
								onClick={handleGenerateDescription}
								disabled={isGenerating}
								className="w-full"
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
									<div className="bg-green-50 border border-green-200 rounded-lg p-4">
										<p className="text-sm text-green-800">{generatedDescription}</p>
										<div className="flex gap-2 mt-2">
											<Button
												size="sm"
												variant="outline"
												onClick={() => copyToClipboard(generatedDescription)}
											>
												<Copy className="h-3 w-3 mr-1" />
												Copy
											</Button>
											{onApplyDescription && (
												<Button size="sm" onClick={() => onApplyDescription(generatedDescription)}>
													<CheckCircle className="h-3 w-3 mr-1" />
													Apply
												</Button>
											)}
										</div>
									</div>
								</div>
							)}

							{generationError && (
								<div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
									<p className="text-sm text-red-800">
										<AlertTriangle className="h-4 w-4 inline mr-1" />
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
								onClick={handleSuggestPricing}
								disabled={isSuggestingPrice}
								className="w-full"
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
									<div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
										<div className="flex items-center justify-between mb-2">
											<h4 className="font-medium text-blue-900">Recommended Price</h4>
											<Badge variant="secondary">
												{Math.round(pricingSuggestion.confidence * 100)}% confident
											</Badge>
										</div>
										<p className="text-2xl font-bold text-blue-900 mb-2">
											KES {pricingSuggestion.recommendedPrice.toLocaleString()}
										</p>
										<p className="text-sm text-blue-700">
											Range: KES {pricingSuggestion.range.min.toLocaleString()} -{" "}
											{pricingSuggestion.range.max.toLocaleString()}
										</p>

										<div className="mt-3">
											<h5 className="font-medium text-blue-900 mb-2">Reasoning:</h5>
											<ul className="text-sm text-blue-800 space-y-1">
												{pricingSuggestion.reasoning.map((reason, index) => (
													<li key={index} className="flex items-start gap-1">
														<span className="text-blue-500 mt-1">•</span>
														{reason}
													</li>
												))}
											</ul>
										</div>

										{onApplyPricing && (
											<Button
												size="sm"
												className="mt-3"
												onClick={() => onApplyPricing(pricingSuggestion.recommendedPrice)}
											>
												<CheckCircle className="h-3 w-3 mr-1" />
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
				<TabsContent value="analysis" className="space-y-4">
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Brain className="h-5 w-5 text-indigo-500" />
								Content Analysis & SEO
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							<div>
								<label className="mb-2 block font-medium text-sm">Content to Analyze</label>
								<Textarea
									placeholder="Paste your property description here..."
									value={contentToAnalyze}
									onChange={(e) => setContentToAnalyze(e.target.value)}
									rows={4}
								/>
							</div>

							<div className="flex gap-2">
								<Button
									onClick={handleAnalyzeContent}
									disabled={isAnalyzing || !contentToAnalyze.trim()}
									className="flex-1"
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
									onClick={handleOptimizeSEO}
									disabled={isOptimizing || !contentToAnalyze.trim()}
									variant="outline"
									className="flex-1"
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
								<div className="space-y-4 mt-6">
									<h4 className="font-medium">Analysis Results</h4>

									{/* Score Cards */}
									<div className="grid grid-cols-2 gap-4 md:grid-cols-4">
										<div className="bg-white border rounded-lg p-3 text-center">
											<div className={cn("text-2xl font-bold", getScoreColor(analysis.score))}>
												{analysis.score}
											</div>
											<div className="text-xs text-muted-foreground">Overall Quality</div>
										</div>
										<div className="bg-white border rounded-lg p-3 text-center">
											<div
												className={cn(
													"text-2xl font-bold",
													getScoreColor(analysis.readabilityScore)
												)}
											>
												{analysis.readabilityScore}
											</div>
											<div className="text-xs text-muted-foreground">Readability</div>
										</div>
										<div className="bg-white border rounded-lg p-3 text-center">
											<div className={cn("text-2xl font-bold", getScoreColor(analysis.seoScore))}>
												{analysis.seoScore}
											</div>
											<div className="text-xs text-muted-foreground">SEO Score</div>
										</div>
										<div className="bg-white border rounded-lg p-3 text-center">
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
											<div className="text-xs text-muted-foreground mt-1">Sentiment</div>
										</div>
									</div>

									{/* Suggestions */}
									{analysis.suggestions.length > 0 && (
										<div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
											<h5 className="font-medium text-yellow-900 mb-2 flex items-center gap-2">
												<Lightbulb className="h-4 w-4" />
												Suggestions for Improvement
											</h5>
											<ul className="text-sm text-yellow-800 space-y-1">
												{analysis.suggestions.map((suggestion, index) => (
													<li key={index} className="flex items-start gap-1">
														<span className="text-yellow-600 mt-1">•</span>
														{suggestion}
													</li>
												))}
											</ul>
										</div>
									)}

									{/* Keywords */}
									{analysis.keywords.length > 0 && (
										<div>
											<h5 className="font-medium mb-2">Detected Keywords</h5>
											<div className="flex flex-wrap gap-2">
												{analysis.keywords.map((keyword, index) => (
													<Badge key={index} variant="outline">
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

									<div className="bg-green-50 border border-green-200 rounded-lg p-4">
										<h5 className="font-medium text-green-900 mb-2">Optimized Content:</h5>
										<p className="text-sm text-green-800 mb-3">
											"{seoOptimization.optimizedContent}"
										</p>

										<div className="flex gap-2 mb-3">
											<Button
												size="sm"
												variant="outline"
												onClick={() => copyToClipboard(seoOptimization.optimizedContent)}
											>
												<Copy className="h-3 w-3 mr-1" />
												Copy
											</Button>
											{onApplyOptimization && (
												<Button
													size="sm"
													onClick={() =>
														onApplyOptimization("description", seoOptimization.optimizedContent)
													}
												>
													<CheckCircle className="h-3 w-3 mr-1" />
													Apply
												</Button>
											)}
										</div>

										<div>
											<h6 className="font-medium text-green-900 mb-2">Improvements Made:</h6>
											<ul className="text-sm text-green-800 space-y-1">
												{seoOptimization.improvements.map((improvement, index) => (
													<li key={index} className="flex items-start gap-1">
														<CheckCircle className="h-3 w-3 text-green-600 mt-1 flex-shrink-0" />
														{improvement}
													</li>
												))}
											</ul>
										</div>
									</div>
								</div>
							)}
						</CardContent>
					</Card>
				</TabsContent>

				{/* Insights Tab */}
				<TabsContent value="insights" className="space-y-4">
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<BarChart3 className="h-5 w-5 text-orange-500" />
								Property Insights
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="text-center py-8 text-muted-foreground">
								<TrendingUp className="h-8 w-8 mx-auto mb-2 opacity-50" />
								<p>Market insights and competitive analysis</p>
								<p className="text-xs mt-1">Coming soon...</p>
							</div>
						</CardContent>
					</Card>
				</TabsContent>
			</Tabs>
		</div>
	);
}
