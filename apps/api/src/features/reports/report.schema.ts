import { t } from "elysia";

export const ReportRequestSchema = t.Object({
  reportType: t.String(),
  startDate: t.String(),
  endDate: t.String(),
  propertyId: t.String(),
  status: t.String(),
});

export const ReportScheduleSchema = t.Object({
  reportType: t.String(),
  frequency: t.String(),
  parameters: t.Any(),
  email: t.String(),
});

export const ReportTemplateSchema = t.Object({
  name: t.String(),
  description: t.String(),
  template: t.Any(),
  category: t.String(),
});
