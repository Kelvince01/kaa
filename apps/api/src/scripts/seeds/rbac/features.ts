import { type IPermission, PermissionAction } from "@kaa/models/types";

// Create permissions first
const propertiesPermissions: Pick<
  IPermission,
  "name" | "description" | "resource" | "action"
>[] = [
  {
    resource: "properties",
    action: PermissionAction.CREATE,
    name: "properties:create",
    description: "Ability to create new properties",
  },
  {
    resource: "properties",
    action: PermissionAction.READ,
    name: "properties:read",
    description: "Ability to view properties",
  },
  {
    resource: "properties",
    action: PermissionAction.UPDATE,
    name: "properties:update",
    description: "Ability to edit properties",
  },
  {
    resource: "properties",
    action: PermissionAction.DELETE,
    name: "properties:delete",
    description: "Ability to delete properties",
  },
];

const applicationsPermissions: Pick<
  IPermission,
  "name" | "description" | "resource" | "action"
>[] = [
  {
    resource: "applications",
    action: PermissionAction.CREATE,
    name: "applications:create",
    description: "Ability to create new applications",
  },
  {
    resource: "applications",
    action: PermissionAction.READ,
    name: "applications:read",
    description: "Ability to view applications",
  },
  {
    resource: "applications",
    action: PermissionAction.UPDATE,
    name: "applications:update",
    description: "Ability to edit applications",
  },
  {
    resource: "applications",
    action: PermissionAction.DELETE,
    name: "applications:delete",
    description: "Ability to delete applications",
  },
];

const auditsPermissions: Pick<
  IPermission,
  "name" | "description" | "resource" | "action"
>[] = [
  {
    resource: "audits",
    action: PermissionAction.CREATE,
    name: "audits:create",
    description: "Ability to create new audits",
  },
  {
    resource: "audits",
    action: PermissionAction.READ,
    name: "audits:read",
    description: "Ability to view audits",
  },
  {
    resource: "audits",
    action: PermissionAction.UPDATE,
    name: "audits:update",
    description: "Ability to edit audits",
  },
  {
    resource: "audits",
    action: PermissionAction.DELETE,
    name: "audits:delete",
    description: "Ability to delete audits",
  },
];

const bookingsPermissions: Pick<
  IPermission,
  "name" | "description" | "resource" | "action"
>[] = [
  {
    resource: "bookings",
    action: PermissionAction.CREATE,
    name: "bookings:create",
    description: "Ability to create new bookings",
  },
  {
    resource: "bookings",
    action: PermissionAction.READ,
    name: "bookings:read",
    description: "Ability to view bookings",
  },
  {
    resource: "bookings",
    action: PermissionAction.UPDATE,
    name: "bookings:update",
    description: "Ability to edit bookings",
  },
  {
    resource: "bookings",
    action: PermissionAction.DELETE,
    name: "bookings:delete",
    description: "Ability to delete bookings",
  },
];

const contractsPermissions: Pick<
  IPermission,
  "name" | "description" | "resource" | "action"
>[] = [
  {
    resource: "contracts",
    action: PermissionAction.CREATE,
    name: "contracts:create",
    description: "Ability to create new contracts",
  },
  {
    resource: "contracts",
    action: PermissionAction.READ,
    name: "contracts:read",
    description: "Ability to view contracts",
  },
  {
    resource: "contracts",
    action: PermissionAction.UPDATE,
    name: "contracts:update",
    description: "Ability to edit contracts",
  },
  {
    resource: "contracts",
    action: PermissionAction.DELETE,
    name: "contracts:delete",
    description: "Ability to delete contracts",
  },
];

const conversationsPermissions: Pick<
  IPermission,
  "name" | "description" | "resource" | "action"
>[] = [
  {
    resource: "conversations",
    action: PermissionAction.CREATE,
    name: "conversations:create",
    description: "Ability to create new conversations",
  },
  {
    resource: "conversations",
    action: PermissionAction.READ,
    name: "conversations:read",
    description: "Ability to view conversations",
  },
  {
    resource: "conversations",
    action: PermissionAction.UPDATE,
    name: "conversations:update",
    description: "Ability to edit conversations",
  },
  {
    resource: "conversations",
    action: PermissionAction.DELETE,
    name: "conversations:delete",
    description: "Ability to delete conversations",
  },
];

