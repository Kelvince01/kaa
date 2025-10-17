import { google } from "@ai-sdk/google";
import { aiIntegrationsService, aiStreamingService } from "@kaa/ai";
// import { rolesPlugin } from "~/features/rbac/rbac.plugin";
// import { strictRateLimit } from "~/plugins/rate-limit.plugin";
import { logger } from "@kaa/utils";
import { convertToModelMessages, streamText } from "ai";
import Elysia, { t } from "elysia";
import { authPlugin } from "~/features/auth/auth.plugin";

// File upload validation
const validateImageFile = (file: File) => {
  const maxSize = 10 * 1024 * 1024; // 10MB
  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

  if (file.size > maxSize) {
    throw new Error("Image file too large. Maximum size is 10MB.");
  }

  if (!allowedTypes.includes(file.type)) {
    throw new Error(
      "Invalid image type. Only JPEG, PNG, and WebP are allowed."
    );
  }
};

const validateDocumentFile = (file: File) => {
  const maxSize = 25 * 1024 * 1024; // 25MB
  const allowedTypes = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain",
  ];

  if (file.size > maxSize) {
    throw new Error("Document file too large. Maximum size is 25MB.");
  }

  if (!allowedTypes.includes(file.type)) {
    throw new Error(
      "Invalid document type. Only PDF, DOC, DOCX, and TXT are allowed."
    );
  }
};

