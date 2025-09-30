import { promises as fs } from "node:fs";
import path from "node:path";
import {
  ReportAnalytics,
  ReportDefinition,
  ReportExecution,
} from "@kaa/models";
import {
  AggregationType,
  DataSource,
  type IChartConfig,
  type ICreateReportRequest,
  type IExecuteReportRequest,
  type IKenyaSpecificMetrics,
  type IReportFilter,
  type IReportQuery,
  type IReportResponse,
  KENYA_COUNTIES_LIST,
  REPORT_CONFIG,
  ReportDeliveryMethod,
  ReportErrorCode,
  ReportFormat,
  ReportFrequency,
  ReportPriority,
  ReportStatus,
  TimeGranularity,
} from "@kaa/models/types";
import { createObjectCsvWriter } from "csv-writer";
import ExcelJS from "exceljs";
import { Types } from "mongoose";

export class ReportsService {
  private static instance: ReportsService;

  static getInstance(): ReportsService {
    if (!ReportsService.instance) {
      ReportsService.instance = new ReportsService();
    }
    return ReportsService.instance;
  }

  // Report Management
  async createReport(
    request: ICreateReportRequest,
    createdBy: Types.ObjectId
  ): Promise<IReportResponse> {
    try {
      // Validate query complexity
      if (await this.isQueryTooComplex(request.query)) {
        return {
          success: false,
          error: {
            code: ReportErrorCode.INVALID_PARAMETERS,
            message: "Query complexity exceeds limits",
          },
        };
      }

      const reportDefinition = new ReportDefinition({
        name: request.name,
        description: request.description,
        type: request.type,
        templateId: request.templateId
          ? Types.ObjectId.createFromHexString(request.templateId)
          : undefined,
        query: request.query,
        charts: request.charts || [],
        format: request.format,
        frequency: request.frequency,
        schedule: request.schedule,
        recipients: request.recipients,
        parameters: request.parameters || {},
        priority: request.priority || ReportPriority.NORMAL,
        tags: request.tags || [],
        createdBy,
        metadata: {
          complexity: await this.calculateComplexity(request.query),
          kenyaSpecific: this.isKenyaSpecific(request.query),
          businessCritical:
            request.priority === ReportPriority.URGENT ||
            request.priority === ReportPriority.HIGH,
        },
      });

      // Set next run time if scheduled
      if (request.frequency !== ReportFrequency.ON_DEMAND && request.schedule) {
        await reportDefinition.updateNextRun();
      }

      await reportDefinition.save();

      return {
        success: true,
        data: {
          reportId: reportDefinition._id,
          name: reportDefinition.name,
          type: reportDefinition.type,
          frequency: reportDefinition.frequency,
          nextRunAt: reportDefinition.nextRunAt,
        },
        message: "Report created successfully",
      };
    } catch (error) {
      console.error("Create report error:", error);
      return {
        success: false,
        error: {
          code: ReportErrorCode.GENERATION_FAILED,
          message: "Failed to create report",
        },
      };
    }
  }

  async executeReport(
    request: IExecuteReportRequest,
    executedBy?: Types.ObjectId
  ): Promise<IReportResponse> {
    try {
      const reportDefinition = await ReportDefinition.findById(
        request.reportId
      );

      if (!reportDefinition) {
        return {
          success: false,
          error: {
            code: ReportErrorCode.INVALID_PARAMETERS,
            message: "Report not found",
          },
        };
      }

      // Check if report is currently running
      const runningExecution = await ReportExecution.findOne({
        reportId: reportDefinition._id,
        status: { $in: [ReportStatus.PENDING, ReportStatus.PROCESSING] },
      });

      if (runningExecution) {
        return {
          success: false,
          error: {
            code: ReportErrorCode.GENERATION_FAILED,
            message: "Report is already running",
          },
        };
      }

      // Create execution record
      const execution = new ReportExecution({
        reportId: reportDefinition._id,
        status: ReportStatus.PROCESSING,
        parameters: { ...reportDefinition.parameters, ...request.parameters },
        triggeredBy: {
          type: executedBy ? "manual" : "api",
          userId: executedBy,
          source: "reports_service",
        },
        metadata: {
          serverInstance: process.env.SERVER_INSTANCE || "unknown",
          executionContext: {
            priority: request.priority || reportDefinition.priority,
            formats: request.format || reportDefinition.format,
          },
        },
      });

      await execution.save();

      // Execute report asynchronously
      this.processReport(execution._id, reportDefinition, request);

      return {
        success: true,
        data: {
          executionId: execution._id,
          status: execution.status,
          estimatedCompletion: this.estimateCompletionTime(reportDefinition),
        },
        message: "Report execution started",
      };
    } catch (error) {
      console.error("Execute report error:", error);
      return {
        success: false,
        error: {
          code: ReportErrorCode.GENERATION_FAILED,
          message: "Failed to execute report",
        },
      };
    }
  }

