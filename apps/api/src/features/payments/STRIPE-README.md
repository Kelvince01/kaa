# Stripe Integration Module

## Overview

The Stripe module provides seamless integration with Stripe's payment processing platform, enabling credit card payments, subscriptions, and other financial transactions within the KAA SaaS platform.

## Features

### Payment Processing

- Credit & Debit Card payments
- SEPA Direct Debit
- Alipay
- Apple Pay
- Google Pay
- Payment Intents API
- Setup Intents API
- Payment Methods API

### Billing & Subscriptions

- Recurring billing
- Multiple pricing models
- Prorations
- Free trials
- Coupons & discounts
- Invoicing

### Business Operations

- Payouts
- Transfers
- Refunds
- Disputes
- Reporting
- Tax calculation

## Data Models

### StripeCustomer

```typescript
{
  _id: ObjectId,
  userId: ObjectId,
  customerId: string, // Stripe Customer ID
  email: string,
  name: string,
  phone: string,
  address: {
    line1: string,
    line2: string,
    city: string,
    state: string,
    postal_code: string,
    country: string
  },
  metadata: Record<string, any>,
  defaultPaymentMethod: string,
  invoiceSettings: {
    defaultPaymentMethod: string,
    customFields: any[],
    footer: string
  },
  tax: {
    ipAddress: string,
    taxId: string,
    type: string
  },
  created: Date,
  updatedAt: Date
}
```

### StripePaymentIntent

```typescript
{
  _id: ObjectId,
  paymentIntentId: string,
  amount: number,
  currency: string,
  status: 'requires_payment_method' | 'requires_confirmation' | 'requires_action' | 'processing' | 'requires_capture' | 'canceled' | 'succeeded',
  clientSecret: string,
  customer: ObjectId,
  paymentMethod: string,
  paymentMethodTypes: string[],
  metadata: Record<string, any>,
  charges: Array<{
    id: string,
    amount: number,
    amountRefunded: number,
    captured: boolean,
    created: Date,
    currency: string,
    paid: boolean,
    paymentMethod: string,
    receiptUrl: string,
    status: 'succeeded' | 'pending' | 'failed'
  }>,
  lastPaymentError: {
    code: string,
    declineCode: string,
    docUrl: string,
    message: string,
    paymentMethod: any,
    type: string
  },
  createdAt: Date,
  updatedAt: Date
}
```

## API Endpoints

### Customers

- `POST /api/stripe/customers` - Create a customer
- `GET /api/stripe/customers/:id` - Get customer
- `PUT /api/stripe/customers/:id` - Update customer
- `DELETE /api/stripe/customers/:id` - Delete customer
- `GET /api/stripe/customers/:id/payment-methods` - List payment methods

### Payment Intents

- `POST /api/stripe/payment-intents` - Create payment intent
- `GET /api/stripe/payment-intents/:id` - Get payment intent
- `POST /api/stripe/payment-intents/:id/confirm` - Confirm payment intent
- `POST /api/stripe/payment-intents/:id/capture` - Capture payment intent
- `POST /api/stripe/payment-intents/:id/cancel` - Cancel payment intent

### Payment Methods

- `POST /api/stripe/payment-methods` - Create payment method
- `GET /api/stripe/payment-methods/:id` - Get payment method
- `POST /api/stripe/payment-methods/:id/attach` - Attach to customer
- `POST /api/stripe/payment-methods/:id/detach` - Detach from customer
- `GET /api/stripe/customers/:customerId/payment-methods` - List customer's payment methods

### Webhooks

- `POST /api/stripe/webhooks` - Stripe webhook endpoint

## Usage Examples

### Create a Payment Intent

```typescript
const paymentIntent = {
  amount: 1000, // in smallest currency unit (e.g., cents)
  currency: 'usd',
  customer: 'cus_123',
  paymentMethod: 'pm_123',
  confirm: true,
  offSession: false,
  metadata: {
    orderId: 'order_123',
    userId: 'user_456'
  }
};

const response = await fetch('/api/stripe/payment-intents', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify(paymentIntent)
});

const result = await response.json();
```

### Handle Webhook Events

```javascript
// Example webhook handler
app.post('/api/stripe/webhooks', 
  bodyParser.raw({type: 'application/json'}),
  async (req, res) => {
    const sig = req.headers['stripe-signature'];
    
    try {
      const event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );

      // Handle the event
      switch (event.type) {
        case 'payment_intent.succeeded':
          const paymentIntent = event.data.object;
          await handlePaymentIntentSucceeded(paymentIntent);
          break;
        case 'payment_method.attached':
          const paymentMethod = event.data.object;
          await handlePaymentMethodAttached(paymentMethod);
          break;
        // ... handle other event types
        default:
          console.log(`Unhandled event type ${event.type}`);
      }

      res.json({received: true});
    } catch (err) {
      console.error(`Webhook Error: ${err.message}`);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }
  }
);
```

## Configuration

### Environment Variables

```env
# Stripe API Keys
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_API_VERSION=2022-11-15

# Currency & Formatting
DEFAULT_CURRENCY=usd
CURRENCY_DECIMALS=2

# Webhook Configuration
WEBHOOK_ENDPOINT_SECRET=whsec_...
WEBHOOK_TIMEOUT=20000

# Test Cards
# Success: 4242424242424242
# Requires Authentication: 4000002500003155
# Decline: 4000000000000002
```

## Security Considerations

- Never expose secret keys in client-side code
- Use HTTPS for all API requests
- Verify webhook signatures
- Implement proper error handling
- Comply with PCI DSS requirements
- Use Stripe Elements or Stripe.js for secure card collection

## Testing

### Test Cards

- Success: 4242424242424242
- Requires Authentication: 4000002500003155
- Decline: 4000000000000002
- 3D Secure 2: 4000002500003155

### Test Webhooks

Use the Stripe CLI to test webhooks locally:

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhooks
```

## Dependencies

- stripe (Stpe Node.js library)
- @stripe/stripe-js (Stripe.js for client-side)
- @stripe/react-stripe-js (React components)
- uuid (unique identifiers)

## Support

For support, please contact:

- Email: <stripe-support@kaa-saas.com>
- Phone: +254 700 000000

## License

Proprietary - All rights reserved © 2025 KAA SaaS Solutions
