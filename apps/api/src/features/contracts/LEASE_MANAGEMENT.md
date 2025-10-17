# Advanced Lease Management System

A comprehensive lease management system with advanced features for contract renewals, amendments, and automated workflows.

## 🚀 Features Implemented

### 1. **Contract Renewals**
- **Automated Renewal Detection**: Identifies contracts eligible for renewal based on expiry dates
- **Renewal Request Creation**: Allows landlords and tenants to create renewal requests
- **Approval Workflow**: Multi-step approval process for renewal requests
- **Auto-Renewal Support**: Configurable automatic renewals with customizable terms
- **Renewal Notifications**: Automated reminders at 90, 60, 30, 7, and 1 days before expiry

### 2. **Contract Amendments**
- **Field-Level Amendments**: Modify specific contract terms (rent, deposit, utilities, rules)
- **Amendment Approval Workflow**: Requires approval before changes are applied
- **Amendment History**: Complete audit trail of all contract modifications
- **Bulk Amendments**: Support for multiple field changes in a single amendment
- **Amendment Templates**: Pre-defined amendment types for common changes

### 3. **Advanced Lease Terms Management**
- **Custom Terms**: Support for custom contract clauses and conditions
- **Term Categories**: Organized terms by category (financial, property rules, utilities)
- **Mandatory vs Optional Terms**: Distinction between required and optional clauses
- **Term Versioning**: Track changes to terms over time
- **Template Management**: Reusable term templates for different property types

### 4. **Automated Notifications**
- **Renewal Reminders**: Multi-stage reminder system for expiring contracts
- **Amendment Notifications**: Alerts for amendment approvals/rejections
- **Signing Reminders**: Automated reminders for pending contract signatures
- **Expiration Alerts**: Notifications when contracts expire
- **Custom Notification Templates**: Personalized email templates with urgency levels

### 5. **Cron Job Automation**
- **Daily Renewal Processing**: Automated processing of renewal eligibility
- **Auto-Renewal Execution**: Automatic creation of renewal contracts
- **Contract Expiration Handling**: Automatic status updates for expired contracts
- **Cleanup Tasks**: Automated cleanup of old contracts and temporary files
- **Notification Scheduling**: Scheduled sending of renewal and amendment notifications

## 📁 File Structure

```
src/properties/contracts/
├── services/
│   ├── contract.service.ts              # Core contract business logic
│   ├── contract-renewal.service.ts      # Renewal management
│   ├── contract-amendment.service.ts    # Amendment management
│   ├── contract-notification.service.ts # Notification system
│   ├── contract-cron.service.ts         # Automated tasks
│   ├── contract-signing.service.ts      # Digital signatures
│   └── contract.pdf.service.ts          # PDF generation
├── utils/
│   ├── contract.helpers.ts              # Utility functions
│   ├── contract.templates.ts            # Contract templates
│   └── contract.errors.ts               # Error handling
├── contract.controller.ts               # API endpoints
├── contract.model.ts                    # Database schema
├── contract.type.ts                     # TypeScript interfaces
├── contract.validator.ts                # Input validation
└── README.md                            # Service documentation
```

## 🔧 API Endpoints

### Contract Management
```http
POST   /contracts                    # Create new contract
GET    /contracts                    # List contracts (with filtering)
GET    /contracts/:id                # Get contract details
PATCH  /contracts/:id                # Update contract
DELETE /contracts/:id                # Delete contract (soft delete)
POST   /contracts/:id/sign           # Sign contract
POST   /contracts/:id/terminate      # Terminate contract
```

### Renewal Management
```http
POST   /contracts/:id/renew          # Create renewal request
GET    /contracts/renewals/eligible  # Get contracts eligible for renewal
POST   /contracts/:id/renew/approve  # Approve renewal request
```

### Amendment Management
```http
POST   /contracts/:id/amend          # Create amendment request
GET    /contracts/amendments/pending # Get pending amendments
POST   /contracts/amendments/:id/approve # Approve/reject amendment
GET    /contracts/:id/amendments     # Get amendment history
DELETE /contracts/:id/amendments/:id # Cancel amendment
```

## 🎯 Usage Examples

### Creating a Renewal Request

```typescript
const renewalData = {
  newStartDate: "2025-06-01",
  newEndDate: "2026-05-31",
  newRentAmount: 1650, // 10% increase
  newDepositAmount: 1650,
  renewalNotes: "Annual renewal with rent adjustment",
  autoRenewal: false
};

const response = await fetch('/contracts/contract_id/renew', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(renewalData)
});
```

### Creating an Amendment Request

```typescript
const amendmentData = {
  amendmentReason: "Rent increase due to market conditions",
  changes: [
    {
      field: "rentAmount",
      oldValue: "1500",
      newValue: "1650",
      description: "10% rent increase"
    },
    {
      field: "petsAllowed",
      oldValue: "false",
      newValue: "true",
      description: "Allow pets with additional deposit"
    }
  ],
  effectiveDate: "2025-03-01",
  requiresApproval: true,
  notes: "Market adjustment and policy update"
};

const response = await fetch('/contracts/contract_id/amend', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(amendmentData)
});
```

## 🔄 Automated Workflows

### Renewal Reminder Schedule
- **90 days**: Initial renewal notice
- **60 days**: Follow-up reminder
- **30 days**: Urgent renewal notice
- **7 days**: Final renewal warning
- **1 day**: Last chance notification

### Auto-Renewal Process
1. **Eligibility Check**: Verify contract allows auto-renewal
2. **Terms Calculation**: Apply rent increases and term updates
3. **Contract Creation**: Generate new contract with updated terms
4. **Notification**: Inform all parties of auto-renewal
5. **Status Update**: Link original contract to renewal

