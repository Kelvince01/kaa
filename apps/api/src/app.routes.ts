import { Elysia } from "elysia";

import { aiController } from "./features/ai/ai.controller";
import { authController } from "./features/auth/auth.controller";
import { csrfController } from "./features/auth/csrf.controller";
import { securityMonitoringController } from "./features/auth/security-monitoring.controller";
import { conversationController } from "./features/comms/messages/conversation.controller";
import { notificationController } from "./features/comms/notifications/notification.controller";
import { smsController } from "./features/comms/sms/sms.controller";
import { fileController } from "./features/files/file.controller";
import { monitoringController } from "./features/misc/monitoring/monitoring.controller";
import { billingController } from "./features/org/billing.controller";
import { memberController } from "./features/org/member.controller";
import { organizationController } from "./features/org/org.controller";
import { rentSubscriptionController } from "./features/org/rent-subscription.controller";
import { subscriptionController } from "./features/org/subscription.controller";
import { rbacController } from "./features/rbac/rbac.controller";
import { templatesController } from "./features/templates/template.controller";
import { usersController } from "./features/users/user.controller";

const routes = new Elysia({ prefix: "api/v1" })
  .use(csrfController)
  .use(securityMonitoringController)
  .use(authController)
  .use(rbacController)
  .use(usersController)
  .use(smsController)
  .use(conversationController)
  .use(aiController)
  .use(fileController)
  .use(templatesController)
  .use(monitoringController)
  .use(notificationController)
  .use(organizationController)
  .use(memberController)
  .use(subscriptionController)
  .use(billingController)
  .use(rentSubscriptionController);

export { routes as AppRoutes };