  private async processReport(
    executionId: Types.ObjectId,
    reportDefinition: any,
    request: IExecuteReportRequest
  ) {
    let execution: any;
    const startTime = Date.now();

    try {
      execution = await ReportExecution.findById(executionId);
      if (!execution) return;

      // Update report run count
      await reportDefinition.incrementRunCount();

      // Execute query and get data
      const queryStartTime = Date.now();
      const data = await this.executeQuery(
        reportDefinition.query,
        execution.parameters
      );
      const queryTime = Date.now() - queryStartTime;

      // Generate charts if configured
      const renderStartTime = Date.now();
      const charts = await this.generateCharts(reportDefinition.charts, data);
      const renderTime = Date.now() - renderStartTime;

      // Generate report files
      const formats = request.format || reportDefinition.format;
      const files = await this.generateReportFiles(
        data,
        charts,
        formats,
        reportDefinition
      );

      // Deliver reports
      const deliveryStartTime = Date.now();
      const recipients = request.recipients || reportDefinition.recipients;
      await this.deliverReports(files, recipients, execution);
      const deliveryTime = Date.now() - deliveryStartTime;

      // Mark as completed
      await execution.markAsCompleted({
        recordCount: data.length,
        dataSize: JSON.stringify(data).length,
        charts: charts.map((c) => c.url),
        files,
        summary: await this.generateSummary(data, reportDefinition),
      });

      // Update performance metrics
      execution.metadata.performanceMetrics = {
        queryTime,
        renderTime,
        deliveryTime,
      };
      await execution.save();

      // Update analytics
      await this.updateReportAnalytics(reportDefinition._id, execution);
    } catch (error) {
      console.error("Report processing error:", error);

      if (execution) {
        await execution.markAsFailed({
          code: ReportErrorCode.GENERATION_FAILED,
          message: (error as Error).message,
          stack: (error as Error).stack,
          details: { executionTime: Date.now() - startTime },
        });
      }
    }
  }

  // Query Execution
  private async executeQuery(
    query: IReportQuery,
    parameters: Record<string, any>
  ): Promise<any[]> {
    try {
      // Apply parameters to filters
      const processedQuery = this.applyParameters(query, parameters);

      // Build aggregation pipeline based on data source
      const pipeline = await this.buildAggregationPipeline(processedQuery);

      // Execute query based on data source
      const data = await this.executeDataQuery(
        processedQuery.dataSource,
        pipeline
      );

      // Apply post-processing
      return this.postProcessData(data, processedQuery);
    } catch (error) {
      console.error("Query execution error:", error);
      throw new Error(`Query execution failed: ${(error as Error).message}`);
    }
  }

  private applyParameters(
    query: IReportQuery,
    parameters: Record<string, any>
  ): IReportQuery {
    // Clone query to avoid mutation
    const processedQuery = JSON.parse(JSON.stringify(query));

    // Replace parameter placeholders in filters
    if (processedQuery.filters) {
      processedQuery.filters = processedQuery.filters.map(
        (filter: IReportFilter) => ({
          ...filter,
          value: this.replaceParameterPlaceholders(filter.value, parameters),
        })
      );
    }

    // Apply time range parameters
    if (parameters.dateRange?.start && parameters.dateRange.end) {
      processedQuery.timeRange = {
        start: new Date(parameters.dateRange.start),
        end: new Date(parameters.dateRange.end),
        timezone: REPORT_CONFIG.DEFAULT_TIMEZONE,
      };
    }

    return processedQuery;
  }

  private replaceParameterPlaceholders(
    value: any,
    parameters: Record<string, any>
  ): any {
    if (
      typeof value === "string" &&
      value.startsWith("${") &&
      value.endsWith("}")
    ) {
      const paramName = value.slice(2, -1);
      return parameters[paramName] !== undefined
        ? parameters[paramName]
        : value;
    }
    return value;
  }

