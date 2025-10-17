# Payments System

This module handles all payment processing for the application, including M-Pesa mobile money payments and Stripe credit card payments. It provides a unified interface for processing transactions, handling webhooks, and managing payment methods.

## Features

- **Multiple Payment Methods**
  - M-Pesa Mobile Money
  - Credit/Debit Cards (via Stripe)
  - Bank Transfers
  - Payment Links

- **Payment Processing**
  - One-time payments
  - Recurring payments (subscriptions)
  - Payment splitting
  - Partial payments
  - Payment receipts and invoices

- **Security**
  - PCI-DSS compliant
  - Tokenized payment methods
  - Webhook verification
  - Idempotency key support

## Supported Payment Methods

### M-Pesa
- STK Push
- B2C (Business to Customer) payments
- B2B (Business to Business) payments
- Account Balance
- Transaction Status Query
- Reversal

### Stripe
- Credit/Debit Cards
- SEPA Direct Debit
- Apple Pay
- Google Pay
- SEPA Credit Transfer
- iDEAL
- Giropay
- Bancontact
- EPS
- P24
- Alipay
- WeChat Pay
- Klarna
- Affirm
- Afterpay / Clearpay

## API Endpoints

### Payments
- `POST /payments` - Create a new payment
- `GET /payments` - List all payments
- `GET /payments/:id` - Get payment details
- `POST /payments/:id/capture` - Capture an authorized payment
- `POST /payments/:id/refund` - Refund a payment
- `POST /payments/:id/void` - Void a payment
- `GET /payments/:id/receipt` - Get payment receipt

### M-Pesa Specific
- `POST /payments/mpesa/stk-push` - Initiate STK push
- `POST /payments/mpesa/query` - Query transaction status
- `POST /payments/mpesa/register-urls` - Register validation and confirmation URLs
- `POST /payments/mpesa/b2c` - Business to customer payment
- `POST /payments/mpesa/b2b` - Business to business payment

### Stripe Specific
- `POST /payments/stripe/create-payment-intent` - Create a payment intent
- `POST /payments/stripe/create-setup-intent` - Create a setup intent
- `GET /payments/stripe/payment-methods` - List saved payment methods
- `POST /payments/stripe/webhook` - Stripe webhook handler

### Payment Methods
- `POST /payment-methods` - Add a payment method
- `GET /payment-methods` - List payment methods
- `GET /payment-methods/:id` - Get payment method details
- `DELETE /payment-methods/:id` - Remove a payment method
- `POST /payment-methods/:id/set-default` - Set default payment method

## Configuration

### Environment Variables

#### M-Pesa
```
MPESA_CONSUMER_KEY=your_consumer_key
MPESA_CONSUMER_SECRET=your_consumer_secret
MPESA_PASSKEY=your_passkey
MPESA_SHORTCODE=your_shortcode
MPESA_INITIATOR_NAME=your_initiator_name
MPESA_SECURITY_CREDENTIAL=your_security_credential
MPESA_ACCOUNT_REFERENCE=your_account_reference
MPESA_TRANSACTION_DESC=your_transaction_desc
MPESA_ENVIRONMENT=sandbox|production
```

#### Stripe
```
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_webhook_secret
STRIPE_API_VERSION=2022-11-15
```

## Usage Examples

### Create a Payment
```typescript
const paymentData = {
  amount: 1000, // Amount in smallest currency unit (e.g., cents)
  currency: 'KES',
  paymentMethod: 'mpesa', // or 'stripe'
  paymentMethodId: 'pm_123456789', // Required for saved payment methods
  customer: {
    email: 'customer@example.com',
    phone: '+254712345678', // Required for M-Pesa
    name: 'John Doe'
  },
  description: 'Rent payment for June 2023',
  metadata: {
    propertyId: 'prop_123',
    unitId: 'unit_456',
    invoiceId: 'inv_789'
  }
};

const response = await fetch('/payments', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(paymentData)
});
```

### Handle M-Pesa Callback
```typescript
// Example webhook handler for M-Pesa callback
app.post('/api/payments/mpesa/callback', async (req, res) => {
  try {
    const callbackData = req.body;
    
    // Verify the callback is from M-Pesa
    if (isValidMpesaCallback(callbackData)) {
      // Process the payment status update
      await processMpesaPayment(callbackData);
      return res.status(200).json({ ResultCode: 0, ResultDesc: 'Success' });
    }
    
    res.status(400).json({ ResultCode: 1, ResultDesc: 'Invalid request' });
  } catch (error) {
    console.error('Error processing M-Pesa callback:', error);
    res.status(500).json({ ResultCode: 1, ResultDesc: 'Internal server error' });
  }
});
```

### Create a Stripe Payment Intent
```typescript
const paymentIntent = await fetch('/payments/stripe/create-payment-intent', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    amount: 1000,
    currency: 'usd',
    customer: 'cus_123456789',
    description: 'Rent payment',
    metadata: { invoiceId: 'inv_123' }
  })
});

// Use the client secret to confirm the payment on the client
const { clientSecret } = await paymentIntent.json();
```

## Webhooks

### M-Pesa Webhook Events
- `mpesa.payment.received` - Payment received
- `mpesa.payment.failed` - Payment failed
- `mpesa.payment.reversed` - Payment reversed
- `mpesa.payment.timeout` - Payment timed out

### Stripe Webhook Events
- `payment_intent.succeeded`
- `payment_intent.payment_failed`
- `charge.refunded`
- `customer.subscription.created`
- `invoice.payment_succeeded`
- `invoice.payment_failed`

## Error Handling

All error responses follow this format:
```json
{
  "success": false,
  "code": "PAYMENT_ERROR_CODE",
  "message": "Human-readable error message",
  "details": {
    // Additional error details
  }
}
```

Common error codes:
- `PAYMENT_FAILED`
- `INSUFFICIENT_FUNDS`
- `CARD_DECLINED`
- `INVALID_PAYMENT_METHOD`
- `PROCESSOR_ERROR`
- `WEBHOOK_SIGNATURE_VERIFICATION_FAILED`

## Testing

Run tests with:
```bash
npm test payments
```

### Test Cards (Stripe)
- Success: 4242 4242 4242 4242
- Requires authentication: 4000 0025 0000 3155
- Insufficient funds: 4000 0000 0000 9995
- Lost card: 4000 0000 0000 9987
- Stolen card: 4000 0000 0000 9979

### Test Phone Numbers (M-Pesa Sandbox)
- 254708374149
- 254708374150
- 254708374151

## Dependencies

- `stripe` - Stripe Node.js library
- `axios` - HTTP client for M-Pesa API calls
- `crypto` - For security credential generation (M-Pesa)
- `jsonwebtoken` - For webhook verification
- `mongoose` - For data modeling and database operations

## Security Considerations

- Always use HTTPS in production
- Never expose API keys in client-side code
- Implement proper webhook signature verification
- Store sensitive data securely using environment variables
- Follow PCI compliance guidelines when handling credit card data
- Implement rate limiting on payment endpoints
- Keep dependencies updated to the latest secure versions