const documentsPermissions: Pick<
  IPermission,
  "name" | "description" | "resource" | "action"
>[] = [
  {
    resource: "documents",
    action: PermissionAction.CREATE,
    name: "documents:create",
    description: "Ability to create new documents",
  },
  {
    resource: "documents",
    action: PermissionAction.READ,
    name: "documents:read",
    description: "Ability to view documents",
  },
  {
    resource: "documents",
    action: PermissionAction.UPDATE,
    name: "documents:update",
    description: "Ability to edit documents",
  },
  {
    resource: "documents",
    action: PermissionAction.DELETE,
    name: "documents:delete",
    description: "Ability to delete documents",
  },
];

const filesPermissions: Pick<
  IPermission,
  "name" | "description" | "resource" | "action"
>[] = [
  {
    resource: "files",
    action: PermissionAction.CREATE,
    name: "files:create",
    description: "Ability to create new files",
  },
  {
    resource: "files",
    action: PermissionAction.READ,
    name: "files:read",
    description: "Ability to view files",
  },
  {
    resource: "files",
    action: PermissionAction.UPDATE,
    name: "files:update",
    description: "Ability to edit files",
  },
  {
    resource: "files",
    action: PermissionAction.DELETE,
    name: "files:delete",
    description: "Ability to delete files",
  },
];

const maintenancePermissions: Pick<
  IPermission,
  "name" | "description" | "resource" | "action"
>[] = [
  {
    resource: "maintenance",
    action: PermissionAction.CREATE,
    name: "maintenance:create",
    description: "Ability to create new maintenance requests",
  },
  {
    resource: "maintenance",
    action: PermissionAction.READ,
    name: "maintenance:read",
    description: "Ability to view maintenance requests",
  },
  {
    resource: "maintenance",
    action: PermissionAction.UPDATE,
    name: "maintenance:update",
    description: "Ability to edit maintenance requests",
  },
  {
    resource: "maintenance",
    action: PermissionAction.DELETE,
    name: "maintenance:delete",
    description: "Ability to delete maintenance requests",
  },
];

const messagesPermissions: Pick<
  IPermission,
  "name" | "description" | "resource" | "action"
>[] = [
  {
    resource: "messages",
    action: PermissionAction.CREATE,
    name: "messages:create",
    description: "Ability to create new messages",
  },
  {
    resource: "messages",
    action: PermissionAction.READ,
    name: "messages:read",
    description: "Ability to view messages",
  },
  {
    resource: "messages",
    action: PermissionAction.UPDATE,
    name: "messages:update",
    description: "Ability to edit messages",
  },
  {
    resource: "messages",
    action: PermissionAction.DELETE,
    name: "messages:delete",
    description: "Ability to delete messages",
  },
];

const mpesaPaymentsPermissions: Pick<
  IPermission,
  "name" | "description" | "resource" | "action"
>[] = [
  {
    resource: "mpesaPayments",
    action: PermissionAction.CREATE,
    name: "mpesaPayments:create",
    description: "Ability to create new mpesa payments",
  },
  {
    resource: "mpesaPayments",
    action: PermissionAction.READ,
    name: "mpesaPayments:read",
    description: "Ability to view mpesa payments",
  },
  {
    resource: "mpesaPayments",
    action: PermissionAction.UPDATE,
    name: "mpesaPayments:update",
    description: "Ability to edit mpesa payments",
  },
  {
    resource: "mpesaPayments",
    action: PermissionAction.DELETE,
    name: "mpesaPayments:delete",
    description: "Ability to delete mpesa payments",
  },
];

const notificationPreferencesPermissions: Pick<
  IPermission,
  "name" | "description" | "resource" | "action"
>[] = [
  {
    resource: "notificationPreferences",
    action: PermissionAction.CREATE,
    name: "notificationPreferences:create",
    description: "Ability to create new notification preferences",
  },
  {
    resource: "notificationPreferences",
    action: PermissionAction.READ,
    name: "notificationPreferences:read",
    description: "Ability to view notification preferences",
  },
  {
    resource: "notificationPreferences",
    action: PermissionAction.UPDATE,
    name: "notificationPreferences:update",
    description: "Ability to edit notification preferences",
  },
  {
    resource: "notificationPreferences",
    action: PermissionAction.DELETE,
    name: "notificationPreferences:delete",
    description: "Ability to delete notification preferences",
  },
];

