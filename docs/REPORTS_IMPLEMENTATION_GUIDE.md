# Reports Feature - Complete Implementation Guide

This document provides the complete, production-ready implementation for the Kaa reports feature.

## ✅ Completed

1. **Comprehensive Validation Schemas** (`apps/api/src/features/reports/report.schema.ts`)
   - All request/response schemas with proper validation
   - Nested schema definitions
   - Query parameter schemas
   - Param schemas

## 📋 Implementation Steps

### Step 1: Extend Report Service (`packages/services/src/report.service.ts`)

Add the following methods to the `ReportsService` class:

#### A. Report Management Methods

```typescript
// Get report by ID
async getReportById(reportId: string): Promise<IReportResponse> {
  try {
    const report = await ReportDefinition.findById(reportId);
    
    if (!report) {
      return {
        success: false,
        error: {
          code: ReportErrorCode.INVALID_PARAMETERS,
          message: 'Report not found',
        },
      };
    }

    return {
      success: true,
      data: report,
    };
  } catch (error) {
    console.error('Get report error:', error);
    return {
      success: false,
      error: {
        code: ReportErrorCode.GENERATION_FAILED,
        message: 'Failed to retrieve report',
      },
    };
  }
}

// Get user reports with pagination
async getUserReports(
  userId: Types.ObjectId,
  options: {
    page?: number;
    limit?: number;
    status?: string;
    type?: ReportType;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    tags?: string;
  }
): Promise<IReportListResponse> {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      type,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      tags,
    } = options;

    const skip = (page - 1) * limit;
    const query: any = { createdBy: userId };

    // Apply filters
    if (status) {
      query.status = status;
    }

    if (type) {
      query.type = type;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    if (tags) {
      query.tags = { $in: tags.split(',') };
    }

    const sort: any = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const [reports, total] = await Promise.all([
      ReportDefinition.find(query)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      ReportDefinition.countDocuments(query),
    ]);

    const totalPages = Math.ceil(total / limit);
    const hasMore = page < totalPages;

    return {
      success: true,
      data: {
        reports,
        total,
        page,
        limit,
        hasMore,
      },
    };
  } catch (error) {
    console.error('Get user reports error:', error);
    return {
      success: false,
      error: {
        code: ReportErrorCode.GENERATION_FAILED,
        message: 'Failed to retrieve reports',
      },
    };
  }
}

// Update report
async updateReport(
  reportId: string,
  updates: Partial<IReportDefinition>
): Promise<IReportResponse> {
  try {
    const report = await ReportDefinition.findByIdAndUpdate(
      reportId,
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!report) {
      return {
        success: false,
        error: {
          code: ReportErrorCode.INVALID_PARAMETERS,
          message: 'Report not found',
        },
      };
    }

    return {
      success: true,
      data: report,
      message: 'Report updated successfully',
    };
  } catch (error) {
    console.error('Update report error:', error);
    return {
      success: false,
      error: {
        code: ReportErrorCode.GENERATION_FAILED,
        message: 'Failed to update report',
      },
    };
  }
}

// Delete report (soft delete)
async deleteReport(reportId: string): Promise<IReportResponse> {
  try {
    const report = await ReportDefinition.findByIdAndUpdate(
      reportId,
      { isActive: false, deletedAt: new Date() },
      { new: true }
    );

    if (!report) {
      return {
        success: false,
        error: {
          code: ReportErrorCode.INVALID_PARAMETERS,
          message: 'Report not found',
        },
      };
    }

    return {
      success: true,
      message: 'Report deleted successfully',
    };
  } catch (error) {
    console.error('Delete report error:', error);
    return {
      success: false,
      error: {
        code: ReportErrorCode.GENERATION_FAILED,
        message: 'Failed to delete report',
      },
    };
  }
}

// Duplicate report
async duplicateReport(
  reportId: string,
  userId: Types.ObjectId
): Promise<IReportResponse> {
  try {
    const original = await ReportDefinition.findById(reportId);

    if (!original) {
      return {
        success: false,
        error: {
          code: ReportErrorCode.INVALID_PARAMETERS,
          message: 'Report not found',
        },
      };
    }

    const duplicate = new ReportDefinition({
      ...original.toObject(),
      _id: undefined,
      name: `${original.name} (Copy)`,
      createdBy: userId,
      runCount: 0,
      lastRunAt: undefined,
      nextRunAt: undefined,
    });

    await duplicate.save();

    return {
      success: true,
      data: duplicate,
      message: 'Report duplicated successfully',
    };
  } catch (error) {
    console.error('Duplicate report error:', error);
    return {
      success: false,
      error: {
        code: ReportErrorCode.GENERATION_FAILED,
        message: 'Failed to duplicate report',
      },
    };
  }
}
```

