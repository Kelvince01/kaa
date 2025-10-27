import { AIModel } from "@kaa/models";
import type { IAIModel } from "@kaa/models/types";
import Elysia, { t } from "elysia";
import type mongoose from "mongoose";
import {
  apiKeyPlugin,
  requirePermissions,
} from "#/features/auth/api-key.plugin";
// import { strictRateLimit } from "~/plugins/rate-limit.plugin";
import { aiService, getAIService } from "./ai.service";

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
    .use(apiKeyPlugin)
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

    // ===== Basic Model Management =====

    .get(
      "/models",
      async ({ user, query, set }) => {
        const { page = 1, limit = 10, status } = query;

        const result = await aiService.listModels(user.memberId ?? "", {
          page,
          limit,
          status,
        });

        set.status = 200;
        return {
          status: "success",
          data: {
            items: result.items.map((item: IAIModel) => ({
              ...item.toObject(),
              _id: (item._id as mongoose.Types.ObjectId).toString(),
              memberId: item.memberId?.toString() ?? undefined,
            })),
            pagination: result.pagination,
          },
        };
      },
      {
        query: t.Object({
          page: t.Optional(t.Number()),
          limit: t.Optional(t.Number()),
          status: t.Optional(t.String()),
        }),
        detail: {
          tags: ["ai"],
          summary: "List AI models (paginated)",
          examples: { request: { query: { page: 1, limit: 10 } } },
        },
      }
    )

    .get(
      "/models/:id",
      async ({ params, user, set }) => {
        const model = await AIModel.findOne({
          _id: params.id,
          memberId: user.memberId,
        });

        if (!model) {
          set.status = 404;
          return { status: "error", message: "Model not found" };
        }

        set.status = 200;
        return { status: "success", data: model };
      },
      {
        params: t.Object({ id: t.String() }),
        detail: { tags: ["ai"], summary: "Get AI model by id" },
      }
    )

    // Require admin permissions for model management
    .use(requirePermissions(["ai:admin", "ai:train"]))

    // ===== Model Creation with Enhanced Features =====

    .post(
      "/models",
      async ({ body, user, set }) => {
        // Validate trainingDataSource
        const allowedSources = new Set([
          "properties",
          "internal",
          "synthetic",
          "uploaded",
        ]);
        const source = body.trainingDataSource;
        let isValidSource = false;
        try {
          new URL(source);
          isValidSource = true;
        } catch {
          if (allowedSources.has(source)) isValidSource = true;
        }
        if (!isValidSource) {
          set.status = 400;
          return {
            status: "error",
            message:
              "Invalid trainingDataSource; must be a URL or one of: internal, synthetic, uploaded",
          } as const;
        }

        // Validate algorithm compatibility with type
        const allowedByType: Record<string, Set<string>> = {
          classification: new Set(["dense_nn", "generic"]),
          regression: new Set(["dense_nn", "generic"]),
          clustering: new Set(["generic"]),
          recommendation: new Set(["generic"]),
          nlp: new Set(["lstm", "generic"]),
          custom: new Set(["dense_nn", "lstm", "generic"]),
        };

        if (!allowedByType[body.type]?.has(body.configuration.algorithm)) {
          set.status = 400;
          return {
            status: "error",
            message: `Algorithm ${body.configuration.algorithm} is not compatible with type ${body.type}`,
          } as const;
        }

        try {
          const service = await getAIService();
          const model = await service.createModel(
            {
              ...body,
              createdBy: user.id,
              memberId: user.memberId,
            }
            // user.id
          );

          return {
            status: "success",
            data: model,
            message: "AI model created successfully",
          };
        } catch (error: any) {
          set.status = 500;
          return {
            status: "error",
            message: error.message || "Failed to create model",
          };
        }
      },
      {
        body: t.Object({
          name: t.String(),
          type: t.Enum({
            classification: "classification",
            regression: "regression",
            clustering: "clustering",
            recommendation: "recommendation",
            nlp: "nlp",
            custom: "custom",
          }),
          description: t.Optional(t.String()),
          trainingDataSource: t.String({
            description: "URL or source identifier",
          }),
          configuration: t.Object({
            algorithm: t.Enum({
              dense_nn: "dense_nn",
              lstm: "lstm",
              generic: "generic",
            }),
            parameters: t.Record(t.String(), t.Any()),
            features: t.Array(t.String()),
            target: t.Optional(t.String()),
            textFeatures: t.Optional(t.Array(t.String())),
            useEmbeddings: t.Optional(t.Boolean()),
          }),
          // Enhanced features
          transformers: t.Optional(
            t.Array(
              t.Object({
                feature: t.String(),
                transformers: t.Array(t.String()),
              })
            )
          ),
          incrementalLearning: t.Optional(t.Boolean()),
        }),
        detail: {
          tags: ["ai"],
          summary: "Create AI model with optional enhanced features",
          examples: {
            request: {
              body: {
                name: "Churn Classifier",
                type: "classification",
                description: "Predicts customer churn",
                trainingDataSource: "internal",
                configuration: {
                  algorithm: "dense_nn",
                  parameters: { learningRate: 0.001, numClasses: 3 },
                  features: ["age", "tenure", "spend"],
                  target: "churned",
                  useEmbeddings: true,
                },
                incrementalLearning: true,
              },
            },
          },
        },
      }
    )

    // ===== Model Lifecycle Management =====

    .post(
      "/models/:id/promote",
      async ({ params, set, body }) => {
        try {
          const service = await getAIService();
          await service.promoteModel(params.id, body.version, body.stage);

          return {
            status: "success",
            message: `Model promoted to ${body.stage}`,
          };
        } catch (error: any) {
          set.status = 500;
          return {
            status: "error",
            message: error.message || "Failed to promote model",
          };
        }
      },
      {
        params: t.Object({ id: t.String() }),
        body: t.Object({
          version: t.String(),
          stage: t.Enum({
            development: "development",
            staging: "staging",
            production: "production",
            archived: "archived",
          }),
        }),
        detail: {
          tags: ["ai"],
          summary: "Promote model version to different stage",
        },
      }
    )

    .post(
      "/models/:id/archive",
      async ({ params, body, set }) => {
        try {
          const service = await getAIService();
          const archivedCount = await service.archiveOldVersions(
            params.id,
            body.keepCount
          );

          return {
            status: "success",
            archivedCount,
            message: `Archived ${archivedCount} old versions`,
          };
        } catch (error: any) {
          set.status = 500;
          return {
            status: "error",
            message: error.message || "Failed to archive versions",
          };
        }
      },
      {
        params: t.Object({ id: t.String() }),
        body: t.Object({
          keepCount: t.Optional(t.Number({ default: 5 })),
        }),
        detail: {
          tags: ["ai"],
          summary: "Archive old model versions",
        },
      }
    )

    .get(
      "/models/:id/best-version",
      async ({ params, query, set }) => {
        try {
          const service = await getAIService();
          const bestVersion = await service.getBestVersion(
            params.id,
            query.metric
          );

          return {
            status: "success",
            data: bestVersion,
          };
        } catch (error: any) {
          set.status = 500;
          return {
            status: "error",
            message: error.message || "Failed to get best version",
          };
        }
      },
      {
        params: t.Object({ id: t.String() }),
        query: t.Object({
          metric: t.Optional(t.String({ default: "accuracy" })),
        }),
        detail: {
          tags: ["ai"],
          summary: "Get best performing model version",
        },
      }
    )

    .delete(
      "/models/:id",
      async ({ params, user, set }) => {
        try {
          await aiService.deleteModel(params.id, user.memberId ?? "", user.id);
          return {
            status: "success",
            message: "Model deleted successfully",
          };
        } catch (error: any) {
          set.status = error.message.includes("not found") ? 404 : 500;
          return {
            status: "error",
            message: error.message || "Failed to delete model",
          };
        }
      },
      {
        params: t.Object({ id: t.String() }),
        detail: {
          tags: ["ai"],
          summary: "Delete AI model",
        },
      }
    )

    // ===== Predictions =====

    .post(
      "/models/:id/predict",
      async ({ params, body, checkPredictLimit, user, set }) => {
        // Check rate limit
        const { allowed, retryAfter, remaining } = await checkPredictLimit(
          user.id,
          "predict",
          body.enhanced ?? false
        );
        if (!allowed) {
          set.status = 429;
          set.headers["Retry-After"] = String(retryAfter);
          return {
            status: "error",
            message: "Rate limit exceeded",
            retryAfter,
          };
        }

        try {
          const service = await getAIService();
          const prediction = await service.predict({
            modelId: params.id,
            input: body.input,
            memberId: user.memberId ?? "",
            userId: user.id,
            version: body.version,
            stage: body.stage,
            abTestId: body.abTestId,
          });

          return {
            status: "success",
            data: prediction,
          };
        } catch (error: any) {
          set.status = error.message.includes("not found") ? 404 : 500;
          return {
            status: "error",
            message: error.message || "Prediction failed",
          };
        }
      },
      {
        params: t.Object({ id: t.String() }),
        body: t.Object({
          input: t.Record(t.String(), t.Any()),
          version: t.Optional(t.String()),
          stage: t.Optional(
            t.Enum({
              development: "development",
              production: "production",
              staging: "staging",
            })
          ),
          abTestId: t.Optional(t.String()),
          enhanced: t.Optional(t.Boolean()),
        }),
        detail: {
          tags: ["ai"],
          summary: "Make prediction with model",
          description: "Make prediction with enhanced security and monitoring",
        },
      }
    )

    .post(
      "/models/:id/batch-predict",
      async ({ params, body, user, set }) => {
        try {
          const service = await getAIService();
          const result = await service.batchPredict({
            modelId: params.id,
            inputs: body.inputs,
            memberId: user.memberId ?? "",
            userId: user.id,
            version: body.version,
            stage: body.stage,
          });

          return {
            status: "success",
            data: result,
          };
        } catch (error: any) {
          set.status = error.message.includes("not found") ? 404 : 500;
          return {
            status: "error",
            message: error.message || "Batch prediction failed",
          };
        }
      },
      {
        params: t.Object({ id: t.String() }),
        body: t.Object({
          inputs: t.Array(t.Record(t.String(), t.Any())),
          version: t.Optional(t.String()),
          stage: t.Optional(
            t.Enum({
              production: "production",
              staging: "staging",
            })
          ),
        }),
        detail: {
          tags: ["ai"],
          summary: "Batch prediction with model",
          description: "Process multiple predictions in a single request",
        },
      }
    )

    .get(
      "/models/:id/predictions",
      async ({ params, query, user, set }) => {
        try {
          const service = await getAIService();
          const result = await service.getModelPredictions(
            params.id,
            user.memberId ?? "",
            {
              page: query.page,
              limit: query.limit,
            }
          );

          return {
            status: "success",
            data: result.items,
            pagination: result.pagination,
          };
        } catch (error: any) {
          set.status = 500;
          return {
            status: "error",
            message: error.message || "Failed to get predictions",
          };
        }
      },
      {
        params: t.Object({ id: t.String() }),
        query: t.Object({
          page: t.Optional(t.Number({ default: 1 })),
          limit: t.Optional(t.Number({ default: 10 })),
        }),
        detail: {
          tags: ["ai"],
          summary: "Get model predictions history",
        },
      }
    )

    // ===== Feedback and Learning =====

    .post(
      "/predictions/:id/feedback",
      async ({ params, body, user, set }) => {
        try {
          const service = await getAIService();
          await service.submitFeedback(
            params.id,
            {
              actualValue: body.actualValue,
              isCorrect: body.isCorrect,
              feedback: body.comments,
              providedBy: user.id,
            },
            body.triggerLearning
          );

          return {
            status: "success",
            message: "Feedback submitted successfully",
          };
        } catch (error: any) {
          set.status = error.message.includes("not found") ? 404 : 500;
          return {
            status: "error",
            message: error.message || "Failed to submit feedback",
          };
        }
      },
      {
        params: t.Object({ id: t.String() }),
        body: t.Object({
          actualValue: t.Any(),
          isCorrect: t.Boolean(),
          comments: t.Optional(t.String()),
          triggerLearning: t.Optional(t.Boolean({ default: true })),
        }),
        detail: {
          tags: ["ai"],
          summary: "Submit feedback for prediction",
          description:
            "Submit feedback with optional incremental learning trigger",
        },
      }
    )

    .post(
      "/models/:id/incremental-update",
      async ({ params, set }) => {
        try {
          const service = await getAIService();
          const result = await service.forceIncrementalUpdate(params.id);

          return {
            status: "success",
            data: result,
            message: "Incremental update completed",
          };
        } catch (error: any) {
          set.status = 500;
          return {
            status: "error",
            message: error.message || "Failed to perform incremental update",
          };
        }
      },
      {
        params: t.Object({ id: t.String() }),
        detail: {
          tags: ["ai"],
          summary: "Force incremental learning update",
        },
      }
    )

    .get(
      "/models/:id/incremental-history",
      async ({ params }) => {
        const service = await getAIService();
        const history = service.getIncrementalHistory(params.id);

        return {
          status: "success",
          data: history,
        };
      },
      {
        params: t.Object({ id: t.String() }),
        detail: {
          tags: ["ai"],
          summary: "Get incremental learning history",
        },
      }
    )

    // ===== A/B Testing =====

    .post(
      "/ab-tests",
      async ({ body, set }) => {
        try {
          const service = await getAIService();
          service.startABTest(
            body.testId,
            body.modelA,
            body.modelB,
            body.trafficSplit,
            body.minSamples
          );

          return {
            status: "success",
            message: "A/B test started",
          };
        } catch (error: any) {
          set.status = 500;
          return {
            status: "error",
            message: error.message || "Failed to start A/B test",
          };
        }
      },
      {
        body: t.Object({
          testId: t.String(),
          modelA: t.String(),
          modelB: t.String(),
          trafficSplit: t.Optional(t.Number({ default: 50 })),
          minSamples: t.Optional(t.Number({ default: 100 })),
        }),
        detail: {
          tags: ["ai"],
          summary: "Start A/B test between models",
        },
      }
    )

    .get(
      "/ab-tests/:id",
      async ({ params }) => {
        const service = await getAIService();
        const results = service.getABTestResults(params.id);

        return {
          status: "success",
          data: results,
        };
      },
      {
        params: t.Object({ id: t.String() }),
        detail: {
          tags: ["ai"],
          summary: "Get A/B test results",
        },
      }
    )

    .post(
      "/ab-tests/:id/stop",
      async ({ params }) => {
        const service = await getAIService();
        const results = service.stopABTest(params.id);

        return {
          status: "success",
          data: results,
          message: "A/B test stopped",
        };
      },
      {
        params: t.Object({ id: t.String() }),
        detail: {
          tags: ["ai"],
          summary: "Stop A/B test",
        },
      }
    )

    // ===== Advanced Features =====

    .post(
      "/models/:id/feature-importance",
      async ({ params, body, user, set }) => {
        try {
          const service = await getAIService();
          const importance = await service.calculateFeatureImportance(
            params.id,
            body.sampleData,
            user.memberId
          );

          return {
            status: "success",
            data: importance,
          };
        } catch (error: any) {
          set.status = 500;
          return {
            status: "error",
            message: error.message || "Failed to calculate feature importance",
          };
        }
      },
      {
        params: t.Object({ id: t.String() }),
        body: t.Object({
          sampleData: t.Optional(t.Array(t.Record(t.String(), t.Any()))),
        }),
        detail: {
          tags: ["ai"],
          summary: "Calculate feature importance for model",
        },
      }
    )

    .post(
      "/embeddings/cache/warmup",
      async ({ body, set }) => {
        try {
          const service = await getAIService();
          await service.warmUpEmbeddingCache(body.texts);

          return {
            status: "success",
            message: "Embedding cache warmed up",
          };
        } catch (error: any) {
          set.status = 500;
          return {
            status: "error",
            message: error.message || "Failed to warm up cache",
          };
        }
      },
      {
        body: t.Object({
          texts: t.Array(t.String()),
        }),
        detail: {
          tags: ["ai"],
          summary: "Warm up embedding cache",
        },
      }
    )

    .get(
      "/embeddings/cache/stats",
      async () => {
        const service = await getAIService();
        const stats = service.getEmbeddingCacheStats();

        return {
          status: "success",
          data: stats,
        };
      },
      {
        detail: {
          tags: ["ai"],
          summary: "Get embedding cache statistics",
        },
      }
    )

    .get(
      "/transformers",
      async () => {
        const service = await getAIService();
        const transformers = service.listTransformers();

        return {
          status: "success",
          data: transformers,
        };
      },
      {
        detail: {
          tags: ["ai"],
          summary: "List available feature transformers",
        },
      }
    )

    .post(
      "/transformers",
      async ({ body, set }) => {
        try {
          const service = await getAIService();
          service.registerCustomTransformer(
            body.name,
            body.description,
            body.transformCode,
            body.inputType,
            body.outputDimension
          );

          return {
            status: "success",
            message: "Custom transformer registered",
          };
        } catch (error: any) {
          set.status = 500;
          return {
            status: "error",
            message: error.message || "Failed to register transformer",
          };
        }
      },
      {
        body: t.Object({
          name: t.String(),
          description: t.String(),
          transformCode: t.String(),
          inputType: t.Optional(
            t.Enum({
              numeric: "numeric",
              string: "string",
              boolean: "boolean",
              date: "date",
              any: "any",
            })
          ),
          outputDimension: t.Optional(
            t.Union([t.Number(), t.Literal("variable")])
          ),
        }),
        detail: {
          tags: ["ai"],
          summary: "Register custom feature transformer",
        },
      }
    )

    .post(
      "/models/:id/evaluate",
      async ({ params, body, set }) => {
        try {
          const service = await getAIService();
          const metrics = await service.evaluateModel(
            params.id,
            body.testData,
            body.version
          );

          return {
            status: "success",
            data: metrics,
          };
        } catch (error: any) {
          set.status = 500;
          return {
            status: "error",
            message: error.message || "Failed to evaluate model",
          };
        }
      },
      {
        params: t.Object({ id: t.String() }),
        body: t.Object({
          testData: t.Object({
            features: t.Array(t.Record(t.String(), t.Any())),
            labels: t.Array(t.Any()),
          }),
          version: t.Optional(t.String()),
        }),
        detail: {
          tags: ["ai"],
          summary: "Evaluate model on test data",
        },
      }
    )

    // ===== Enhanced Monitoring & Health =====

    .get(
      "/models/:id/health",
      async ({ params, set }) => {
        try {
          const service = await getAIService();
          const health = await service.getModelHealth(params.id);

          return {
            status: "success",
            data: health,
          };
        } catch (error: any) {
          set.status = 500;
          return {
            status: "error",
            message: error.message || "Failed to get model health",
          };
        }
      },
      {
        params: t.Object({ id: t.String() }),
        detail: {
          tags: ["ai"],
          summary: "Get model health status",
        },
      }
    )

    .get(
      "/models/:id/metrics",
      async ({ params, set }) => {
        try {
          const service = await getAIService();
          const metrics = await service.getModelMetrics(params.id);

          return {
            status: "success",
            data: metrics,
          };
        } catch (error: any) {
          set.status = 500;
          return {
            status: "error",
            message: error.message || "Failed to get model metrics",
          };
        }
      },
      {
        params: t.Object({ id: t.String() }),
        detail: {
          tags: ["ai"],
          summary: "Get comprehensive model metrics",
        },
      }
    )

    .post(
      "/models/:id/drift-detection",
      async ({ params, set }) => {
        try {
          const service = await getAIService();
          const driftReport = await service.detectModelDrift(params.id);

          return {
            status: "success",
            data: driftReport,
          };
        } catch (error: any) {
          set.status = 500;
          return {
            status: "error",
            message: error.message || "Failed to detect model drift",
          };
        }
      },
      {
        params: t.Object({ id: t.String() }),
        detail: {
          tags: ["ai"],
          summary: "Detect model drift",
          description: "Analyze recent predictions for data drift",
        },
      }
    )

    // ===== Enhanced Deployment =====

    .post(
      "/models/:id/deploy",
      async ({ params, body, set }) => {
        try {
          const service = await getAIService();
          const deploymentId = await service.deployModel(
            params.id,
            body.version,
            body.stage,
            body.strategy
          );

          return {
            status: "success",
            data: { deploymentId },
            message: "Model deployment started",
          };
        } catch (error: any) {
          set.status = 500;
          return {
            status: "error",
            message: error.message || "Failed to deploy model",
          };
        }
      },
      {
        params: t.Object({ id: t.String() }),
        body: t.Object({
          version: t.String(),
          stage: t.Enum({
            development: "development",
            staging: "staging",
            production: "production",
            archived: "archived",
          }),
          strategy: t.Optional(
            t.Enum({
              blue_green: "blue_green",
              canary: "canary",
              rolling: "rolling",
              immediate: "immediate",
            })
          ),
        }),
        detail: {
          tags: ["ai"],
          summary: "Deploy model with advanced strategies",
        },
      }
    )

    .post(
      "/models/:id/rollback",
      async ({ params, body, set }) => {
        try {
          const service = await getAIService();
          await service.rollbackModel(params.id, body.targetVersion);

          return {
            status: "success",
            message: "Model rolled back successfully",
          };
        } catch (error: any) {
          set.status = 500;
          return {
            status: "error",
            message: error.message || "Failed to rollback model",
          };
        }
      },
      {
        params: t.Object({ id: t.String() }),
        body: t.Object({
          targetVersion: t.String(),
        }),
        detail: {
          tags: ["ai"],
          summary: "Rollback model to previous version",
        },
      }
    )

    // ===== AutoML =====

    .post(
      "/automl/train",
      async ({ body, set }) => {
        try {
          const service = await getAIService();
          const result = await service.autoTrainModel(
            body.dataset,
            body.task,
            body.constraints
          );

          return {
            status: "success",
            data: result,
            message: "AutoML training completed",
          };
        } catch (error: any) {
          set.status = 500;
          return {
            status: "error",
            message: error.message || "AutoML training failed",
          };
        }
      },
      {
        body: t.Object({
          dataset: t.Object({
            features: t.Array(t.Record(t.String(), t.Any())),
            labels: t.Optional(t.Array(t.Any())),
            metadata: t.Object({
              size: t.Number(),
              featureCount: t.Number(),
              targetType: t.Optional(t.String()),
              hasNulls: t.Boolean(),
              imbalanced: t.Optional(t.Boolean()),
            }),
          }),
          task: t.Enum({
            classification: "classification",
            regression: "regression",
            clustering: "clustering",
            time_series: "time_series",
            nlp: "nlp",
          }),
          constraints: t.Object({
            maxTrainingTime: t.Number(),
            maxTrials: t.Number(),
            earlyStoppingPatience: t.Number(),
            validationSplit: t.Number(),
          }),
        }),
        detail: {
          tags: ["ai"],
          summary: "Auto-train model using AutoML",
          description:
            "Automatically find the best model architecture and hyperparameters",
        },
      }
    )

    .get(
      "/health",
      async ({ set }) => {
        try {
          const service = await getAIService();
          const healthStatus = await service.getHealthStatus();
          return {
            status: "success",
            data: healthStatus,
          };
        } catch (error: any) {
          set.status = 500;
          return {
            status: "error",
            message: error.message || "Failed to get health status",
          };
        }
      },
      {
        detail: {
          tags: ["ai"],
          summary: "Get AI service health status",
          description:
            "Returns the overall health status of the AI/ML service including component services, model counts, and performance metrics.",
        },
      }
    )

    // ===== Service Statistics =====

    .get(
      "/stats",
      async () => {
        const service = await getAIService();
        const stats = service.getServiceStats();

        return {
          status: "success",
          data: stats,
        };
      },
      {
        detail: {
          tags: ["ai"],
          summary: "Get comprehensive AI service statistics",
        },
      }
    )
);
