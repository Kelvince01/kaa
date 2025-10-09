# M-Pesa Integration Module

## Overview

The M-Pesa module provides seamless integration with Safaricom's M-Pesa mobile money service, enabling mobile payments, paybill, and till number transactions within the KAA SaaS platform.

## Features

### Payment Processing

- Lipa Na M-Pesa Online (STK Push)
- B2C payments
- B2B payments
- Account Balance
- Transaction Reversal
- Transaction Status Query

### Customer Experience

- STK Push for seamless payments
- USSD fallback
- Payment notifications
- Receipt generation

### Business Tools

- Paybill management
- Till number management
- Transaction reporting
- Settlement reconciliation

## Data Models

### MpesaTransaction

```typescript
{
  _id: ObjectId,
  transactionType: 'stk_push' | 'b2c' | 'b2b' | 'reversal' | 'balance',
  transactionId: string, // M-Pesa Transaction ID
  conversationId: string,
  originatorConversationId: string,
  reference: string,
  amount: number,
  phoneNumber: string,
  accountReference: string,
  description: string,
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'reversed',
  resultCode: string,
  resultDesc: string,
  merchantRequestId: string,
  checkoutRequestId: string,
  responseCode: string,
  responseDescription: string,
  customerMessage: string,
  metadata: Record<string, any>,
  callbackMetadata: {
    receiptNumber: string,
    balance: number,
    transactionDate: Date,
    phoneNumber: string
  },
  requestPayload: Record<string, any>,
  responsePayload: Record<string, any>,
  error: {
    code: string,
    message: string,
    details: any
  },
  createdAt: Date,
  updatedAt: Date
}
```

## API Endpoints

### STK Push

- `POST /api/mpesa/stk-push` - Initiate STK Push
- `POST /api/mpesa/stk-query` - Query STK Status

### B2C

- `POST /api/mpesa/b2c` - Send B2C Payment
- `GET /api/mpesa/b2c/:id` - Get B2C Transaction

### Transaction Management

- `GET /api/mpesa/transactions` - List transactions
- `GET /api/mpesa/transactions/:id` - Get transaction
- `POST /api/mpesa/transactions/:id/reverse` - Reverse transaction
- `GET /api/mpesa/transactions/reference/:reference` - Find by reference

### Callbacks

- `POST /api/mpesa/callbacks/stk` - STK Callback URL
- `POST /api/mpesa/callbacks/b2c` - B2C Callback URL
- `POST /api/mpesa/callbacks/balance` - Balance Callback URL
- `POST /api/mpesa/callbacks/reversal` - Reversal Callback URL

## Usage Examples

### Initiate STK Push

```typescript
const payload = {
  phoneNumber: '254712345678',
  amount: 100,
  accountReference: 'INV-001',
  description: 'Payment for invoice INV-001',
  callbackUrl: 'https://api.yourdomain.com/webhooks/mpesa/payment',
  metadata: {
    invoiceId: 'inv_123',
    userId: 'user_456'
  }
};

const response = await fetch('/api/mpesa/stk-push', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify(payload)
});

const result = await response.json();
```

### Handle STK Callback

```javascript
// This is an example of how to handle the callback in your application
app.post('/api/mpesa/callbacks/stk', async (req, res) => {
  try {
    const callbackData = req.body;
    
    // Process the callback data
    const result = await mpesaService.processSTKCallback(callbackData);
    
    // Acknowledge receipt
    res.status(200).json({
      ResultCode: 0,
      ResultDesc: 'Success',
      ThirdPartyTransID: result.transactionId
    });
  } catch (error) {
    console.error('Error processing STK callback:', error);
    res.status(500).json({
      ResultCode: 1,
      ResultDesc: 'Failed to process callback'
    });
  }
});
```

## Configuration

### Environment Variables

```env
# M-Pesa API Configuration
MPESA_ENV=sandbox
MPESA_CONSUMER_KEY=your-consumer-key
MPESA_CONSUMER_SECRET=your-consumer-secret
MPESA_PASSKEY=your-passkey
MPESA_SHORTCODE=your-shortcode
MPESA_INITIATOR_NAME=your-initiator
MPESA_SECURITY_CREDENTIAL=your-security-credential
MPESA_ENCRYPTION_KEY=your-encryption-key
MPESA_PUBLIC_KEY=your-public-key

# Callback URLs
MPESA_CALLBACK_URL=https://api.yourdomain.com/api/mpesa/callbacks
MPESA_QUEUE_TIMEOUT_URL=https://api.yourdomain.com/api/mpesa/timeout
MPESA_RESULT_URL=https://api.yourdomain.com/api/mpesa/result

# Transaction Limits
MPESA_MIN_AMOUNT=10
MPESA_MAX_AMOUNT=150000
```

## Security Considerations

- Use HTTPS for all API endpoints
- Validate callback signatures
- Encrypt sensitive data
- Implement IP whitelisting
- Rate limit API requests
- Regular security audits

## Testing

### Sandbox Testing

1. Configure sandbox credentials
2. Use test phone numbers (e.g., 254708374149)
3. Test successful and failed scenarios
4. Verify callbacks

### Test Cases

- Successful payment
- Insufficient funds
- Timeout
- Duplicate transactions
- Invalid phone numbers
- Network failures

## Dependencies

- axios (HTTP client)
- crypto-js (encryption)
- @elysiajs/jwt (JWT)
- moment (date handling)
- uuid (unique identifiers)

## Support

For support, please contact:

- Email: <mpesa-support@kaa-saas.com>
- Phone: +254 700 000000

## License

Proprietary - All rights reserved © 2025 KAA SaaS Solutions
