import { Avatar, AvatarFallback, AvatarImage } from "@kaa/ui/components/avatar";
import { Badge } from "@kaa/ui/components/badge";
import { Button } from "@kaa/ui/components/button";
import { Input } from "@kaa/ui/components/input";
import { ScrollArea } from "@kaa/ui/components/scroll-area";
import { cn } from "@kaa/ui/lib/utils";
import {
  Bot,
  Copy,
  DollarSign,
  FileText,
  ImageIcon,
  Loader2,
  Mic,
  MicOff,
  Paperclip,
  RotateCcw,
  Search,
  Send,
  ThumbsDown,
  ThumbsUp,
  TrendingUp,
  User,
  Zap,
} from "lucide-react";
import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useAIAssistant } from "../hooks/use-ai-assistant";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  type: "text" | "action" | "suggestion" | "analysis";
  metadata?: {
    confidence?: number;
    sources?: string[];
    actionType?: string;
    suggestedActions?: Array<{
      label: string;
      action: string;
      icon?: React.ReactNode;
    }>;
  };
};

type AIChatAssistantProps = {
  propertyContext?: any;
  onActionTrigger?: (action: string, data?: any) => void;
  contextualSuggestions?: boolean;
};

export function AIChatAssistant({
  propertyContext,
  onActionTrigger,
  contextualSuggestions = true,
}: AIChatAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    processStreamingQuery,
    analyzePropertyImage,
    processDocument,
    isProcessingQuery,
    streamingState,
    conversationId,
    clearConversation,
  } = useAIAssistant(propertyContext);

  // Smart suggestions based on context
  const smartSuggestions = [
    {
      label: "Analyze this property",
      action: "analyze_property",
      icon: <Search className="h-4 w-4" />,
      context: propertyContext ? "property" : null,
    },
    {
      label: "Suggest pricing",
      action: "suggest_pricing",
      icon: <DollarSign className="h-4 w-4" />,
      context: propertyContext ? "property" : null,
    },
    {
      label: "Market trends",
      action: "market_trends",
      icon: <TrendingUp className="h-4 w-4" />,
    },
    {
      label: "Quick valuation",
      action: "quick_valuation",
      icon: <Zap className="h-4 w-4" />,
      context: propertyContext ? "property" : null,
    },
  ];

  // Initialize with welcome message
  useEffect(() => {
    const welcomeMessage: Message = {
      id: `welcome-${Date.now()}`,
      role: "assistant",
      content: `Habari! I'm your AI property assistant. I can help you with property analysis, pricing suggestions, market insights, and much more. ${propertyContext ? "I can see you're working on a property - shall I analyze it?" : "How can I assist you today?"}`,
      timestamp: new Date(),
      type: "text",
      metadata: {
        suggestedActions:
          contextualSuggestions && propertyContext
            ? [
                {
                  label: "Analyze Property",
                  action: "analyze_property",
                  icon: <Search className="h-4 w-4" />,
                },
                {
                  label: "Suggest Pricing",
                  action: "suggest_pricing",
                  icon: <DollarSign className="h-4 w-4" />,
                },
              ]
            : [],
      },
    };
    setMessages([welcomeMessage]);
  }, [propertyContext, contextualSuggestions]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // Handle streaming responses
  useEffect(() => {
    if (streamingState.isStreaming && streamingState.streamedText) {
      setMessages((prev) => {
        const lastMessage = prev.at(-1);
        if (
          lastMessage &&
          lastMessage.role === "assistant" &&
          lastMessage.type === "text"
        ) {
          return [
            ...prev.slice(0, -1),
            { ...lastMessage, content: streamingState.streamedText },
          ];
        }
        return prev;
      });
    }

    if (streamingState.complete && !streamingState.isStreaming) {
      setIsTyping(false);
    }
  }, [streamingState]);

  const handleSubmit = useCallback(
    async (messageText?: string) => {
      const text = messageText || input.trim();
      if (!text && attachments.length === 0) return;

      const userMessage: Message = {
        id: `user-${Date.now()}`,
        role: "user",
        content: text,
        timestamp: new Date(),
        type: "text",
      };

      setMessages((prev) => [...prev, userMessage]);
      setInput("");
      setIsTyping(true);

      // Create placeholder for assistant response
      const assistantPlaceholder: Message = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: "",
        timestamp: new Date(),
        type: "text",
      };

      setMessages((prev) => [...prev, assistantPlaceholder]);

      try {
        // Process attachments if any
        if (attachments.length > 0) {
          for (const file of attachments) {
            if (file.type.startsWith("image/")) {
              await analyzePropertyImage({ file, context: propertyContext });
            } else {
              await processDocument({ file });
            }
          }
          setAttachments([]);
        }

        // Process the query with context
        const contextualQuery = propertyContext
          ? `Context: Working on property with ${JSON.stringify(propertyContext)}. Query: ${text}`
          : text;

        await processStreamingQuery(contextualQuery, "property");
      } catch (error) {
        setIsTyping(false);
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantPlaceholder.id
              ? {
                  ...msg,
                  content: `Sorry, I encountered an error: ${error}`,
                  type: "text",
                }
              : msg
          )
        );
        toast.error("Failed to process your request");
      }
    },
    [
      input,
      attachments,
      propertyContext,
      processStreamingQuery,
      analyzePropertyImage,
      processDocument,
    ]
  );

  const handleQuickAction = useCallback(
    async (action: string) => {
      switch (action) {
        case "analyze_property":
          if (propertyContext) {
            await handleSubmit(
              `Please analyze this property: ${JSON.stringify(propertyContext)}`
            );
          }
          break;
        case "suggest_pricing":
          if (propertyContext) {
            await handleSubmit(
              "Please suggest pricing for this property based on current market conditions"
            );
          }
          break;
        case "market_trends":
          await handleSubmit(
            "What are the current market trends in the Kenyan rental market?"
          );
          break;
        case "quick_valuation":
          if (propertyContext) {
            await handleSubmit(
              "Provide a quick valuation estimate for this property"
            );
          }
          break;
        default:
          break;
      }

      onActionTrigger?.(action, propertyContext);
    },
    [propertyContext, handleSubmit, onActionTrigger]
  );

  const handleFileAttachment = useCallback((files: FileList | null) => {
    if (!files) return;

    const newAttachments = Array.from(files).filter((file) => {
      const isImage = file.type.startsWith("image/");
      const isDocument =
        file.type === "application/pdf" || file.type.includes("document");
      return isImage || isDocument;
    });

    if (newAttachments.length !== files.length) {
      toast.warning("Only images and documents are supported");
    }

    setAttachments((prev) => [...prev, ...newAttachments]);
  }, []);

  const copyToClipboard = useCallback((text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  }, []);

  const handleFeedback = useCallback(
    (_messageId: string, positive: boolean) => {
      toast.success(
        positive
          ? "Thanks for the positive feedback!"
          : "Thanks for the feedback, I'll improve!"
      );
    },
    []
  );

  return (
    <div className="flex h-[600px] flex-col rounded-lg border border-emerald-200 bg-linear-to-br from-emerald-50 to-teal-50">
      {/* Header */}
      <div className="flex items-center justify-between rounded-t-lg border-emerald-200 border-b bg-white/80 p-4 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src="/ai-avatar.png" />
            <AvatarFallback className="bg-emerald-500 text-white">
              <Bot className="h-5 w-5" />
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-semibold text-emerald-900">
              Keja AI Assistant
            </h3>
            <p className="text-emerald-600 text-sm">
              {isTyping ? "Thinking..." : "Ready to help"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            className="border-emerald-300 text-emerald-700"
            variant="outline"
          >
            {messages.length} messages
          </Badge>
          <Button
            onClick={clearConversation}
            size="sm"
            title="Clear conversation"
            variant="ghost"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <ScrollArea className="min-h-[200px] flex-col p-4">
        {/* Messages */}
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              className={cn(
                "flex gap-3",
                message.role === "user" ? "justify-end" : "justify-start"
              )}
              key={message.id}
            >
              {message.role === "assistant" && (
                <Avatar className="flex h-8 w-8 shrink-0">
                  <AvatarFallback className="bg-emerald-500 text-white text-xs">
                    <Bot className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
              )}

              <div
                className={cn(
                  "max-w-[80%] rounded-lg p-3",
                  message.role === "user"
                    ? "ml-12 bg-emerald-500 text-white"
                    : "border border-emerald-100 bg-white shadow-sm"
                )}
              >
                <div className="prose prose-sm max-w-none">
                  {message.content}
                </div>

                {message.metadata?.suggestedActions && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {message.metadata.suggestedActions.map((action) => (
                      <Button
                        className="h-8 text-xs"
                        key={action.action}
                        onClick={() => handleQuickAction(action.action)}
                        size="sm"
                        variant="outline"
                      >
                        {action.icon}
                        {action.label}
                      </Button>
                    ))}
                  </div>
                )}

                {message.role === "assistant" && (
                  <div className="mt-2 flex items-center justify-between border-gray-100 border-t pt-2">
                    <div className="flex items-center gap-2">
                      {message.metadata?.confidence && (
                        <Badge className="text-xs" variant="secondary">
                          {Math.round(message.metadata.confidence * 100)}%
                          confident
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        className="h-6 w-6 p-0"
                        onClick={() => copyToClipboard(message.content)}
                        size="sm"
                        variant="ghost"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                      <Button
                        className="h-6 w-6 p-0"
                        onClick={() => handleFeedback(message.id, true)}
                        size="sm"
                        variant="ghost"
                      >
                        <ThumbsUp className="h-3 w-3" />
                      </Button>
                      <Button
                        className="h-6 w-6 p-0"
                        onClick={() => handleFeedback(message.id, false)}
                        size="sm"
                        variant="ghost"
                      >
                        <ThumbsDown className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {message.role === "user" && (
                <Avatar className="flex h-8 w-8 shrink-0">
                  <AvatarFallback className="bg-gray-300 text-gray-600 text-xs">
                    <User className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
              )}
            </div>
          ))}

          {isTyping && (
            <div className="flex justify-start gap-3">
              <Avatar className="flex h-8 w-8">
                <AvatarFallback className="bg-emerald-500 text-white text-xs">
                  <Bot className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              <div className="rounded-lg border border-emerald-100 bg-white p-3 shadow-sm">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-gray-600 text-sm">
                    AI is thinking...
                  </span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Actions */}
        {contextualSuggestions && (
          <div className="border-emerald-200 border-t px-4 py-2">
            <div className="flex flex-wrap gap-2">
              {smartSuggestions
                .filter((suggestion) => !suggestion.context || propertyContext)
                .map((suggestion) => (
                  <Button
                    className="h-8 border-emerald-200 text-xs hover:bg-emerald-50"
                    key={suggestion.action}
                    onClick={() => handleQuickAction(suggestion.action)}
                    size="sm"
                    variant="outline"
                  >
                    {suggestion.icon}
                    {suggestion.label}
                  </Button>
                ))}
            </div>
          </div>
        )}

        {/* Attachments Preview */}
        {attachments.length > 0 && (
          <div className="border-emerald-200 border-t px-4 py-2">
            <div className="flex flex-wrap gap-2">
              {attachments.map((file, idx) => (
                <div
                  className="flex items-center gap-2 rounded-lg bg-emerald-100 px-3 py-1"
                  key={file.name}
                >
                  {file.type.startsWith("image/") ? (
                    <ImageIcon className="h-4 w-4" />
                  ) : (
                    <FileText className="h-4 w-4" />
                  )}
                  <span className="max-w-[100px] truncate text-xs">
                    {file.name}
                  </span>
                  <Button
                    className="h-4 w-4 p-0"
                    onClick={() =>
                      setAttachments((prev) => prev.filter((_, i) => i !== idx))
                    }
                    size="sm"
                    variant="ghost"
                  >
                    ×
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="rounded-b-lg border-emerald-200 border-t bg-white/80 p-4 backdrop-blur-sm">
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <div className="relative">
                <Input
                  className="border-emerald-200 pr-20 focus:border-emerald-500"
                  disabled={isProcessingQuery || isTyping}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) =>
                    e.key === "Enter" && !e.shiftKey && handleSubmit()
                  }
                  placeholder="Ask me anything about properties, pricing, market trends..."
                  value={input}
                />
                <div className="-translate-y-1/2 absolute top-1/2 right-2 flex items-center gap-1">
                  <Button
                    className="h-8 w-8 p-0"
                    disabled={isProcessingQuery || isTyping}
                    onClick={() => fileInputRef.current?.click()}
                    size="sm"
                    variant="ghost"
                  >
                    <Paperclip className="h-4 w-4" />
                  </Button>
                  <Button
                    className="h-8 w-8 p-0"
                    disabled={isProcessingQuery || isTyping}
                    onClick={() => {
                      if (isListening) {
                        // Stop listening
                        setIsListening(false);
                      } else {
                        // Start listening
                        setIsListening(true);
                        // Implement speech recognition
                      }
                    }}
                    size="sm"
                    variant="ghost"
                  >
                    {isListening ? (
                      <MicOff className="h-4 w-4 text-red-500" />
                    ) : (
                      <Mic className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700"
              disabled={
                isProcessingQuery ||
                isTyping ||
                (!input.trim() && attachments.length === 0)
              }
              onClick={() => handleSubmit()}
            >
              {isProcessingQuery || isTyping ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>

          <input
            accept="image/*,application/pdf,.doc,.docx"
            hidden
            multiple
            onChange={(e) => handleFileAttachment(e.target.files)}
            ref={fileInputRef}
            type="file"
          />
        </div>
      </ScrollArea>
    </div>
  );
}

export default AIChatAssistant;
