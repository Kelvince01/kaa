import config from "@kaa/config/api";
import { User } from "@kaa/models";
import emailService from "./email.service";

/**
 * Send email verification to a newly registered user
 */
export const sendVerificationEmail = async (
  email: string,
  token: string
): Promise<boolean> => {
  const verificationUrl = `${config.clientUrl}/auth/verify-email?token=${token}`;

  // Find user to get their name
  const user = await User.findOne({ email });
  const firstName = user?.profile.firstName || "there";

  return emailService.sendEmail({
    to: email,
    subject: "Verify Your Email Address",
    template: "verification",
    context: {
      firstName,
      verificationUrl,
      supportEmail: process.env.SUPPORT_EMAIL || "support@kaa.co.ke",
      year: new Date().getFullYear(),
    },
  });
};

/**
 * Send password reset email
 */
export const sendPasswordResetEmail = async (
  email: string,
  token: string
): Promise<boolean> => {
  const resetUrl = `${config.clientUrl}/auth/reset-password?token=${token}`;

  // Find user to get their name
  const user = await User.findOne({ email });
  const firstName = user?.profile.firstName || "there";

  return emailService.sendEmail({
    to: email,
    subject: "Reset Your Password",
    template: "password-reset",
    context: {
      firstName,
      resetUrl,
      expiryHours: 1, // Token expiry in hours
      supportEmail: process.env.SUPPORT_EMAIL || "support@kaa.co.ke",
      year: new Date().getFullYear(),
    },
  });
};

/**
 * Send welcome email after account verification
 */
export const sendWelcomeEmail = async (email: string): Promise<boolean> => {
  // Find user to get their name
  const user = await User.findOne({ email });
  const firstName = user?.profile.firstName || "there";

  return emailService.sendEmail({
    to: email,
    subject: "Welcome to Kaa!",
    template: "welcome",
    context: {
      firstName,
      loginUrl: `${config.clientUrl}/auth/login`,
      supportEmail: process.env.SUPPORT_EMAIL || "support@kaa.co.ke",
      year: new Date().getFullYear(),
    },
  });
};

export const sendLoginAlertEmail = async (
  email: string,
  ip: string,
  userAgent: string
): Promise<boolean> =>
  await emailService.sendEmail({
    to: email,
    subject: "New Login Alert",
    template: "login-alert",
    context: {
      ip,
      userAgent,
      date: new Date().toLocaleString(),
    },
  });
