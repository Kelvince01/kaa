import { Elysia, t } from "elysia";
import { authPlugin } from "../../auth/auth.plugin";
import {
  getEmailsQuerySchema,
  sendBulkEmailSchema,
  sendBulkEmailWithTemplateSchema,
  sendEmailSchema,
  sendEmailWithTemplateSchema,
} from "./email.schema";
import emailService from "./email.service";

export const emailController = new Elysia({ prefix: "/emails" })
  .use(authPlugin)
  .post(
    "/send",
    ({ body }) => {
      emailService.sendEmail({
        to: body.to,
        subject: body.subject,
        content: body.content,
        html: body.html,
        context: body.context,
      });

      return {
        message: "Email sent successfully",
      };
    },
    {
      body: sendEmailSchema,
      detail: {
        tags: ["emails"],
        summary: "Send email",
        description: "Send an email to a recipient",
      },
    }
  )
  .post(
    "/send-with-template",
    ({ body }) => {
      emailService.sendEmailWithTemplate({
        to: body.to,
        subject: body.subject,
        content: body.content,
        templateId: body.templateId,
        data: body.data,
        metadata: body.metadata,
        context: body.context,
      });

      return {
        message: "Email sent successfully with template",
      };
    },
    {
      body: sendEmailWithTemplateSchema,
      detail: {
        tags: ["emails"],
        summary: "Send email with template",
        description: "Send an email to a recipient with a template",
      },
    }
  )
  .post(
    "/send-bulk",
    ({ body }) => {
      emailService.sendBulkEmail(body);
    },
    {
      body: sendBulkEmailSchema,
      detail: {
        tags: ["emails"],
        summary: "Send bulk email",
        description: "Send an email to a list of recipients",
      },
    }
  )
  .post(
    "/send-bulk-with-template",
    ({ body }) => {
      emailService.sendBulkEmailWithTemplate(body);
    },
    {
      body: sendBulkEmailWithTemplateSchema,
      detail: {
        tags: ["emails"],
        summary: "Send bulk email with template",
        description: "Send an email to a list of recipients with a template",
      },
    }
  )
  .get(
    "/get",
    ({ query }) => {
      const {
        page: pageQuery,
        limit: limitQuery,
        recipients,
        templateId,
        data,
        metadata,
        subject,
        content,
      } = query;
      const limit = Number(limitQuery) || 20;
      const page = Number(pageQuery) || 1;

      return emailService.getEmails({
        page,
        limit,
        recipients: recipients
          ? Array.isArray(recipients)
            ? recipients
            : [recipients]
          : [],
        templateId,
        data,
        metadata,
        subject,
        content,
      });
    },
    {
      query: getEmailsQuerySchema,
      detail: {
        tags: ["emails"],
        summary: "Get emails",
        description: "Get emails with filtering",
      },
    }
  )
  .get("/:id", ({ params }) => emailService.getEmail(params.id), {
    params: t.Object({ id: t.String() }),
    detail: {
      tags: ["emails"],
      summary: "Get email by ID",
      description: "Get an email by its ID",
    },
  });
