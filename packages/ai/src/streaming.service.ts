import { EventEmitter } from "node:events";
import config from "@kaa/config/api";
import { logger } from "@kaa/utils";
import OpenAI from "openai";
import { openAIService } from "./openai.service";

type StreamingSession = {
  id: string;
  userId: string;
  conversationId: string;
  context: any;
  history: Array<{
    role: "user" | "assistant" | "system";
    content: string;
    timestamp: Date;
  }>;
  isActive: boolean;
  lastActivity: Date;
};

type StreamChunk = {
  id: string;
  type: "text" | "action" | "suggestion" | "complete";
  content: string;
  metadata?: any;
  timestamp: Date;
};

/**
 * Real-time AI streaming service for live conversations
 */
export class AIStreamingService extends EventEmitter {
  private static instance: AIStreamingService;
  private readonly sessions = new Map<string, StreamingSession>();
  private openai: OpenAI | null = null;
  private cleanupInterval: NodeJS.Timeout | null = null;

  private constructor() {
    super();
    this.cleanupInterval = setTimeout(
      () => {
        this.cleanupInterval = null;
      },
      10 * 60 * 1000
    ) as any;
    this.initializeOpenAI();
    this.startCleanupProcess();
  }

  static getInstance(): AIStreamingService {
    if (!AIStreamingService.instance) {
      AIStreamingService.instance = new AIStreamingService();
    }
    return AIStreamingService.instance;
  }

  private initializeOpenAI(): void {
    const apiKey = config.openai.apiKey;
    if (apiKey && apiKey !== "sk-your-openai-api-key-here") {
      this.openai = new OpenAI({
        apiKey,
        timeout: 60_000,
        maxRetries: 2,
      });
    }
  }

  /**
   * Create or get existing streaming session
   */
  createSession(
    userId: string,
    conversationId: string,
    context?: any
  ): StreamingSession {
    const sessionId = `${userId}_${conversationId}`;

    let session = this.sessions.get(sessionId);
    if (!session) {
      session = {
        id: sessionId,
        userId,
        conversationId,
        context: context || {},
        history: [],
        isActive: true,
        lastActivity: new Date(),
      };
      this.sessions.set(sessionId, session);
    }

    session.lastActivity = new Date();
    session.isActive = true;

    logger.info("AI streaming session created/updated", {
      sessionId,
      userId,
      conversationId,
    });

    return session;
  }

