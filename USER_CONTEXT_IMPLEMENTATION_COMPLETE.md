# User Context & Organization Switcher Implementation - COMPLETE

## Overview

Successfully implemented a unified user context system that integrates RBAC roles with organization and profile data, replacing hardcoded dummy data with real database-driven information.

## Architecture Implemented

```
┌─────────────────────────────────────────────────────────────┐
│                     Backend (/api/me)                        │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ├─→ User (Base Model)
                       ├─→ UserRole → Role (RBAC)
                       ├─→ Member → Organization
                       └─→ Profile (Landlord/Tenant based on role)
                       │
                       ↓
┌─────────────────────────────────────────────────────────────┐
│                 Frontend (useUserContext Hook)               │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ├─→ OrgSwitcher Component
                       ├─→ Dashboard Layout
                       ├─→ Account Layout
                       └─→ Admin Layout
```

## What Was Implemented

### 1. Backend Enhancement (`apps/api/src/features/auth/me.controller.ts`)

**Enhanced `/api/me` endpoint** to return:

- ✅ User base data
- ✅ UserRole from RBAC (userId → roleId → Role)
- ✅ Member data with populated organization
- ✅ Organization details (if applicable)
- ✅ Role-specific profile:
  - **Landlords**: Fetches `Landlord` model with `organizationId`
  - **Tenants**: Fetches `Tenant` model with `property`
  - **Admins**: Uses Member's organization

**Response Structure:**
```typescript
{
  status: "success",
  user: { /* base user data */ },
  context: {
    role: {
      id: string;
      name: "landlord" | "tenant" | "admin";
      isPrimary: boolean;
    },
    member: {
      id: string;
      type: string;
      name: string;
      logo: string;
      plan: string;
    },
    organization: {
      id: string;
      name: string;
      logo: string;
      type: string;
    },
    profile: {
      type: string;
      data: any; // ILandlord | ITenant
    }
  }
}
```

### 2. Frontend Types (`apps/app/src/modules/auth/user-context.type.ts`)

Created TypeScript types for:
- `UserRole`
- `UserMember`
- `UserOrganization`
- `UserProfile`
- `UserContext`
- `MeResponse`
- Helper function: `toOrganizationDisplay()`

### 3. Frontend Hook (`apps/app/src/modules/auth/use-user-context.ts`)

Created three powerful hooks:

#### `useUserContext()` - Main Hook
```typescript
const { 
  user,
  context,
  role,
  member,
  organization,
  profile,
  hasOrganization,
  isLandlord,
  isTenant,
  isAdmin,
  isLoading 
} = useUserContext();
```

#### `useOrganization()` - Organization-Specific
```typescript
const { 
  organization,
  member,
  hasOrganization,
  organizationName,
  organizationLogo,
  plan 
} = useOrganization();
```

#### `useUserRole()` - Role Checking
```typescript
const { 
  role,
  roleName,
  isPrimary,
  isLandlord,
  isTenant,
  isAdmin,
  hasRole,
  hasAnyRole 
} = useUserRole();
```

### 4. Updated OrgSwitcher Component (`apps/app/src/components/layout/sidebar.tsx`)

**Removed**: Dummy `organizations` prop

**Implemented**:
- ✅ Real-time data fetching using `useUserContext()`
- ✅ Loading state with skeleton UI
- ✅ **Tenant Display**: Shows "Personal Account" with avatar
- ✅ **Landlord/Admin Display**: Shows organization with dropdown
- ✅ Dynamic logo rendering (image URL or initials)
- ✅ Plan display from member data
- ✅ Proper role-based conditional rendering

### 5. Updated Layout Containers

#### Dashboard Layout (`apps/app/src/routes/dashboard/layout/index.tsx`)
- Removed hardcoded organizations prop
- OrgSwitcher now fetches data internally

#### Admin Layout (`apps/app/src/routes/admin/layout/index.tsx`)
- Removed hardcoded organizations prop
- OrgSwitcher now fetches data internally

#### Sidebar Configurations
- Cleaned up `dashboardSidebarItems` - removed dummy data
- Cleaned up `adminSidebarItems` - removed dummy data

### 6. Module Exports (`apps/app/src/modules/auth/index.ts`)

Added exports:
```typescript
export * from "./use-user-context";
export * from "./user-context.type";
```

## How It Works

### For Landlords:
1. User logs in → JWT contains userId
2. `/api/me` fetches:
   - User base data
   - UserRole → finds role name = "landlord"
   - Member → Organization
   - Landlord profile → organizationId
3. OrgSwitcher displays organization with logo and plan
4. Sidebar shows landlord-specific navigation

