# Maintenance Management Module

## Overview

The Maintenance Management module provides comprehensive tools for handling all maintenance-related activities in the property management system. It streamlines the process of reporting, tracking, and resolving maintenance issues across all properties.

## Features

### Maintenance Requests

- Submit and track maintenance requests
- Categorize by type (plumbing, electrical, HVAC, etc.)
- Set priority levels (low, medium, high, emergency)
- Track request status (submitted, in progress, completed, etc.)
- Attach photos and documents
- Add comments and updates
- Schedule maintenance appointments
- Track resolution time

### Work Orders

- Create and assign work orders
- Schedule and track work orders
- Document time and materials
- Capture before/after photos
- Generate completion reports
- Track work order status
- Manage work order assignments
- Document resolution details

### Preventative Maintenance

- Schedule recurring maintenance tasks
- Set up maintenance checklists
- Track maintenance history
- Generate maintenance reports
- Set up maintenance reminders
- Track equipment warranties
- Document maintenance procedures

### Vendor Management

- Maintain vendor directory
- Track vendor performance
- Manage vendor contracts
- Track insurance and certifications
- Rate and review vendors
- Track vendor response times
- Manage vendor payments

## Data Models

### Maintenance Request

```typescript
{
  _id: ObjectId,
  property: ObjectId,
  unit: ObjectId,
  tenant: ObjectId,
  title: string,
  description: string,
  category: 'plumbing' | 'electrical' | 'hvac' | 'appliance' | 'structural' | 'pest' | 'cleaning' | 'other',
  priority: 'low' | 'medium' | 'high' | 'emergency',
  status: 'submitted' | 'in_review' | 'approved' | 'assigned' | 'in_progress' | 'completed' | 'cancelled',
  submissionDate: Date,
  preferredDate: Date,
  preferredTime: 'morning' | 'afternoon' | 'evening',
  accessInstructions: string,
  images: string[],
  documents: string[],
  assignedTo: ObjectId,
  assignedDate: Date,
  completedDate: Date,
  completionNotes: string,
  tenantRating: number,
  tenantFeedback: string,
  internalNotes: string,
  createdBy: ObjectId,
  updatedBy: ObjectId,
  createdAt: Date,
  updatedAt: Date
}
```

### Work Order

```typescript
{
  _id: ObjectId,
  property: ObjectId,
  unit: ObjectId,
  title: string,
  description: string,
  category: string,
  priority: 'low' | 'medium' | 'high' | 'emergency',
  status: 'pending' | 'assigned' | 'in_progress' | 'on_hold' | 'completed' | 'cancelled',
  scheduledStart: Date,
  scheduledEnd: Date,
  actualStart: Date,
  actualEnd: Date,
  estimatedDuration: number, // in minutes
  assignedTo: ObjectId,
  assignedBy: ObjectId,
  assignedDate: Date,
  completedBy: ObjectId,
  completedDate: Date,
  completionNotes: string,
  beforePhotos: string[],
  afterPhotos: string[],
  materials: {
    name: string,
    quantity: number,
    unit: string,
    unitCost: number,
    totalCost: number,
    supplier?: string
  }[],
  laborCost: number,
  materialCost: number,
  totalCost: number,
  currency: string,
  checklist: {
    task: string,
    completed: boolean,
    completedAt: Date,
    completedBy: ObjectId
  }[],
  location: {
    specificLocation: string,
    accessInstructions: string,
    contactPerson: string,
    contactPhone: string
  },
  createdBy: ObjectId,
  updatedBy: ObjectId,
  createdAt: Date,
  updatedAt: Date
}
```

### Vendor

```typescript
{
  _id: ObjectId,
  companyName: string,
  contactPerson: string,
  email: string,
  phone: string,
  address: {
    street: string,
    city: string,
    state: string,
    postalCode: string,
    country: string,
    coordinates: [number, number]
  },
  services: string[],
  taxId: string,
  registrationNumber: string,
  insurance: {
    provider: string,
    policyNumber: string,
    coverageAmount: number,
    expiryDate: Date,
    document: string
  },
  rating: number,
  totalJobs: number,
  averageResponseTime: number, // in hours
  notes: string,
  status: 'active' | 'inactive' | 'suspended',
  createdBy: ObjectId,
  updatedBy: ObjectId,
  createdAt: Date,
  updatedAt: Date
}
```

## API Endpoints

### Maintenance Requests