  private async buildAggregationPipeline(query: IReportQuery): Promise<any[]> {
    const pipeline: any[] = [];

    // Match stage (filters)
    if (query.filters && query.filters.length > 0) {
      const matchStage: any = {};

      for (const filter of query.filters) {
        matchStage[filter.field] = this.buildFilterCondition(filter);
      }

      pipeline.push({ $match: matchStage });
    }

    // Time range filter
    if (query.timeRange) {
      pipeline.push({
        $match: {
          createdAt: {
            $gte: query.timeRange.start,
            $lte: query.timeRange.end,
          },
        },
      });
    }

    // Group stage
    if (query.groupBy && query.groupBy.length > 0) {
      const groupStage: any = { _id: {} };

      // Group by fields
      for (const group of query.groupBy) {
        if (query.timeGranularity && this.isDateField(group.field)) {
          groupStage._id[group.alias || group.field] = this.buildDateGrouping(
            group.field,
            query.timeGranularity
          );
        } else {
          groupStage._id[group.alias || group.field] = `$${group.field}`;
        }
      }

      // Aggregations
      if (query.aggregations) {
        for (const agg of query.aggregations) {
          groupStage[agg.alias || agg.field] = this.buildAggregation(agg);
        }
      }

      pipeline.push({ $group: groupStage });
    }

    // Sort stage
    if (query.sort && query.sort.length > 0) {
      const sortStage: any = {};
      for (const sort of query.sort) {
        sortStage[sort.field] = sort.order === "asc" ? 1 : -1;
      }
      pipeline.push({ $sort: sortStage });
    }

    // Limit and offset
    if (query.offset && query.offset > 0) {
      pipeline.push({ $skip: query.offset });
    }

    if (query.limit) {
      pipeline.push({
        $limit: Math.min(query.limit, REPORT_CONFIG.DEFAULT_PAGE_SIZE),
      });
    }

    return await Promise.resolve(pipeline);
  }

  private buildFilterCondition(filter: IReportFilter): any {
    switch (filter.operator) {
      case "eq":
        return filter.value;
      case "ne":
        return { $ne: filter.value };
      case "gt":
        return { $gt: filter.value };
      case "gte":
        return { $gte: filter.value };
      case "lt":
        return { $lt: filter.value };
      case "lte":
        return { $lte: filter.value };
      case "in":
        return {
          $in: Array.isArray(filter.value) ? filter.value : [filter.value],
        };
      case "nin":
        return {
          $nin: Array.isArray(filter.value) ? filter.value : [filter.value],
        };
      case "regex":
        return { $regex: filter.value, $options: "i" };
      case "exists":
        return { $exists: filter.value };
      default:
        return filter.value;
    }
  }

  private buildDateGrouping(field: string, granularity: TimeGranularity): any {
    const dateField = `$${field}`;

    switch (granularity) {
      case TimeGranularity.MINUTE:
        return {
          year: { $year: dateField },
          month: { $month: dateField },
          day: { $dayOfMonth: dateField },
          hour: { $hour: dateField },
          minute: { $minute: dateField },
        };
      case TimeGranularity.HOUR:
        return {
          year: { $year: dateField },
          month: { $month: dateField },
          day: { $dayOfMonth: dateField },
          hour: { $hour: dateField },
        };
      case TimeGranularity.DAY:
        return {
          year: { $year: dateField },
          month: { $month: dateField },
          day: { $dayOfMonth: dateField },
        };
      case TimeGranularity.WEEK:
        return { $isoWeek: dateField };
      case TimeGranularity.MONTH:
        return {
          year: { $year: dateField },
          month: { $month: dateField },
        };
      case TimeGranularity.QUARTER:
        return {
          year: { $year: dateField },
          quarter: { $ceil: { $divide: [{ $month: dateField }, 3] } },
        };
      case TimeGranularity.YEAR:
        return { $year: dateField };
      default:
        return dateField;
    }
  }

  private buildAggregation(agg: any): any {
    switch (agg.type) {
      case AggregationType.COUNT:
        return { $sum: 1 };
      case AggregationType.SUM:
        return { $sum: `$${agg.field}` };
      case AggregationType.AVG:
        return { $avg: `$${agg.field}` };
      case AggregationType.MIN:
        return { $min: `$${agg.field}` };
      case AggregationType.MAX:
        return { $max: `$${agg.field}` };
      case AggregationType.DISTINCT:
        return { $addToSet: `$${agg.field}` };
      default:
        return { $sum: 1 };
    }
  }

  private isDateField(field: string): boolean {
    const dateFields = ["createdAt", "updatedAt", "date", "timestamp", "time"];
    return dateFields.some((df) =>
      field.toLowerCase().includes(df.toLowerCase())
    );
  }

  private async executeDataQuery(
    dataSource: DataSource | DataSource[],
    pipeline: any[]
  ): Promise<any[]> {
    // This would integrate with actual data models
    // For now, return mock data based on data source

    if (Array.isArray(dataSource)) {
      // Handle multiple data sources - would need joins/unions
      const results = await Promise.all(
        dataSource.map((ds) => this.queryDataSource(ds, pipeline))
      );
      return results.flat();
    }
    return await this.queryDataSource(dataSource, pipeline);
  }

  private queryDataSource(dataSource: DataSource, _pipeline: any[]): any[] {
    // Mock implementation - in real app would query actual models
    switch (dataSource) {
      case DataSource.USERS:
        return this.mockUserData();
      case DataSource.PROPERTIES:
        return this.mockPropertyData();
      case DataSource.BOOKINGS:
        return this.mockBookingData();
      case DataSource.PAYMENTS:
        return this.mockPaymentData();
      default:
        return [];
    }
  }

