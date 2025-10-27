import config from "@kaa/config/api";
import { emailService, TemplateService } from "@kaa/services";
import type { Job } from "bullmq";
import type mongoose from "mongoose";

/**
 * Send email verification to a newly registered user
 */
export const sendVerificationEmail = async (
  user: {
    email: string;
    id: string;
    firstName: string;
  },
  token: string,
  requestMetadata: {
    requestId: string;
    ipAddress: string;
    userAgent: string;
  }
): Promise<Job<any, any, string>> => {
  const verificationUrl = `${config.clientUrl}/auth/verify-email?token=${token}`;

  const template = await TemplateService.getTemplateBy({
    slug: "user-verification-mjml-template",
  });

  return emailService.sendEmailWithTemplate({
    to: [user.email],
    templateId: (template._id as mongoose.Types.ObjectId).toString(),
    data: {
      logoUrl: config.app.logoUrl,
      firstName: user.firstName,
      verificationUrl,
      supportEmail: process.env.SUPPORT_EMAIL || "support@kaa.co.ke",
      year: new Date().getFullYear(),
    },
    userId: user.id,
    requestMetadata,
  });
};

/**
 * Send welcome email after account verification
 */
export const sendWelcomeEmail = async (
  user: {
    email: string;
    id: string;
    firstName: string;
  },
  requestMetadata: {
    requestId: string;
    ipAddress: string;
    userAgent: string;
  }
): Promise<Job<any, any, string>> => {
  const template = await TemplateService.getTemplateBy({
    slug: "welcome-email-mjml-template",
  });

  return emailService.sendEmailWithTemplate({
    to: [user.email],
    templateId: (template._id as mongoose.Types.ObjectId).toString(),
    data: {
      logoUrl: config.app.logoUrl,
      firstName: user.firstName,
      loginUrl: `${config.clientUrl}/auth/login`,
      supportEmail: process.env.SUPPORT_EMAIL || "support@kaa.co.ke",
      year: new Date().getFullYear(),
    },
    userId: user.id,
    requestMetadata,
  });
};

export const sendLoginAlertEmail = async (
  user: {
    id: string;
    email: string;
  },
  ip: string,
  userAgent: string,
  requestMetadata: {
    requestId: string;
    ipAddress: string;
    userAgent: string;
  }
): Promise<Job<any, any, string>> => {
  const template = await TemplateService.getTemplateBy({
    slug: "login-alert-email-mjml-template",
  });

  return emailService.sendEmailWithTemplate({
    to: [user.email],
    templateId: (template._id as mongoose.Types.ObjectId).toString(),
    data: {
      logoUrl: config.app.logoUrl,
      ip,
      userAgent,
      date: new Date().toLocaleString(),
    },
    userId: user.id,
    requestMetadata,
  });
};

/**
 * Send password reset email
 */
export const sendPasswordResetEmail = async (
  user: {
    email: string;
    id: string;
    firstName: string;
  },
  token: string,
  requestMetadata: {
    requestId: string;
    ipAddress: string;
    userAgent: string;
  }
): Promise<Job<any, any, string>> => {
  const resetUrl = `${config.clientUrl}/auth/reset-password?token=${token}`;

  const template = await TemplateService.getTemplateBy({
    slug: "password-reset-email-mjml-template",
  });

  return emailService.sendEmailWithTemplate({
    to: [user.email],
    templateId: (template._id as mongoose.Types.ObjectId).toString(),
    data: {
      logoUrl: config.app.logoUrl,
      firstName: user.firstName,
      resetUrl,
      expiryHours: 1, // Token expiry in hours
      supportEmail: process.env.SUPPORT_EMAIL || "support@kaa.co.ke",
      year: new Date().getFullYear(),
    },
    userId: user.id,
    requestMetadata,
  });
};
