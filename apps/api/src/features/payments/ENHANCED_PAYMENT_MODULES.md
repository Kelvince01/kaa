# Enhanced Payment Modules - Mpesa & Stripe

This document describes the enhanced implementation of the Mpesa and Stripe payment sub-modules within the KAA SaaS platform.

## Overview

The payment system has been significantly enhanced to provide comprehensive support for both M-Pesa mobile money payments and Stripe card payments, with additional functionality for payment management, webhooks, and error handling.

## Mpesa Sub-Module Enhancements

### New Services Added

1. **Account Balance Check** (`checkAccountBalance`)
   - Query the current M-Pesa account balance
   - Admin-only functionality for financial oversight

2. **Transaction Status Query** (`queryTransactionStatus`)
   - Check the status of any M-Pesa transaction
   - Uses originatorConversationId and conversationId for tracking

3. **Transaction Reversal** (`reverseTransaction`)
   - Reverse completed M-Pesa transactions
   - Admin-only with proper authorization checks

4. **URL Registration** (`registerUrls`)
   - Register validation and confirmation URLs for C2B transactions
   - Essential for setting up M-Pesa webhook endpoints

5. **Enhanced B2C Payments** (`initiateB2CTransaction`)
   - Support for multiple command types (BusinessPayment, SalaryPayment, PromotionPayment)
   - Better validation and error handling
   - Landlord and admin access levels

6. **B2B Payments** (`initiateB2BTransaction`)
   - Business-to-business transactions
   - Support for BusinessToBusinessTransfer, BusinessPayBill, BusinessBuyGoods
   - Admin-only functionality

### API Endpoints

| Method | Endpoint | Description | Access Level |
|--------|----------|-------------|--------------|
| POST | `/payments/mpesa/initiate` | Initiate M-Pesa payment | Tenant/Admin |
| POST | `/payments/mpesa/callback` | Handle M-Pesa callbacks | Public |
| POST | `/payments/mpesa/verify` | Verify payment status | Tenant/Admin |
| POST | `/payments/mpesa/b2c` | Business to customer payment | Landlord/Admin |
| POST | `/payments/mpesa/b2b` | Business to business payment | Admin |
| POST | `/payments/mpesa/reverse` | Reverse transaction | Admin |
| GET | `/payments/mpesa/balance` | Check account balance | Admin |
| POST | `/payments/mpesa/query-status` | Query transaction status | Tenant/Admin |
| POST | `/payments/mpesa/register-urls` | Register callback URLs | Admin |

### Enhanced Features

- **Better Error Handling**: Comprehensive error codes and messages
- **Phone Number Validation**: Automatic formatting and validation
- **Security**: Role-based access control for sensitive operations
- **Callback Processing**: Robust webhook handling with proper status updates
- **Transaction Tracking**: Complete audit trail for all M-Pesa operations

## Stripe Sub-Module Enhancements

### New Services Added

1. **Setup Intents** (`createSetupIntent`)
   - Save payment methods for future use
   - Support for recurring payments and subscriptions

2. **Payment Method Management**
   - List customer payment methods (`getCustomerPaymentMethods`)
   - Detach payment methods (`detachPaymentMethod`)
   - Automatic customer creation and management

3. **Advanced Payment Controls**
   - Confirm payment intents server-side (`confirmPaymentIntent`)
   - Cancel payment intents (`cancelPaymentIntent`)
   - Retrieve payment intent details (`getPaymentIntent`)

4. **Enhanced Refund System** (`createRefund`)
   - Full and partial refunds
   - Proper authorization checks
   - Metadata tracking for audit trails

5. **Customer Management**
   - Get customer details (`getCustomer`)
   - Update customer information (`updateCustomer`)
   - Automatic Stripe customer creation for tenants

6. **Enhanced Webhook Handling**
   - Support for additional events (disputes, refunds, cancellations)
   - Payment method attachment events
   - Better error logging and handling

### API Endpoints

| Method | Endpoint | Description | Access Level |
|--------|----------|-------------|--------------|
| POST | `/payments/stripe/payment-intent` | Create payment intent | Tenant |
| POST | `/payments/stripe/webhook` | Handle Stripe webhooks | Public |
| GET | `/payments/stripe/:paymentIntentId` | Get payment details | Tenant/Landlord/Admin |
| POST | `/payments/stripe/refund` | Process refunds | Landlord/Admin |
| POST | `/payments/stripe/setup-intent` | Create setup intent | Tenant |
| GET | `/payments/stripe/payment-methods` | List payment methods | Tenant |
| DELETE | `/payments/stripe/payment-methods/:id` | Remove payment method | Tenant |
| POST | `/payments/stripe/confirm/:id` | Confirm payment intent | Tenant |
| POST | `/payments/stripe/cancel/:id` | Cancel payment intent | Tenant |

### Enhanced Webhook Events

The system now handles the following Stripe webhook events:

- `payment_intent.succeeded` - Successful payments
- `payment_intent.payment_failed` - Failed payments
- `payment_intent.canceled` - Canceled payments
- `charge.dispute.created` - Payment disputes
- `charge.refunded` - Refund notifications
- `payment_method.attached` - New payment methods
- Subscription events (placeholder for future implementation)

## Security Enhancements

### Role-Based Access Control

1. **Admin Access**
   - All M-Pesa administrative functions
   - Account balance checks
   - Transaction reversals
   - B2B payments
   - URL registration

