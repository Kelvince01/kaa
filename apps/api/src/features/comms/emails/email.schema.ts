import { type Static, t } from "elysia";

export const emailAttachmentSchema = t.Object({
  filename: t.String(),
  content: t.ArrayBuffer(),
});

export const basicEmailSchema = t.Object({
  to: t.Array(t.String()),
  subject: t.String(),
  content: t.String(),
  headers: t.Optional(t.Object({})),
  tags: t.Optional(t.Array(t.String())),
  cc: t.Optional(t.Union([t.String(), t.Array(t.String())])),
  bcc: t.Optional(t.Union([t.String(), t.Array(t.String())])),
  replyTo: t.Optional(t.String()),
  attachments: t.Optional(t.Array(emailAttachmentSchema)),
  metadata: t.Optional(t.Object({})),
  priority: t.Optional(t.String()),
  settings: t.Optional(
    t.Object({
      enableDeliveryReports: t.Optional(t.Boolean()),
      maxRetries: t.Optional(t.Number()),
      retryInterval: t.Optional(t.Number()),
      provider: t.Optional(t.String()),
    })
  ),
});

export const sendEmailSchema = t.Object({
  ...basicEmailSchema.properties,
  html: t.Optional(t.String()),
  text: t.Optional(t.String()),
});

export const sendEmailWithTemplateSchema = t.Object({
  ...basicEmailSchema.properties,
  templateId: t.String(),
  template: t.Optional(t.Object({})),
  data: t.Optional(t.Object({})),
  userId: t.String(),
  requestMetadata: t.Object({
    requestId: t.String(),
    ipAddress: t.String(),
    userAgent: t.String(),
  }),
});

export const sendBulkEmailSchema = t.Object({
  recipients: t.Array(t.String()),
  subject: t.String(),
  content: t.String(),
  priority: t.Optional(t.String()),
  settings: t.Optional(
    t.Object({
      enableDeliveryReports: t.Optional(t.Boolean()),
      maxRetries: t.Optional(t.Number()),
      retryInterval: t.Optional(t.Number()),
      provider: t.Optional(t.String()),
    })
  ),
});

export const sendBulkEmailWithTemplateSchema = t.Object({
  recipients: t.Array(t.String()),
  templateId: t.String(),
  data: t.Optional(t.Object({})),
  metadata: t.Optional(t.Object({})),
  priority: t.Optional(t.String()),
  settings: t.Optional(
    t.Object({
      enableDeliveryReports: t.Optional(t.Boolean()),
      maxRetries: t.Optional(t.Number()),
      retryInterval: t.Optional(t.Number()),
      provider: t.Optional(t.String()),
    })
  ),
});

export const queryEmailsSchema = t.Object({
  page: t.Optional(t.Number()),
  limit: t.Optional(t.Number()),
  subject: t.Optional(t.String()),
  content: t.Optional(t.String()),
  recipients: t.Optional(t.Array(t.String())),
  templateId: t.Optional(t.String()),
  data: t.Optional(t.Object({})),
  metadata: t.Optional(t.Object({})),
  priority: t.Optional(t.String()),
});

export type SendEmail = Static<typeof sendEmailSchema>;
export type SendEmailWithTemplate = Static<typeof sendEmailWithTemplateSchema>;
export type SendBulkEmail = Static<typeof sendBulkEmailSchema>;
export type SendBulkEmailWithTemplate = Static<
  typeof sendBulkEmailWithTemplateSchema
>;
export type QueryEmails = Static<typeof queryEmailsSchema>;
