# Organizations Module

Comprehensive organization management module providing full CRUD operations for organizations including landlords, property managers, agencies, and other organization types.

## 📁 Module Structure

```
apps/app/src/modules/organizations/
├── components/
│   ├── create-organization-sheet.tsx    # Sheet for creating new organizations
│   ├── update-organization-sheet.tsx    # Sheet for updating existing organizations
│   ├── delete-organizations-dialog.tsx  # Dialog for deleting organizations (single/bulk)
│   ├── organization-form.tsx            # Main form component for create/edit
│   ├── organization-details.tsx         # Detailed organization view
│   └── index.ts                         # Component exports
├── table/
│   ├── columns.tsx                      # Table column definitions
│   ├── action-bar.tsx                   # Bulk action bar for selected rows
│   ├── toolbar-actions.tsx              # Toolbar actions (create, export)
│   └── index.tsx                        # Main table component
├── organization.mutations.ts            # React Query mutations
├── organization.queries.ts              # React Query queries
├── organization.schema.ts               # Zod validation schemas
├── organization.service.ts              # API service layer
├── organization.store.ts                # Zustand state management
├── organization.type.ts                 # TypeScript types
├── index.ts                             # Main module exports
└── README.md                            # This file
```

## 🏗️ API Integration

This module integrates with the following API endpoints from `apps/api/src/features/org/org.controller.ts`:

### Endpoints

- `GET /organizations` - List all organizations with pagination and filtering
- `GET /organizations/:id` - Get organization by ID
- `GET /organizations/slug/:slug` - Get organization by slug
- `GET /organizations/slug/:slug/check` - Check if slug is available
- `POST /organizations` - Create new organization
- `PATCH /organizations/:id` - Update organization
- `DELETE /organizations/:id` - Delete organization
- `POST /organizations/:id/members` - Add member to organization
- `DELETE /organizations/:id/members/:memberId` - Remove member from organization

## 🔧 Core Features

### 1. **Organization Management**
- ✅ Create, read, update, delete organizations
- ✅ Multi-organization selection and bulk operations
- ✅ Organization type management (landlord, property_manager, agency, other)
- ✅ Slug generation and validation
- ✅ Comprehensive contact information
- ✅ Full address management
- ✅ Registration and tax information (KRA PIN)

### 2. **Data Table**
- ✅ Advanced filtering and sorting
- ✅ Column visibility controls
- ✅ Pagination support
- ✅ Bulk selection
- ✅ Export to CSV functionality
- ✅ Search by name, email, phone
- ✅ Type and status filtering
- ✅ Location display

### 3. **Form Validation**
- ✅ Comprehensive Zod schemas
- ✅ Email validation
- ✅ Phone number validation
- ✅ URL validation (website, logo)
- ✅ Slug format validation
- ✅ Required field validation
- ✅ Real-time form validation

### 4. **Organization Details**
- ✅ Complete organization profile view
- ✅ Contact information display
- ✅ Address visualization
- ✅ Registration details
- ✅ Status indicators
- ✅ Creation and update timestamps

## 🎯 Key Components

### OrganizationsTable

Main table component with advanced filtering and bulk operations.

```tsx
import { OrganizationsTable } from "@/modules/organizations";

export default function OrganizationsPage() {
  return (
    <OrganizationsTable
      filters={{
        page: 1,
        limit: 10,
        name: "",
        sort: "dateDesc",
      }}
    />
  );
}
```

### OrganizationForm

Form component for creating and editing organizations.

```tsx
import { OrganizationForm } from "@/modules/organizations";

export default function EditOrganizationPage() {
  return (
    <OrganizationForm
      mode="edit"
      organization={selectedOrganization}
      onSuccess={() => console.log("Updated!")}
      onCancel={() => console.log("Cancelled")}
    />
  );
}
```

### OrganizationDetails

Detailed view of a single organization.

```tsx
import { OrganizationDetails } from "@/modules/organizations";

export default function OrganizationDetailsPage({ params }: { params: { id: string } }) {
  return <OrganizationDetails organizationId={params.id} />;
}
```

### CreateOrganizationSheet

Sheet component for creating new organizations with full form.

```tsx
import { CreateOrganizationSheet } from "@/modules/organizations";

export default function NewOrganizationButton() {
  return <CreateOrganizationSheet />;
}
```

## 📊 Data Types

### Organization

```typescript
type Organization = {
  _id: string;
  slug: string;
  name: string;
  type: OrganizationType;
  email: string;
  phone: string;
  address: OrganizationAddress;
  registrationNumber?: string;
  kraPin?: string;
  website?: string;
  logo?: string;
  settings?: Record<string, unknown>;
  isActive: boolean;
  members?: string[];
  properties?: string[];
  createdAt: string;
  updatedAt: string;
};
```

### Organization Types

```typescript
type OrganizationType =
  | "landlord"
  | "property_manager"
  | "agency"
  | "other";
```

### Organization Address

```typescript
type OrganizationAddress = {
  country: string;
  county: string;
  town: string;
  street: string;
  postalCode?: string;
};
```

## 🔌 React Query Hooks

### Queries

