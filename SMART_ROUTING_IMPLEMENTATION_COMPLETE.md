# Smart Context-Aware Routing Implementation - COMPLETE

## Overview

Successfully implemented intelligent, role-based routing that adapts dashboard content based on user roles while maintaining shared personal account settings for all users.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                  Route Structure                         │
└──────────────────────┬──────────────────────────────────┘
                       │
        ┌──────────────┼──────────────┐
        │              │              │
        ↓              ↓              ↓
  /account/*     /dashboard/*    /admin/*
  (All Roles)    (Context-Aware)  (Admin Only)
  - Profile      - Landlord View  - Users
  - Settings     - Tenant View    - Properties
  - Wallet       - Manager View   - Analytics
  - Documents    - Agent View     - Settings
```

## What Was Implemented

### 1. **RoleBasedContent Component** (`apps/app/src/components/role-based-content.tsx`)

A powerful component for conditional rendering based on user roles:

```typescript
<RoleBasedContent
  landlord={<LandlordView />}
  tenant={<TenantView />}
  admin={<AdminView />}
  manager={<ManagerView />}
  fallback={<DefaultView />}
/>
```

**Features:**
- ✅ Automatic role detection from context
- ✅ Loading states
- ✅ Fallback rendering
- ✅ Type-safe props

**Additional Components:**
- `RoleGuard` - Show content only for specific roles
- `ShowForRole` - Conditionally show for role(s)
- `HideForRole` - Conditionally hide for role(s)

### 2. **Smart Dashboard Sidebar** (`apps/app/src/routes/dashboard/layout/sidebar.tsx`)

Completely refactored to use context-aware navigation:

**Before:**
```typescript
dashboardSidebarItems(user: User) // Used user.role directly
```

**After:**
```typescript
getDashboardSidebarItems(roleName?: string) // Uses role from context
```

**Role-Specific Navigation:**

#### **Tenant Navigation:**
- My Property
- My Bookings
- Maintenance Requests
- Rent Payments
- My References
- Communication
- Settings

#### **Landlord/Manager/Admin Navigation:**
- Properties (with sub-items)
  - My Properties
  - Units
  - Amenities
  - Virtual Tours
- Tenants
- Bookings
  - All Bookings
  - Booking Requests
- Maintenance
- Finances
  - Overview
  - Analytics
  - Receipts
- Reviews
- References
- Legal Documents
- Communication
- Settings

### 3. **Role-Aware Dashboard Home** (`apps/app/src/app/dashboard/page.tsx`)

Dashboard page now renders different content based on role:

```typescript
<RoleBasedContent
  landlord={<LandlordDashboard />}
  tenant={<TenantDashboard />}
  admin={<LandlordDashboard />}
  manager={<LandlordDashboard />}
/>
```

**Features:**
- ✅ Dynamic imports for code splitting
- ✅ Loading states
- ✅ No props drilling
- ✅ Automatic role detection

### 4. **Separate Dashboard Views**

#### **Landlord Dashboard** (`apps/app/src/routes/dashboard/landlord.tsx`)
Shows:
- Property management stats
- Revenue charts
- Tenant overview
- Maintenance requests
- Quick actions for property management
- AI insights and recommendations

#### **Tenant Dashboard** (`apps/app/src/routes/dashboard/tenant.tsx`)
Shows:
- Current property info
- Rent payment status
- Maintenance request counter
- Documents available
- Quick actions (Pay Rent, Request Maintenance, etc.)
- Recent activities
- Lease information

### 5. **Updated Dashboard Layout** (`apps/app/src/routes/dashboard/layout/index.tsx`)

Now uses context for role-aware sidebar:

```typescript
const { roleName } = useUserContext();
const sidebarItems = getDashboardSidebarItems(roleName);
```

**Features:**
- ✅ Fetches role from context hook
- ✅ Generates appropriate sidebar items
- ✅ No role prop drilling
- ✅ Automatic updates when role changes

## Route Behavior

### `/account` Routes
**Purpose:** Universal personal settings
**Access:** All authenticated users (tenant, landlord, admin)
**Content:** Same for everyone

**Pages:**
- `/account/profile` - Personal profile
- `/account/settings` - User preferences
- `/account/saved-searches` - Saved property searches
- `/account/favorites` - Favorited properties
- `/account/applications` - Applications submitted
- `/account/wallet` - Personal wallet
- `/account/documents` - Personal documents
- `/account/security` - Security settings

### `/dashboard` Routes  
**Purpose:** Business/operational workspace
**Access:** Landlords, tenants, managers, agents
**Content:** Changes based on role

**For Landlords:**
- Property management
- Tenant management
- Financial overview
- Booking management
- Maintenance oversight

**For Tenants:**
- View rented property
- Pay rent
- Submit maintenance requests
- View documents
- Track bookings

**For Managers/Agents:**
- Similar to landlords
- Manage assigned properties
- Handle tenant relations

### `/admin` Routes
**Purpose:** Platform administration
**Access:** Admins only
**Content:** Platform-wide controls

**Pages:**
- `/admin` - Admin dashboard
- `/admin/users` - User management
- `/admin/organizations` - Organization management
- `/admin/properties` - All properties (platform-wide)
- `/admin/landlords` - Landlord management
- `/admin/rbac` - Role & permission management

## Data Flow

```
User Login
    ↓
JWT Token
    ↓
/api/me fetches:
  - User data
  - UserRole (from RBAC)
  - Member + Organization
  - Profile (Landlord/Tenant)
    ↓
useUserContext() hook
    ↓
Context available app-wide:
  - user
  - context { role, member, organization, profile }
  - roleName
  - isLandlord, isTenant, isAdmin
    ↓
Components use context:
  - RoleBasedContent
  - getDashboardSidebarItems()
  - Dashboard pages
  - Navigation guards
```

## Usage Examples

### Example 1: Role-Based Page Content

```typescript
import { RoleBasedContent } from "@/components/role-based-content";

export default function PropertiesPage() {
  return (
    <RoleBasedContent
      landlord={
        <div>
          <h1>My Properties</h1>
          {/* Landlord can manage properties */}
          <PropertyManagementTable />
        </div>
      }
      tenant={
        <div>
          <h1>My Rented Property</h1>
          {/* Tenant can only view their property */}
          <TenantPropertyView />
        </div>
      }
    />
  );
}
```

### Example 2: Conditional Navigation Items

```typescript
import { ShowForRole, HideForRole } from "@/components/role-based-content";

