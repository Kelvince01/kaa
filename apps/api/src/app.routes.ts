import { Elysia } from "elysia";

import { aiController } from "./features/ai/ai.controller";
import { authController } from "./features/auth/auth.controller";
import { csrfController } from "./features/auth/csrf.controller";
import { securityMonitoringController } from "./features/auth/security-monitoring.controller";
import { videoCallingController } from "./features/comms";
import { emailController } from "./features/comms/emails/email.controller";
import { conversationController } from "./features/comms/messages/conversation.controller";
import { notificationController } from "./features/comms/notifications/notification.controller";
import { smsController } from "./features/comms/sms/sms.controller";
import { ussdController } from "./features/comms/ussd.controller";
import { legalDocumentController } from "./features/documents/legal-document.controller";
import { fileController } from "./features/files/file.controller";
import { fileV2Controller } from "./features/files/file-v2.controller";
import { locationsController } from "./features/locations/location.controller";
import { monitoringController } from "./features/misc/monitoring/monitoring.controller";
import { billingController } from "./features/org/billing.controller";
import { memberController } from "./features/org/member.controller";
import { organizationController } from "./features/org/org.controller";
import { rentSubscriptionController } from "./features/org/rent-subscription.controller";
import { subscriptionController } from "./features/org/subscription.controller";
import { airtelMoneyController } from "./features/payments/airtel-money.controller";
import { mpesaController } from "./features/payments/mpesa.controller";
import { paymentMethodController } from "./features/payments/payment-method.controller";
// import { stripeController } from "./features/payments/stripe.controller";
import { walletController } from "./features/payments/wallet.controller";
import { reviewController } from "./features/properties/review.controller";
import { rbacController } from "./features/rbac/rbac.controller";
import { templatesController } from "./features/templates/template.controller";
import { landlordController } from "./features/users/landlords/landlord.controller";
import { tenantController } from "./features/users/tenants/tenant.controller";
import { tenantScreeningController } from "./features/users/tenants/tenant-screening.controller";
import { usersController } from "./features/users/user.controller";

const routes = new Elysia({ prefix: "api/v1" })
  .use(csrfController)
  .use(securityMonitoringController)
  .use(authController)
  .use(rbacController)
  .use(usersController)
  .use(landlordController)
  .use(tenantController)
  .use(tenantScreeningController)
  .use(emailController)
  .use(smsController)
  .use(conversationController)
  .use(notificationController)
  .use(ussdController)
  .use(organizationController)
  .use(memberController)
  .use(subscriptionController)
  .use(billingController)
  .use(rentSubscriptionController)
  .use(walletController)
  .use(mpesaController)
  // .use(stripeController)
  .use(paymentMethodController)
  .use(airtelMoneyController)
  .use(locationsController)
  .use(aiController)
  .use(fileController)
  .use(fileV2Controller)
  .use(legalDocumentController)
  .use(templatesController)
  .use(monitoringController)
  .use(videoCallingController)
  .use(reviewController);

export { routes as AppRoutes };
