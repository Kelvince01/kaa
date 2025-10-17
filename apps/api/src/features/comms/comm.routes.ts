import { Elysia } from "elysia";
import { emailController } from "./emails/email.controller";
import { conversationController } from "./messages/conversation.controller";
import { notificationController } from "./notifications/notification.controller";
import { smsController } from "./sms/sms.controller";
import { ussdController } from "./ussd.controller";

export const commRoutes = new Elysia()
  .use(emailController)
  .use(smsController)
  .use(conversationController)
  .use(notificationController)
  .use(ussdController);
