# Contract Management System

A comprehensive, refactored contract management system for rental property management, built with clean architecture principles and modern best practices.

## 🏗️ Architecture Overview

The contract system has been completely refactored with a focus on:
- **Separation of Concerns**: Clear separation between HTTP handling, business logic, and data persistence
- **Service-Oriented Design**: Modular services for different aspects of contract management
- **Type Safety**: Comprehensive TypeScript interfaces and validation
- **Error Handling**: Centralized error handling with proper error types
- **Testability**: Clean interfaces that are easy to mock and test

## 📁 Directory Structure

```
src/contracts/
├── contract.controller.ts          # HTTP route handlers
├── contract.model.ts               # MongoDB schema
├── contract.type.ts                # TypeScript interfaces
├── contract.validator.ts           # Input validation schemas
├── services/
│   ├── contract.service.ts         # Core business logic
│   └── contract.pdf.service.ts     # PDF generation service
├── utils/
│   ├── contract.helpers.ts         # Helper functions & utilities
│   ├── contract.templates.ts       # Contract templates & terms
│   └── contract.errors.ts          # Error classes & handling
└── README.md                       # This file
```

## ✨ Key Features

### Contract Lifecycle Management
- **Draft → Pending → Active → Terminated/Expired** status flow
- Automatic status transitions based on signatures and dates
- Comprehensive audit trail for all changes

### Digital Signatures
- Multiple signature types: digital, electronic, wet signatures
- IP address and user agent tracking for security
- Witness signature support for legal compliance

### PDF Generation
- Professional contract documents with Kenyan legal format
- Customizable templates (standard, furnished, commercial)
- Watermarking for draft documents
- Amendment document generation

### Advanced Validation
- Date range validation with business rules
- Overlap detection for unit bookings
- Comprehensive input validation with detailed error messages
- Custom validation rules for rental amounts and terms

### Error Handling
- Typed error classes for different error scenarios
- Centralized error handling with proper HTTP status codes
- Detailed error context for debugging and monitoring

## 🔧 Services

### ContractService
Core business logic service that handles:
- Contract creation and validation
- Status management and transitions
- Permission checking and authorization
- Database operations with proper error handling

```typescript
import { contractService } from './services/contract.service';

// Create a new contract
const contract = await contractService.createContract({
  propertyId: 'property_id',
  tenantIds: ['tenant_id_1', 'tenant_id_2'],
  startDate: '2025-06-01',
  endDate: '2026-05-31',
  rentAmount: 1500,
  userId: 'user_id'
});
```

### ContractPDFService
Dedicated PDF generation service that provides:
- Professional contract document generation
- Multiple template support
- Amendment document creation
- Watermarking and signature placement

```typescript
import { contractPDFService } from './services/contract.pdf.service';

// Generate contract PDF
const pdfResult = await contractPDFService.generateContractPDF({
  property: propertyData,
  tenants: tenantData,
  startDate: '2025-06-01',
  endDate: '2026-05-31',
  rentAmount: 1500,
  // ... other contract data
});
```

## 🛡️ Error Handling

The system includes comprehensive error handling with typed error classes:

```typescript
// Contract-specific errors
ContractValidationError    // Input validation failures
ContractNotFoundError      // Contract not found
ContractOverlapError       // Date/unit conflicts
ContractAuthorizationError // Permission issues
ContractStatusError        // Invalid status transitions
ContractPDFError          // PDF generation failures
```

Each error includes:
- Descriptive error messages
- Appropriate HTTP status codes
- Detailed context for debugging
- Structured error responses

## 📋 API Endpoints

### Contract Management
```http
POST   /contracts                    # Create new contract
GET    /contracts                    # List contracts (with filtering)
GET    /contracts/:id                # Get contract details
PATCH  /contracts/:id                # Update contract
DELETE /contracts/:id                # Delete contract (soft delete)
```

### Contract Operations
```http
POST   /contracts/:id/sign           # Sign contract
POST   /contracts/:id/terminate      # Terminate contract
POST   /contracts/:id/documents      # Upload documents
GET    /contracts/property/:id       # Get contracts by property
```

### Utility Endpoints
```http
GET    /contracts/health             # Health check
GET    /contracts/stats/summary      # Contract statistics
```

## 🎯 Usage Examples

### Creating a Contract
```typescript
const contractData = {
  propertyId: "507f1f77bcf86cd799439011",
  tenantIds: ["507f1f77bcf86cd799439012"],
  startDate: "2025-06-01",
  endDate: "2026-05-31",
  rentAmount: 1500,
  depositAmount: 1500,
  rentDueDate: 1,
  waterBill: "Included",
  electricityBill: "Tenant pays",
  petsAllowed: false,
  smokingAllowed: false,
  sublettingAllowed: false,
  terms: [
    {
      title: "ADDITIONAL TERMS",
      content: "No loud music after 10 PM"
    }
  ],
  specialConditions: ["Property to be cleaned weekly"]
};

const response = await fetch('/contracts', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(contractData)
});
```

