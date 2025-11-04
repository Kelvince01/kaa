import { Elysia } from "elysia";

import { aiController } from "./features/ai/ai.controller";
import { analyticsController } from "./features/analytics/analytics.controller";
import { applicationController } from "./features/applications/application.controller";
import { bookingController } from "./features/applications/booking.controller";
import { authController } from "./features/auth/auth.controller";
import { csrfController } from "./features/auth/csrf.controller";
import { securityMonitoringController } from "./features/auth/security-monitoring.controller";
import { videoCallingController } from "./features/comms";
import { commRoutes } from "./features/comms/comm.routes";
import { contractController } from "./features/contracts/contract.controller";
import { documentController } from "./features/documents/document.controller";
import { legalDocumentController } from "./features/documents/legal-document.controller";
import { fileV2Controller } from "./features/files/file-v2.controller";
import { financialController } from "./features/financials/financial.controller";
import { complianceController } from "./features/legal/compliance.controller";
import { locationsController } from "./features/locations/location.controller";
import { maintenanceController } from "./features/maintenance/maintenance.controller";
import { monitoringController } from "./features/misc/monitoring/monitoring.controller";
import { webhookController } from "./features/misc/webhooks/webhook.controller";
import { billingController } from "./features/org/billing.controller";
import { memberController } from "./features/org/member.controller";
import { organizationController } from "./features/org/org.controller";
import { rentSubscriptionController } from "./features/org/rent-subscription.controller";
import { subscriptionController } from "./features/org/subscription.controller";
import { paymentRoutes } from "./features/payments/payment.routes";
import { amenityController } from "./features/properties/amenities/amenity.controller";
import { contractorController } from "./features/properties/contractor.controller";
import { insuranceController } from "./features/properties/insurance.controller";
import { propertyRoutes } from "./features/properties/property.routes";
import { reviewController } from "./features/properties/review.controller";
import { scheduleController } from "./features/properties/schedule.controller";
import { searchRouter } from "./features/properties/search/search.router";
import { unitController } from "./features/properties/units/unit.controller";
import { workOrderController } from "./features/properties/work-order.controller";
import { rbacController } from "./features/rbac/rbac.controller";
import { referenceController } from "./features/references/reference.controller";
import { reportsController } from "./features/reports/reports.controller";
import { templatesController } from "./features/templates/template.controller";
import { accountRoutes } from "./features/users/account.routes";
import { virtualToursController } from "./features/virtual-tours/virtual-tours.controller";

const routes = new Elysia({ prefix: "api/v1" })
  .use(csrfController)
  .use(securityMonitoringController)
  .use(authController)
  .use(rbacController)
  .use(accountRoutes)
  .use(commRoutes)
  .use(organizationController)
  .use(memberController)
  .use(subscriptionController)
  .use(billingController)
  .use(rentSubscriptionController)
  .use(paymentRoutes)
  .use(bookingController)
  .use(applicationController)
  .use(contractController)
  .use(propertyRoutes)
  .use(searchRouter)
  .use(unitController)
  .use(contractorController)
  .use(workOrderController)
  .use(scheduleController)
  .use(amenityController)
  .use(maintenanceController)
  .use(referenceController)
  .use(reviewController)
  .use(locationsController)
  .use(aiController)
  .use(fileV2Controller)
  .use(documentController)
  .use(legalDocumentController)
  .use(templatesController)
  .use(monitoringController)
  .use(videoCallingController)
  .use(analyticsController)
  .use(reportsController)
  .use(insuranceController)
  .use(virtualToursController)
  .use(financialController)
  .use(complianceController)
  .use(webhookController);

export { routes as AppRoutes };