  private postProcessData(data: any[], query: IReportQuery): any[] {
    // Apply any post-processing logic
    let processedData = [...data];

    // Format data based on Kenya-specific requirements
    if (this.isKenyaSpecific(query)) {
      processedData = this.applyKenyaFormatting(processedData);
    }

    return processedData;
  }

  // Chart Generation
  private async generateCharts(
    chartConfigs: IChartConfig[],
    data: any[]
  ): Promise<any[]> {
    const charts: any[] = [];

    for (const config of chartConfigs) {
      try {
        const chartData = this.prepareChartData(data, config);
        const chartUrl = await this.renderChart(config, chartData);

        charts.push({
          type: config.type,
          title: config.title,
          url: chartUrl,
          data: chartData,
        });
      } catch (error) {
        console.error(`Chart generation error for ${config.type}:`, error);
      }
    }

    return charts;
  }

  private prepareChartData(data: any[], config: IChartConfig): any {
    // Transform data for chart visualization
    const chartData: { labels: any[]; datasets: any[] } = {
      labels: [],
      datasets: [],
    };

    if (config.xAxis && config.yAxis) {
      chartData.labels = data.map((item) => item[config.xAxis?.field || ""]);

      if (config.series && config.series.length > 0) {
        // Multiple series
        chartData.datasets = config.series.map((series) => ({
          label: series.label || series.field,
          data: data.map((item) => item[series.field]),
          backgroundColor: series.color || "#3498db",
        }));
      } else {
        // Single series
        chartData.datasets = [
          {
            label: config.yAxis.label || config.yAxis.field,
            data: data.map((item) => item[config.yAxis?.field || ""]),
            backgroundColor: "#3498db",
          },
        ];
      }
    }

    return chartData;
  }

  private async renderChart(
    _config: IChartConfig,
    _data: any
  ): Promise<string> {
    // Mock chart rendering - in real app would use Chart.js, D3, or similar
    const chartId = new Types.ObjectId().toString();
    const chartPath = path.join("/tmp", `chart_${chartId}.png`);

    // Generate chart image (mock)
    await fs.writeFile(chartPath, Buffer.from("mock-chart-data"));

    return chartPath;
  }

  // File Generation
  private async generateReportFiles(
    data: any[],
    charts: any[],
    formats: ReportFormat[],
    reportDef: any
  ): Promise<any[]> {
    const files: any[] = [];

    for (const format of formats) {
      try {
        const file = await this.generateFile(data, charts, format, reportDef);
        files.push(file);
      } catch (error) {
        console.error(`File generation error for ${format}:`, error);
      }
    }

    return files;
  }

  private async generateFile(
    data: any[],
    charts: any[],
    format: ReportFormat,
    reportDef: any
  ): Promise<any> {
    const timestamp = Date.now();
    const filename = `${reportDef.name}_${timestamp}`;

    switch (format) {
      case ReportFormat.JSON:
        return await this.generateJsonFile(data, filename);
      case ReportFormat.CSV:
        return await this.generateCsvFile(data, filename);
      case ReportFormat.EXCEL:
        return await this.generateExcelFile(data, charts, filename);
      case ReportFormat.PDF:
        return await this.generatePdfFile(data, charts, filename, reportDef);
      case ReportFormat.HTML:
        return await this.generateHtmlFile(data, charts, filename, reportDef);
      default:
        throw new Error(`Unsupported format: ${format}`);
    }
  }

  private async generateJsonFile(data: any[], filename: string): Promise<any> {
    const filePath = path.join("/tmp", `${filename}.json`);
    const content = JSON.stringify(data, null, 2);

    await fs.writeFile(filePath, content);

    return {
      filename: `${filename}.json`,
      format: ReportFormat.JSON,
      size: Buffer.byteLength(content),
      path: filePath,
      expiresAt: new Date(
        Date.now() + REPORT_CONFIG.FILE_RETENTION_DAYS * 24 * 60 * 60 * 1000
      ),
    };
  }

  private async generateCsvFile(data: any[], filename: string): Promise<any> {
    const filePath = path.join("/tmp", `${filename}.csv`);

    if (data.length === 0) {
      await fs.writeFile(filePath, "");
      return {
        filename: `${filename}.csv`,
        format: ReportFormat.CSV,
        size: 0,
        path: filePath,
      };
    }

    // Get headers from first row
    const headers = Object.keys(data[0]).map((key) => ({
      id: key,
      title: key,
    }));

    const csvWriter = createObjectCsvWriter({
      path: filePath,
      header: headers,
    });

    await csvWriter.writeRecords(data);

    const stats = await fs.stat(filePath);

    return {
      filename: `${filename}.csv`,
      format: ReportFormat.CSV,
      size: stats.size,
      path: filePath,
      expiresAt: new Date(
        Date.now() + REPORT_CONFIG.FILE_RETENTION_DAYS * 24 * 60 * 60 * 1000
      ),
    };
  }

