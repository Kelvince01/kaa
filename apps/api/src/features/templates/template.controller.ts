import { TemplateService } from "@kaa/services";
import { TemplateEngine } from "@kaa/services/engines";
import { AppError, logger } from "@kaa/utils";
import Elysia, { t } from "elysia";
import type mongoose from "mongoose";
import ShortUniqueId from "short-unique-id";
import { authPlugin } from "~/features/auth/auth.plugin";
import {
  BatchRenderRequestSchema,
  CacheStatsResponseSchema,
  CategoriesResponseSchema,
  FileExportRequestSchema,
  FileExportResponseSchema,
  FileImportRequestSchema,
  FileImportResponseSchema,
  RenderingListQuerySchema,
  RenderingListResponseSchema,
  SMSPreviewResponseSchema,
  TemplateCreateSchema,
  TemplateIdParamsSchema,
  TemplateListQuerySchema,
  TemplateListResponseSchema,
  TemplatePreviewRequestSchema,
  TemplatePreviewResponseSchema,
  TemplateRenderingResponseSchema,
  TemplateRenderRequestSchema,
  TemplateResponseSchema,
  TemplateUpdateSchema,
  TypesResponseSchema,
  UsageTrackingSchema,
} from "./template.schema";

const uid = new ShortUniqueId({ length: 10 });

