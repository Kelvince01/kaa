import type { ITemplateCreateRequest } from "@kaa/models/types";
import {
  loginAlertEmailMJMLTemplate,
  userVerificationMJMLTemplate,
  welcomeEmailMJMLTemplate,
} from "./auth-mjml-templates";

export const authTemplates: ITemplateCreateRequest[] = [
  {
    name: "User Verification MJML Template",
    slug: "user-verification-mjml-template",
    description: "User verification email template",
    content: userVerificationMJMLTemplate,
    variables: [
      {
        name: "firstName",
        type: "string",
        description: "The first name of the user",
        required: true,
      },
      {
        name: "logoUrl",
        type: "string",
        description: "The URL of the logo",
        required: true,
      },
      {
        name: "verificationUrl",
        type: "string",
        description: "The URL to verify the email address",
        required: true,
      },
      {
        name: "supportEmail",
        type: "string",
        description: "The support email address",
        required: true,
      },
      {
        name: "year",
        type: "number",
        description: "The year",
        required: true,
      },
    ],
    engine: "mjml",
    format: "html",
    category: "email",
    type: "verification",
    subject: "Verify Your Email Address",
    tags: ["auth", "verification"],
    translations: {
      en: {
        subject: "Verify Your Email Address",
        textContent: "Verify Your Email Address",
      },
      sw: {
        subject:
          "Tafadhali tumia barua hii kwa kutekeleza utaratibu wa barua hii",
        textContent:
          "Tafadhali tumia barua hii kwa kutekeleza utaratibu wa barua hii",
      },
    },
    defaultLanguage: "en",
  },
  {
    name: "Welcome Email MJML Template",
    slug: "welcome-email-mjml-template",
    description: "Welcome email template",
    content: welcomeEmailMJMLTemplate,
    variables: [
      {
        name: "firstName",
        type: "string",
        description: "The first name of the user",
        required: true,
      },
      {
        name: "logoUrl",
        type: "string",
        description: "The URL of the logo",
        required: true,
      },
      {
        name: "loginUrl",
        type: "string",
        description: "The URL to login",
        required: true,
      },
      {
        name: "supportEmail",
        type: "string",
        description: "The support email address",
        required: true,
      },
      {
        name: "year",
        type: "number",
        description: "The year",
        required: true,
      },
    ],
    engine: "mjml",
    format: "html",
    category: "email",
    type: "welcome",
    subject: "Welcome to Kaa!",
    tags: ["auth", "welcome"],
    translations: {
      en: {
        subject: "Welcome to Kaa!",
        textContent: "Welcome to our platform",
      },
      sw: {
        subject: "Karibu kwenye Kaa!",
        textContent: "Karibu kwenye platform ya Kaa",
      },
    },
    defaultLanguage: "en",
  },
  {
    name: "Login Alert Email MJML Template",
    slug: "login-alert-email-mjml-template",
    description: "Login alert email template",
    content: loginAlertEmailMJMLTemplate,
    variables: [
      /*{
        name: "logoUrl",
        type: "string",
        description: "The URL of the logo",
        required: true,
      },*/
      {
        name: "ip",
        type: "string",
        description: "The IP address of the user",
        required: true,
      },
      {
        name: "userAgent",
        type: "string",
        description: "The user agent of the user",
        required: true,
      },
      {
        name: "date",
        type: "string",
        description: "The date of the login",
        required: true,
      },
    ],
    engine: "mjml",
    format: "html",
    category: "email",
    type: "login-alert",
    subject: "New Login Alert",
    tags: ["auth", "login-alert"],
    translations: {
      en: {
        subject: "New Login Alert",
        textContent: "New Login Alert",
      },
      sw: {
        subject: "Msalio Mchungaji wa Kipindi",
        textContent: "Msalio Mchungaji wa Kipindi",
      },
    },
    defaultLanguage: "en",
  },
];