#### B. Download & Storage Methods

```typescript
// Generate signed download URL
async getReportDownloadUrl(
  reportId: string,
  format: ReportFormat,
  expiresIn: number = 3600 // 1 hour default
): Promise<IReportResponse> {
  try {
    const execution = await ReportExecution.findOne({
      reportId,
      status: ReportStatus.COMPLETED,
    })
      .sort({ completedAt: -1 })
      .limit(1);

    if (!execution || !execution.results?.files) {
      return {
        success: false,
        error: {
          code: ReportErrorCode.INVALID_PARAMETERS,
          message: 'No completed report found',
        },
      };
    }

    const file = execution.results.files.find(
      (f: any) => f.format === format
    );

    if (!file) {
      return {
        success: false,
        error: {
          code: ReportErrorCode.INVALID_PARAMETERS,
          message: `Report file in ${format} format not found`,
        },
      };
    }

    // Generate signed URL (implement based on your storage solution)
    const downloadUrl = await this.generateSignedUrl(file.path, expiresIn);

    return {
      success: true,
      data: {
        downloadUrl,
        filename: file.filename,
        size: file.size,
        expiresAt: new Date(Date.now() + expiresIn * 1000),
      },
    };
  } catch (error) {
    console.error('Get download URL error:', error);
    return {
      success: false,
      error: {
        code: ReportErrorCode.GENERATION_FAILED,
        message: 'Failed to generate download URL',
      },
    };
  }
}

private async generateSignedUrl(
  filePath: string,
  expiresIn: number
): Promise<string> {
  // TODO: Implement based on your storage solution (S3, GCS, Azure, etc.)
  // For now, return a mock URL
  const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
  const timestamp = Date.now() + expiresIn * 1000;
  const signature = Buffer.from(`${filePath}:${timestamp}`).toString('base64');
  
  return `${baseUrl}/api/reports/download/${encodeURIComponent(filePath)}?expires=${timestamp}&signature=${signature}`;
}
```

#### C. Template Management Methods