### Amendment Workflow
1. **Request Creation**: User submits amendment request
2. **Validation**: System validates proposed changes
3. **Approval Process**: Route to appropriate approver
4. **Application**: Apply approved changes to contract
5. **Notification**: Inform all parties of changes
6. **Audit Trail**: Record all changes in amendment history

## 📊 Dashboard Features

### Lease Management Widget
- **Active Contracts**: Total number of active leases
- **Expiring Contracts**: Contracts expiring in next 30 days
- **Pending Renewals**: Renewal requests awaiting approval
- **Pending Amendments**: Amendment requests awaiting approval
- **Financial Summary**: Total and average rent amounts
- **Renewal Rate**: Historical renewal success rate

### Renewal Management Dashboard
- **Eligible Contracts**: List of contracts eligible for renewal
- **Renewal Status**: Track renewal request status
- **Bulk Actions**: Process multiple renewals simultaneously
- **Renewal Calendar**: Visual timeline of upcoming expirations

### Amendment Management Dashboard
- **Amendment Requests**: List of pending amendment requests
- **Amendment History**: Complete audit trail per contract
- **Bulk Approval**: Process multiple amendments at once
- **Amendment Templates**: Quick access to common amendments

## 🔐 Security Features

### Authorization
- **Role-Based Access**: Different permissions for landlords, tenants, and admins
- **Resource-Level Security**: Users can only access their own contracts
- **Amendment Permissions**: Restrict who can create/approve amendments
- **Audit Logging**: Complete audit trail of all actions

### Data Protection
- **Soft Deletion**: Contracts are archived, not permanently deleted
- **Encryption**: Sensitive data encrypted at rest and in transit
- **Backup Integration**: Automated backups of contract data
- **GDPR Compliance**: Data retention and deletion policies

## 📈 Performance Optimizations

### Database Indexing
```javascript
// Compound indexes for common queries
{ property: 1, unit: 1, tenant: 1 }
{ landlord: 1, status: 1 }
{ startDate: 1, endDate: 1 }
{ status: 1, endDate: 1 } // For renewal eligibility
```

### Caching Strategy
- **Template Caching**: Contract templates cached in memory
- **Query Caching**: Frequently accessed data cached with Redis
- **PDF Caching**: Generated PDFs cached for reuse

### Background Processing
- **Queue System**: Heavy operations processed in background
- **Batch Processing**: Bulk operations handled efficiently
- **Rate Limiting**: Prevent system overload

## 🧪 Testing

### Unit Tests
```bash
# Test renewal service
npm test -- --grep "ContractRenewalService"

# Test amendment service
npm test -- --grep "ContractAmendmentService"

# Test notification service
npm test -- --grep "ContractNotificationService"
```

### Integration Tests
```bash
# Test renewal API endpoints
npm test -- --grep "Renewal API"

# Test amendment API endpoints
npm test -- --grep "Amendment API"
```

## 🚀 Deployment

### Environment Variables
```bash
# Notification settings
CONTRACT_ENABLE_REMINDERS=true
CONTRACT_REMINDER_DAYS=90,60,30,7,1

# Auto-renewal settings
CONTRACT_AUTO_RENEWAL_ENABLED=true
CONTRACT_AUTO_RENEWAL_NOTICE_DAYS=30

# File storage
CONTRACT_UPLOAD_DIR=uploads/contracts
CONTRACT_MAX_FILE_SIZE=10485760

# Email settings
EMAIL_SERVICE_PROVIDER=resend
EMAIL_FROM_ADDRESS=noreply@kaasaas.com
```

### Cron Job Configuration
The system automatically initializes cron jobs on startup:
- **Renewal Reminders**: Daily at 9:00 AM EAT
- **Auto-Renewals**: Daily at 2:00 AM EAT
- **Contract Expiration**: Daily at 1:00 AM EAT
- **Signing Reminders**: Daily at 10:00 AM EAT
- **Cleanup Tasks**: Weekly on Sunday at 3:00 AM EAT

## 📞 Support

### Monitoring
- **Health Checks**: `/contracts/health` endpoint
- **Metrics**: Prometheus metrics for monitoring
- **Logging**: Structured logging with correlation IDs
- **Alerts**: Automated alerts for system issues

### Troubleshooting
1. **Check Logs**: Review application logs for errors
2. **Verify Cron Jobs**: Ensure scheduled tasks are running
3. **Database Health**: Check database connectivity and performance
4. **Email Delivery**: Verify email service configuration

### Common Issues
- **Renewal Not Created**: Check contract eligibility and permissions
- **Amendment Not Applied**: Verify approval status and field validation
- **Notifications Not Sent**: Check email service configuration
- **Cron Jobs Not Running**: Verify system timezone and scheduling

## 🔄 Future Enhancements

### Planned Features
- **Mobile App Integration**: Native mobile app for contract management
- **AI-Powered Insights**: Predictive analytics for renewal likelihood
- **Integration APIs**: Connect with property management systems
- **Advanced Reporting**: Detailed analytics and reporting dashboard
- **Multi-Language Support**: Localization for different markets
- **Blockchain Integration**: Immutable contract records

### Scalability Improvements
- **Microservices Architecture**: Split into smaller, focused services
- **Event-Driven Architecture**: Use events for loose coupling
- **Horizontal Scaling**: Support for multiple application instances
- **Database Sharding**: Distribute data across multiple databases

This advanced lease management system provides a comprehensive solution for managing rental contracts with automated workflows, detailed tracking, and robust notification systems. The modular architecture ensures maintainability and scalability as the platform grows.