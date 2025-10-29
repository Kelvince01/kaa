// Admin Module Exports

// Queries
export * from "./admin.queries";

// Services
export * from "./admin.service";
// Store
export { useAdminStore } from "./admin.store";
// Re-export key types for convenience
export type {
  AdminCreateUserInput,
  AdminUpdateUserInput,
  AdminUser,
  AuditLog,
  BulkUserAction,
  FeatureFlag,
  SystemConfiguration,
  SystemHealth,
  SystemStats,
  UserManagementFilter,
} from "./admin.type";
// Types
export * from "./admin.type";
export { RecentActivity } from "./components/stats/recent-activity";
// Components
export { SystemStatsCards } from "./components/stats/system-stats-cards";
export { UserManagementTable } from "./components/users/user-management-table";