```typescript
// Create report template
async createReportTemplate(
  template: any,
  userId: Types.ObjectId
): Promise<IReportResponse> {
  try {
    const newTemplate = new ReportTemplate({
      ...template,
      createdBy: userId,
      isSystemTemplate: false,
      version: 1,
    });

    await newTemplate.save();

    return {
      success: true,
      data: newTemplate,
      message: 'Template created successfully',
    };
  } catch (error) {
    console.error('Create template error:', error);
    return {
      success: false,
      error: {
        code: ReportErrorCode.TEMPLATE_ERROR,
        message: 'Failed to create template',
      },
    };
  }
}

// Get report templates with pagination
async getReportTemplates(
  userId: Types.ObjectId,
  options: {
    page?: number;
    limit?: number;
    category?: string;
    type?: ReportType;
    isPublic?: boolean;
    search?: string;
  }
): Promise<IReportListResponse> {
  try {
    const {
      page = 1,
      limit = 20,
      category,
      type,
      isPublic,
      search,
    } = options;

    const skip = (page - 1) * limit;
    const query: any = {
      $or: [
        { createdBy: userId },
        { isPublic: true },
        { isSystemTemplate: true },
      ],
    };

    if (category) {
      query.category = category;
    }

    if (type) {
      query.type = type;
    }

    if (isPublic !== undefined) {
      query.isPublic = isPublic;
    }

    if (search) {
      query.$and = query.$and || [];
      query.$and.push({
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
        ],
      });
    }

    const [templates, total] = await Promise.all([
      ReportTemplate.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      ReportTemplate.countDocuments(query),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      success: true,
      data: {
        reports: templates,
        total,
        page,
        limit,
        hasMore: page < totalPages,
      },
    };
  } catch (error) {
    console.error('Get templates error:', error);
    return {
      success: false,
      error: {
        code: ReportErrorCode.TEMPLATE_ERROR,
        message: 'Failed to retrieve templates',
      },
    };
  }
}

// Get template by ID
async getTemplateById(templateId: string): Promise<IReportResponse> {
  try {
    const template = await ReportTemplate.findById(templateId);

    if (!template) {
      return {
        success: false,
        error: {
          code: ReportErrorCode.INVALID_PARAMETERS,
          message: 'Template not found',
        },
      };
    }

    return {
      success: true,
      data: template,
    };
  } catch (error) {
    console.error('Get template error:', error);
    return {
      success: false,
      error: {
        code: ReportErrorCode.TEMPLATE_ERROR,
        message: 'Failed to retrieve template',
      },
    };
  }
}

// Update template
async updateTemplate(
  templateId: string,
  updates: any
): Promise<IReportResponse> {
  try {
    const template = await ReportTemplate.findByIdAndUpdate(
      templateId,
      {
        $set: updates,
        $inc: { version: 1 },
      },
      { new: true, runValidators: true }
    );

    if (!template) {
      return {
        success: false,
        error: {
          code: ReportErrorCode.INVALID_PARAMETERS,
          message: 'Template not found',
        },
      };
    }

    return {
      success: true,
      data: template,
      message: 'Template updated successfully',
    };
  } catch (error) {
    console.error('Update template error:', error);
    return {
      success: false,
      error: {
        code: ReportErrorCode.TEMPLATE_ERROR,
        message: 'Failed to update template',
      },
    };
  }
}

// Delete template
async deleteTemplate(templateId: string): Promise<IReportResponse> {
  try {
    const template = await ReportTemplate.findByIdAndDelete(templateId);

    if (!template) {
      return {
        success: false,
        error: {
          code: ReportErrorCode.INVALID_PARAMETERS,
          message: 'Template not found',
        },
      };
    }

    return {
      success: true,
      message: 'Template deleted successfully',
    };
  } catch (error) {
    console.error('Delete template error:', error);
    return {
      success: false,
      error: {
        code: ReportErrorCode.TEMPLATE_ERROR,
        message: 'Failed to delete template',
      },
    };
  }
}

// Get system templates
async getSystemTemplates(): Promise<IReportResponse> {
  try {
    const templates = await ReportTemplate.find({
      isSystemTemplate: true,
      isActive: true,
    }).sort({ category: 1, name: 1 });

    return {
      success: true,
      data: {
        templates,
        categories: [...new Set(templates.map(t => t.category))],
      },
    };
  } catch (error) {
    console.error('Get system templates error:', error);
    return {
      success: false,
      error: {
        code: ReportErrorCode.TEMPLATE_ERROR,
        message: 'Failed to retrieve system templates',
      },
    };
  }
}
```

#### D. Schedule Management Methods