const notificationsPermissions: Pick<
  IPermission,
  "name" | "description" | "resource" | "action"
>[] = [
  {
    resource: "notifications",
    action: PermissionAction.CREATE,
    name: "notifications:create",
    description: "Ability to create new notifications",
  },
  {
    resource: "notifications",
    action: PermissionAction.READ,
    name: "notifications:read",
    description: "Ability to view notifications",
  },
  {
    resource: "notifications",
    action: PermissionAction.UPDATE,
    name: "notifications:update",
    description: "Ability to edit notifications",
  },
  {
    resource: "notifications",
    action: PermissionAction.DELETE,
    name: "notifications:delete",
    description: "Ability to delete notifications",
  },
];

const oauthConnectionsPermissions: Pick<
  IPermission,
  "name" | "description" | "resource" | "action"
>[] = [
  {
    resource: "oauthConnections",
    action: PermissionAction.CREATE,
    name: "oauthConnections:create",
    description: "Ability to create new oauth connections",
  },
  {
    resource: "oauthConnections",
    action: PermissionAction.READ,
    name: "oauthConnections:read",
    description: "Ability to view oauth connections",
  },
  {
    resource: "oauthConnections",
    action: PermissionAction.UPDATE,
    name: "oauthConnections:update",
    description: "Ability to edit oauth connections",
  },
  {
    resource: "oauthConnections",
    action: PermissionAction.DELETE,
    name: "oauthConnections:delete",
    description: "Ability to delete oauth connections",
  },
];

const otpsPermissions: Pick<
  IPermission,
  "name" | "description" | "resource" | "action"
>[] = [
  {
    resource: "otps",
    action: PermissionAction.CREATE,
    name: "otps:create",
    description: "Ability to create new otps",
  },
  {
    resource: "otps",
    action: PermissionAction.READ,
    name: "otps:read",
    description: "Ability to view otps",
  },
  {
    resource: "otps",
    action: PermissionAction.UPDATE,
    name: "otps:update",
    description: "Ability to edit otps",
  },
  {
    resource: "otps",
    action: PermissionAction.DELETE,
    name: "otps:delete",
    description: "Ability to delete otps",
  },
];

const passkeysPermissions: Pick<
  IPermission,
  "name" | "description" | "resource" | "action"
>[] = [
  {
    resource: "passkeys",
    action: PermissionAction.CREATE,
    name: "passkeys:create",
    description: "Ability to create new passkeys",
  },
  {
    resource: "passkeys",
    action: PermissionAction.READ,
    name: "passkeys:read",
    description: "Ability to view passkeys",
  },
  {
    resource: "passkeys",
    action: PermissionAction.UPDATE,
    name: "passkeys:update",
    description: "Ability to edit passkeys",
  },
  {
    resource: "passkeys",
    action: PermissionAction.DELETE,
    name: "passkeys:delete",
    description: "Ability to delete passkeys",
  },
];

const paymentMethodsPermissions: Pick<
  IPermission,
  "name" | "description" | "resource" | "action"
>[] = [
  {
    resource: "paymentMethods",
    action: PermissionAction.CREATE,
    name: "paymentMethods:create",
    description: "Ability to create new payment methods",
  },
  {
    resource: "paymentMethods",
    action: PermissionAction.READ,
    name: "paymentMethods:read",
    description: "Ability to view payment methods",
  },
  {
    resource: "paymentMethods",
    action: PermissionAction.UPDATE,
    name: "paymentMethods:update",
    description: "Ability to edit payment methods",
  },
  {
    resource: "paymentMethods",
    action: PermissionAction.DELETE,
    name: "paymentMethods:delete",
    description: "Ability to delete payment methods",
  },
];

const paymentsPermissions: Pick<
  IPermission,
  "name" | "description" | "resource" | "action"
