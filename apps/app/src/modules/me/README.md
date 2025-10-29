# Me Module

Handles current user context, including role, member, organization, and profile data.

## Architecture

The Me module uses a **dual-layer architecture**:
1. **React Query** - For data fetching, caching, and server state management
2. **Zustand Store** - For persisted local state with automatic sync

### Data Flow

```
API (/auth/me) → React Query → useUserContext Hook → Zustand Store → Components
                                      ↓
                                  localStorage (persisted)
```

## Usage Examples

### 1. Fetch User Context (with auto-sync to store)

```typescript
import { useUserContext } from "@/modules/me";

function MyComponent() {
  const { context, role, organization, isLandlord, isTenant, isLoading } = useUserContext();
  
  if (isLoading) return <div>Loading...</div>;
  
  if (isLandlord) {
    return <div>Welcome, {organization?.name}</div>;
  }
  
  if (isTenant) {
    return <div>Welcome to your personal account</div>;
  }
}
```

### 2. Access Persisted Store Data (without fetching)

```typescript
import { useMeStoreData } from "@/modules/me";

function MyComponent() {
  const { context, isLandlord, roleName, hasOrganization } = useMeStoreData();
  
  // This reads from the persisted store without triggering an API call
  // Useful for quick checks or when you know the data is already loaded
  
  return <div>Role: {roleName}</div>;
}
```

### 3. Access Specific Context Parts

```typescript
import { useOrganization, useUserRole } from "@/modules/me";

// Get only organization data
function OrgHeader() {
  const { organization, organizationName, organizationLogo, plan } = useOrganization();
  
  return (
    <div>
      <img src={organizationLogo} alt={organizationName} />
      <span>{plan} Plan</span>
    </div>
  );
}

// Get only role data
function RoleChecker() {
  const { roleName, isLandlord, isTenant, hasRole, hasAnyRole } = useUserRole();
  
  const canEdit = hasAnyRole(['landlord', 'admin', 'manager']);
  
  return canEdit ? <EditButton /> : null;
}
```

### 4. Manually Update Store

```typescript
import { useMeStore } from "@/modules/me";

function UpdateProfile() {
  const { setProfile, setOrganization } = useMeStore();
  
  const updateOrg = (newOrgData) => {
    setOrganization(newOrgData);
  };
  
  return <button onClick={() => updateOrg(...)}>Update</button>;
}
```

## Store Sync Behavior

The store automatically syncs in the following scenarios:

1. **On Login**: When `useCurrentUser()` or `useUserContext()` fetches data
2. **On Query Success**: Whenever React Query successfully fetches new data
3. **On Logout**: Store is automatically cleared via `authStore.logout()`

### Persistence

The store persists the following to `localStorage`:
- `context` - Full user context object
- `role` - User role information
- `member` - Member information
- `organization` - Organization information
- `profile` - Role-specific profile data

### Auto-sync to Store

Both `useCurrentUser` and `useUserContext` hooks automatically sync fetched data to the Zustand store using `useEffect`. This means:

- ✅ **Store always reflects latest API data**
- ✅ **Data persists across page refreshes**
- ✅ **No manual sync needed**
- ✅ **Optimistic UI updates possible**

## API Response Structure

```typescript
{
  status: "success",
  user: {
    id: string,
    email: string,
    firstName: string,
    lastName: string,
    // ... other user fields
  },
  context: {
    role: {
      id: string,
      name: "landlord" | "tenant" | "admin",
      isPrimary: boolean
    },
    member: {
      id: string,
      name: string,
      logo?: string,
      plan: string
    },
    organization: {
      id: string,
      name: string,
      logo?: string,
      type: string
    },
    profile: {
      type: string,
      data: any  // Landlord or Tenant specific data
    }
  }
}
```

## Helper Methods

### Store Computed Values

```typescript
const store = useMeStore();

// Check organization status
store.hasOrganization() // boolean

// Check role
store.isLandlord()      // boolean
store.isTenant()        // boolean
store.isAdmin()         // boolean
store.getRoleName()     // string | null
```

### Hook Return Values

```typescript
const {
  // Query state
  isLoading,
  isError,
  error,
  
  // Context data
  context,
  role,
  member,
  organization,
  profile,
  
  // Helper booleans
  hasOrganization,
  isLandlord,
  isTenant,
  isAdmin,
} = useUserContext();
```

## Best Practices

1. **Use `useUserContext()` in components** - It fetches fresh data and syncs to store
2. **Use `useMeStoreData()` for quick checks** - When you need persisted data without fetching
3. **Use specific hooks for focused data** - `useOrganization()`, `useUserRole()` for better performance
4. **Don't manually sync** - The hooks handle sync automatically
5. **Trust the store** - It's always in sync with latest API data

## Testing

```typescript
import { renderHook, waitFor } from '@testing-library/react';
import { useUserContext, useMeStore } from '@/modules/me';

test('store syncs with fetched data', async () => {
  const { result } = renderHook(() => useUserContext());
  
  await waitFor(() => expect(result.current.isLoading).toBe(false));
  
  // Check that store has the data
  const store = useMeStore.getState();
  expect(store.context).toBeDefined();
  expect(store.role).toBeDefined();
});
```