- `GET /api/maintenance-requests` - List all maintenance requests
- `POST /api/maintenance-requests` - Create a new maintenance request
- `GET /api/maintenance-requests/:id` - Get a specific maintenance request
- `PUT /api/maintenance-requests/:id` - Update a maintenance request
- `DELETE /api/maintenance-requests/:id` - Delete a maintenance request
- `GET /api/maintenance-requests/property/:propertyId` - Get maintenance requests by property
- `GET /api/maintenance-requests/unit/:unitId` - Get maintenance requests by unit
- `GET /api/maintenance-requests/tenant/:tenantId` - Get maintenance requests by tenant
- `POST /api/maintenance-requests/:id/assign` - Assign a maintenance request
- `POST /api/maintenance-requests/:id/status` - Update maintenance request status
- `POST /api/maintenance-requests/:id/comment` - Add a comment to a maintenance request

### Work Orders

- `GET /api/work-orders` - List all work orders
- `POST /api/work-orders` - Create a new work order
- `GET /api/work-orders/:id` - Get a specific work order
- `PUT /api/work-orders/:id` - Update a work order
- `DELETE /api/work-orders/:id` - Delete a work order
- `GET /api/work-orders/assigned/:userId` - Get work orders assigned to a user
- `GET /api/work-orders/property/:propertyId` - Get work orders by property
- `POST /api/work-orders/:id/assign` - Assign a work order
- `POST /api/work-orders/:id/status` - Update work order status
- `POST /api/work-orders/:id/complete` - Complete a work order
- `POST /api/work-orders/:id/cancel` - Cancel a work order

### Preventative Maintenance

- `GET /api/preventative-maintenance` - List all preventative maintenance schedules
- `POST /api/preventative-maintenance` - Create a new preventative maintenance schedule
- `GET /api/preventative-maintenance/:id` - Get a specific preventative maintenance schedule
- `PUT /api/preventative-maintenance/:id` - Update a preventative maintenance schedule
- `DELETE /api/preventative-maintenance/:id` - Delete a preventative maintenance schedule
- `GET /api/preventative-maintenance/property/:propertyId` - Get preventative maintenance schedules by property
- `POST /api/preventative-maintenance/:id/generate-work-order` - Generate work orders from a schedule

### Vendors

- `GET /api/vendors` - List all vendors
- `POST /api/vendors` - Create a new vendor
- `GET /api/vendors/:id` - Get a specific vendor
- `PUT /api/vendors/:id` - Update a vendor
- `DELETE /api/vendors/:id` - Delete a vendor
- `GET /api/vendors/search` - Search vendors
- `GET /api/vendors/:id/performance` - Get vendor performance metrics

## Usage Examples

### Create a Maintenance Request

```typescript
const maintenanceRequest = {
  property: 'property123',
  unit: 'unit456',
  tenant: 'tenant789',
  title: 'Kitchen Sink Leak',
  description: 'The kitchen sink is leaking from the faucet base. Water is dripping into the cabinet below.',
  category: 'plumbing',
  priority: 'high',
  preferredDate: '2025-07-15',
  preferredTime: 'morning',
  accessInstructions: 'Someone will be home all day',
  images: [
    'https://example.com/photos/leak1.jpg',
    'https://example.com/photos/leak2.jpg'
  ]
};

const response = await fetch('/api/maintenance-requests', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify(maintenanceRequest)
});

const { request } = await response.json();
```

### Create a Work Order

```typescript
const workOrder = {
  property: 'property123',
  title: 'Fix Kitchen Sink Leak',
  description: 'Replace washers and seals on kitchen sink faucet',
  category: 'plumbing',
  priority: 'high',
  assignedTo: 'vendor123',
  scheduledStart: '2025-07-16T09:00:00Z',
  scheduledEnd: '2025-07-16T11:00:00Z',
  estimatedDuration: 120, // minutes
  location: {
    specificLocation: 'Unit 456, Kitchen',
    accessInstructions: 'Tenant will be home',
    contactPerson: 'John Doe',
    contactPhone: '+254712345678'
  },
  checklist: [
    { task: 'Turn off water supply', completed: false },
    { task: 'Disassemble faucet', completed: false },
    { task: 'Replace washers and seals', completed: false },
    { task: 'Reassemble faucet', completed: false },
    { task: 'Test for leaks', completed: false },
    { task: 'Clean work area', completed: false }
  ],
  materials: [
    {
      name: 'Faucet Washer Kit',
      quantity: 1,
      unit: 'set',
      unitCost: 500,
      totalCost: 500
    }
  ],
  laborCost: 2000,
  materialCost: 500,
  totalCost: 2500,
  currency: 'KES'
};

const response = await fetch('/api/work-orders', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify(workOrder)
});

const { workOrder: createdWorkOrder } = await response.json();
```