export function Navigation() {
  return (
    <nav>
      <NavItem href="/dashboard">Dashboard</NavItem>
      
      <ShowForRole role={["landlord", "admin"]}>
        <NavItem href="/dashboard/tenants">Tenants</NavItem>
        <NavItem href="/dashboard/financials">Finances</NavItem>
      </ShowForRole>
      
      <ShowForRole role="tenant">
        <NavItem href="/dashboard/payments">Pay Rent</NavItem>
      </ShowForRole>
      
      <HideForRole role="tenant">
        <NavItem href="/dashboard/analytics">Analytics</NavItem>
      </HideForRole>
    </nav>
  );
}
```

### Example 3: Role Guard

```typescript
import { RoleGuard } from "@/components/role-based-content";

export function FinancialReport() {
  return (
    <RoleGuard 
      allowedRoles={["landlord", "admin", "manager"]}
      fallback={<div>Access Denied</div>}
    >
      <FinancialDashboard />
      <RevenueCharts />
      <ExpenseTracking />
    </RoleGuard>
  );
}
```

### Example 4: Using Role Hooks

```typescript
import { useUserRole } from "@/modules/auth";

export function PropertyActions() {
  const { isLandlord, isTenant, hasRole } = useUserRole();
  
  return (
    <div>
      {isLandlord && <Button>Add Property</Button>}
      {isTenant && <Button>Request Viewing</Button>}
      {hasRole("admin") && <Button>Verify Property</Button>}
    </div>
  );
}
```

## Benefits

### 1. **Clean URLs**
- No role-specific prefixes (no `/landlord/dashboard`, `/tenant/dashboard`)
- Consistent, predictable routes
- Better SEO

### 2. **Better UX**
- Same URL structure for all users
- Content adapts to user role
- No confusion about which dashboard to use

### 3. **Code Reusability**
- Shared layouts
- Common components
- Single route definition

### 4. **Maintainability**
- Centralized role logic
- Easy to add new roles
- Clear separation of concerns

### 5. **Security**
- Role checks at component level
- Route-level protection (AuthGuard)
- Context-based authorization

### 6. **Performance**
- Dynamic imports for code splitting
- Only loads relevant dashboard code
- Optimized bundle sizes

## File Structure

```
apps/app/src/
├── components/
│   └── role-based-content.tsx         # New: Role-based rendering
├── app/
│   ├── account/                       # Universal (all roles)
│   │   ├── profile/
│   │   ├── settings/
│   │   └── ...
│   ├── dashboard/                     # Context-aware
│   │   ├── page.tsx                   # Updated: Role-based content
│   │   ├── layout.tsx                 # Updated: Context-aware sidebar
│   │   ├── properties/
│   │   ├── tenants/
│   │   └── ...
│   └── admin/                         # Admin only
│       ├── users/
│       ├── organizations/
│       └── ...
├── routes/
│   └── dashboard/
│       ├── landlord.tsx               # Renamed from index.tsx
│       ├── tenant.tsx                 # New: Tenant dashboard
│       └── layout/
│           ├── index.tsx              # Updated: Context-aware
│           └── sidebar.tsx            # Updated: Role-based nav
└── modules/
    └── auth/
        ├── use-user-context.ts        # From previous implementation
        └── user-context.type.ts       # From previous implementation