2. **Landlord Access**
   - B2C payments (refunds, payouts)
   - Refund processing
   - Property-specific payment management

3. **Tenant Access**
   - Payment initiation
   - Payment method management
   - Payment status verification
   - Personal payment history

### Data Protection

- Sensitive payment data is properly masked
- Webhook signatures are verified
- Payment method tokenization
- Secure customer data handling

## Error Handling

### M-Pesa Error Codes

Comprehensive mapping of M-Pesa error codes to human-readable messages:
- Network and connectivity errors
- Insufficient funds notifications
- Invalid transaction errors
- Business logic validations

### Stripe Error Handling

- Webhook signature validation
- Payment intent status checks
- Customer authorization verification
- Proper error logging and monitoring

## Configuration Requirements

### Environment Variables

#### M-Pesa Configuration
```env
MPESA_CONSUMER_KEY=your_consumer_key
MPESA_CONSUMER_SECRET=your_consumer_secret
MPESA_PASSKEY=your_passkey
MPESA_SHORTCODE=your_shortcode
MPESA_INITIATOR_NAME=your_initiator_name
MPESA_SECURITY_CREDENTIAL=your_security_credential
MPESA_ENVIRONMENT=sandbox|production
```

#### Stripe Configuration
```env
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_webhook_secret
STRIPE_API_VERSION=2022-11-15
```

## Usage Examples

### M-Pesa Payment Flow

```typescript
// 1. Initiate payment
const payment = await fetch('/payments/mpesa/initiate', {
  method: 'POST',
  body: JSON.stringify({
    bookingId: 'booking_123',
    phoneNumber: '0712345678',
    amount: 1000,
    paymentMethod: 'mpesa',
    paymentType: 'rent'
  })
});

// 2. Verify payment status
const verification = await fetch('/payments/mpesa/verify', {
  method: 'POST',
  body: JSON.stringify({
    checkoutRequestID: 'ws_CO_123456789'
  })
});
```

### Stripe Payment Flow

```typescript
// 1. Create payment intent
const intent = await fetch('/payments/stripe/payment-intent', {
  method: 'POST',
  body: JSON.stringify({
    propertyId: 'property_123',
    paymentType: 'deposit',
    description: 'Security deposit payment'
  })
});

// 2. Setup future payments
const setupIntent = await fetch('/payments/stripe/setup-intent', {
  method: 'POST',
  body: JSON.stringify({
    paymentMethodTypes: ['card']
  })
});
```

## Database Schema Updates

### Payment Model Enhancements

The payment model includes additional fields for:
- Enhanced tracking and reconciliation
- AI insights for payment predictions
- Partial payment support
- Late payment penalties
- Automated reminder systems

### M-Pesa Transaction Model

Comprehensive tracking of:
- M-Pesa specific transaction data
- Callback metadata
- Processing status and timestamps
- Error handling and retry logic

## Monitoring and Analytics

### Payment Metrics

- Success/failure rates by payment method
- Transaction volume and value tracking
- Customer payment behavior analysis
- Fraud detection and prevention

### Webhook Monitoring

- Webhook delivery success rates
- Processing time metrics
- Error rate monitoring
- Retry logic performance

## Testing

### Test Scenarios

1. **M-Pesa Testing**
   - STK Push simulations
   - Callback processing
   - Transaction status queries
   - Error condition handling

2. **Stripe Testing**
   - Payment intent creation
   - Webhook event simulation
   - Refund processing
   - Payment method management

### Test Data

- Sandbox credentials configuration
- Test card numbers and phone numbers
- Mock webhook payloads
- Error scenario test cases

## Deployment Considerations

### Infrastructure Requirements

- Webhook endpoint security (HTTPS)
- Database transaction handling
- Queue processing for callbacks
- Monitoring and alerting setup

### Production Checklist

- [ ] Webhook URLs registered with providers
- [ ] SSL certificates configured
- [ ] Environment variables set
- [ ] Database migrations applied
- [ ] Monitoring dashboards configured
- [ ] Error alerting setup
- [ ] Backup and recovery procedures

## Future Enhancements

### Planned Features

1. **Subscription Management**
   - Recurring payment setup
   - Subscription lifecycle management
   - Dunning management

2. **Advanced Analytics**
   - Payment prediction models
   - Risk scoring
   - Customer lifetime value calculation

3. **Multi-Currency Support**
   - Dynamic currency conversion
   - Regional payment methods
   - Localized payment experiences

4. **Enhanced Security**
   - 3D Secure implementation
   - Fraud detection algorithms
   - PCI compliance improvements

## Support and Troubleshooting

### Common Issues

1. **M-Pesa Callback Issues**
   - Webhook URL validation
   - Firewall and security settings
   - Callback data validation

2. **Stripe Integration Issues**
   - Webhook signature verification
   - Payment intent status handling
   - Customer ID management

### Debug Tools

- Payment transaction logs
- Webhook payload inspection
- Error tracking and reporting
- Performance monitoring

## Conclusion

The enhanced payment modules provide a robust, secure, and scalable foundation for handling payments in the KAA SaaS platform. With comprehensive support for both M-Pesa and Stripe, the system can handle various payment scenarios while maintaining security, reliability, and user experience standards.

For technical support or questions about implementation, please refer to the individual service documentation or contact the development team.