### Complete a Work Order

```typescript
const completionData = {
  actualStart: '2025-07-16T09:15:00Z',
  actualEnd: '2025-07-16T10:30:00Z',
  completionNotes: 'Replaced all washers and seals. No more leaks detected.',
  completedBy: 'staff123',
  materialsUsed: [
    {
      name: 'Faucet Washer Kit',
      quantity: 1,
      unit: 'set',
      unitCost: 500,
      totalCost: 500,
      supplier: 'PlumbPro'
    }
  ],
  beforePhotos: [
    'https://example.com/photos/leak-before.jpg'
  ],
  afterPhotos: [
    'https://example.com/photos/leak-after.jpg'
  ]
};

const response = await fetch('/api/work-orders/wo123/complete', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify(completionData)
});

const { workOrder: completedWorkOrder } = await response.json();
```

## Error Handling

### Common Error Codes

- `400 Bad Request` - Invalid input data
- `401 Unauthorized` - Authentication required
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `409 Conflict` - Resource conflict (e.g., duplicate entry)
- `422 Unprocessable Entity` - Validation error
- `429 Too Many Requests` - Rate limiting
- `500 Internal Server Error` - Server error

### Error Response Format

```json
{
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "The requested resource was not found",
    "details": {
      "resourceType": "workOrder",
      "id": "wo123"
    },
    "timestamp": "2025-05-28T00:00:00Z",
    "requestId": "req_1234567890"
  }
}
```

## Security Considerations

### Authentication & Authorization

- All endpoints require authentication
- Role-based access control (RBAC)
- JWT token validation
- API key for service-to-service communication

### Data Protection

- Encrypt sensitive data at rest
- Use HTTPS for all communications
- Mask sensitive information in logs
- Regular security audits

### Rate Limiting

- 100 requests per minute per user
- 1000 requests per minute per IP
- 10,000 requests per day per API key

## Best Practices

### For Tenants

1. Provide clear descriptions of issues
2. Include photos when possible
3. Be specific about location and access
4. Update request status when issues are resolved
5. Provide feedback after completion

### For Staff

1. Acknowledge requests promptly
2. Set realistic timeframes
3. Document all work performed
4. Update status regularly
5. Follow up with tenants after completion

### For Vendors

1. Arrive on time for scheduled appointments
2. Document work with before/after photos
3. Provide detailed invoices
4. Follow up on warranty work
5. Maintain professional communication

## Dependencies

### Internal Services

- Authentication Service
- Property Management Service
- User Management Service
- Notification Service
- Document Storage Service

### External Services

- Cloud Storage (AWS S3, Google Cloud Storage)
- Email Service (SendGrid, AWS SES)
- SMS Gateway (Twilio, Africa's Talking)
- Payment Processor (Stripe, M-Pesa)
- Maps & Geocoding (Google Maps, Mapbox)

## Monitoring & Alerts

### Key Metrics

- Average response time
- Resolution time by category
- Vendor performance
- Recurring issues
- Cost per maintenance request

### Alerting

- High-priority requests
- Overdue work orders
- SLA breaches
- System errors
- Suspicious activity

## Troubleshooting

### Common Issues

1. **Request not appearing in system**
   - Verify authentication
   - Check for validation errors in the request
   - Confirm proper permissions

2. **Work order assignment issues**
   - Verify vendor availability
   - Check for scheduling conflicts
   - Confirm vendor has required skills

3. **Notification problems**
   - Check notification settings
   - Verify contact information
   - Review email/SMS delivery logs

## Support

For support, please contact:

- Email: <support@kaa-saas.com>
- Phone: +254 700 000000
- Help Center: <https://help.kaa-saas.com/maintenance>
- API Documentation: <https://docs.kaa-saas.com/api/maintenance>

## Versioning

This API follows [Semantic Versioning 2.0.0](https://semver.org/).

## Changelog

### [1.0.0] - 2025-05-28

#### Added

- Initial release of Maintenance Management module
- Support for maintenance requests and work orders
- Vendor management functionality
- Preventative maintenance scheduling
- Comprehensive API documentation

## Contributing

We welcome contributions to improve the Maintenance module. Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

Proprietary - All rights reserved © 2025 KAA SaaS Solutions

## Acknowledgments

- Thanks to all contributors who have helped improve the Maintenance module
- Special thanks to our beta testers for their valuable feedback
- Built with ❤️ by the KAA SaaS Team
- Help Center: <https://help.kaa-saas.com>

## License

Proprietary - All rights reserved © 2025 KAA SaaS Solutions