### Signing a Contract
```typescript
const signatureData = {
  signatureType: "digital",
  signatureData: "base64_encoded_signature_data",
  witnessName: "John Witness",
  witnessSignature: "base64_encoded_witness_signature"
};

await fetch('/contracts/contract_id/sign', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(signatureData)
});
```

### Querying Contracts
```typescript
const params = new URLSearchParams({
  status: 'ACTIVE',
  startDateFrom: '2025-01-01',
  startDateTo: '2025-12-31',
  sortBy: 'createdAt',
  sortOrder: 'desc',
  limit: '10',
  page: '1'
});

const contracts = await fetch(`/contracts?${params}`);
```

## 🔒 Security Features

### Authorization
- Role-based access control integration
- Resource-level permissions (landlords can only access their contracts)
- Admin override capabilities

### Signature Security
- IP address and user agent tracking
- Cryptographic signature verification
- Witness signature support for legal compliance

### Data Protection
- Soft deletion for audit compliance
- Comprehensive audit logging
- File access controls

## 🧪 Testing

### Unit Tests
```bash
# Run contract service tests
npm test -- --grep "ContractService"

# Run PDF service tests
npm test -- --grep "ContractPDFService"

# Run validation tests
npm test -- --grep "ContractValidator"
```

### Integration Tests
```bash
# Run contract API tests
npm test -- --grep "Contract API"

# Run end-to-end contract flow tests
npm test -- --grep "Contract E2E"
```

## ⚙️ Configuration

### Environment Variables
```bash
# File upload settings
CONTRACT_UPLOAD_DIR=uploads/contracts
CONTRACT_MAX_FILE_SIZE=10485760  # 10MB

# PDF generation settings
CONTRACT_PDF_WATERMARK=true
CONTRACT_PDF_SIGNATURES=true

# Notification settings
CONTRACT_ENABLE_REMINDERS=true
CONTRACT_REMINDER_DAYS=30,7,1
```

### Template Configuration
```typescript
// Customize contract templates
const customTemplate = {
  name: "Custom Furnished Template",
  type: "furnished",
  terms: [
    {
      title: "FURNITURE INVENTORY",
      content: "All furniture items are listed in the attached inventory..."
    }
  ]
};
```

## 🔄 Migration from Legacy System

### Database Migration
```bash
# Run migration scripts
npm run migrate:contracts:up

# Rollback if needed
npm run migrate:contracts:down
```

### API Changes
- All endpoints now use consistent response format
- Error responses include detailed error codes
- Pagination is now standardized across all list endpoints

### Breaking Changes
- Contract status values are now UPPERCASE
- Date formats are now ISO 8601 strings
- Some field names have been updated for consistency

## 📊 Monitoring & Logging

### Structured Logging
```typescript
// Contract operations are logged with context
{
  "level": "info",
  "message": "Contract created",
  "contractId": "507f1f77bcf86cd799439011",
  "userId": "507f1f77bcf86cd799439012",
  "propertyId": "507f1f77bcf86cd799439013",
  "action": "contract_created",
  "timestamp": "2025-01-15T10:30:00Z"
}
```

### Health Checks
```http
GET /contracts/health
```

Returns service health status and dependencies.

## 🚀 Performance Optimizations

### Database Indexing
- Compound indexes for common query patterns
- Text indexes for search functionality
- Proper indexing for date range queries

### Caching Strategy
- Template caching for PDF generation
- Query result caching for frequently accessed data
- File system caching for generated PDFs

### Pagination
- Cursor-based pagination for large datasets
- Configurable page sizes with reasonable defaults
- Total count optimization for better UX

## 🤝 Contributing

### Code Style
- Follow TypeScript strict mode
- Use ESLint and Prettier for consistent formatting
- Include JSDoc comments for public APIs

### Testing Requirements
- Unit tests for all business logic
- Integration tests for API endpoints
- Error case coverage for all service methods

### Documentation
- Update API documentation for any endpoint changes
- Include usage examples for new features
- Update type definitions for schema changes

## 📞 Support

For questions or issues:
1. Check the [API documentation](../docs/api.md)
2. Review the [troubleshooting guide](../docs/troubleshooting.md)
3. Contact the development team

## 📄 License

This contract management system is part of the KAA SaaS platform and is proprietary software.