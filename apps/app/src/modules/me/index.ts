/**
 * Me Module
 * Handles current user context, role, member, organization, and profile data
 */

// Mutations
export * from "./me.mutations";
// Queries and Hooks
export {
  useCurrentUser,
  useMeStoreData,
  useOrganization,
  useUserContext,
  useUserRole,
} from "./me.queries";
// Service
export { meService } from "./me.service";

// Store
export { useMeStore } from "./me.store";
// Types
export type {
  MeResponse,
  OrganizationDisplay,
  UserContext,
  UserMember,
  UserOrganization,
  UserProfile,
  UserRole,
} from "./me.type";
export { toOrganizationDisplay } from "./me.type";