```typescript
// Schedule report
async scheduleReport(
  schedule: any,
  userId: Types.ObjectId
): Promise<IReportResponse> {
  try {
    // Create or update report definition with schedule
    const reportDef = await ReportDefinition.findByIdAndUpdate(
      schedule.reportId,
      {
        $set: {
          frequency: schedule.schedule.frequency,
          schedule: schedule.schedule,
          recipients: schedule.recipients || [],
          parameters: schedule.parameters || {},
        },
      },
      { new: true, upsert: false }
    );

    if (!reportDef) {
      return {
        success: false,
        error: {
          code: ReportErrorCode.INVALID_PARAMETERS,
          message: 'Report not found',
        },
      };
    }

    // Calculate next run time
    await reportDef.updateNextRun();

    return {
      success: true,
      data: reportDef,
      message: 'Report scheduled successfully',
    };
  } catch (error) {
    console.error('Schedule report error:', error);
    return {
      success: false,
      error: {
        code: ReportErrorCode.GENERATION_FAILED,
        message: 'Failed to schedule report',
      },
    };
  }
}

// Get scheduled reports
async getScheduledReports(
  userId: Types.ObjectId,
  options: {
    page?: number;
    limit?: number;
    active?: boolean;
    frequency?: ReportFrequency;
  }
): Promise<IReportListResponse> {
  try {
    const { page = 1, limit = 20, active, frequency } = options;
    const skip = (page - 1) * limit;

    const query: any = {
      createdBy: userId,
      frequency: { $ne: ReportFrequency.ON_DEMAND },
    };

    if (active !== undefined) {
      query.isActive = active;
    }

    if (frequency) {
      query.frequency = frequency;
    }

    const [schedules, total] = await Promise.all([
      ReportDefinition.find(query)
        .sort({ nextRunAt: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      ReportDefinition.countDocuments(query),
    ]);

    return {
      success: true,
      data: {
        reports: schedules,
        total,
        page,
        limit,
        hasMore: page < Math.ceil(total / limit),
      },
    };
  } catch (error) {
    console.error('Get scheduled reports error:', error);
    return {
      success: false,
      error: {
        code: ReportErrorCode.GENERATION_FAILED,
        message: 'Failed to retrieve scheduled reports',
      },
    };
  }
}

// Update report schedule
async updateReportSchedule(
  scheduleId: string,
  updates: any
): Promise<IReportResponse> {
  try {
    const updateData: any = {};

    if (updates.schedule) {
      updateData.schedule = updates.schedule;
      updateData.frequency = updates.schedule.frequency;
    }

    if (updates.recipients) {
      updateData.recipients = updates.recipients;
    }

    if (updates.parameters) {
      updateData.parameters = updates.parameters;
    }

    if (updates.isActive !== undefined) {
      updateData.isActive = updates.isActive;
    }

    const schedule = await ReportDefinition.findByIdAndUpdate(
      scheduleId,
      { $set: updateData },
      { new: true }
    );

    if (!schedule) {
      return {
        success: false,
        error: {
          code: ReportErrorCode.INVALID_PARAMETERS,
          message: 'Schedule not found',
        },
      };
    }

    // Recalculate next run if schedule changed
    if (updates.schedule) {
      await schedule.updateNextRun();
    }

    return {
      success: true,
      data: schedule,
      message: 'Schedule updated successfully',
    };
  } catch (error) {
    console.error('Update schedule error:', error);
    return {
      success: false,
      error: {
        code: ReportErrorCode.GENERATION_FAILED,
        message: 'Failed to update schedule',
      },
    };
  }
}

// Cancel report schedule
async cancelReportSchedule(scheduleId: string): Promise<IReportResponse> {
  try {
    const schedule = await ReportDefinition.findByIdAndUpdate(
      scheduleId,
      {
        $set: {
          isActive: false,
          frequency: ReportFrequency.ON_DEMAND,
        },
        $unset: { schedule: '', nextRunAt: '' },
      },
      { new: true }
    );

    if (!schedule) {
      return {
        success: false,
        error: {
          code: ReportErrorCode.INVALID_PARAMETERS,
          message: 'Schedule not found',
        },
      };
    }

    return {
      success: true,
      message: 'Schedule cancelled successfully',
    };
  } catch (error) {
    console.error('Cancel schedule error:', error);
    return {
      success: false,
      error: {
        code: ReportErrorCode.GENERATION_FAILED,
        message: 'Failed to cancel schedule',
      },
    };
  }
}

// Pause schedule
async pauseSchedule(scheduleId: string): Promise<IReportResponse> {
  try {
    const schedule = await ReportDefinition.findByIdAndUpdate(
      scheduleId,
      { $set: { isActive: false } },
      { new: true }
    );

    if (!schedule) {
      return {
        success: false,
        error: {
          code: ReportErrorCode.INVALID_PARAMETERS,
          message: 'Schedule not found',
        },
      };
    }

    return {
      success: true,
      data: schedule,
      message: 'Schedule paused successfully',
    };
  } catch (error) {
    console.error('Pause schedule error:', error);
    return {
      success: false,
      error: {
        code: ReportErrorCode.GENERATION_FAILED,
        message: 'Failed to pause schedule',
      },
    };
  }
}

// Resume schedule
async resumeSchedule(scheduleId: string): Promise<IReportResponse> {
  try {
    const schedule = await ReportDefinition.findByIdAndUpdate(
      scheduleId,
      { $set: { isActive: true } },
      { new: true }
    );

    if (!schedule) {
      return {
        success: false,
        error: {
          code: ReportErrorCode.INVALID_PARAMETERS,
          message: 'Schedule not found',
        },
      };
    }

    // Recalculate next run
    await schedule.updateNextRun();

    return {
      success: true,
      data: schedule,
      message: 'Schedule resumed successfully',
    };
  } catch (error) {
    console.error('Resume schedule error:', error);
    return {
      success: false,
      error: {
        code: ReportErrorCode.GENERATION_FAILED,
        message: 'Failed to resume schedule',
      },
    };
  }
}
```