export const templatesController = new Elysia({ prefix: "/templates" })
  .use(authPlugin)
  // .use(accessPlugin)

  // Get templates
  .get(
    "/",
    async ({ query, user, set }) => {
      try {
        set.status = 200;
        const result = await TemplateService.getTemplates(query, user.id);
        return {
          status: "success",
          templates: result.templates.map(
            (template) =>
              ({
                ...template,
                _id: (template._id as mongoose.Types.ObjectId).toString(),
                usage: {
                  ...template.usage,
                  lastUsedAt: template?.usage?.lastUsedAt?.toISOString(),
                },
                createdAt: template.createdAt.toISOString(),
                updatedAt: template.updatedAt.toISOString(),
                metadata: template.metadata as any,
              }) as any
          ),
          pagination: result.pagination,
        };
      } catch (error) {
        logger.error("Error getting templates:", error);
        set.status = 500;
        return {
          status: "error",
          message: (error as Error).message,
        };
      }
    },
    {
      query: TemplateListQuerySchema,
      response: {
        200: t.Object({
          status: t.Literal("success"),
          ...TemplateListResponseSchema.properties,
        }),
        500: t.Object({
          status: t.Literal("error"),
          message: t.String(),
        }),
      },
      detail: {
        summary: "Get templates",
        description:
          "Get a paginated list of templates with optional filtering",
        tags: ["templates"],
      },
    }
  )

  // Create template
  .post(
    "/",
    async ({ body, user, set }) => {
      try {
        set.status = 201;
        const template = await TemplateService.createTemplate(body, user.id);
        return {
          status: "success",
          data: {
            ...template,
            _id: (template._id as mongoose.Types.ObjectId).toString(),
            createdAt: template.createdAt.toISOString(),
            updatedAt: template.updatedAt.toISOString(),
          },
          message: "Template created successfully",
        };
      } catch (error) {
        logger.error("Error creating template:", error);
        set.status = 500;
        return {
          status: "error",
          message: (error as Error).message,
        };
      }
    },
    {
      body: TemplateCreateSchema,
      response: {
        201: t.Object({
          status: t.Literal("success"),
          data: TemplateResponseSchema,
          message: t.String(),
        }),
        500: t.Object({
          status: t.Literal("error"),
          message: t.String(),
        }),
      },
      detail: {
        summary: "Create template",
        description: "Create a new template",
        tags: ["templates"],
      },
    }
  )

  // Get template by ID
  .get(
    "/:id",
    async ({ params, set }) => {
      try {
        const template = await TemplateService.getTemplateById(params.id);

        if (!template) {
          set.status = 404;
          return {
            status: "error",
            message: "Template not found",
          };
        }

        set.status = 200;
        return {
          status: "success",
          data: {
            ...template,
            _id: (template._id as mongoose.Types.ObjectId).toString(),
            createdAt: template.createdAt.toISOString(),
            updatedAt: template.updatedAt.toISOString(),
          } as any,
        };
      } catch (error) {
        logger.error("Error getting template:", error);
        set.status = 500;
        return {
          status: "error",
          message: (error as Error).message,
        };
      }
    },
    {
      params: TemplateIdParamsSchema,
      response: {
        200: t.Object({
          status: t.Literal("success"),
          data: TemplateResponseSchema,
        }),
        404: t.Object({
          status: t.Literal("error"),
          message: t.String(),
        }),
        500: t.Object({
          status: t.Literal("error"),
          message: t.String(),
        }),
      },
      detail: {
        summary: "Get template by ID",
        description: "Get a specific template by its ID",
        tags: ["templates"],
      },
    }
  )

  // Update template
  .put(
    "/:id",
    async ({ params, body, user, set }) => {
      try {
        set.status = 200;
        const template = await TemplateService.updateTemplate(
          params.id,
          body,
          user.id
        );
        return {
          status: "success",
          data: {
            ...template,
            _id: (template._id as mongoose.Types.ObjectId).toString(),
            createdAt: template.createdAt.toISOString(),
            updatedAt: template.updatedAt.toISOString(),
          } as any,
          message: "Template updated successfully",
        };
      } catch (error) {
        logger.error("Error updating template:", error);
        set.status = 500;
        return {
          status: "error",
          message: (error as Error).message,
        };
      }
    },
    {
      params: TemplateIdParamsSchema,
      body: TemplateUpdateSchema,
      response: {
        200: t.Object({
          status: t.Literal("success"),
          data: TemplateResponseSchema,
          message: t.String(),
        }),
        500: t.Object({
          status: t.Literal("error"),
          message: t.String(),
        }),
      },
      detail: {
        summary: "Update template",
        description: "Update an existing template",
        tags: ["templates"],
      },
    }
  )

  // Delete template
  .delete(
    "/:id",
    async ({ params, user, set }) => {
      try {
        set.status = 200;
        await TemplateService.deleteTemplate(params.id, user.id);
        return {
          status: "success",
          message: "Template deleted successfully",
        };
      } catch (error) {
        logger.error("Error deleting template:", error);
        set.status = 500;
        return {
          status: "error",
          message: (error as Error).message,
        };
      }
    },
    {
      params: TemplateIdParamsSchema,
      response: {
        200: t.Object({
          status: t.Literal("success"),
          message: t.String(),
        }),
        500: t.Object({
          status: t.Literal("error"),
          message: t.String(),
        }),
      },
      detail: {
        summary: "Delete template",
        description: "Delete a template",
        tags: ["templates"],
      },
    }
  )

  // Duplicate template
  .post(
    "/:id/duplicate",
    async ({ params, user, set }) => {
      try {
        const template = await TemplateService.duplicateTemplate(
          params.id,
          user.id
        );

        set.status = 201;
        return {
          status: "success",
          data: {
            ...template,
            _id: (template._id as mongoose.Types.ObjectId).toString(),
            createdAt: template.createdAt.toISOString(),
            updatedAt: template.updatedAt.toISOString(),
          },
          message: "Template duplicated successfully",
        };
      } catch (error) {
        logger.error("Error duplicating template:", error);
        set.status = 500;
        return {
          status: "error",
          message: (error as Error).message,
        };
      }
    },
    {
      params: TemplateIdParamsSchema,
      response: {
        201: t.Object({
          status: t.Literal("success"),
          data: TemplateResponseSchema,
          message: t.String(),
        }),
        500: t.Object({
          status: t.Literal("error"),
          message: t.String(),
        }),
      },
      detail: {
        summary: "Duplicate template",
        description: "Create a copy of an existing template",
        tags: ["templates"],
      },
    }
  )

  // Get template categories
  .get(
    "/categories",
    async ({ set }) => {
      try {
        const categories = await TemplateService.getCategories();

        set.status = 200;
        return {
          status: "success",
          data: categories,
        };
      } catch (error) {
        logger.error("Error getting categories:", error);
        set.status = 500;
        return {
          status: "error",
          message: (error as Error).message,
        };
      }
    },
    {
      response: {
        200: t.Object({
          status: t.Literal("success"),
          data: CategoriesResponseSchema,
        }),
        500: t.Object({
          status: t.Literal("error"),
          message: t.String(),
        }),
      },
      detail: {
        summary: "Get template categories",
        description: "Get all available template categories",
        tags: ["templates"],
      },
    }
  )

  // Get template types
  .get(
    "/types",
    async ({ set }) => {
      try {
        const types = await TemplateService.getTypes();

        set.status = 200;
        return {
          status: "success",
          data: types,
        };
      } catch (error) {
        logger.error("Error getting types:", error);
        set.status = 500;
        return {
          status: "error",
          message: (error as Error).message,
        };
      }
    },
    {
      response: {
        200: t.Object({
          status: t.Literal("success"),
          data: TypesResponseSchema,
        }),
        500: t.Object({
          status: t.Literal("error"),
          message: t.String(),
        }),
      },
      detail: {
        summary: "Get template types",
        description: "Get all available template types",
        tags: ["templates"],
      },
    }
  )

  // Render template
  .post(
    "/render",
    async ({ body, user, headers, set }) => {
      try {
        const requestId = uid.randomUUID();
        const ipAddress =
          headers["x-forwarded-for"] || headers["x-real-ip"] || "unknown";
        const userAgent = headers["user-agent"] || "unknown";

        const rendering = await TemplateService.renderTemplate(body, user.id, {
          requestId,
          ipAddress: ipAddress as string,
          userAgent: userAgent as string,
        });

        set.status = 200;
        return {
          status: "success",
          data: {
            ...rendering,
            _id: rendering._id.toString(),
            templateId: rendering.templateId.toString(),
            templateVersion: rendering.templateVersion,
            status: rendering.status,
            input: rendering.input,
            output: rendering.output,
            error: rendering.error,
            metadata: {
              ...rendering.metadata,
              userId: rendering.metadata.userId.toString(),
            },
            createdAt: rendering.createdAt.toISOString(),
            updatedAt: rendering.updatedAt.toISOString(),
          },
          message: "Template rendered successfully",
        };
      } catch (error) {
        logger.error("Error rendering template:", error);
        set.status = 500;
        return {
          status: "error",
          message: (error as Error).message,
        };
      }
    },
    {
      body: TemplateRenderRequestSchema,
      response: {
        200: t.Object({
          status: t.Literal("success"),
          data: TemplateRenderingResponseSchema,
          message: t.String(),
        }),
        500: t.Object({
          status: t.Literal("error"),
          message: t.String(),
        }),
      },
      detail: {
        summary: "Render template",
        description: "Render a template with provided data",
        tags: ["rendering"],
      },
    }
  )

  // Render specific template by ID
  .post(
    "/:id/render",
    async ({ params, body, user, headers, set }) => {
      try {
        const requestId = uid.randomUUID();
        const ipAddress =
          headers["x-forwarded-for"] || headers["x-real-ip"] || "unknown";
        const userAgent = headers["user-agent"] || "unknown";

        const renderRequest = {
          ...body,
          templateId: params.id,
        };

        const rendering = await TemplateService.renderTemplate(
          renderRequest,
          user.id,
          {
            requestId,
            ipAddress: ipAddress as string,
            userAgent: userAgent as string,
          }
        );

        set.status = 200;
        return {
          status: "success",
          data: {
            ...rendering,
            _id: rendering._id.toString(),
            templateId: rendering.templateId.toString(),
            templateVersion: rendering.templateVersion,
            status: rendering.status,
            input: rendering.input,
            output: rendering.output,
            error: rendering.error,
            metadata: {
              ...rendering.metadata,
              userId: rendering.metadata.userId.toString(),
            },
            createdAt: rendering.createdAt.toISOString(),
            updatedAt: rendering.updatedAt.toISOString(),
          },
          message: "Template rendered successfully",
        };
      } catch (error) {
        logger.error("Error rendering template:", error);
        set.status = 500;
        return {
          status: "error",
          message: (error as Error).message,
        };
      }
    },
    {
      params: TemplateIdParamsSchema,
      body: t.Object({
        data: t.Record(t.String(), t.Any()),
        options: t.Optional(
          t.Object({
            format: t.Optional(
              t.Union(
                [
                  t.Literal("html"),
                  t.Literal("pdf"),
                  t.Literal("text"),
                  t.Literal("docx"),
                  t.Literal("xlsx"),
                ],
                { default: "html" }
              )
            ),
            theme: t.Optional(t.String({ maxLength: 50 })),
            language: t.Optional(t.String({ maxLength: 10 })),
          })
        ),
      }),
      response: {
        200: t.Object({
          status: t.Literal("success"),
          data: TemplateRenderingResponseSchema,
          message: t.String(),
        }),
        500: t.Object({
          status: t.Literal("error"),
          message: t.String(),
        }),
      },
      detail: {
        summary: "Render specific template",
        description: "Render a specific template by ID with provided data",
        tags: ["rendering"],
      },
    }
  )

  // Batch render templates
  .post(
    "/batch-render",
    async ({ body, user, headers, set }) => {
      try {
        const requestId = uid.randomUUID();
        const ipAddress =
          headers["x-forwarded-for"] || headers["x-real-ip"] || "unknown";
        const userAgent = headers["user-agent"] || "unknown";

        const renderings = await TemplateService.batchRender(body, user.id, {
          requestId,
          ipAddress: ipAddress as string,
          userAgent: userAgent as string,
        });

        set.status = 200;
        return {
          status: "success",
          data: renderings.map((rendering) => ({
            ...rendering,
            _id: rendering._id.toString(),
            templateId: rendering.templateId.toString(),
            templateVersion: rendering.templateVersion,
            status: rendering.status,
            input: rendering.input,
            output: rendering.output,
            error: rendering.error,
            metadata: {
              ...rendering.metadata,
              userId: rendering.metadata.userId.toString(),
            },
            createdAt: rendering.createdAt.toISOString(),
            updatedAt: rendering.updatedAt.toISOString(),
          })),
          message: "Templates rendered successfully",
        };
      } catch (error) {
        logger.error("Error batch rendering templates:", error);
        set.status = 500;
        return {
          status: "error",
          message: (error as Error).message,
        };
      }
    },
    {
      body: BatchRenderRequestSchema,
      response: {
        200: t.Object({
          status: t.Literal("success"),
          data: t.Array(TemplateRenderingResponseSchema),
          message: t.String(),
        }),
        500: t.Object({
          status: t.Literal("error"),
          message: t.String(),
        }),
      },
      detail: {
        summary: "Batch render templates",
        description: "Render multiple templates in a single request",
        tags: ["rendering"],
      },
    }
  )

  // Get renderings
  .get(
    "/renders",
    async ({ query, user, set }) => {
      try {
        const result = await TemplateService.getUserRenderings(
          user.id,
          query.page ? Number(query.page) : 1,
          query.limit ? Number(query.limit) : 20
        );

        set.status = 200;
        return {
          status: "success",
          data: {
            ...result,
            renderings: result.renderings.map((rendering) => ({
              ...rendering,
              _id: rendering._id.toString(),
              templateId: rendering.templateId.toString(),
              templateVersion: rendering.templateVersion,
              status: rendering.status,
              input: rendering.input,
              output: rendering.output,
              error: rendering.error,
              metadata: {
                ...rendering.metadata,
                userId: rendering.metadata.userId.toString(),
              },
              createdAt: rendering.createdAt.toISOString(),
              updatedAt: rendering.updatedAt.toISOString(),
            })),
          },
        };
      } catch (error) {
        logger.error("Error getting renderings:", error);
        set.status = 500;
        return {
          status: "error",
          message: (error as Error).message,
        };
      }
    },
    {
      query: RenderingListQuerySchema,
      response: {
        200: t.Object({
          status: t.Literal("success"),
          data: RenderingListResponseSchema,
        }),
        500: t.Object({
          status: t.Literal("error"),
          message: t.String(),
        }),
      },
      detail: {
        summary: "Get renderings",
        description:
          "Get a paginated list of template renderings for the current user",
        tags: ["rendering"],
      },
    }
  )

  // Get rendering details
  .get(
    "/renders/:id",
    async ({ params, set }) => {
      try {
        const rendering = await TemplateService.getRenderingById(params.id);

        if (!rendering) {
          set.status = 404;
          return {
            status: "error",
            message: "Rendering not found",
          };
        }

        set.status = 200;
        return {
          status: "success",
          data: {
            ...rendering,
            _id: rendering._id.toString(),
            templateId: rendering.templateId.toString(),
            templateVersion: rendering.templateVersion,
            status: rendering.status,
            input: rendering.input,
            output: rendering.output,
            error: rendering.error,
            metadata: {
              ...rendering.metadata,
              userId: rendering.metadata.userId.toString(),
            },
            createdAt: rendering.createdAt.toISOString(),
            updatedAt: rendering.updatedAt.toISOString(),
          },
        };
      } catch (error) {
        logger.error("Error getting rendering:", error);
        set.status = 500;
        return {
          status: "error",
          message: (error as Error).message,
        };
      }
    },
    {
      params: TemplateIdParamsSchema,
      response: {
        200: t.Object({
          status: t.Literal("success"),
          data: TemplateRenderingResponseSchema,
        }),
        500: t.Object({
          status: t.Literal("error"),
          message: t.String(),
        }),
      },
      detail: {
        summary: "Get rendering details",
        description: "Get details of a specific template rendering",
        tags: ["templates"],
      },
    }
  )

  // Preview template
  .post(
    "/preview",
    async ({ body, set }) => {
      try {
        const result = await TemplateService.previewTemplate(body);

        set.status = 200;
        return {
          status: "success",
          data: result as any,
        };
      } catch (error) {
        logger.error("Error previewing template:", error);
        set.status = 500;
        return {
          status: "error",
          message: (error as Error).message,
        };
      }
    },
    {
      body: TemplatePreviewRequestSchema,
      response: {
        200: t.Object({
          status: t.Literal("success"),
          data: TemplatePreviewResponseSchema,
        }),
        500: t.Object({
          status: t.Literal("error"),
          message: t.String(),
        }),
      },
      detail: {
        summary: "Preview template",
        description:
          "Preview a template with sample data without saving the rendering",
        tags: ["templates"],
      },
    }
  )

  // Preview template by ID
  .get(
    "/:id/preview",
    async ({ params, set }) => {
      try {
        // Generate sample data from template variables
        const template = await TemplateService.getTemplateById(params.id);
        const sampleData = TemplateEngine.generateSampleData(
          template.variables
        );

        const result = await TemplateService.previewTemplate({
          templateId: params.id,
          data: sampleData,
        });

        set.status = 200;
        return {
          status: "success",
          data: {
            ...result,
            sampleData,
          } as any,
        };
      } catch (error) {
        logger.error("Error previewing template:", error);
        set.status = 500;
        return {
          status: "error",
          message: (error as Error).message,
        };
      }
    },
    {
      params: TemplateIdParamsSchema,
      response: {
        200: t.Object({
          status: t.Literal("success"),
          data: t.Object({
            subject: t.String(),
            content: t.String(),
            renderTime: t.Number(),
            sampleData: t.Record(t.String(), t.Any()),
          }),
        }),
        500: t.Object({
          status: t.Literal("error"),
          message: t.String(),
        }),
      },
      detail: {
        summary: "Preview template with sample data",
        description:
          "Preview a template using automatically generated sample data based on its variables",
        tags: ["templates"],
      },
    }
  )

  // Send test email (if email category)
  .post(
    "/:id/test",
    async ({ params, body, set }) => {
      try {
        const template = await TemplateService.getTemplateById(params.id);

        if (template.category !== "email") {
          set.status = 400;
          return {
            status: "error",
            message: "Template must be of email category to send test email",
          };
        }

        // For now, just render the template
        // In a full implementation, this would integrate with the email service
        const result = await TemplateService.previewTemplate({
          templateId: params.id,
          data:
            body.data || TemplateEngine.generateSampleData(template.variables),
        });

        set.status = 200;
        return {
          status: "success",
          data: {
            message: "Test email would be sent with this content",
            preview: result,
          } as any,
          message: "Test email prepared successfully",
        };
      } catch (error) {
        logger.error("Error preparing test email:", error);
        set.status = 500;
        return {
          status: "error",
          message: (error as Error).message,
        };
      }
    },
    {
      params: TemplateIdParamsSchema,
      body: t.Object({
        data: t.Optional(t.Record(t.String(), t.Any())),
        recipients: t.Optional(t.Array(t.String({ format: "email" }))),
      }),
      response: {
        200: t.Object({
          status: t.Literal("success"),
          data: t.Object({
            message: t.String(),
            preview: TemplatePreviewResponseSchema,
          }),
          message: t.String(),
        }),
        500: t.Object({
          status: t.Literal("error"),
          message: t.String(),
        }),
      },
      detail: {
        summary: "Send test email",
        description:
          "Send a test email using the template (currently returns preview)",
        tags: ["templates"],
      },
    }
  )

  // SMS Preview endpoint
  .post(
    "/:id/sms-preview",
    async ({ params, body, set }) => {
      try {
        const result = await TemplateService.previewSMSTemplate(
          params.id,
          body.sampleData
        );

        set.status = 200;
        return {
          status: "success",
          data: result,
          message: "SMS template preview generated successfully",
        };
      } catch (error) {
        logger.error("Error previewing SMS template:", error);
        set.status = 500;
        return {
          status: "error",
          message: (error as Error).message,
        };
      }
    },
    {
      params: TemplateIdParamsSchema,
      body: t.Object({
        sampleData: t.Record(t.String(), t.Any()),
      }),
      response: {
        200: t.Object({
          status: t.Literal("success"),
          data: SMSPreviewResponseSchema,
          message: t.String(),
        }),
        500: t.Object({
          status: t.Literal("error"),
          message: t.String(),
        }),
      },
      detail: {
        summary: "Preview SMS template",
        description:
          "Preview SMS template with SMS-specific metadata (segments, cost, etc.)",
        tags: ["templates"],
      },
    }
  )

  // File Import endpoint
  .post(
    "/import",
    async ({ body, set }) => {
      try {
        const result = await TemplateService.importTemplatesFromFiles(body);

        set.status = 200;
        return {
          status: "success",
          data: result,
          message: `Import completed: ${result.success} successful, ${result.failed} failed`,
        };
      } catch (error) {
        logger.error("Error importing templates:", error);
        set.status = 500;
        return {
          status: "error",
          message: (error as Error).message,
        };
      }
    },
    {
      body: FileImportRequestSchema,
      response: {
        200: t.Object({
          status: t.Literal("success"),
          data: FileImportResponseSchema,
          message: t.String(),
        }),
        500: t.Object({
          status: t.Literal("error"),
          message: t.String(),
        }),
      },
      detail: {
        summary: "Import templates from files",
        description:
          "Import templates from filesystem (supports .hbs, .ejs, .pug files)",
        tags: ["templates"],
      },
    }
  )

  // File Export endpoint
  .post(
    "/export",
    async ({ body, set }) => {
      try {
        const result = await TemplateService.exportTemplatesToFiles(body);

        set.status = 200;
        return {
          status: "success",
          data: result,
          message: `Export completed: ${result.exportedCount} templates exported`,
        };
      } catch (error) {
        logger.error("Error exporting templates:", error);
        set.status = 500;
        return {
          status: "error",
          message: (error as Error).message,
        };
      }
    },
    {
      body: FileExportRequestSchema,
      response: {
        200: t.Object({
          status: t.Literal("success"),
          data: FileExportResponseSchema,
          message: t.String(),
        }),
        500: t.Object({
          status: t.Literal("error"),
          message: t.String(),
        }),
      },
      detail: {
        summary: "Export templates to files",
        description:
          "Export templates to filesystem (supports JSON, .hbs, .ejs, .pug formats)",
        tags: ["templates"],
      },
    }
  )

  /**
   * Get template variable types
   */
  .get(
    "/meta/variable-types",
    () => ({
      success: true,
      data: ["string", "number", "boolean", "date", "array", "object"],
      message: "Template variable types retrieved successfully",
    }),
    {
      detail: {
        tags: ["templates"],
        summary: "Get template variable types",
        description: "Get all supported template variable types",
      },
    }
  )

  /**
   * Get template engine types
   */
  .get(
    "/meta/engines",
    () => ({
      success: true,
      data: ["handlebars", "mjml", "ejs", "pug", "nunjucks", "raw"],
      message: "Template engines retrieved successfully",
    }),
    {
      detail: {
        tags: ["templates"],
        summary: "Get template engines",
        description: "Get all supported template engines",
      },
    }
  )

  // Cache Statistics endpoint
  .get(
    "/meta/cache",
    ({ set }) => {
      try {
        const stats = TemplateEngine.getCacheStats();

        set.status = 200;
        return {
          status: "success",
          data: stats,
          message: "Cache statistics retrieved successfully",
        };
      } catch (error) {
        logger.error("Error getting cache statistics:", error);
        set.status = 500;
        return {
          status: "error",
          message: (error as Error).message,
        };
      }
    },
    {
      response: {
        200: t.Object({
          status: t.Literal("success"),
          data: CacheStatsResponseSchema,
          message: t.String(),
        }),
        500: t.Object({
          status: t.Literal("error"),
          message: t.String(),
        }),
      },
      detail: {
        summary: "Get cache statistics",
        description: "Get template engine cache statistics",
        tags: ["templates"],
      },
    }
  )

  // Clear Cache endpoint
  .delete(
    "/meta/cache",
    ({ set }) => {
      try {
        TemplateEngine.clearCache();

        set.status = 200;
        return {
          status: "success",
          message: "Template cache cleared successfully",
        };
      } catch (error) {
        logger.error("Error clearing cache:", error);
        set.status = 500;
        return {
          status: "error",
          message: (error as Error).message,
        };
      }
    },
    {
      response: {
        200: t.Object({
          status: t.Literal("success"),
          message: t.String(),
        }),
        500: t.Object({
          status: t.Literal("error"),
          message: t.String(),
        }),
      },
      detail: {
        summary: "Clear template cache",
        description: "Clear all compiled template cache",
        tags: ["templates"],
      },
    }
  )

  // Template Usage Statistics endpoint
  .get(
    "/:id/usage",
    async ({ params, set }) => {
      try {
        const stats = await TemplateService.getTemplateUsageStats(params.id);

        set.status = 200;
        return {
          status: "success",
          data: {
            ...stats,
            lastUsedAt: stats.lastUsedAt?.toISOString(),
            usageHistory: stats.usageHistory.map((entry) => ({
              ...entry,
              date: entry.date.toISOString(),
            })),
          },
          message: "Template usage statistics retrieved successfully",
        };
      } catch (error) {
        logger.error("Error getting template usage stats:", error);
        set.status = 500;
        return {
          status: "error",
          message: (error as Error).message,
        };
      }
    },
    {
      params: TemplateIdParamsSchema,
      response: {
        200: t.Object({
          status: t.Literal("success"),
          data: UsageTrackingSchema,
          message: t.String(),
        }),
        500: t.Object({
          status: t.Literal("error"),
          message: t.String(),
        }),
      },
      detail: {
        summary: "Get template usage statistics",
        description: "Get usage statistics for a specific template",
        tags: ["templates"],
      },
    }
  )

  .onError(({ error }) => {
    if (error instanceof AppError) {
      return {
        status: "error",
        error: {
          message: error.message,
          code: error.statusCode,
        },
      };
    }

    logger.error("Unhandled error in template controller:", error);

    return {
      status: "error",
      error: {
        message: "Internal server error",
        code: 500,
      },
    };
  });