>[] = [
  {
    resource: "payments",
    action: PermissionAction.CREATE,
    name: "payments:create",
    description: "Ability to create new payments",
  },
  {
    resource: "payments",
    action: PermissionAction.READ,
    name: "payments:read",
    description: "Ability to view payments",
  },
  {
    resource: "payments",
    action: PermissionAction.UPDATE,
    name: "payments:update",
    description: "Ability to edit payments",
  },
  {
    resource: "payments",
    action: PermissionAction.DELETE,
    name: "payments:delete",
    description: "Ability to delete payments",
  },
];

const propertyConditionsPermissions: Pick<
  IPermission,
  "name" | "description" | "resource" | "action"
>[] = [
  {
    resource: "propertyConditions",
    action: PermissionAction.CREATE,
    name: "propertyConditions:create",
    description: "Ability to create new property conditions",
  },
  {
    resource: "propertyConditions",
    action: PermissionAction.READ,
    name: "propertyConditions:read",
    description: "Ability to view property conditions",
  },
  {
    resource: "propertyConditions",
    action: PermissionAction.UPDATE,
    name: "propertyConditions:update",
    description: "Ability to edit property conditions",
  },
  {
    resource: "propertyConditions",
    action: PermissionAction.DELETE,
    name: "propertyConditions:delete",
    description: "Ability to delete property conditions",
  },
];

const propertyInspectionsPermissions: Pick<
  IPermission,
  "name" | "description" | "resource" | "action"
>[] = [
  {
    resource: "propertyInspections",
    action: PermissionAction.CREATE,
    name: "propertyInspections:create",
    description: "Ability to create new property inspections",
  },
  {
    resource: "propertyInspections",
    action: PermissionAction.READ,
    name: "propertyInspections:read",
    description: "Ability to view property inspections",
  },
  {
    resource: "propertyInspections",
    action: PermissionAction.UPDATE,
    name: "propertyInspections:update",
    description: "Ability to edit property inspections",
  },
  {
    resource: "propertyInspections",
    action: PermissionAction.DELETE,
    name: "propertyInspections:delete",
    description: "Ability to delete property inspections",
  },
];

const refreshTokenPermissions: Pick<
  IPermission,
  "name" | "description" | "resource" | "action"
>[] = [
  {
    resource: "refreshTokens",
    action: PermissionAction.CREATE,
    name: "refreshTokens:create",
    description: "Ability to create new refresh tokens",
  },
  {
    resource: "refreshTokens",
    action: PermissionAction.READ,
    name: "refreshTokens:read",
    description: "Ability to view refresh tokens",
  },
  {
    resource: "refreshTokens",
    action: PermissionAction.UPDATE,
    name: "refreshTokens:update",
    description: "Ability to edit refresh tokens",
  },
  {
    resource: "refreshTokens",
    action: PermissionAction.DELETE,
    name: "refreshTokens:delete",
    description: "Ability to delete refresh tokens",
  },
];

const reviewsPermissions: Pick<
  IPermission,
  "name" | "description" | "resource" | "action"
>[] = [
  {
    resource: "reviews",
    action: PermissionAction.CREATE,
    name: "reviews:create",
    description: "Ability to create new reviews",
  },
  {
    resource: "reviews",
    action: PermissionAction.READ,
    name: "reviews:read",
    description: "Ability to view reviews",
  },
  {
    resource: "reviews",
    action: PermissionAction.UPDATE,
    name: "reviews:update",
    description: "Ability to edit reviews",
  },
  {
    resource: "reviews",
    action: PermissionAction.DELETE,
    name: "reviews:delete",
    description: "Ability to delete reviews",
  },
];

const rolePermissionPermissions: Pick<
  IPermission,
  "name" | "description" | "resource" | "action"
>[] = [
  {
    resource: "rolePermissions",
    action: PermissionAction.CREATE,
    name: "rolePermissions:create",
    description: "Ability to create new role permissions",
  },
  {
    resource: "rolePermissions",
    action: PermissionAction.READ,
    name: "rolePermissions:read",
    description: "Ability to view role permissions",
  },
  {
    resource: "rolePermissions",
    action: PermissionAction.UPDATE,
    name: "rolePermissions:update",
    description: "Ability to edit role permissions",
  },
  {
    resource: "rolePermissions",
    action: PermissionAction.DELETE,
    name: "rolePermissions:delete",
    description: "Ability to delete role permissions",
  },
];

