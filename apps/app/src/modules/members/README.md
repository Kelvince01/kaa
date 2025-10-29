# Members Module

Comprehensive member management module for the app, providing full CRUD operations and member statistics tracking.

## 📁 Module Structure

```
apps/app/src/modules/members/
├── components/
│   ├── create-member-sheet.tsx    # Sheet for creating new members
│   ├── update-member-sheet.tsx    # Sheet for updating existing members
│   ├── delete-members-dialog.tsx  # Dialog for deleting members (single/bulk)
│   ├── member-form.tsx            # Main form component for create/edit
│   ├── member-details.tsx         # Detailed member view
│   ├── member-stats.tsx           # Member statistics dashboard
│   └── index.ts                   # Component exports
├── table/
│   ├── columns.tsx                # Table column definitions
│   ├── action-bar.tsx             # Bulk action bar for selected rows
│   ├── toolbar-actions.tsx        # Toolbar actions (create, export)
│   └── index.tsx                  # Main table component
├── member.mutations.ts            # React Query mutations
├── member.queries.ts              # React Query queries
├── member.schema.ts               # Zod validation schemas
├── member.service.ts              # API service layer
├── member.store.ts                # Zustand state management
├── member.type.ts                 # TypeScript types
├── index.ts                       # Main module exports
└── README.md                      # This file
```

## 🏗️ API Integration

This module integrates with the following API endpoints from `apps/api/src/features/org/member.controller.ts`:

### Endpoints

- `GET /members` - List all members with pagination and filtering
- `GET /members/:memberId` - Get member by ID
- `POST /members` - Create new member
- `PATCH /members/:memberId` - Update member
- `DELETE /members/:memberId` - Delete member
- `GET /members/me` - Get current user's member
- `PUT /members/me` - Update current user's member
- `DELETE /members/me` - Delete current user's member
- `GET /members/me/stats` - Get member statistics

## 🔧 Core Features

### 1. **Member Management**
- ✅ Create, read, update, delete members
- ✅ Multi-member selection and bulk operations
- ✅ Member status management (active/inactive)
- ✅ Plan management (free, starter, professional, enterprise)
- ✅ Custom domain configuration
- ✅ Logo/branding support

### 2. **Data Table**
- ✅ Advanced filtering and sorting
- ✅ Column visibility controls
- ✅ Pagination support
- ✅ Bulk selection
- ✅ Export to CSV functionality
- ✅ Search by name, domain, plan
- ✅ Status filtering

### 3. **Member Settings**
- ✅ Theme customization
- ✅ Max users configuration
- ✅ Feature flags
- ✅ Custom branding toggle
- ✅ Invite permissions
- ✅ Email verification requirements
- ✅ Two-factor authentication settings

### 4. **Usage Tracking**
- ✅ User count vs limits
- ✅ API call monitoring
- ✅ Storage usage tracking
- ✅ Bandwidth monitoring
- ✅ Real-time percentage calculations
- ✅ Visual progress indicators

### 5. **Statistics Dashboard**
- ✅ Total and active user counts
- ✅ API call statistics
- ✅ Storage metrics
- ✅ Bandwidth analytics
- ✅ Usage vs limit comparisons
- ✅ Plan limits summary

## 🎯 Key Components

### MembersTable

Main table component with advanced filtering and bulk operations.

```tsx
import { MembersTable } from "@/modules/members/table";

export default function MembersPage() {
  return (
    <MembersTable
      params={{
        page: 1,
        limit: 10,
        search: "",
        plan: "professional",
      }}
    />
  );
}
```

### MemberForm

Form component for creating and editing members.

```tsx
import { MemberForm } from "@/modules/members/components";

export default function EditMemberPage() {
  return (
    <MemberForm
      mode="edit"
      member={selectedMember}
      onSuccess={() => console.log("Updated!")}
      onCancel={() => console.log("Cancelled")}
    />
  );
}
```

### MemberDetails

Detailed view of a single member with all information.

```tsx
import { MemberDetails } from "@/modules/members/components";

export default function MemberDetailsPage({ params }: { params: { id: string } }) {
  return <MemberDetails memberId={params.id} />;
}
```

### MemberStats

Statistics dashboard for member usage and limits.

```tsx
import { MemberStats } from "@/modules/members/components";

export default function MemberStatsPage({ params }: { params: { id: string } }) {
  return <MemberStats memberId={params.id} />;
}
```

## 📊 Data Types

### Member

```typescript
type Member = {
  _id: string;
  type?: "admin" | "agent" | "caretaker" | "viewer";
  user: string | any;
  organization: string | any;
  role: string | any;
  name: string;
  slug: string;
  plan: string | any;
  domain?: string;
  logo?: string;
  isActive: boolean;
  settings: MemberSettings;
  usage: MemberUsage;
  limits: MemberLimits;
  customPermissions?: string[];
  createdAt: string;
  updatedAt: string;
};
```

### Member Settings

```typescript
type MemberSettings = {
  theme?: string;
  maxUsers: number;
  features: string[];
  customBranding: boolean;
  allowInvites: boolean;
  requireEmailVerification: boolean;
  twoFactorRequired: boolean;
};
```

