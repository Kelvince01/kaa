/account/*          → Personal settings (ALL roles)
  ├─ /profile       → User profile, avatar, bio
  ├─ /settings      → Preferences, notifications
  ├─ /security      → Password, 2FA
  ├─ /saved-searches → Saved property searches
  ├─ /favorites     → Favorited properties
  └─ /billing       → Personal billing (if applicable)

/dashboard/*        → Role-specific workspace (Landlord/Tenant)
  ├─ /overview      → Role-aware dashboard home
  ├─ /properties    → Landlord: owned properties | Tenant: rented properties
  ├─ /tenants       → Landlord only
  ├─ /payments      → Landlord: collections | Tenant: rent payments
  ├─ /maintenance   → Landlord: requests to handle | Tenant: submit requests
  ├─ /documents     → Role-specific documents
  ├─ /reports       → Role-specific reports
  └─ /messages      → Communications

/admin/*            → Platform administration (Admin only)
  ├─ /users         → User management
  ├─ /organizations → Org management
  ├─ /properties    → All properties (platform-wide)
  ├─ /approvals     → Verification queues
  ├─ /analytics     → Platform analytics
  └─ /settings      → Platform settings