```

## Testing

### Manual Testing Checklist

#### **As Landlord:**
- [ ] Login redirects to `/dashboard`
- [ ] Dashboard shows landlord view (properties, tenants, finances)
- [ ] Sidebar shows landlord navigation items
- [ ] Can access `/dashboard/properties`
- [ ] Can access `/dashboard/tenants`
- [ ] Can access `/dashboard/financials`
- [ ] Can access `/account/*` pages
- [ ] Cannot access `/admin/*` (should redirect)

#### **As Tenant:**
- [ ] Login redirects to `/account` (or `/dashboard` shows tenant view)
- [ ] Dashboard shows tenant view (rented property, payments)
- [ ] Sidebar shows tenant navigation items
- [ ] Can access `/dashboard/properties` (shows their property)
- [ ] Can access `/dashboard/payments`
- [ ] Can access `/dashboard/maintenance`
- [ ] Can access `/account/*` pages
- [ ] Cannot access `/dashboard/tenants` (should error or hide)
- [ ] Cannot access `/admin/*` (should redirect)

#### **As Admin:**
- [ ] Login redirects to `/admin`
- [ ] Can access `/admin/*` pages
- [ ] Can access `/dashboard` (shows landlord-like view)
- [ ] Sidebar shows admin navigation in `/admin`
- [ ] Sidebar shows landlord navigation in `/dashboard`
- [ ] Can access `/account/*` pages

### Navigation Flow Testing

```
Landlord User:
  Login → /dashboard → Shows LandlordDashboard
    - Sidebar: Properties, Tenants, Finances, etc.
    - Can navigate to /account → Personal settings
    
Tenant User:
  Login → /account (or /dashboard) → Shows TenantDashboard
    - Sidebar: My Property, Rent Payments, Maintenance
    - /dashboard/properties → Shows their rented property
    - Can navigate to /account → Personal settings

Admin User:
  Login → /admin → Shows AdminDashboard
    - Can switch to /dashboard → Shows landlord-like view
    - Can navigate to /account → Personal settings
```

## Migration Guide

### For Existing Components

**Old Way:**
```typescript
// Using user.role directly
const { user } = useAuthStore();
if (user.role === "landlord") {
  // ...
}
```

**New Way:**
```typescript
// Using context
const { isLandlord } = useUserRole();
if (isLandlord) {
  // ...
}
```

### For Existing Pages

**Old Way:**
```typescript
// Separate routes for each role
/landlord/dashboard
/tenant/dashboard
```

**New Way:**
```typescript
// Unified route with role-based content
/dashboard → <RoleBasedContent />
```

## Future Enhancements

### 1. **Multi-Role Support**
If a user can have multiple roles (e.g., both landlord and tenant):

```typescript
const { roles, activeRole, switchRole } = useUserContext();

<RoleSwitcher
  roles={roles}
  activeRole={activeRole}
  onSwitch={switchRole}
/>
```

### 2. **Permission-Based Rendering**
Beyond roles, check specific permissions:

```typescript
<PermissionGuard permission="properties.create">
  <CreatePropertyButton />
</PermissionGuard>
```

### 3. **Dynamic Route Generation**
Generate routes dynamically based on role and permissions:

```typescript
const routes = generateRoutesForRole(roleName, permissions);
```

### 4. **Analytics Integration**
Track which roles use which features:

```typescript
trackRoleAction(roleName, "viewed_dashboard");
trackRoleAction(roleName, "created_property");
```

## Support

### Common Issues

**Issue: Dashboard shows wrong content**
- Check `/api/me` response contains correct role
- Verify `useUserContext()` returns correct `roleName`
- Check browser console for errors

**Issue: Sidebar doesn't match role**
- Ensure `getDashboardSidebarItems()` receives correct `roleName`
- Check layout is using `useUserContext()` hook

**Issue: Can't access certain pages**
- Check `AuthGuard` in layout has correct `requiredRole`
- Verify user has correct role in database

### Debugging

```typescript
// Add to any component
const { context, roleName, isLandlord, isTenant } = useUserContext();
console.log("Debug Context:", {
  roleName,
  isLandlord,
  isTenant,
  fullContext: context,
});
```

---

**Status**: ✅ Implementation Complete
**Next**: Testing & User Feedback