const savedSearchesPermissions: Pick<
  IPermission,
  "name" | "description" | "resource" | "action"
>[] = [
  {
    resource: "savedSearches",
    action: PermissionAction.CREATE,
    name: "savedSearches:create",
    description: "Ability to create new saved searches",
  },
  {
    resource: "savedSearches",
    action: PermissionAction.READ,
    name: "savedSearches:read",
    description: "Ability to view saved searches",
  },
  {
    resource: "savedSearches",
    action: PermissionAction.UPDATE,
    name: "savedSearches:update",
    description: "Ability to edit saved searches",
  },
  {
    resource: "savedSearches",
    action: PermissionAction.DELETE,
    name: "savedSearches:delete",
    description: "Ability to delete saved searches",
  },
];

const securityViolationsPermissions: Pick<
  IPermission,
  "name" | "description" | "resource" | "action"
>[] = [
  {
    resource: "securityViolations",
    action: PermissionAction.CREATE,
    name: "securityViolations:create",
    description: "Ability to create new security violations",
  },
  {
    resource: "securityViolations",
    action: PermissionAction.READ,
    name: "securityViolations:read",
    description: "Ability to view security violations",
  },
  {
    resource: "securityViolations",
    action: PermissionAction.UPDATE,
    name: "securityViolations:update",
    description: "Ability to edit security violations",
  },
  {
    resource: "securityViolations",
    action: PermissionAction.DELETE,
    name: "securityViolations:delete",
    description: "Ability to delete security violations",
  },
];

const sessionsPermissions: Pick<
  IPermission,
  "name" | "description" | "resource" | "action"
>[] = [
  {
    resource: "sessions",
    action: PermissionAction.CREATE,
    name: "sessions:create",
    description: "Ability to create new sessions",
  },
  {
    resource: "sessions",
    action: PermissionAction.READ,
    name: "sessions:read",
    description: "Ability to view sessions",
  },
  {
    resource: "sessions",
    action: PermissionAction.UPDATE,
    name: "sessions:update",
    description: "Ability to edit sessions",
  },
  {
    resource: "sessions",
    action: PermissionAction.DELETE,
    name: "sessions:delete",
    description: "Ability to delete sessions",
  },
];

const subscriptionPermissions: Pick<
  IPermission,
  "name" | "description" | "resource" | "action"
>[] = [
  {
    resource: "subscriptions",
    action: PermissionAction.CREATE,
    name: "subscriptions:create",
    description: "Ability to create new subscriptions",
  },
  {
    resource: "subscriptions",
    action: PermissionAction.READ,
    name: "subscriptions:read",
    description: "Ability to view subscriptions",
  },
  {
    resource: "subscriptions",
    action: PermissionAction.UPDATE,
    name: "subscriptions:update",
    description: "Ability to edit subscriptions",
  },
  {
    resource: "subscriptions",
    action: PermissionAction.DELETE,
    name: "subscriptions:delete",
    description: "Ability to delete subscriptions",
  },
];

const tenantsPermissions: Pick<
  IPermission,
  "name" | "description" | "resource" | "action"
>[] = [
  {
    resource: "tenants",
    action: PermissionAction.CREATE,
    name: "tenants:create",
    description: "Ability to create new tenants",
  },
  {
    resource: "tenants",
    action: PermissionAction.READ,
    name: "tenants:read",
    description: "Ability to view tenants",
  },
  {
    resource: "tenants",
    action: PermissionAction.UPDATE,
    name: "tenants:update",
    description: "Ability to edit tenants",
  },
  {
    resource: "tenants",
    action: PermissionAction.DELETE,
    name: "tenants:delete",
    description: "Ability to delete tenants",
  },
];

const unitsPermissions: Pick<
  IPermission,
  "name" | "description" | "resource" | "action"
>[] = [
  {
    resource: "units",
    action: PermissionAction.CREATE,
    name: "units:create",
    description: "Ability to create new units",
  },
  {
    resource: "units",
    action: PermissionAction.READ,
    name: "units:read",
    description: "Ability to view units",
  },
  {
    resource: "units",
    action: PermissionAction.UPDATE,
    name: "units:update",
    description: "Ability to edit units",
  },
  {
    resource: "units",
    action: PermissionAction.DELETE,
    name: "units:delete",
    description: "Ability to delete units",
  },
];