### Member Usage & Limits

```typescript
type MemberUsage = {
  users: number;
  apiCalls: number;
  storage: number; // in bytes
  bandwidth: number; // in bytes
};

type MemberLimits = {
  users: number;
  apiCalls: number;
  storage: number;
  bandwidth: number;
};
```

## 🔌 React Query Hooks

### Queries

```typescript
import {
  useMembers,      // Get all members with filters
  useMember,       // Get single member by ID
  useCurrentMember, // Get current user's member
  useMemberStats,  // Get member statistics
} from "@/modules/members";

// Example usage
const { data, isLoading } = useMembers({
  page: 1,
  limit: 10,
  search: "acme",
  plan: "enterprise",
});

const { data: member } = useMember("member-id");
const { data: currentMember } = useCurrentMember();
const { data: stats } = useMemberStats("member-id");
```

### Mutations

```typescript
import {
  useCreateMember,
  useUpdateMember,
  useDeleteMember,
  useUpdateCurrentMember,
  useDeleteCurrentMember,
} from "@/modules/members";

// Example usage
const createMember = useCreateMember();
const updateMember = useUpdateMember();
const deleteMember = useDeleteMember();

await createMember.mutateAsync({
  user: "user-id",
  organization: "org-id",
  role: "role-id",
  name: "Acme Corp",
  slug: "acme-corp",
  plan: "enterprise",
});

await updateMember.mutateAsync({
  id: "member-id",
  data: {
    name: "Updated Name",
    isActive: true,
  },
});

await deleteMember.mutateAsync("member-id");
```

## 🎨 UI Components Used

- **Shadcn/ui**: Badge, Button, Card, Checkbox, Dialog, Form, Input, Select, Sheet, Separator, Switch, Progress
- **Lucide Icons**: Building2, Calendar, CheckCircle2, CircleX, Users, Globe, Settings, Activity, Database, HardDrive, TrendingUp, Wifi
- **React Hook Form**: Form management and validation
- **Zod**: Schema validation
- **TanStack Table**: Advanced data table functionality
- **Zustand**: State management

## 🚀 Usage Examples

### Creating a Member Management Page

```tsx
"use client";

import { MembersTable } from "@/modules/members/table";

export default function MembersPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Members</h1>
        <p className="text-muted-foreground">
          Manage organization members and track their usage
        </p>
      </div>
      <MembersTable />
    </div>
  );
}
```

### Creating a Member Details Page

```tsx
"use client";

import { MemberDetails } from "@/modules/members/components";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@kaa/ui/components/tabs";
import { MemberStats } from "@/modules/members/components";

export default function MemberPage({ params }: { params: { id: string } }) {
  return (
    <div className="container mx-auto py-6">
      <Tabs defaultValue="details">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="stats">Statistics</TabsTrigger>
        </TabsList>
        <TabsContent value="details">
          <MemberDetails memberId={params.id} />
        </TabsContent>
        <TabsContent value="stats">
          <MemberStats memberId={params.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

## 🔐 Permissions & Access Control

The member module integrates with the RBAC system. Most operations require admin role:

- **Admin**: Full access to all member operations
- **Member**: Can view and update their own member
- **Other roles**: Limited access based on permissions

## 📝 Validation

All forms use Zod schemas for validation:

- **Name**: Required, minimum 1 character
- **Slug**: Required, lowercase alphanumeric with hyphens
- **Domain**: Optional, must be valid URL
- **Logo**: Optional, must be valid URL
- **Plan**: Must be one of: free, starter, professional, enterprise
- **Settings**: Each setting has specific validation rules

## 🎯 Best Practices

1. **Always use React Query hooks** for data fetching and mutations
2. **Handle loading and error states** appropriately
3. **Use optimistic updates** where applicable
4. **Validate data** using Zod schemas before submission
5. **Show success/error toasts** for user feedback
6. **Implement proper access control** checks
7. **Cache invalidation** after mutations

## 🐛 Troubleshooting

### Member not updating
- Check if the mutation is being called with correct parameters
- Verify user has appropriate permissions
- Check network tab for API errors

### Stats not loading
- Ensure member ID is valid
- Check if member has access to view stats
- Verify API endpoint is accessible

### Table not rendering
- Ensure data is being fetched correctly
- Check if FeatureFlagsProvider is wrapping the component
- Verify table columns are configured properly

## 🔄 Future Enhancements

- [ ] Member invitations system
- [ ] Activity logs and audit trail
- [ ] Advanced analytics and reporting
- [ ] Email notifications for usage limits
- [ ] Billing integration
- [ ] Multi-organization support
- [ ] Custom role permissions per member
- [ ] SSO/SAML integration

## 📚 Related Modules

- **Organizations**: Parent organization management
- **Users**: User management within members
- **RBAC**: Role-based access control
- **Subscriptions**: Plan and billing management
- **Analytics**: Usage analytics and reporting

## 🤝 Contributing

When adding new features to this module:

1. Follow the existing file structure
2. Add proper TypeScript types
3. Include Zod validation schemas
4. Write comprehensive tests
5. Update this README
6. Follow the project's coding standards

## 📄 License

This module is part of the KAA project and follows the same license.