### Step 2: Integrate Real Data Sources

Replace the mock data methods with actual database queries:

```typescript
// Replace mockUserData
private async queryUserData(pipeline: any[]): Promise<any[]> {
  const { User } = await import('@kaa/models');
  return await User.aggregate(pipeline).exec();
}

// Replace mockPropertyData
private async queryPropertyData(pipeline: any[]): Promise<any[]> {
  const { Property } = await import('@kaa/models');
  return await Property.aggregate(pipeline).exec();
}

// Replace mockBookingData
private async queryBookingData(pipeline: any[]): Promise<any[]> {
  const { Booking } = await import('@kaa/models');
  return await Booking.aggregate(pipeline).exec();
}

// Replace mockPaymentData
private async queryPaymentData(pipeline: any[]): Promise<any[]> {
  const { Payment } = await import('@kaa/models');
  return await Payment.aggregate(pipeline).exec();
}

// Update queryDataSource to use real data
private async queryDataSource(
  dataSource: DataSource,
  pipeline: any[]
): Promise<any[]> {
  switch (dataSource) {
    case DataSource.USERS:
      return await this.queryUserData(pipeline);
    case DataSource.PROPERTIES:
      return await this.queryPropertyData(pipeline);
    case DataSource.BOOKINGS:
      return await this.queryBookingData(pipeline);
    case DataSource.PAYMENTS:
      return await this.queryPaymentData(pipeline);
    // Add more data sources as needed
    default:
      return [];
  }
}
```

### Step 3: Implement Controller (Uncomment and Complete)

Update `apps/api/src/features/reports/reports.controller.ts`:

The controller is substantial. See **REPORTS_CONTROLLER_COMPLETE.md** for the full implementation.

### Step 4: Add BullMQ Job Queue

Create `apps/api/src/features/reports/report.queue.ts`:

```typescript
import { Queue, Worker, Job } from 'bullmq';
import { reportsService } from '@kaa/services';
import type { IExecuteReportRequest } from '@kaa/models/types';

const connection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: Number.parseInt(process.env.REDIS_PORT || '6379'),
};

export const reportQueue = new Queue('reports', { connection });

// Worker to process report jobs
export const reportWorker = new Worker(
  'reports',
  async (job: Job<IExecuteReportRequest>) => {
    console.log(`Processing report job ${job.id}`);
    
    const result = await reportsService.executeReport(
      job.data,
      job.data.userId
    );

    if (!result.success) {
      throw new Error(result.error?.message || 'Report generation failed');
    }

    return result.data;
  },
  {
    connection,
    concurrency: 5, // Process 5 reports concurrently
  }
);

// Job event listeners
reportWorker.on('completed', (job) => {
  console.log(`Report job ${job.id} completed`);
});

reportWorker.on('failed', (job, err) => {
  console.error(`Report job ${job?.id} failed:`, err);
});

reportWorker.on('progress', (job, progress) => {
  console.log(`Report job ${job.id} progress: ${progress}%`);
});

// Helper to enqueue report generation
export async function enqueueReport(
  request: IExecuteReportRequest,
  priority: number = 0
): Promise<string> {
  const job = await reportQueue.add('generate-report', request, {
    priority,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  });

  return job.id || '';
}
```