```typescript
import {
  useOrganizations,           // Get all organizations with filters
  useOrganization,           // Get single organization by ID
  useOrganizationBySlug,     // Get organization by slug
  useSlugAvailability,       // Check if slug is available
} from "@/modules/organizations";

// Example usage
const { data, isLoading } = useOrganizations({
  page: 1,
  limit: 10,
  name: "acme",
  type: "landlord",
  sort: "nameAsc",
});

const { data: org } = useOrganization("org-id");
const { data: orgBySlug } = useOrganizationBySlug("acme-properties");
const { data: slugCheck } = useSlugAvailability("new-org-slug");
```

### Mutations

```typescript
import {
  useCreateOrganization,
  useUpdateOrganization,
  useDeleteOrganization,
  useAddMemberToOrganization,
  useRemoveMemberFromOrganization,
} from "@/modules/organizations";

// Example usage
const createOrg = useCreateOrganization();
const updateOrg = useUpdateOrganization();
const deleteOrg = useDeleteOrganization();

await createOrg.mutateAsync({
  slug: "acme-properties",
  name: "Acme Properties",
  type: "landlord",
  email: "info@acmeproperties.com",
  phone: "+254700000000",
  address: {
    country: "Kenya",
    county: "Nairobi",
    town: "Nairobi",
    street: "Kenyatta Avenue",
    postalCode: "00100",
  },
  registrationNumber: "REG-123456",
  kraPin: "A000000000A",
  website: "https://acmeproperties.com",
});

await updateOrg.mutateAsync({
  id: "org-id",
  data: {
    name: "Updated Name",
    email: "newemail@example.com",
  },
});

await deleteOrg.mutateAsync("org-id");
```

## 🎨 UI Components Used

- **Shadcn/ui**: Badge, Button, Card, Checkbox, Dialog, Form, Input, Select, Sheet, Separator
- **Lucide Icons**: Building2, Calendar, CheckCircle2, CircleX, Mail, Phone, Globe, MapPin
- **React Hook Form**: Form management and validation
- **Zod**: Schema validation
- **TanStack Table**: Advanced data table functionality
- **Zustand**: State management

## 🚀 Usage Examples

### Creating an Organizations Management Page

```tsx
"use client";

import { OrganizationsTable } from "@/modules/organizations/table";

export default function OrganizationsPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Organizations</h1>
        <p className="text-muted-foreground">
          Manage landlords, property managers, and agencies
        </p>
      </div>
      <OrganizationsTable />
    </div>
  );
}
```

### Creating an Organization Details Page

```tsx
"use client";

import { OrganizationDetails } from "@/modules/organizations";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@kaa/ui/components/tabs";

export default function OrganizationPage({ params }: { params: { id: string } }) {
  return (
    <div className="container mx-auto py-6">
      <Tabs defaultValue="details">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="members">Members</TabsTrigger>
          <TabsTrigger value="properties">Properties</TabsTrigger>
        </TabsList>
        <TabsContent value="details">
          <OrganizationDetails organizationId={params.id} />
        </TabsContent>
        <TabsContent value="members">
          {/* Members list component */}
        </TabsContent>
        <TabsContent value="properties">
          {/* Properties list component */}
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

### Adding a Quick Create Button

```tsx
import { CreateOrganizationSheet } from "@/modules/organizations";

export function QuickCreateButton() {
  return (
    <CreateOrganizationSheet showTrigger={true} />
  );
}
```

## 🔐 Permissions & Access Control

The organizations module integrates with the RBAC system. Most operations require admin role:

- **Admin**: Full access to all organization operations
- **Property Manager**: Can view and update their own organization
- **Other roles**: Limited access based on permissions

## 📝 Validation Rules

All forms use Zod schemas for validation:

- **Name**: Required, minimum 1 character
- **Slug**: Required, lowercase alphanumeric with hyphens
- **Type**: Must be one of: landlord, property_manager, agency, other
- **Email**: Required, must be valid email format
- **Phone**: Required, minimum 1 character
- **Address**: All fields required except postal code
- **Website**: Optional, must be valid URL if provided
- **Logo**: Optional, must be valid URL if provided
- **Registration Number**: Optional, alphanumeric
- **KRA PIN**: Optional, tax identification number

## 🎯 Best Practices

1. **Always use React Query hooks** for data fetching and mutations
2. **Handle loading and error states** appropriately
3. **Use optimistic updates** where applicable
4. **Validate data** using Zod schemas before submission
5. **Show success/error toasts** for user feedback
6. **Implement proper access control** checks
7. **Cache invalidation** after mutations
8. **Use slug for URL-friendly identifiers**

## 🐛 Troubleshooting

### Organization not updating
- Check if the mutation is being called with correct parameters
- Verify user has appropriate permissions
- Check network tab for API errors

### Slug validation failing
- Ensure slug contains only lowercase letters, numbers, and hyphens
- Check if slug is already taken using slug availability check
- Verify slug is not empty

### Table not rendering
- Ensure data is being fetched correctly
- Check if FeatureFlagsProvider is wrapping the component
- Verify table columns are configured properly

## 🔄 Future Enhancements

- [ ] Organization invitation system
- [ ] Activity logs and audit trail
- [ ] Advanced analytics and reporting
- [ ] Email notifications
- [ ] Multi-level organization hierarchy
- [ ] Custom role permissions per organization
- [ ] SSO/SAML integration
- [ ] API rate limiting per organization
- [ ] Organization billing and subscriptions
- [ ] Bulk import/export functionality

## 📚 Related Modules

- **Members**: Member management within organizations
- **Properties**: Property management by organizations
- **Users**: User management and authentication
- **RBAC**: Role-based access control
- **Subscriptions**: Plan and billing management

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