export const aiController = new Elysia({
  detail: {
    tags: ["ai"],
    description: "Unified AI API with advanced capabilities",
  },
}).group("/ai", (app) =>
  app
    .use(authPlugin)
    // Rate limit AI endpoints
    // .use(strictRateLimit)
    // Redis-backed limiter for predict endpoints
    .derive(() => {
      const checkPredictLimit = async (
        userId: string,
        operation: string,
        enhanced = false
      ) => {
        const { redisConnection } = await import("@kaa/utils");
        const key = enhanced
          ? `ai:predict:enhanced:${userId}`
          : `ai:predict:rate:${userId}`;
        // const limit = enhanced ? 10 : 5; // Enhanced endpoints get higher limit
        const limit =
          operation === "image_analysis"
            ? 20
            : operation === "document_processing"
              ? 10
              : operation === "valuation"
                ? 15
                : 30;
        const count = await redisConnection.incr(key);
        if (count === 1) {
          await redisConnection.expire(key, 60);
        }
        const ttl = await redisConnection.ttl(key);
        const retryAfter = ttl > 0 ? ttl : 60;
        const allowed = count <= limit;
        return { allowed, retryAfter, remaining: Math.max(0, limit - count) };
      };
      return { checkPredictLimit } as const;
    })

    .post(
      "/chat",
      async ({ body, set }) => {
        try {
          const uiMessages = body.messages || [];

          const result = await streamText({
            model: google("gemini-2.0-flash"),
            messages: convertToModelMessages(uiMessages as any),
          });

          set.status = 200;
          return result.toUIMessageStreamResponse();
        } catch (error: any) {
          set.status = 500;
          return {
            status: "error",
            message: error.message || "Failed to chat with AI",
          };
        }
      },
      {
        body: t.Object({
          messages: t.Array(t.String()),
        }),
        detail: {
          tags: ["ai"],
          summary: "Chat with AI",
          description: "Chat with AI",
        },
      }
    )

    // ===== Property AI Endpoints for Frontend Support =====

    .post(
      "/property/generate/description",
      async ({ body, set }) => {
        try {
          const { openAIService } = await import("@kaa/ai");
          const description = await openAIService.generateDescription(
            body.propertyData,
            body.options
          );

          set.status = 200;
          return {
            status: "success",
            data: { description },
          };
        } catch (error: any) {
          set.status = 500;
          return {
            status: "error",
            message: error.message || "Failed to generate property description",
          };
        }
      },
      {
        body: t.Object({
          propertyData: t.Object({
            basic: t.Optional(
              t.Object({
                title: t.Optional(t.String()),
                description: t.Optional(t.String()),
              })
            ),
            details: t.Optional(
              t.Object({
                bedrooms: t.Optional(t.Number()),
                bathrooms: t.Optional(t.Number()),
                size: t.Optional(t.Number()),
                floor: t.Optional(t.Number()),
              })
            ),
            location: t.Optional(
              t.Object({
                county: t.Optional(t.String()),
                city: t.Optional(t.String()),
                neighborhood: t.Optional(t.String()),
              })
            ),
            pricing: t.Optional(
              t.Object({
                rentAmount: t.Optional(t.Number()),
                deposit: t.Optional(t.Number()),
              })
            ),
            amenities: t.Optional(t.Array(t.String())),
            type: t.Optional(t.String()),
          }),
          options: t.Optional(
            t.Object({
              tone: t.Optional(
                t.Union([
                  t.Literal("professional"),
                  t.Literal("friendly"),
                  t.Literal("luxury"),
                  t.Literal("casual"),
                ])
              ),
              length: t.Optional(
                t.Union([
                  t.Literal("short"),
                  t.Literal("medium"),
                  t.Literal("long"),
                ])
              ),
              includeKeywords: t.Optional(t.Array(t.String())),
              targetAudience: t.Optional(
                t.Union([
                  t.Literal("families"),
                  t.Literal("professionals"),
                  t.Literal("students"),
                  t.Literal("general"),
                ])
              ),
            })
          ),
        }),
        detail: {
          tags: ["ai"],
          summary: "Generate property description using AI",
          description:
            "Generate compelling property descriptions using AI based on property data and customization options",
        },
      }
    )

    .post(
      "/property/analyze-content",
      async ({ body, set }) => {
        try {
          const { openAIService } = await import("@kaa/ai");
          const analysis = await openAIService.analyzeContent(body.content);

          set.status = 200;
          return {
            status: "success",
            data: analysis,
          };
        } catch (error: any) {
          set.status = 500;
          return {
            status: "error",
            message: error.message || "Failed to analyze content",
          };
        }
      },
      {
        body: t.Object({
          content: t.String({
            description:
              "The content to analyze for quality, SEO, and sentiment",
          }),
        }),
        detail: {
          tags: ["ai"],
          summary: "Analyze content quality and provide suggestions",
          description:
            "Analyze text content for quality, readability, SEO, and sentiment with improvement suggestions",
        },
      }
    )

    .post(
      "/property/suggest-pricing",
      async ({ body, set }) => {
        try {
          const { openAIService } = await import("@kaa/ai");
          const pricingSuggestion = await openAIService.suggestPricing(
            body.propertyData
          );

          set.status = 200;
          return {
            status: "success",
            data: pricingSuggestion,
          };
        } catch (error: any) {
          set.status = 500;
          return {
            status: "error",
            message: error.message || "Failed to suggest pricing",
          };
        }
      },
      {
        body: t.Object({
          propertyData: t.Object({
            details: t.Optional(
              t.Object({
                bedrooms: t.Optional(t.Number()),
                bathrooms: t.Optional(t.Number()),
                size: t.Optional(t.Number()),
              })
            ),
            location: t.Optional(
              t.Object({
                county: t.Optional(t.String()),
                city: t.Optional(t.String()),
                neighborhood: t.Optional(t.String()),
              })
            ),
            amenities: t.Optional(t.Array(t.String())),
            type: t.Optional(t.String()),
          }),
        }),
        detail: {
          tags: ["ai"],
          summary: "Get AI-powered pricing suggestions",
          description:
            "Get market-based pricing recommendations with confidence scores and reasoning",
        },
      }
    )

    .post(
      "/property/optimize-seo",
      async ({ body, set }) => {
        try {
          const { openAIService } = await import("@kaa/ai");
          const optimization = await openAIService.optimizeForSEO(
            body.content,
            body.propertyType
          );

          set.status = 200;
          return {
            status: "success",
            data: optimization,
          };
        } catch (error: any) {
          set.status = 500;
          return {
            status: "error",
            message: error.message || "Failed to optimize content for SEO",
          };
        }
      },
      {
        body: t.Object({
          content: t.String({ description: "The content to optimize for SEO" }),
          propertyType: t.String({
            description:
              "The type of property (apartment, house, studio, etc.)",
          }),
        }),
        detail: {
          tags: ["ai"],
          summary: "Optimize content for search engines",
          description:
            "Enhance content for better SEO performance with keyword optimization and improvements",
        },
      }
    )

    .post(
      "/property/market-analysis",
      async ({ body, set }) => {
        try {
          const { openAIService } = await import("@kaa/ai");
          const analysis = await openAIService.getMarketAnalysis(body.location);

          set.status = 200;
          return {
            status: "success",
            data: analysis,
          };
        } catch (error: any) {
          set.status = 500;
          return {
            status: "error",
            message: error.message || "Failed to get market analysis",
          };
        }
      },
      {
        body: t.Object({
          location: t.String({
            description: "The location to analyze (city, county, neighborhood)",
          }),
        }),
        detail: {
          tags: ["ai"],
          summary: "Get rental market analysis",
          description:
            "Get comprehensive market analysis for a specific location",
        },
      }
    )

    .post(
      "/property/recommendations",
      async ({ body, set }) => {
        try {
          const { openAIService } = await import("@kaa/ai");
          const recommendations =
            await openAIService.getPropertyRecommendations(body);

          set.status = 200;
          return {
            status: "success",
            data: recommendations,
          };
        } catch (error: any) {
          set.status = 500;
          return {
            status: "error",
            message: error.message || "Failed to get property recommendations",
          };
        }
      },
      {
        body: t.Object({
          budget: t.Number({ description: "Budget in KES" }),
          location: t.String({ description: "Preferred location" }),
          bedrooms: t.Number({ description: "Number of bedrooms" }),
          amenities: t.Array(t.String(), { description: "Desired amenities" }),
        }),
        detail: {
          tags: ["ai"],
          summary: "Get property recommendations",
          description:
            "Get personalized property recommendations based on preferences",
        },
      }
    )

    .post(
      "/query",
      async ({ body, set }) => {
        try {
          const { openAIService } = await import("@kaa/ai");
          const response = await openAIService.processQuery(
            body.query,
            body.domain || "property",
            body.threadId
          );

          set.status = 200;
          return {
            status: "success",
            data: response,
          };
        } catch (error: any) {
          set.status = 500;
          return {
            status: "error",
            message: error.message || "Failed to process AI query",
          };
        }
      },
      {
        body: t.Object({
          query: t.String({ description: "The user's question or query" }),
          domain: t.Optional(
            t.String({
              description:
                "Domain context (property, document, maintenance, etc.)",
            })
          ),
          threadId: t.Optional(
            t.String({ description: "Thread ID for conversation continuity" })
          ),
        }),
        detail: {
          tags: ["ai"],
          summary: "Process general AI query",
          description:
            "Process general AI queries with domain-specific context",
        },
      }
    )

    // ===== Property Image Analysis =====
    .post(
      "/property/image/analyze",
      async ({ body, user, checkPredictLimit, set }) => {
        // Check rate limit
        const { allowed, retryAfter, remaining } = await checkPredictLimit(
          user.id,
          "image_analysis"
        );
        if (!allowed) {
          set.status = 429;
          set.headers["Retry-After"] = String(retryAfter);
          set.headers["X-RateLimit-Remaining"] = "0";
          return {
            status: "error",
            message: "Rate limit exceeded for image analysis",
            retryAfter,
          };
        }

        set.headers["X-RateLimit-Remaining"] = String(remaining);

        try {
          // Validate image file
          validateImageFile(body.image);

          // Convert file to buffer
          const imageBuffer = Buffer.from(await body.image.arrayBuffer());

          const { openAIService } = await import("@kaa/ai");
          // Analyze the image
          const analysis = await openAIService.analyzePropertyImage(
            imageBuffer,
            body.propertyContext
          );

          set.status = 200;
          return {
            status: "success",
            data: analysis,
            meta: {
              processingTime: Date.now() - Date.now(), // Will be calculated properly
              confidence: analysis.aiConfidence,
            },
          };
        } catch (error: any) {
          logger.error("Property image analysis failed:", error);
          set.status = 500;
          return {
            status: "error",
            message: error.message || "Failed to analyze property image",
          };
        }
      },
      {
        body: t.Object({
          image: t.File({
            type: ["image/jpeg", "image/png", "image/webp"],
            maxSize: 10 * 1024 * 1024, // 10MB
          }),
          propertyContext: t.Optional(t.Any()),
        }),
        detail: {
          tags: ["ai"],
          summary: "Analyze property images using AI vision",
          description:
            "Upload property images and get detailed AI analysis including condition assessment, features detection, and value estimation",
        },
      }
    )

    // ===== Document Processing =====
    .post(
      "/document/process",
      async ({ body, user, checkPredictLimit, set }) => {
        const { allowed, retryAfter, remaining } = await checkPredictLimit(
          user.id,
          "document_processing"
        );
        if (!allowed) {
          set.status = 429;
          set.headers["Retry-After"] = String(retryAfter);
          return {
            status: "error",
            message: "Rate limit exceeded for document processing",
            retryAfter,
          };
        }

        set.headers["X-RateLimit-Remaining"] = String(remaining);

        try {
          validateDocumentFile(body.document);

          const documentBuffer = Buffer.from(await body.document.arrayBuffer());
          const { openAIService } = await import("@kaa/ai");

          const analysis = await openAIService.processDocument(
            documentBuffer,
            body.documentType
          );

          return {
            status: "success",
            data: analysis,
          };
        } catch (error: any) {
          logger.error("Document processing failed:", error);
          set.status = 500;
          return {
            status: "error",
            message: error.message || "Failed to process document",
          };
        }
      },
      {
        body: t.Object({
          document: t.File({
            type: ["application/pdf", "application/msword", "text/plain"],
            maxSize: 25 * 1024 * 1024,
          }),
          documentType: t.Optional(
            t.Union([
              t.Literal("lease"),
              t.Literal("contract"),
              t.Literal("title_deed"),
              t.Literal("certificate"),
              t.Literal("other"),
            ])
          ),
        }),
        detail: {
          tags: ["ai"],
          summary: "Process and analyze property documents",
          description:
            "Extract key information from property documents and check legal compliance",
        },
      }
    )

    // ===== Advanced Property Valuation =====
    .post(
      "/property/valuation/advanced",
      async ({ body, user, checkPredictLimit, set }) => {
        const { allowed, retryAfter, remaining } = await checkPredictLimit(
          user.id,
          "valuation"
        );
        if (!allowed) {
          set.status = 429;
          set.headers["Retry-After"] = String(retryAfter);
          return {
            status: "error",
            message: "Rate limit exceeded for valuations",
            retryAfter,
          };
        }

        set.headers["X-RateLimit-Remaining"] = String(remaining);

        try {
          const valuation =
            await aiIntegrationsService.performAdvancedValuation(body);

          return {
            status: "success",
            data: valuation,
            meta: {
              model: "Advanced ML Valuation",
              confidence: valuation.confidence,
              methodology: valuation.methodology,
            },
          };
        } catch (error: any) {
          logger.error("Advanced valuation failed:", error);
          set.status = 500;
          return {
            status: "error",
            message: error.message || "Failed to perform advanced valuation",
          };
        }
      },
      {
        body: t.Object({
          location: t.Object({
            lat: t.Number(),
            lng: t.Number(),
            county: t.String(),
            city: t.String(),
          }),
          physical: t.Object({
            bedrooms: t.Number(),
            bathrooms: t.Number(),
            size: t.Number(),
            age: t.Optional(t.Number()),
          }),
          features: t.Array(t.String()),
          condition: t.Union([
            t.Literal("excellent"),
            t.Literal("good"),
            t.Literal("fair"),
            t.Literal("poor"),
          ]),
        }),
        detail: {
          tags: ["ai"],
          summary: "Advanced property valuation using AI and market data",
          description:
            "Get comprehensive property valuation with confidence scores and comparable analysis",
        },
      }
    )

    // ===== Real-time Market Insights =====
    .get(
      "/market/insights/:location",
      async ({ params, user, checkPredictLimit, set }) => {
        const { allowed, retryAfter, remaining } = await checkPredictLimit(
          user.id,
          "market_insights"
        );
        if (!allowed) {
          set.status = 429;
          set.headers["Retry-After"] = String(retryAfter);
          return {
            status: "error",
            message: "Rate limit exceeded for market insights",
            retryAfter,
          };
        }

        set.headers["X-RateLimit-Remaining"] = String(remaining);

        try {
          const insights = await aiIntegrationsService.fetchRealTimeMarketData(
            params.location,
            "residential" // Default to residential
          );

          return {
            status: "success",
            data: insights,
            meta: {
              location: params.location,
              lastUpdated: insights.lastUpdated,
              dataSource: insights.dataSource,
            },
          };
        } catch (error: any) {
          logger.error("Market insights failed:", error);
          set.status = 500;
          return {
            status: "error",
            message: error.message || "Failed to get market insights",
          };
        }
      },
      {
        params: t.Object({
          location: t.String(),
        }),
        detail: {
          tags: ["ai"],
          summary: "Get real-time market insights for location",
          description:
            "Fetch current market data, trends, and pricing information for a specific location",
        },
      }
    )

    // ===== Contract Analysis =====
    .post(
      "/contract/analyze",
      async ({ body, user, checkPredictLimit, set }) => {
        const { allowed, retryAfter, remaining } = await checkPredictLimit(
          user.id,
          "contract_analysis"
        );
        if (!allowed) {
          set.status = 429;
          set.headers["Retry-After"] = String(retryAfter);
          return {
            status: "error",
            message: "Rate limit exceeded for contract analysis",
            retryAfter,
          };
        }

        set.headers["X-RateLimit-Remaining"] = String(remaining);

        try {
          const analysis = await aiIntegrationsService.analyzePropertyContract(
            body.contractText,
            body.contractType
          );

          return {
            status: "success",
            data: analysis,
            meta: {
              contractType: body.contractType,
              riskLevel:
                analysis.riskScore >= 70
                  ? "high"
                  : analysis.riskScore >= 40
                    ? "medium"
                    : "low",
            },
          };
        } catch (error: any) {
          logger.error("Contract analysis failed:", error);
          set.status = 500;
          return {
            status: "error",
            message: error.message || "Failed to analyze contract",
          };
        }
      },
      {
        body: t.Object({
          contractText: t.String(),
          contractType: t.Optional(
            t.Union([
              t.Literal("lease"),
              t.Literal("sale"),
              t.Literal("management"),
            ])
          ),
        }),
        detail: {
          tags: ["ai"],
          summary: "AI-powered contract analysis and risk assessment",
          description:
            "Analyze property contracts for legal compliance, risks, and missing clauses",
        },
      }
    )

    // ===== Voice Query Processing =====
    .post(
      "/voice/process",
      async ({ body, user, checkPredictLimit, set }) => {
        const { allowed, retryAfter, remaining } = await checkPredictLimit(
          user.id,
          "voice_processing"
        );
        if (!allowed) {
          set.status = 429;
          set.headers["Retry-After"] = String(retryAfter);
          return {
            status: "error",
            message: "Rate limit exceeded for voice processing",
            retryAfter,
          };
        }

        set.headers["X-RateLimit-Remaining"] = String(remaining);

        try {
          const audioBuffer = Buffer.from(await body.audio.arrayBuffer());

          const result = await aiIntegrationsService.processVoiceQuery(
            audioBuffer,
            body.language
          );

          return {
            status: "success",
            data: result,
            meta: {
              language: body.language,
              processingTime: Date.now() - Date.now(), // Will be calculated properly
            },
          };
        } catch (error: any) {
          logger.error("Voice processing failed:", error);
          set.status = 500;
          return {
            status: "error",
            message: error.message || "Failed to process voice query",
          };
        }
      },
      {
        body: t.Object({
          audio: t.File({
            type: ["audio/wav", "audio/mp3", "audio/webm"],
            maxSize: 10 * 1024 * 1024, // 10MB
          }),
          language: t.Optional(t.String({ default: "en-KE" })),
        }),
        detail: {
          tags: ["ai"],
          summary: "Process voice queries with speech-to-text and AI response",
          description:
            "Convert speech to text and generate AI responses for property-related queries",
        },
      }
    )

    // ===== Streaming AI Chat =====
    .get(
      "/stream/chat",
      ({ query, user, set }) => {
        const {
          conversationId,
          query: chatQuery,
          domain = "property",
          context,
        } = query;

        if (!(conversationId && chatQuery)) {
          set.status = 400;
          return {
            status: "error",
            message: "conversationId and query are required",
          };
        }

        try {
          // Create streaming session
          const session = aiStreamingService.createSession(
            user.id,
            conversationId,
            context ? JSON.parse(context) : undefined
          );

          // Set headers for Server-Sent Events
          set.headers = {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            Connection: "keep-alive",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "Cache-Control",
          };

          // Create async generator for streaming
          const stream = aiStreamingService.streamResponse(
            session.id,
            chatQuery,
            domain
          );

          // Convert to SSE format
          const sseStream = new ReadableStream({
            async start(controller) {
              try {
                for await (const chunk of stream) {
                  const sseData = `data: ${JSON.stringify(chunk)}\n\n`;
                  controller.enqueue(new TextEncoder().encode(sseData));
                }

                // Send completion event
                controller.enqueue(
                  new TextEncoder().encode("data: [DONE]\n\n")
                );
                controller.close();
              } catch (error) {
                logger.error("Streaming error:", error);
                const errorData = `data: ${JSON.stringify({
                  id: `error_${Date.now()}`,
                  type: "error",
                  content: "Streaming failed",
                  timestamp: new Date(),
                })}\n\n`;
                controller.enqueue(new TextEncoder().encode(errorData));
                controller.close();
              }
            },
          });

          return new Response(sseStream, {
            headers: {
              "Content-Type": "text/event-stream",
              "Cache-Control": "no-cache",
              Connection: "keep-alive",
            },
          });
        } catch (error: any) {
          logger.error("Streaming setup failed:", error);
          set.status = 500;
          return {
            status: "error",
            message: error.message || "Failed to start streaming session",
          };
        }
      },
      {
        query: t.Object({
          conversationId: t.String(),
          query: t.String(),
          domain: t.Optional(t.String()),
          context: t.Optional(t.String()),
        }),
        detail: {
          tags: ["ai"],
          summary: "Start streaming AI chat session",
          description:
            "Real-time AI chat with Server-Sent Events for live responses",
        },
      }
    )

    // ===== Smart Property Recommendations =====
    .post(
      "/property/recommendations/smart",
      async ({ body, user, checkPredictLimit, set }) => {
        const { allowed, retryAfter, remaining } = await checkPredictLimit(
          user.id,
          "recommendations"
        );
        if (!allowed) {
          set.status = 429;
          set.headers["Retry-After"] = String(retryAfter);
          return {
            status: "error",
            message: "Rate limit exceeded for recommendations",
            retryAfter,
          };
        }

        set.headers["X-RateLimit-Remaining"] = String(remaining);

        try {
          const recommendations =
            await aiIntegrationsService.getSmartPropertyRecommendations(body);

          return {
            status: "success",
            data: recommendations,
            meta: {
              totalRecommendations: recommendations.length,
              budgetRange: body.budget,
              generatedAt: new Date(),
            },
          };
        } catch (error: any) {
          logger.error("Smart recommendations failed:", error);
          set.status = 500;
          return {
            status: "error",
            message:
              error.message || "Failed to generate property recommendations",
          };
        }
      },
      {
        body: t.Object({
          budget: t.Object({
            min: t.Number(),
            max: t.Number(),
          }),
          preferences: t.Object({
            location: t.Array(t.String()),
            propertyType: t.Array(t.String()),
            bedrooms: t.Array(t.Number()),
            amenities: t.Array(t.String()),
          }),
          lifestyle: t.Array(t.String()),
          workLocation: t.Optional(
            t.Object({
              lat: t.Number(),
              lng: t.Number(),
            })
          ),
          transportation: t.Union([
            t.Literal("car"),
            t.Literal("public"),
            t.Literal("both"),
          ]),
        }),
        detail: {
          tags: ["ai"],
          summary: "Get AI-powered property recommendations",
          description:
            "Generate personalized property recommendations based on user preferences and lifestyle",
        },
      }
    )

    // ===== Legal Compliance Check =====
    .post(
      "/legal/compliance/check",
      async ({ body, user, checkPredictLimit, set }) => {
        const { allowed, retryAfter, remaining } = await checkPredictLimit(
          user.id,
          "compliance_check"
        );
        if (!allowed) {
          set.status = 429;
          set.headers["Retry-After"] = String(retryAfter);
          return {
            status: "error",
            message: "Rate limit exceeded for compliance checks",
            retryAfter,
          };
        }

        set.headers["X-RateLimit-Remaining"] = String(remaining);

        try {
          const compliance =
            await aiIntegrationsService.checkLegalComplianceRealTime(body);

          return {
            status: "success",
            data: compliance,
            meta: {
              complianceLevel:
                compliance.overallCompliance >= 90
                  ? "excellent"
                  : compliance.overallCompliance >= 75
                    ? "good"
                    : compliance.overallCompliance >= 50
                      ? "fair"
                      : "poor",
              criticalIssuesCount: compliance.criticalIssues.length,
            },
          };
        } catch (error: any) {
          logger.error("Legal compliance check failed:", error);
          set.status = 500;
          return {
            status: "error",
            message: error.message || "Failed to check legal compliance",
          };
        }
      },
      {
        body: t.Object({
          id: t.Optional(t.String()),
          propertyData: t.Any(),
          documents: t.Optional(t.Array(t.String())),
        }),
        detail: {
          tags: ["ai"],
          summary: "Check legal compliance for property transactions",
          description:
            "Verify legal compliance with Kenyan property law and identify required documents",
        },
      }
    )

    // ===== Service Statistics =====
    .get(
      "/stats/enhanced",
      async ({ user, set }) => {
        try {
          const streamingStats = aiStreamingService.getSessionStats();
          const { openAIService } = await import("@kaa/ai");
          const cacheStats = openAIService.getCacheStats();

          return {
            status: "success",
            data: {
              streaming: streamingStats,
              cache: cacheStats,
              timestamp: new Date(),
              user: {
                id: user.id,
                requests: "Available in detailed analytics",
              },
            },
          };
        } catch (error: any) {
          logger.error("Failed to get enhanced AI stats:", error);
          set.status = 500;
          return {
            status: "error",
            message: error.message || "Failed to get service statistics",
          };
        }
      },
      {
        detail: {
          tags: ["ai"],
          summary: "Get enhanced AI service statistics",
          description: "Retrieve usage statistics for enhanced AI features",
        },
      }
    )
);