  private async generateExcelFile(
    data: any[],
    _charts: any[],
    filename: string
  ): Promise<any> {
    const filePath = path.join("/tmp", `${filename}.xlsx`);
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Report Data");

    if (data.length > 0) {
      // Add headers
      const headers = Object.keys(data[0]);
      worksheet.addRow(headers);

      // Style headers
      const headerRow = worksheet.getRow(1);
      headerRow.font = { bold: true };
      headerRow.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFE0E0E0" },
      };

      // Add data rows
      for (const row of data) {
        worksheet.addRow(Object.values(row));
      }

      // Auto-fit columns
      for (const column of worksheet.columns) {
        if (column.values) {
          const lengths = column.values.map((v: any) =>
            v ? v.toString().length : 0
          );
          const maxLength = Math.max(...lengths);
          column.width = Math.min(maxLength + 2, 50);
        }
      }
    }

    await workbook.xlsx.writeFile(filePath);
    const stats = await fs.stat(filePath);

    return {
      filename: `${filename}.xlsx`,
      format: ReportFormat.EXCEL,
      size: stats.size,
      path: filePath,
      expiresAt: new Date(
        Date.now() + REPORT_CONFIG.FILE_RETENTION_DAYS * 24 * 60 * 60 * 1000
      ),
    };
  }

  private async generatePdfFile(
    data: any[],
    _charts: any[],
    filename: string,
    reportDef: any
  ): Promise<any> {
    // Mock PDF generation - in real app would use puppeteer, PDFKit, etc.
    const filePath = path.join("/tmp", `${filename}.pdf`);
    const mockContent = `Mock PDF Report: ${reportDef.name}\nData records: ${data.length}\nGenerated: ${new Date()}`;

    await fs.writeFile(filePath, mockContent);
    const stats = await fs.stat(filePath);

    return {
      filename: `${filename}.pdf`,
      format: ReportFormat.PDF,
      size: stats.size,
      path: filePath,
      expiresAt: new Date(
        Date.now() + REPORT_CONFIG.FILE_RETENTION_DAYS * 24 * 60 * 60 * 1000
      ),
    };
  }

  private async generateHtmlFile(
    data: any[],
    charts: any[],
    filename: string,
    reportDef: any
  ): Promise<any> {
    const filePath = path.join("/tmp", `${filename}.html`);

    let html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${reportDef.name}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          table { border-collapse: collapse; width: 100%; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
          .chart { margin: 20px 0; }
        </style>
      </head>
      <body>
        <h1>${reportDef.name}</h1>
        <p>Generated: ${new Date().toLocaleString()}</p>
        <p>Records: ${data.length}</p>
    `;

    // Add charts
    for (const chart of charts) {
      html += `<div class="chart"><h3>${chart.title}</h3><img src="${chart.url}" alt="${chart.title}"></div>`;
    }

    // Add data table
    if (data.length > 0) {
      html += "<table><thead><tr>";
      for (const key of Object.keys(data[0])) {
        html += `<th>${key}</th>`;
      }
      html += "</tr></thead><tbody>";

      for (const row of data) {
        html += "<tr>";
        for (const value of Object.values(row)) {
          html += `<td>${value}</td>`;
        }
        html += "</tr>";
      }

      html += "</tbody></table>";
    }

    html += "</body></html>";

    await fs.writeFile(filePath, html);
    const stats = await fs.stat(filePath);

    return {
      filename: `${filename}.html`,
      format: ReportFormat.HTML,
      size: stats.size,
      path: filePath,
      expiresAt: new Date(
        Date.now() + REPORT_CONFIG.FILE_RETENTION_DAYS * 24 * 60 * 60 * 1000
      ),
    };
  }

  // Report Delivery
  private async deliverReports(
    files: any[],
    recipients: any[],
    execution: any
  ): Promise<void> {
    for (const recipient of recipients) {
      if (!recipient.isActive) continue;

      try {
        await this.deliverToRecipient(files, recipient, execution);
        await execution.updateDeliveryStatus(recipient.target, "delivered");
      } catch (error) {
        console.error(`Delivery error to ${recipient.target}:`, error);
        await execution.updateDeliveryStatus(
          recipient.target,
          "failed",
          (error as Error).message
        );
      }
    }
  }

  private async deliverToRecipient(
    files: any[],
    recipient: any,
    execution: any
  ): Promise<void> {
    switch (recipient.type) {
      case ReportDeliveryMethod.EMAIL:
        await this.deliverViaEmail(files, recipient, execution);
        break;
      case ReportDeliveryMethod.SMS:
        await this.deliverViaSms(files, recipient, execution);
        break;
      case ReportDeliveryMethod.WEBHOOK:
        await this.deliverViaWebhook(files, recipient, execution);
        break;
      case ReportDeliveryMethod.DOWNLOAD:
        // Files are already generated, just mark as ready for download
        break;
      default:
        throw new Error(`Unsupported delivery method: ${recipient.type}`);
    }
  }

  private async deliverViaEmail(
    files: any[],
    recipient: any,
    execution: any
  ): Promise<void> {
    // Mock email delivery - integrate with email service
    console.log(`Delivering report via email to ${recipient.target}`);

    // Would use email service from other modules
    // await emailService.sendEmail({
    //   to: recipient.target,
    //   subject: `Report: ${execution.reportId}`,
    //   text: 'Please find your requested report attached.',
    //   attachments: files.map(f => ({ filename: f.filename, path: f.path }))
    // });
    await Promise.resolve({ files, execution });
  }

  private async deliverViaSms(
    files: any[],
    recipient: any,
    execution: any
  ): Promise<void> {
    // Mock SMS delivery - integrate with SMS service
    console.log(
      `Delivering report notification via SMS to ${recipient.target}`
    );

    // Would use SMS service from other modules
    // await smsService.sendSms({
    //   to: recipient.target,
    //   message: `Your report is ready. Download link: ${downloadUrl}`
    // });

    await Promise.resolve({ files, execution });
  }

  private async deliverViaWebhook(
    files: any[],
    recipient: any,
    execution: any
  ): Promise<void> {
    // Mock webhook delivery
    console.log(`Delivering report via webhook to ${recipient.target}`);

    const payload = {
      reportId: execution.reportId,
      executionId: execution._id,
      status: execution.status,
      files: files.map((f) => ({
        filename: f.filename,
        format: f.format,
        size: f.size,
        downloadUrl: `${process.env.BASE_URL}/reports/download/${f.filename}`,
      })),
    };

    // Would make HTTP request to webhook URL
    // await fetch(recipient.target, {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(payload)
    // });
    await Promise.resolve({ files, execution });
  }

  // Kenya-specific Analytics
  async getKenyaMetrics(timeRange?: {
    start: Date;
    end: Date;
  }): Promise<IKenyaSpecificMetrics> {
    try {
      const defaultRange = {
        start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
        end: new Date(),
      };
      const range = timeRange || defaultRange;

      const [countyMetrics, mpesaMetrics, smsMetrics, businessHoursMetrics] =
        await Promise.all([
          this.getCountyMetrics(range),
          this.getMpesaMetrics(range),
          this.getSmsMetrics(range),
          this.getBusinessHoursMetrics(range),
        ]);

      return {
        counties: countyMetrics,
        mpesa: mpesaMetrics,
        sms: smsMetrics,
        businessHours: businessHoursMetrics,
        languages: {
          english: 75,
          swahili: 20,
          other: 5,
        },
        mobileNetworks: {
          safaricom: 80,
          airtel: 15,
          telkom: 5,
        },
      };
    } catch (error) {
      console.error("Kenya metrics error:", error);
      throw error;
    }
  }

  private async getCountyMetrics(_range: {
    start: Date;
    end: Date;
  }): Promise<any[]> {
    // Mock county metrics - would query actual location and user data
    return await Promise.resolve(
      KENYA_COUNTIES_LIST.map((county) => ({
        name: county,
        metrics: {
          users: Math.floor(Math.random() * 1000),
          properties: Math.floor(Math.random() * 500),
          bookings: Math.floor(Math.random() * 200),
          revenue: Math.floor(Math.random() * 1_000_000),
        },
      }))
    );
  }

  private async getMpesaMetrics(_range: {
    start: Date;
    end: Date;
  }): Promise<any> {
    // Mock M-Pesa metrics - would query payment data
    return await Promise.resolve({
      transactions: 15_420,
      volume: 45_600_000, // KES
      successRate: 96.8,
      averageAmount: 2958,
    });
  }

  private async getSmsMetrics(_range: {
    start: Date;
    end: Date;
  }): Promise<any> {
    // Mock SMS metrics - would query SMS service data
    return await Promise.resolve({
      sent: 8950,
      delivered: 8756,
      deliveryRate: 97.8,
      cost: 134_250, // KES
    });
  }

  private async getBusinessHoursMetrics(_range: {
    start: Date;
    end: Date;
  }): Promise<any> {
    // Mock business hours metrics - would analyze time-based activity
    return await Promise.resolve({
      activeUsers: 2340,
      transactions: 3450,
      peakHour: 14, // 2 PM
      offPeakRatio: 0.65,
    });
  }

  // Utility Methods
  private isQueryTooComplex(query: IReportQuery): boolean {
    // Check query complexity limits
    const filterCount = query.filters?.length || 0;
    const groupByCount = query.groupBy?.length || 0;
    const aggCount = query.aggregations?.length || 0;

    return filterCount > 20 || groupByCount > 10 || aggCount > 15;
  }

  private calculateComplexity(query: IReportQuery): "low" | "medium" | "high" {
    const filterCount = query.filters?.length || 0;
    const groupByCount = query.groupBy?.length || 0;
    const aggCount = query.aggregations?.length || 0;
    const hasTimeGranularity = !!query.timeGranularity;
    const hasCustomQuery = !!query.customQuery;

    const complexityScore =
      filterCount +
      groupByCount * 2 +
      aggCount * 2 +
      (hasTimeGranularity ? 3 : 0) +
      (hasCustomQuery ? 5 : 0);

    if (complexityScore <= 5) return "low";
    if (complexityScore <= 15) return "medium";
    return "high";
  }

  private isKenyaSpecific(query: IReportQuery): boolean {
    // Check if query involves Kenya-specific fields or filters
    const kenyaFields = [
      "county",
      "mpesa",
      "safaricom",
      "nairobi",
      "mombasa",
      "kisumu",
    ];

    const queryStr = JSON.stringify(query).toLowerCase();
    return kenyaFields.some((field) => queryStr.includes(field));
  }

  private applyKenyaFormatting(data: any[]): any[] {
    return data.map((item) => {
      // Format currency values to KES
      for (const key of Object.keys(item)) {
        if (
          typeof item[key] === "number" &&
          (key.includes("amount") ||
            key.includes("price") ||
            key.includes("cost"))
        ) {
          item[`${key}_formatted`] = `KES ${item[key].toLocaleString()}`;
        }

        // Format phone numbers to Kenya format
        if (key.includes("phone") && typeof item[key] === "string") {
          item[key] = this.formatKenyaPhone(item[key]);
        }
      }

      return item;
    });
  }

  private formatKenyaPhone(phone: string): string {
    // Format to +254 format
    if (phone.startsWith("0")) {
      return `+254${phone.substring(1)}`;
    }
    if (phone.startsWith("254")) {
      return `+${phone}`;
    }
    return phone;
  }

  private estimateCompletionTime(reportDef: any): Date {
    const baseTime = 30_000; // 30 seconds base
    const complexityMultiplier =
      reportDef.metadata?.complexity === "high"
        ? 3
        : reportDef.metadata?.complexity === "medium"
          ? 2
          : 1;

    const estimatedMs = baseTime * complexityMultiplier;
    return new Date(Date.now() + estimatedMs);
  }

  private async generateSummary(
    data: any[],
    reportDef: any
  ): Promise<Record<string, any>> {
    return await Promise.resolve({
      totalRecords: data.length,
      generatedAt: new Date(),
      reportType: reportDef.type,
      dataSourcesUsed: Array.isArray(reportDef.query.dataSource)
        ? reportDef.query.dataSource
        : [reportDef.query.dataSource],
      keyMetrics: this.calculateKeyMetrics(data),
    });
  }

  private calculateKeyMetrics(data: any[]): Record<string, any> {
    if (data.length === 0) return {};

    const metrics: Record<string, any> = {};
    const firstRow = data[0];

    // Calculate basic statistics for numeric fields
    for (const key of Object.keys(firstRow)) {
      const values = data
        .map((row) => row[key])
        .filter((val) => typeof val === "number");

      if (values.length > 0) {
        metrics[key] = {
          total: values.reduce((sum, val) => sum + val, 0),
          average: values.reduce((sum, val) => sum + val, 0) / values.length,
          min: Math.min(...values),
          max: Math.max(...values),
          count: values.length,
        };
      }
    }

    return metrics;
  }

  private async updateReportAnalytics(
    reportId: Types.ObjectId,
    execution: any
  ): Promise<void> {
    try {
      const today = new Date();
      const startOfDay = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate()
      );
      const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

      // Find or create analytics record for today
      let analytics = await ReportAnalytics.findOne({
        reportId,
        "period.start": { $gte: startOfDay },
        "period.end": { $lt: endOfDay },
      });

      if (!analytics) {
        analytics = new ReportAnalytics({
          reportId,
          period: {
            start: startOfDay,
            end: endOfDay,
          },
          metrics: {
            executionCount: 0,
            averageExecutionTime: 0,
            successRate: 0,
            failureRate: 0,
            dataVolume: 0,
            deliverySuccessRate: 0,
            userEngagement: {
              views: 0,
              downloads: 0,
              shares: 0,
            },
          },
          performance: {
            queryPerformance: {
              averageTime: 0,
              slowestQuery: 0,
              fastestQuery: 0,
            },
            renderPerformance: {
              averageTime: 0,
              slowestRender: 0,
              fastestRender: 0,
            },
          },
          errors: [],
          usage: {
            topUsers: [],
            peakHours: [],
          },
        });
      }

      // Update metrics
      analytics.metrics.executionCount += 1;
      if (execution.duration) {
        analytics.metrics.averageExecutionTime =
          (analytics.metrics.averageExecutionTime *
            (analytics.metrics.executionCount - 1) +
            execution.duration) /
          analytics.metrics.executionCount;
      }

      if (execution.status === ReportStatus.COMPLETED) {
        analytics.metrics.successRate =
          (analytics.metrics.successRate *
            (analytics.metrics.executionCount - 1) +
            100) /
          analytics.metrics.executionCount;
      } else {
        analytics.metrics.failureRate =
          (analytics.metrics.failureRate *
            (analytics.metrics.executionCount - 1) +
            100) /
          analytics.metrics.executionCount;
      }

      await analytics.save();
    } catch (error) {
      console.error("Update analytics error:", error);
    }
  }

  // Mock data generators
  private mockUserData(): any[] {
    return Array.from({ length: 100 }, (_, i) => ({
      id: i + 1,
      name: `User ${i + 1}`,
      email: `user${i + 1}@example.com`,
      county:
        KENYA_COUNTIES_LIST[
          Math.floor(Math.random() * KENYA_COUNTIES_LIST.length)
        ],
      createdAt: new Date(
        Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000
      ),
      isActive: Math.random() > 0.2,
    }));
  }

  private mockPropertyData(): any[] {
    return Array.from({ length: 50 }, (_, i) => ({
      id: i + 1,
      title: `Property ${i + 1}`,
      county:
        KENYA_COUNTIES_LIST[
          Math.floor(Math.random() * KENYA_COUNTIES_LIST.length)
        ],
      price: Math.floor(Math.random() * 100_000) + 10_000,
      bedrooms: Math.floor(Math.random() * 5) + 1,
      createdAt: new Date(
        Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000
      ),
      isActive: Math.random() > 0.1,
    }));
  }

  private mockBookingData(): any[] {
    return Array.from({ length: 200 }, (_, i) => ({
      id: i + 1,
      propertyId: Math.floor(Math.random() * 50) + 1,
      userId: Math.floor(Math.random() * 100) + 1,
      amount: Math.floor(Math.random() * 50_000) + 5000,
      status: Math.random() > 0.8 ? "cancelled" : "confirmed",
      createdAt: new Date(
        Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000
      ),
    }));
  }

  private mockPaymentData(): any[] {
    return Array.from({ length: 300 }, (_, i) => ({
      id: i + 1,
      bookingId: Math.floor(Math.random() * 200) + 1,
      amount: Math.floor(Math.random() * 50_000) + 1000,
      method: Math.random() > 0.7 ? "mpesa" : "bank",
      status: Math.random() > 0.05 ? "completed" : "failed",
      createdAt: new Date(
        Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000
      ),
    }));
  }

  // Scheduled Reports
  async processScheduledReports(): Promise<void> {
    try {
      const now = new Date();

      const scheduledReports = await ReportDefinition.find({
        isActive: true,
        frequency: { $ne: ReportFrequency.ON_DEMAND },
        nextRunAt: { $lte: now },
      }).limit(REPORT_CONFIG.MAX_CONCURRENT_REPORTS);

      for (const report of scheduledReports) {
        try {
          await this.executeReport({ reportId: report._id.toString() });
          await report.updateNextRun();
        } catch (error) {
          console.error(
            `Scheduled report execution error for ${report._id}:`,
            error
          );
        }
      }
    } catch (error) {
      console.error("Process scheduled reports error:", error);
    }
  }

  // Cleanup
  async cleanupExpiredFiles(): Promise<void> {
    try {
      const expiredExecutions = await ReportExecution.find({
        "results.files.expiresAt": { $lt: new Date() },
      });

      for (const execution of expiredExecutions) {
        if (execution.results?.files) {
          for (const file of execution.results.files) {
            if (file.expiresAt && file.expiresAt < new Date()) {
              try {
                await fs.unlink(file.path);
                console.log(`Deleted expired file: ${file.filename}`);
              } catch (error) {
                console.error(`Failed to delete file ${file.filename}:`, error);
              }
            }
          }

          // Remove expired files from database
          execution.results.files = execution.results.files.filter(
            (file: any) => !file.expiresAt || file.expiresAt >= new Date()
          );
          await execution.save();
        }
      }
    } catch (error) {
      console.error("Cleanup expired files error:", error);
    }
  }
}

export const reportsService = ReportsService.getInstance();
