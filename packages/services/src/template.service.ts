import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { Template, TemplateRendering } from "@kaa/models";
import type {
  IBatchRenderRequest,
  ITemplate,
  ITemplateCreateRequest,
  ITemplateListQuery,
  ITemplatePreviewRequest,
  ITemplateRendering,
  ITemplateRenderRequest,
  ITemplateUpdateRequest,
  TemplateCategory,
  TemplateEngineType,
  TemplateFormat,
  TemplateRenderResult,
  TemplateVersion,
} from "@kaa/models/types";
import { AppError, logger, NotFoundError, ValidationError } from "@kaa/utils";
import mongoose, {
  type FilterQuery,
  type ObjectId,
  type SortOrder,
} from "mongoose";
import ShortUniqueId from "short-unique-id";
import { TemplateEngine, unescapeMJML } from "./engines/template.engine";

const uid = new ShortUniqueId({ length: 10 });

export class TemplateService {
  private readonly templatesDir = path.join(__dirname, "../../templates");
  // private readonly templateCache = new Map<string, ITemplate>();

  /**
   * Get templates with filtering and pagination
   */
  static async getTemplates(
    query: ITemplateListQuery,
    _userId: string
  ): Promise<{
    templates: ITemplate[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      pages: number;
    };
  }> {
    try {
      const {
        page = 1,
        limit = 20,
        search,
        category,
        type,
        engine,
        isActive,
        tags,
        sortBy = "createdAt",
        sortOrder = "desc",
      } = query;

      // Build filter object
      const filter: FilterQuery<ITemplate> = {};

      if (search) {
        filter.$or = [
          { name: { $regex: search, $options: "i" } },
          { description: { $regex: search, $options: "i" } },
          { type: { $regex: search, $options: "i" } },
        ];
      }

      if (category) filter.category = category;
      if (type) filter.type = type;
      if (engine) filter.engine = engine;
      if (isActive !== undefined) filter.isActive = isActive;
      if (tags && tags.length > 0) filter.tags = { $in: tags };

      // Build sort object
      const sort: Record<string, SortOrder> = {};
      sort[sortBy] = sortOrder === "asc" ? 1 : -1;

      // Calculate skip value
      const skip = (page - 1) * limit;

      // Execute queries in parallel
      const [templates, total] = await Promise.all([
        Template.find(filter)
          .populate(
            "createdBy",
            "profile.firstName profile.lastName contact.email"
          )
          .populate(
            "updatedBy",
            "profile.firstName profile.lastName contact.email"
          )
          .sort(sort)
          .skip(skip)
          .limit(limit)
          .lean(),
        Template.countDocuments(filter),
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
        templates: templates as ITemplate[],
        pagination: {
          total,
          page,
          limit,
          pages: totalPages,
        },
      };
    } catch (error) {
      logger.error("Error getting templates:", error);
      throw new AppError("Failed to get templates", 500);
    }
  }

  /**
   * Get template by ID
   */
  static async getTemplateById(id: string): Promise<ITemplate> {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new ValidationError("Invalid template ID");
      }

      const template = await Template.findById(id)
        .populate(
          "createdBy",
          "profile.firstName profile.lastName contact.email"
        )
        .populate(
          "updatedBy",
          "profile.firstName profile.lastName contact.email"
        )
        .lean();

      if (!template) {
        throw new NotFoundError("Template not found");
      }

      return template as ITemplate;
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error("Error getting template:", error);
      throw new AppError("Failed to get template", 500);
    }
  }

  /**
   * Get template by type or slug
   */
  static async getTemplateBy(query: {
    type?: string;
    slug?: string;
  }): Promise<ITemplate> {
    try {
      const template = await Template.findOne(query)
        .populate(
          "createdBy",
          "profile.firstName profile.lastName contact.email"
        )
        .populate(
          "updatedBy",
          "profile.firstName profile.lastName contact.email"
        )
        .lean();

      if (!template) {
        throw new NotFoundError("Template not found");
      }

      return template as ITemplate;
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error("Error getting template:", error);
      throw new AppError("Failed to get template", 500);
    }
  }

  /**
   * Create a new template
   */
  static async createTemplate(
    data: ITemplateCreateRequest,
    userId: string
  ): Promise<ITemplate> {
    try {
      // Validate template syntax
      const validation = TemplateEngine.validateTemplate(
        data.engine === "mjml" ? unescapeMJML(data.content) : data.content,
        data.subject,
        data.engine
      );

      if (!validation.isValid) {
        throw new ValidationError(
          `Template validation failed: ${validation.errors.join(", ")}`
        );
      }

      // Create template
      const template = new Template({
        ...data,
        slug: data.slug ?? data.name.toLowerCase().replace(/ /g, "-"),
        versions: [
          {
            version: 1,
            content: data.content,
            variables: data.variables || [],
            createdAt: new Date(),
            createdBy: userId,
            isActive: true,
          },
        ],
        translations: new Map(Object.entries(data.translations || {})),
        createdBy: userId,
        updatedBy: userId,
        version: 1,
      });

      const savedTemplate = await template.save();

      // Populate references
      await savedTemplate.populate(
        "createdBy",
        "profile.firstName profile.lastName contact.email"
      );
      await savedTemplate.populate(
        "updatedBy",
        "profile.firstName profile.lastName contact.email"
      );

      logger.info(`Template created: ${savedTemplate._id} by user ${userId}`);

      return savedTemplate.toObject() as ITemplate;
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error("Error creating template:", error);
      throw new AppError("Failed to create template", 500);
    }
  }

  /**
   * Update template
   */
  static async updateTemplate(
    id: string,
    data: ITemplateUpdateRequest,
    userId: string
  ): Promise<ITemplate> {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new ValidationError("Invalid template ID");
      }

      const template = await Template.findById(id);
      if (!template) {
        throw new NotFoundError("Template not found");
      }

      // Validate template syntax if content or subject is being updated
      if (data.content || data.subject) {
        const validation = TemplateEngine.validateTemplate(
          data.engine === "mjml"
            ? unescapeMJML(data.content as string)
            : (data.content as string),
          data.subject || template.subject,
          data.engine || template.engine
        );

        if (!validation.isValid) {
          throw new ValidationError(
            `Template validation failed: ${validation.errors.join(", ")}`
          );
        }
      }

      // Increment version if content changes
      if (
        data.engine === "mjml"
          ? unescapeMJML(data.content as string)
          : data.content !== template.content
      ) {
        data.version = Number(template.version) + 1;
        const newVersion: TemplateVersion = {
          version: template.version + 1,
          content:
            data.engine === "mjml"
              ? unescapeMJML(data.content as string)
              : (data.content as string),
          variables: data.variables || template.variables,
          createdAt: new Date(),
          createdBy: userId,
          isActive: true,
        };

        template.versions.push(newVersion);
        // Clear cache for old version
        TemplateEngine.clearCache(
          (template._id as ObjectId).toString(),
          template.version
        );
      }

      if (data.translations) {
        (data as any).translations = new Map(Object.entries(data.translations));
      }

      // Update template
      const updatedTemplate = await Template.findByIdAndUpdate(
        id,
        {
          ...data,
          updatedBy: userId,
        },
        { new: true, runValidators: true }
      )
        .populate(
          "createdBy",
          "profile.firstName profile.lastName contact.email"
        )
        .populate(
          "updatedBy",
          "profile.firstName profile.lastName contact.email"
        );

      if (!updatedTemplate) {
        throw new NotFoundError("Template not found");
      }

      logger.info(`Template updated: ${id} by user ${userId}`);

      return updatedTemplate.toObject() as ITemplate;
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error("Error updating template:", error);
      throw new AppError("Failed to update template", 500);
    }
  }

  /**
   * Delete template
   */
  static async deleteTemplate(id: string, userId: string): Promise<void> {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new ValidationError("Invalid template ID");
      }

      const template = await Template.findById(id);
      if (!template) {
        throw new NotFoundError("Template not found");
      }

      await Template.findByIdAndDelete(id);

      // Clear cache
      TemplateEngine.clearCache(
        (template._id as ObjectId).toString(),
        template.version
      );

      logger.info(`Template deleted: ${id} by user ${userId}`);
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error("Error deleting template:", error);
      throw new AppError("Failed to delete template", 500);
    }
  }

  /**
   * Duplicate template
   */
  static async duplicateTemplate(
    id: string,
    userId: string
  ): Promise<ITemplate> {
    try {
      const original = await TemplateService.getTemplateById(id);

      const duplicateData: ITemplateCreateRequest = {
        name: `${original.name} (Copy)`,
        description: original.description,
        category: original.category,
        type: original.type,
        subject: original.subject,
        content: original.content,
        variables: original.variables,
        version: original.version + 1,
        versions: [
          {
            version: 1,
            content: original.content,
            variables: original.variables,
            createdAt: new Date(),
            createdBy: userId,
            isActive: true,
          },
        ],
        engine: original.engine,
        tags: original.tags,
        metadata: original.metadata,
      };

      return await TemplateService.createTemplate(duplicateData, userId);
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error("Error duplicating template:", error);
      throw new AppError("Failed to duplicate template", 500);
    }
  }

  /**
   * Render template
   */
  static async renderTemplate(
    request: ITemplateRenderRequest,
    userId: string,
    requestMetadata: {
      requestId: string;
      ipAddress: string;
      userAgent: string;
    }
  ): Promise<ITemplateRendering> {
    try {
      if (!request.templateId) {
        throw new ValidationError("Template ID is required");
      }

      const template = await TemplateService.getTemplateById(
        request.templateId
      );

      if (!template.isActive) {
        throw new ValidationError("Template is not active");
      }

      // Create rendering record
      const rendering = new TemplateRendering({
        templateId: template._id,
        templateVersion: template.version,
        status: "processing",
        input: request.data,
        metadata: {
          userId,
          ...requestMetadata,
        },
      });

      await rendering.save();

      try {
        // Render template
        const result = await TemplateEngine.render({
          template,
          data: request.data || {},
          options: request.options || {},
        });

        // Update rendering record with success
        rendering.status = "completed";
        rendering.output = {
          content: result.content,
          subject: result.subject,
          metadata: {
            renderTime: result.metadata.renderTime,
            size: Buffer.byteLength(result.content, "utf8"),
            format: request.options?.format || "html",
            engine: template.engine,
            truncated: request.options?.maxLength
              ? result.content.length > request.options.maxLength
              : false,
          },
        };

        await rendering.save();

        // Update usage tracking
        await TemplateService.updateTemplateUsage(
          (template._id as mongoose.Types.ObjectId).toString(),
          userId,
          "render"
        );

        logger.info(
          `Template rendered successfully: ${template._id} for user ${userId}`
        );

        return rendering.toObject() as ITemplateRendering;
      } catch (renderError) {
        // Update rendering record with error
        rendering.status = "failed";
        rendering.error = {
          code: "RENDER_ERROR",
          message: (renderError as Error).message,
          stack: (renderError as Error).stack || "",
        };

        await rendering.save();

        throw renderError;
      }
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error("Error rendering template:", error);
      throw new AppError("Failed to render template", 500);
    }
  }

  /**
   * Batch render templates
   */
  static async batchRender(
    request: IBatchRenderRequest,
    userId: string,
    requestMetadata: {
      requestId: string;
      ipAddress: string;
      userAgent: string;
    }
  ): Promise<ITemplateRendering[]> {
    try {
      const results: ITemplateRendering[] = [];

      for (const template of request.templates) {
        try {
          const renderRequest: ITemplateRenderRequest = {
            templateId: template.templateId,
            data: template.data,
            options: request.options,
          };

          const result = await TemplateService.renderTemplate(
            renderRequest,
            userId,
            {
              ...requestMetadata,
              requestId: `${requestMetadata.requestId}-${template.templateId}`,
            }
          );

          results.push(result);
        } catch (error) {
          logger.error(
            `Error rendering template ${template.templateId} in batch:`,
            error
          );
          // Continue with other templates even if one fails
        }
      }

      return results;
    } catch (error) {
      logger.error("Error in batch render:", error);
      throw new AppError("Failed to batch render templates", 500);
    }
  }

  /**
   * Preview template
   */
  static async previewTemplate(
    request: ITemplatePreviewRequest
  ): Promise<TemplateRenderResult> {
    try {
      let data = request.data;
      let template: ITemplate | null = null;
      if (request.templateId) {
        // Preview existing template
        template = await TemplateService.getTemplateById(request.templateId);

        if (!template) {
          throw new Error(`Template ${request.templateId} not found`);
        }

        // Generate sample data if requested
        if (request.sampleData) {
          data = TemplateEngine.generateSampleData(template.variables);
        }

        const result = await TemplateEngine.render({
          template,
          data: data || {},
          options: {},
        });

        return result;
      }
      if (request.content && request.engine) {
        template = {
          ...(template as any),
          content: request.content,
          engine: request.engine,
        } as any;

        // Preview custom content
        return await TemplateEngine.renderContent(
          template as ITemplate,
          data || {}
        );
      }
      throw new ValidationError(
        "Either templateId or content and engine are required for preview"
      );
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error("Error previewing template:", (error as Error).message);
      throw new AppError("Failed to preview template", 500);
    }
  }

  /**
   * Get template categories
   */
  static async getCategories(): Promise<TemplateCategory[]> {
    try {
      const categories = await Template.distinct("category");
      return categories;
    } catch (error) {
      logger.error("Error getting categories:", (error as Error).message);
      throw new AppError("Failed to get categories", 500);
    }
  }

  /**
   * Get template types
   */
  static async getTypes(): Promise<string[]> {
    try {
      const types = await Template.distinct("type");
      return types;
    } catch (error) {
      logger.error("Error getting types:", (error as Error).message);
      throw new AppError("Failed to get types", 500);
    }
  }

  /**
   * Get renderings for a user
   */
  static async getUserRenderings(
    userId: string,
    page = 1,
    limit = 20
  ): Promise<{
    renderings: ITemplateRendering[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    try {
      const skip = (page - 1) * limit;

      const [renderings, total] = await Promise.all([
        TemplateRendering.find({ "metadata.userId": userId })
          .populate("templateId", "name description category type")
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        TemplateRendering.countDocuments({ "metadata.userId": userId }),
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
        renderings: renderings as ITemplateRendering[],
        total,
        page,
        limit,
        totalPages,
      };
    } catch (error) {
      logger.error("Error getting user renderings:", (error as Error).message);
      throw new AppError("Failed to get user renderings", 500);
    }
  }

  /**
   * Get rendering by ID
   */
  static async getRenderingById(id: string): Promise<ITemplateRendering> {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new ValidationError("Invalid rendering ID");
      }

      const rendering = await TemplateRendering.findById(id)
        .populate("templateId", "name description category type")
        .lean();

      if (!rendering) {
        throw new NotFoundError("Rendering not found");
      }

      return rendering as ITemplateRendering;
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error("Error getting rendering:", (error as Error).message);
      throw new AppError("Failed to get rendering", 500);
    }
  }

  /**
   * Preview SMS template with SMS-specific metadata
   */
  static async previewSMSTemplate(
    templateId: string,
    data: Record<string, any>
  ): Promise<{
    rendered: string;
    segments: number;
    length: number;
    encoding: string;
    cost: number;
    metadata: any;
  }> {
    try {
      const template = await TemplateService.getTemplateById(templateId);

      const result = await TemplateEngine.render({
        template,
        data,
        options: {
          format: "sms",
        },
      });

      return {
        rendered: result.content,
        segments: result.metadata?.segments || 1,
        length: result.metadata?.length || result.content.length,
        encoding: result.metadata?.encoding || "GSM_7BIT",
        cost: result.metadata?.cost || 0.01,
        metadata: result.metadata || {},
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error("Error previewing SMS template:", (error as Error).message);
      throw new AppError("Failed to preview SMS template", 500);
    }
  }

  /**
   * Load template from file system
   */
  loadTemplateFromFile(
    filename: string,
    category: TemplateCategory
  ): ITemplate | null {
    const filePath = path.join(this.templatesDir, filename);

    if (!existsSync(filePath)) {
      logger.warn(`Template file not found: ${filePath}`);
      return null;
    }

    try {
      const content = readFileSync(filePath, "utf8");

      // Determine format and engine based on file extension
      const ext = path.extname(filename).toLowerCase();
      let format: TemplateFormat = "text";
      const engine: TemplateEngineType = "handlebars";

      switch (ext) {
        case ".mjml":
        case ".html":
          format = "html";
          break;
        case ".txt":
          format = "text";
          break;
        case ".sms":
          format = "sms";
          break;
        case ".json":
          format = "json";
          break;
        default:
          break;
      }

      return {
        name: path.basename(filename, ext),
        description: `Template loaded from ${filename}`,
        category,
        type: path.basename(filename, ext),
        content,
        variables: [], // Would need to be parsed from content or provided separately
        engine,
        format,
        version: 1,
        isActive: true,
        tags: [category],
        metadata: { source: "file", filename },
      } as any;
    } catch (error) {
      logger.error(
        `Failed to load template from file ${filename}:`,
        (error as Error).message
      );
      return null;
    }
  }

  /**
   * Import templates from files
   */
  static async importTemplatesFromFiles(
    options: { category?: string; overwrite?: boolean; directory?: string } = {}
  ): Promise<{
    success: number;
    failed: number;
    errors: string[];
    importedTemplates: string[];
  }> {
    let success = 0;
    let failed = 0;
    const errors: string[] = [];
    const importedTemplates: string[] = [];

    try {
      const templatesDir =
        options.directory || path.join(process.cwd(), "templates");

      if (!existsSync(templatesDir)) {
        return {
          success: 0,
          failed: 0,
          errors: ["Templates directory not found"],
          importedTemplates: [],
        };
      }

      const files = readdirSync(templatesDir).filter(
        (file) =>
          file.endsWith(".hbs") ||
          file.endsWith(".ejs") ||
          file.endsWith(".pug")
      );

      for (const file of files) {
        try {
          const filePath = path.join(templatesDir, file);
          const content = readFileSync(filePath, "utf8");

          // Extract template name from filename
          const templateName = path.basename(file, path.extname(file));

          // Check if template already exists
          if (!options.overwrite) {
            const existingTemplate = await Template.findOne({
              name: templateName,
            });
            if (existingTemplate) {
              continue; // Skip existing templates
            }
          }

          // Determine engine from file extension
          const engine = path.extname(file).slice(1) as
            | "handlebars"
            | "ejs"
            | "pug";

          // Create template data
          const templateData: ITemplateCreateRequest = {
            name: templateName,
            description: `Imported from ${file}`,
            category:
              (options.category as TemplateCategory) ||
              ("other" as TemplateCategory),
            type: "imported",
            subject: "", // No subject for file-based templates
            content,
            version: 1,
            versions: [],
            variables: [], // Would need to be extracted from content
            engine,
            tags: ["imported", "file-based"],
            metadata: { source: file },
          };

          const template = await TemplateService.createTemplate(
            templateData,
            "system"
          );
          importedTemplates.push(
            (template._id as mongoose.Types.ObjectId).toString()
          );
          success++;
        } catch (error) {
          errors.push(`Failed to import ${file}: ${(error as Error).message}`);
          failed++;
        }
      }

      return { success, failed, errors, importedTemplates };
    } catch (error) {
      logger.error(
        "Failed to import templates from files:",
        (error as Error).message
      );
      return {
        success,
        failed,
        errors: [error instanceof Error ? error.message : "Unknown error"],
        importedTemplates,
      };
    }
  }

  /**
   * Export templates to files
   */
  static async exportTemplatesToFiles(
    options: {
      templateIds?: string[];
      category?: string;
      format?: TemplateFormat;
    } = {}
  ): Promise<{
    exportedCount: number;
    filePath: string;
    format: string;
  }> {
    try {
      const exportDir = path.join(process.cwd(), "exports", "templates");

      // Create export directory if it doesn't exist
      if (!existsSync(exportDir)) {
        mkdirSync(exportDir, { recursive: true });
      }

      // Build query
      const query: FilterQuery<ITemplate> = {};
      if (options.templateIds && options.templateIds.length > 0) {
        query._id = { $in: options.templateIds };
      }
      if (options.category) {
        query.category = options.category;
      }

      const templates = await Template.find(query).lean();

      if (templates.length === 0) {
        throw new ValidationError("No templates found to export");
      }

      const format = options.format || "json";
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const fileName = `templates-export-${timestamp}.${format}`;
      const filePath = path.join(exportDir, fileName);

      if (format === "json") {
        // Export as JSON
        const exportData = {
          exportedAt: new Date().toISOString(),
          count: templates.length,
          templates: templates.map((template) => ({
            ...template,
            _id: template._id.toString(),
            createdAt: template.createdAt.toISOString(),
            updatedAt: template.updatedAt.toISOString(),
          })),
        };
        writeFileSync(filePath, JSON.stringify(exportData, null, 2));
      } else {
        // Export individual template files
        for (const template of templates) {
          const templateFileName = `${template.name}.${format}`;
          const templateFilePath = path.join(exportDir, templateFileName);
          writeFileSync(templateFilePath, template.content);
        }
      }

      logger.info(`Exported ${templates.length} templates to ${filePath}`);

      return {
        exportedCount: templates.length,
        filePath,
        format,
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error("Failed to export templates:", error);
      throw new AppError("Failed to export templates", 500);
    }
  }

  /**
   * Update template usage tracking
   */
  static async updateTemplateUsage(
    templateId: string,
    userId: string,
    context = "render"
  ): Promise<void> {
    try {
      await Template.findByIdAndUpdate(
        templateId,
        {
          $inc: { "metadata.usageCount": 1 },
          $set: { "metadata.lastUsedAt": new Date() },
          $push: {
            "metadata.usageHistory": {
              date: new Date(),
              userId,
              context,
            },
          },
        },
        { upsert: false }
      );
    } catch (error) {
      logger.error("Failed to update template usage:", error);
      // Don't throw error as this is not critical
    }
  }

  /**
   * Get template usage statistics
   */
  static async getTemplateUsageStats(templateId: string): Promise<{
    usageCount: number;
    lastUsedAt?: Date;
    usageHistory: Array<{
      date: Date;
      userId: string;
      context: string;
    }>;
  }> {
    try {
      const template = await Template.findById(templateId)
        .select("metadata")
        .lean();

      if (!template) {
        throw new NotFoundError("Template not found");
      }

      return {
        usageCount: template.metadata?.usageCount || 0,
        lastUsedAt: template.metadata?.lastUsedAt,
        usageHistory: template.metadata?.usageHistory || [],
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error("Failed to get template usage stats:", error);
      throw new AppError("Failed to get template usage stats", 500);
    }
  }
}