### For Tenants:
1. User logs in → JWT contains userId
2. `/api/me` fetches:
   - User base data
   - UserRole → finds role name = "tenant"
   - Tenant profile → property
   - **No organization** (tenants rent, don't own orgs)
3. OrgSwitcher displays "Personal Account" with avatar
4. Sidebar shows tenant-specific navigation

### For Admins:
1. User logs in → JWT contains userId
2. `/api/me` fetches:
   - User base data
   - UserRole → finds role name = "admin"
   - Member → Organization (platform org)
3. OrgSwitcher displays platform organization
4. Sidebar shows admin navigation

## Data Flow

```
┌──────────┐
│  Login   │
└────┬─────┘
     │
     ↓
┌──────────────────┐
│  JWT Generated   │
│  (userId in sub) │
└────┬─────────────┘
     │
     ↓
┌─────────────────────┐
│  authPlugin         │
│  extracts userId    │
└────┬────────────────┘
     │
     ↓
┌──────────────────────────┐
│  GET /api/me             │
│  ├─ User.findById()      │
│  ├─ getUserRoleBy()      │
│  ├─ getMemberBy()        │
│  ├─ Organization.find()  │
│  └─ Landlord/Tenant.find│
└────┬─────────────────────┘
     │
     ↓
┌──────────────────────┐
│  Frontend            │
│  useUserContext()    │
│  ├─ React Query      │
│  └─ Caches 5 min     │
└────┬─────────────────┘
     │
     ↓
┌──────────────────┐
│  OrgSwitcher     │
│  Conditionally   │
│  Renders         │
└──────────────────┘
```

## Route Protection & Redirects

The existing AuthGuard already handles role-based redirects:

```typescript
// From auth.utils.ts
const redirects = {
  super_admin: "/admin",
  admin: "/admin",
  property_manager: "/dashboard",
  manager: "/dashboard",
  landlord: "/dashboard",
  owner: "/dashboard",
  maintenance: "/dashboard",
  tenant: "/account",  // ← Tenants go to account
  user: "/dashboard",
};
```

**Routes:**
- `/account/*` - All roles (personal settings)
- `/dashboard/*` - Landlords, admins, managers (business workspace)
- `/admin/*` - Admins only (platform administration)

## Testing Checklist

### Backend Testing
- [ ] Test `/api/me` with landlord user
- [ ] Test `/api/me` with tenant user
- [ ] Test `/api/me` with admin user
- [ ] Verify organization data is populated
- [ ] Verify profile data is populated
- [ ] Test without organization (tenant case)

### Frontend Testing
- [ ] **Landlord**: Login and verify organization displays
- [ ] **Landlord**: Check organization logo renders
- [ ] **Landlord**: Verify plan displays correctly
- [ ] **Tenant**: Login and verify "Personal Account" displays
- [ ] **Tenant**: Verify avatar shows correctly
- [ ] **Admin**: Login and verify platform org displays
- [ ] Test loading states
- [ ] Test error handling (network failures)

### Navigation Testing
- [ ] **Landlord**: Should redirect to `/dashboard`
- [ ] **Landlord**: Dashboard sidebar should show properties, tenants, etc.
- [ ] **Tenant**: Should redirect to `/account`
- [ ] **Tenant**: Dashboard sidebar should show bookings, maintenance
- [ ] **Admin**: Should redirect to `/admin`
- [ ] **Admin**: Admin sidebar should show users, organizations

### Data Persistence
- [ ] Context data caches for 5 minutes
- [ ] Refresh works correctly
- [ ] Logout clears context data

## Future Enhancements

### Multi-Organization Support
If users can belong to multiple organizations:

1. Fetch all UserRoles for a user
2. Return array of contexts
3. Update OrgSwitcher to show dropdown with all orgs
4. Add context switching logic

```typescript
// Future: Multiple org support
const { contexts, activeContext, switchContext } = useUserContext();
```

### Profile Switching
Allow users with multiple roles (landlord + tenant):

1. Fetch all role-specific profiles
2. Add profile switcher in UI
3. Update navigation based on active profile

## File Changes Summary

### Created Files:
1. ✅ `apps/app/src/modules/auth/user-context.type.ts`
2. ✅ `apps/app/src/modules/auth/use-user-context.ts`

### Modified Files:
1. ✅ `apps/api/src/features/auth/me.controller.ts`
2. ✅ `apps/app/src/components/layout/sidebar.tsx`
3. ✅ `apps/app/src/routes/dashboard/layout/index.tsx`
4. ✅ `apps/app/src/routes/dashboard/layout/sidebar.tsx`
5. ✅ `apps/app/src/routes/admin/layout/index.tsx`
6. ✅ `apps/app/src/routes/admin/layout/sidebar.tsx`
7. ✅ `apps/app/src/modules/auth/index.ts`

## Usage Examples

### In a Component
```typescript
import { useUserContext } from "@/modules/auth";

export function MyComponent() {
  const { 
    context, 
    isLandlord, 
    organization,
    isLoading 
  } = useUserContext();
  
  if (isLoading) return <Loading />;
  
  if (isLandlord && organization) {
    return <div>Welcome to {organization.name}!</div>;
  }
  
  return <div>Welcome!</div>;
}
```

### Role-Based Rendering
```typescript
import { useUserRole } from "@/modules/auth";

export function Dashboard() {
  const { isLandlord, isTenant, hasRole } = useUserRole();
  
  return (
    <>
      {isLandlord && <LandlordDashboard />}
      {isTenant && <TenantDashboard />}
      {hasRole("admin") && <AdminTools />}
    </>
  );
}
```

### Organization-Specific Logic
```typescript
import { useOrganization } from "@/modules/auth";

export function BillingPage() {
  const { plan, organizationName } = useOrganization();
  
  return (
    <div>
      <h1>{organizationName}</h1>
      <p>Current Plan: {plan}</p>
    </div>
  );
}
```

## Next Steps

1. **Test** - Follow testing checklist above
2. **Seed Data** - Ensure test users have proper:
   - UserRole entries
   - Member entries (for landlords/admins)
   - Organization entries
   - Landlord/Tenant profiles
3. **Error Handling** - Add fallback UI for missing data
4. **Analytics** - Track org switches and role usage
5. **Performance** - Monitor query performance

## Support

For issues or questions:
- Check browser console for errors
- Verify `/api/me` response in Network tab
- Ensure user has proper role and organization setup
- Review RBAC configuration

---

**Status**: ✅ Implementation Complete
**Next**: Testing & Validation