const userRolesPermissions: Pick<
  IPermission,
  "name" | "description" | "resource" | "action"
>[] = [
  {
    resource: "userRoles",
    action: PermissionAction.CREATE,
    name: "userRoles:create",
    description: "Ability to create new user roles",
  },
  {
    resource: "userRoles",
    action: PermissionAction.READ,
    name: "userRoles:read",
    description: "Ability to view user roles",
  },
  {
    resource: "userRoles",
    action: PermissionAction.UPDATE,
    name: "userRoles:update",
    description: "Ability to edit user roles",
  },
  {
    resource: "userRoles",
    action: PermissionAction.DELETE,
    name: "userRoles:delete",
    description: "Ability to delete user roles",
  },
];

const usersPermissions: Pick<
  IPermission,
  "name" | "description" | "resource" | "action"
>[] = [
  {
    resource: "users",
    action: PermissionAction.CREATE,
    name: "users:create",
    description: "Ability to create new users",
  },
  {
    resource: "users",
    action: PermissionAction.READ,
    name: "users:read",
    description: "Ability to view users",
  },
  {
    resource: "users",
    action: PermissionAction.UPDATE,
    name: "users:update",
    description: "Ability to edit users",
  },
  {
    resource: "users",
    action: PermissionAction.DELETE,
    name: "users:delete",
    description: "Ability to delete users",
  },
];

const verificationTokensPermissions: Pick<
  IPermission,
  "name" | "description" | "resource" | "action"
>[] = [
  {
    resource: "verificationTokens",
    action: PermissionAction.CREATE,
    name: "verificationTokens:create",
    description: "Ability to create new verification tokens",
  },
  {
    resource: "verificationTokens",
    action: PermissionAction.READ,
    name: "verificationTokens:read",
    description: "Ability to view verification tokens",
  },
  {
    resource: "verificationTokens",
    action: PermissionAction.UPDATE,
    name: "verificationTokens:update",
    description: "Ability to edit verification tokens",
  },
  {
    resource: "verificationTokens",
    action: PermissionAction.DELETE,
    name: "verificationTokens:delete",
    description: "Ability to delete verification tokens",
  },
];

const webhooksPermissions: Pick<
  IPermission,
  "name" | "description" | "resource" | "action"
>[] = [
  {
    resource: "webhooks",
    action: PermissionAction.CREATE,
    name: "webhooks:create",
    description: "Ability to create new webhooks",
  },
  {
    resource: "webhooks",
    action: PermissionAction.READ,
    name: "webhooks:read",
    description: "Ability to view webhooks",
  },
  {
    resource: "webhooks",
    action: PermissionAction.UPDATE,
    name: "webhooks:update",
    description: "Ability to edit webhooks",
  },
  {
    resource: "webhooks",
    action: PermissionAction.DELETE,
    name: "webhooks:delete",
    description: "Ability to delete webhooks",
  },
];

// Combine all permissions
const allPermissions = [
  ...propertiesPermissions,
  ...filesPermissions,
  ...notificationsPermissions,
  ...oauthConnectionsPermissions,
  ...paymentMethodsPermissions,
  ...propertyConditionsPermissions,
  ...propertyInspectionsPermissions,
  ...refreshTokenPermissions,
  ...reviewsPermissions,
  ...rolePermissionPermissions,
  ...savedSearchesPermissions,
  ...securityViolationsPermissions,
  ...sessionsPermissions,
  ...subscriptionPermissions,
  ...tenantsPermissions,
  ...unitsPermissions,
  ...userRolesPermissions,
  ...usersPermissions,
  ...verificationTokensPermissions,
  ...webhooksPermissions,
  ...applicationsPermissions,
  ...auditsPermissions,
  ...bookingsPermissions,
  ...contractsPermissions,
  ...conversationsPermissions,
  ...documentsPermissions,
  ...maintenancePermissions,
  ...messagesPermissions,
  ...mpesaPaymentsPermissions,
  ...notificationPreferencesPermissions,
  ...otpsPermissions,
  ...passkeysPermissions,
  ...paymentsPermissions,
];

export default allPermissions;