  /**
   * Stream AI responses in real-time
   */
  async *streamResponse(
    sessionId: string,
    query: string,
    domain = "property"
  ): AsyncGenerator<StreamChunk> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error("Invalid streaming session");
    }

    if (!this.openai) {
      yield {
        id: `error_${Date.now()}`,
        type: "complete",
        content:
          "AI service is not available. Please configure OpenAI API key.",
        timestamp: new Date(),
      };
      return;
    }

    try {
      // Add user message to history
      session.history.push({
        role: "user",
        content: query,
        timestamp: new Date(),
      });

      // Prepare messages for OpenAI
      const messages = this.buildConversationMessages(session, query, domain);

      // Start streaming completion
      const stream = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages,
        stream: true,
        max_tokens: 1500,
        temperature: 0.7,
      });

      let fullResponse = "";
      let chunkId = 0;

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || "";

        if (content) {
          fullResponse += content;

          yield {
            id: `chunk_${chunkId++}`,
            type: "text",
            content: fullResponse,
            metadata: {
              isPartial: true,
              sessionId,
            },
            timestamp: new Date(),
          };

          // Emit event for WebSocket clients
          this.emit("chunk", {
            sessionId,
            chunk: {
              content: fullResponse,
              isPartial: true,
            },
          });
        }
      }

      // Add assistant response to history
      session.history.push({
        role: "assistant",
        content: fullResponse,
        timestamp: new Date(),
      });

      // Generate contextual suggestions
      const suggestions = await this.generateSuggestions(session, fullResponse);

      // Yield completion with suggestions
      yield {
        id: `complete_${Date.now()}`,
        type: "complete",
        content: fullResponse,
        metadata: {
          suggestions,
          sessionId,
          conversationLength: session.history.length,
        },
        timestamp: new Date(),
      };

      // Emit completion event
      this.emit("complete", {
        sessionId,
        response: fullResponse,
        suggestions,
      });

      session.lastActivity = new Date();
    } catch (error) {
      logger.error("AI streaming error:", error);

      yield {
        id: `error_${Date.now()}`,
        type: "complete",
        content: "Sorry, I encountered an error while processing your request.",
        metadata: { error: (error as Error).message },
        timestamp: new Date(),
      };

      this.emit("error", { sessionId, error });
    }
  }

  /**
   * Process query with enhanced context and streaming
   */
  async processStreamingQuery(
    sessionId: string,
    query: string,
    domain = "property"
  ): Promise<AsyncIterable<StreamChunk>> {
    return await this.streamResponse(sessionId, query, domain);
  }

  /**
   * Build conversation messages with context
   */
  private buildConversationMessages(
    session: StreamingSession,
    currentQuery: string,
    domain: string
  ): Array<{ role: "system" | "user" | "assistant"; content: string }> {
    const systemPrompt = this.getSystemPromptForDomain(domain, session.context);

    const messages = [
      {
        role: "system" as "system" | "user" | "assistant",
        content: systemPrompt,
      },
    ];

    // Add conversation history (last 10 messages to manage token usage)
    const recentHistory = session.history.slice(-10);
    for (const msg of recentHistory) {
      messages.push({
        role: msg.role,
        content: msg.content,
      });
    }

    // Add current query
    messages.push({
      role: "user" as "system" | "user" | "assistant",
      content: currentQuery,
    });

    return messages;
  }

  /**
   * Get domain-specific system prompts
   */
  private getSystemPromptForDomain(domain: string, context: any): string {
    const basePrompt = `You are Keja AI, a specialized property assistant for the Kenyan market. 
    Provide helpful, accurate, and contextual responses about properties, rentals, and real estate.`;

    const contextInfo = context
      ? `\n\nCurrent Context: ${JSON.stringify(context)}`
      : "";

    const domainPrompts = {
      property: `${basePrompt}
        
        Focus on:
        - Property analysis and valuation
        - Market insights and trends  
        - Pricing recommendations
        - Investment advice
        - Legal and compliance guidance${contextInfo}`,

      chat: `${basePrompt}
        
        Maintain natural conversation while providing expert property advice.
        Be conversational, helpful, and proactive in suggesting relevant actions.${contextInfo}`,

      analysis: `${basePrompt}
        
        Provide detailed analytical insights with data-driven recommendations.
        Focus on quantitative analysis and actionable insights.${contextInfo}`,
    };

    return (
      domainPrompts[domain as keyof typeof domainPrompts] ||
      domainPrompts.property
    );
  }

  /**
   * Generate contextual suggestions based on conversation
   */
  private async generateSuggestions(
    session: StreamingSession,
    _lastResponse: string
  ): Promise<string[]> {
    try {
      const suggestions = await openAIService.getContextualSuggestions({
        currentAction: "chat",
        propertyData: session.context.propertyData,
        userHistory: session.history.slice(-5).map((h) => h.content),
      });

      return suggestions.slice(0, 3).map((s) => s.suggestion);
    } catch (error) {
      logger.error("Error generating suggestions:", error);
      return [
        "Get property valuation",
        "Analyze market trends",
        "Check legal compliance",
      ];
    }
  }

  /**
   * Update session context
   */
  updateSessionContext(sessionId: string, context: any): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.context = { ...session.context, ...context };
      session.lastActivity = new Date();
    }
  }

  /**
   * Get session history
   */
  getSessionHistory(
    sessionId: string
  ): Array<{ role: string; content: string; timestamp: Date }> {
    const session = this.sessions.get(sessionId);
    return session ? session.history : [];
  }

  /**
   * Clear session history
   */
  clearSession(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.history = [];
      session.lastActivity = new Date();
    }
  }

  /**
   * End streaming session
   */
  endSession(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.isActive = false;
      this.sessions.delete(sessionId);

      this.emit("sessionEnded", { sessionId });

      logger.info("AI streaming session ended", { sessionId });
    }
  }

  /**
   * Get active sessions count
   */
  getActiveSessionsCount(): number {
    return Array.from(this.sessions.values()).filter((s) => s.isActive).length;
  }

  /**
   * Get session statistics
   */
  getSessionStats(): {
    totalSessions: number;
    activeSessions: number;
    avgHistoryLength: number;
  } {
    const sessions = Array.from(this.sessions.values());
    const activeSessions = sessions.filter((s) => s.isActive);

    return {
      totalSessions: sessions.length,
      activeSessions: activeSessions.length,
      avgHistoryLength:
        sessions.reduce((sum, s) => sum + s.history.length, 0) /
          sessions.length || 0,
    };
  }

  /**
   * Start cleanup process for inactive sessions
   */
  private startCleanupProcess(): void {
    this.cleanupInterval = setInterval(
      () => {
        const now = new Date();
        const inactiveThreshold = 30 * 60 * 1000; // 30 minutes

        for (const [sessionId, session] of Array.from(
          this.sessions.entries()
        )) {
          if (
            now.getTime() - session.lastActivity.getTime() >
            inactiveThreshold
          ) {
            this.endSession(sessionId);
          }
        }
      },
      10 * 60 * 1000
    ) as any; // Run cleanup every 10 minutes
  }

  /**
   * Stop the service and cleanup
   */
  shutdown(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }

    // End all active sessions
    for (const sessionId of Array.from(this.sessions.keys())) {
      this.endSession(sessionId);
    }

    this.removeAllListeners();
    logger.info("AI streaming service shut down");
  }
}

// Export singleton instance
export const aiStreamingService = AIStreamingService.getInstance();

// For ElysiaJS integration
export type StreamingController = {
  startStream: (
    userId: string,
    conversationId: string,
    query: string,
    context?: any
  ) => AsyncIterable<StreamChunk>;
  endStream: (sessionId: string) => void;
  updateContext: (sessionId: string, context: any) => void;
  getHistory: (sessionId: string) => any[];
};