### Step 5: Kenya-Specific Enhancements

Add to service:

```typescript
// Property market analysis by county
async getCountyPropertyAnalytics(
  county: string,
  timeRange: { start: Date; end: Date }
): Promise<any> {
  const { Property } = await import('@kaa/models');
  
  const analytics = await Property.aggregate([
    {
      $match: {
        'location.county': county,
        createdAt: { $gte: timeRange.start, $lte: timeRange.end },
      },
    },
    {
      $facet: {
        priceStats: [
          {
            $group: {
              _id: '$type',
              avgPrice: { $avg: '$pricing.rent' },
              minPrice: { $min: '$pricing.rent' },
              maxPrice: { $max: '$pricing.rent' },
              count: { $sum: 1 },
            },
          },
        ],
        occupancyStats: [
          {
            $group: {
              _id: null,
              totalUnits: { $sum: '$units' },
              vacantUnits: {
                $sum: {
                  $cond: [{ $eq: ['$status', 'vacant'] }, 1, 0],
                },
              },
            },
          },
          {
            $project: {
              totalUnits: 1,
              vacantUnits: 1,
              occupancyRate: {
                $multiply: [
                  {
                    $divide: [
                      { $subtract: ['$totalUnits', '$vacantUnits'] },
                      '$totalUnits',
                    ],
                  },
                  100,
                ],
              },
            },
          },
        ],
        typeDistribution: [
          {
            $group: {
              _id: '$type',
              count: { $sum: 1 },
            },
          },
        ],
      },
    },
  ]);

  return analytics[0];
}

// M-Pesa deep analytics
async getMpesaDeepAnalytics(
  timeRange: { start: Date; end: Date }
): Promise<any> {
  const { Payment } = await import('@kaa/models');

  const analytics = await Payment.aggregate([
    {
      $match: {
        'method.type': 'mpesa',
        createdAt: { $gte: timeRange.start, $lte: timeRange.end },
      },
    },
    {
      $facet: {
        transactionStats: [
          {
            $group: {
              _id: null,
              total: { $sum: 1 },
              successful: {
                $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] },
              },
              failed: {
                $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] },
              },
              totalVolume: { $sum: '$amount' },
              avgAmount: { $avg: '$amount' },
            },
          },
        ],
        hourlyDistribution: [
          {
            $group: {
              _id: { $hour: '$createdAt' },
              count: { $sum: 1 },
              volume: { $sum: '$amount' },
            },
          },
          { $sort: { _id: 1 } },
        ],
        failureReasons: [
          {
            $match: { status: 'failed' },
          },
          {
            $group: {
              _id: '$failureReason',
              count: { $sum: 1 },
            },
          },
          { $sort: { count: -1 } },
          { $limit: 10 },
        ],
      },
    },
  ]);

  return analytics[0];
}
```

## Next Steps

1. **Implement remaining controller endpoints** (see REPORTS_CONTROLLER_COMPLETE.md)
2. **Add Redis caching layer**
3. **Integrate email/SMS services**
4. **Create system templates**
5. **Add comprehensive tests**
6. **Documentation**

## Testing

```bash
# Unit tests
bun test packages/services/src/__tests__/report.service.test.ts

# Integration tests
bun test apps/api/src/features/reports/__tests__/reports.integration.test.ts

# Load tests
cd apps/api
bun run loadtest:reports
```

## Security Considerations

1. **RBAC Integration**: Ensure proper permission checks
2. **Data Filtering**: Users should only see their own reports (or org-level if admin)
3. **Rate Limiting**: Prevent abuse of report generation
4. **File Access**: Signed URLs with expiration
5. **Audit Logging**: Track all report access

## Performance Optimization

1. **Database Indexes**: Add indexes on frequently queried fields
2. **Caching**: Cache frequently accessed reports
3. **Pagination**: Always paginate large result sets
4. **Async Processing**: Use job queue for long-running reports
5. **Connection Pooling**: Optimize database connections

## Monitoring

Track these metrics:

- Report generation time
- Success/failure rates
- Queue depth
- Storage usage
- API response times
