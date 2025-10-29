# Webhooks Admin Pages

Admin pages and containers for managing webhooks in the application.

## Files Created

### Routes (Containers)

1. **index.tsx** - Main webhooks management page
   - Lists all webhooks with tabs (All, Active, Inactive)
   - Create, edit, delete webhooks
   - Test webhooks
   - Activate/deactivate webhooks
   - View deliveries and analytics
   - Regenerate webhook secrets

2. **deliveries.tsx** - Webhook deliveries page
   - View delivery history for a specific webhook
   - Redeliver failed webhooks
   - View delivery details

3. **analytics.tsx** - Webhook analytics page
   - View performance metrics
   - Success/failure rates
   - Response time statistics

### Pages

1. **apps/app/src/app/admin/webhooks/page.tsx** - Main admin webhooks page
2. **apps/app/src/app/admin/webhooks/[webhookId]/deliveries/page.tsx** - Deliveries page
3. **apps/app/src/app/admin/webhooks/[webhookId]/analytics/page.tsx** - Analytics page

## Features

### Main Webhooks Page (`/admin/webhooks`)

- **Tabs**:
  - All Webhooks - Shows all configured webhooks
  - Active - Shows only active webhooks
  - Inactive - Shows only inactive webhooks

- **Actions**:
  - Create new webhook
  - Edit existing webhook
  - Delete webhook
  - Test webhook endpoint
  - Activate/deactivate webhook
  - View delivery history
  - View analytics
  - Regenerate webhook secret

- **Displays**:
  - Webhook cards with all details
  - Status badges
  - Event tags
  - Last triggered timestamp
  - Webhook URL with copy function

### Deliveries Page (`/admin/webhooks/[webhookId]/deliveries`)

- **Features**:
  - Webhook details card
  - Delivery history table
  - Status indicators (Delivered, Failed, Pending, etc.)
  - HTTP status codes
  - Response times
  - Retry failed deliveries
  - View detailed delivery information
  - Back navigation to main page

### Analytics Page (`/admin/webhooks/[webhookId]/analytics`)

- **Metrics**:
  - Total deliveries count
  - Successful deliveries
  - Failed deliveries
  - Success rate percentage
  - Average response time
  - Last delivery timestamp

- **Visualizations**:
  - Analytics cards
  - Progress bars for success rates
  - Trend indicators

## Navigation

The webhooks section has been added to the admin sidebar with proper icon (Webhook).

```
Admin
  ├── Dashboard
  ├── Organizations
  ├── Properties
  ├── Landlords
  ├── Users
  ├── Members
  ├── Bookings
  ├── Finances
  └── Webhooks  ← New
```

## URL Structure

```
/admin/webhooks                              - Main webhooks list
/admin/webhooks/[webhookId]/deliveries       - Delivery history
/admin/webhooks/[webhookId]/analytics        - Performance metrics
```

## Component Integration

The pages use components from the webhooks module:

- `WebhookList` - Displays webhook cards
- `WebhookCreateDialog` - Create webhook dialog
- `WebhookEditDialog` - Edit webhook dialog
- `WebhookTestDialog` - Test webhook dialog
- `WebhookDeliveries` - Delivery history table
- `WebhookAnalyticsComponent` - Analytics dashboard

## State Management

- Uses React Query for data fetching and caching
- Automatic cache invalidation on mutations
- Loading states with skeletons
- Error handling with toast notifications

## Security

- Protected by `AuthGuard` with admin/super_admin roles
- Only accessible to authenticated admin users

## TODO

- [ ] Replace `window.confirm` with custom confirmation dialogs
- [ ] Add delivery details modal
- [ ] Add webhook logs viewer
- [ ] Add bulk operations (activate/deactivate multiple)
- [ ] Add webhook templates
- [ ] Add export functionality for delivery history
- [ ] Add filtering for deliveries (status, date range)
- [ ] Add pagination for deliveries

## Usage Example

```tsx
// The pages are automatically accessible at:
// - /admin/webhooks
// - /admin/webhooks/[webhookId]/deliveries
// - /admin/webhooks/[webhookId]/analytics

// Navigation from sidebar automatically works
// Can also navigate programmatically:
router.push('/admin/webhooks');
router.push(`/admin/webhooks/${webhookId}/deliveries`);
router.push(`/admin/webhooks/${webhookId}/analytics`);
```

## Dependencies

- `@kaa/ui/components/*` - UI components
- `@/modules/misc/webhooks` - Webhooks module
- `lucide-react` - Icons
- `sonner` - Toast notifications
- `next/navigation` - Routing

## Testing

To test the pages:

1. Navigate to `/admin/webhooks` as an admin user
2. Create a new webhook
3. Test the webhook
4. View delivery history
5. View analytics
6. Edit/delete webhooks

## Notes

- All pages follow the admin layout structure
- Breadcrumbs automatically update based on current page
- Toast notifications for all actions
- Responsive design for mobile and desktop
- Loading states for better UX
- Error handling for failed operations

