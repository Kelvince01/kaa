# Wallet Module

A comprehensive wallet management system for handling deposits, withdrawals, transfers, and rent payments with M-Pesa integration.

## Features

- 💰 **Wallet Balance Management** - View and manage wallet balance with real-time updates
- 📥 **Deposits** - Add funds via M-Pesa STK Push
- 📤 **Withdrawals** - Withdraw funds to M-Pesa account
- 🔄 **Transfers** - Send funds to other wallet users
- 🏠 **Rent Payments** - Pay rent directly from wallet balance
- 📊 **Transaction History** - View and filter transaction history
- 🔒 **Security** - Transaction limits and wallet status management

## Structure

```
wallets/
├── components/              # React components
│   ├── wallet-balance-card.tsx      # Display wallet balance
│   ├── deposit-form.tsx             # Deposit form
│   ├── withdrawal-form.tsx          # Withdrawal form
│   ├── transfer-form.tsx            # Transfer form
│   ├── pay-rent-form.tsx            # Pay rent form
│   ├── transaction-list.tsx         # Transaction history list
│   └── wallet-dashboard.tsx         # Main dashboard component
├── wallet.type.ts           # TypeScript types
├── wallet.schema.ts         # Zod validation schemas
├── wallet.service.ts        # API service functions
├── wallet.queries.ts        # React Query hooks
├── wallet.mutations.ts      # React Query mutations
├── wallet.utils.ts          # Utility functions
└── index.ts                # Module exports
```

## Usage

### Basic Usage

```tsx
import { WalletDashboard } from '@/modules/payments/wallets';

function WalletPage() {
  return (
    <WalletDashboard 
      defaultPhoneNumber="254712345678"
      showPayRent={true}
    />
  );
}
```

### Individual Components

#### Wallet Balance Card

```tsx
import { WalletBalanceCard } from '@/modules/payments/wallets';

function MyComponent() {
  return (
    <WalletBalanceCard
      onDeposit={() => console.log('Deposit clicked')}
      onWithdraw={() => console.log('Withdraw clicked')}
      showActions={true}
    />
  );
}
```

#### Deposit Form

```tsx
import { DepositForm } from '@/modules/payments/wallets';

function MyComponent() {
  const handleSuccess = (data) => {
    console.log('Deposit successful:', data);
  };

  return (
    <DepositForm
      defaultPhoneNumber="254712345678"
      onSuccess={handleSuccess}
      onCancel={() => console.log('Cancelled')}
    />
  );
}
```

#### Transaction List

```tsx
import { TransactionList } from '@/modules/payments/wallets';

function MyComponent() {
  const handleTransactionClick = (transaction) => {
    console.log('Transaction clicked:', transaction);
  };

  return (
    <TransactionList
      showFilters={true}
      pageSize={20}
      onTransactionClick={handleTransactionClick}
    />
  );
}
```

### Using Hooks

#### Queries

```tsx
import { 
  useWalletBalance, 
  useTransactionHistory 
} from '@/modules/payments/wallets';

function MyComponent() {
  const { data: balance, isLoading } = useWalletBalance();
  const { data: transactions } = useTransactionHistory({
    page: 1,
    limit: 20,
    status: 'completed'
  });

  return (
    <div>
      <p>Balance: {balance?.balance}</p>
      <p>Transactions: {transactions?.transactions.length}</p>
    </div>
  );
}
```

#### Mutations

```tsx
import { 
  useDepositToWallet,
  useWithdrawFromWallet,
  useTransferFunds,
  usePayRentFromWallet
} from '@/modules/payments/wallets';

function MyComponent() {
  const depositMutation = useDepositToWallet();
  const withdrawMutation = useWithdrawFromWallet();
  const transferMutation = useTransferFunds();
  const payRentMutation = usePayRentFromWallet();

  const handleDeposit = async () => {
    try {
      const result = await depositMutation.mutateAsync({
        amount: 1000,
        phoneNumber: '254712345678'
      });
      console.log('Deposit successful:', result);
    } catch (error) {
      console.error('Deposit failed:', error);
    }
  };

  return <button onClick={handleDeposit}>Deposit</button>;
}
```

### Using Utilities

```tsx
import { 
  formatCurrency,
  formatDate,
  formatPhoneNumber,
  isValidKenyanPhone,
  validateAmount
} from '@/modules/payments/wallets';

// Format currency
const formatted = formatCurrency(1000); // "KES 1,000"

// Format date
const date = formatDate(new Date()); // "Dec 20, 2023, 10:30 AM"

// Format phone number
const phone = formatPhoneNumber('254712345678'); // "+254 712 345 678"

// Validate phone number
const isValid = isValidKenyanPhone('254712345678'); // true

// Validate amount
const validation = validateAmount(500, 10, 150_000);
if (validation.isValid) {
  console.log('Amount is valid');
} else {
  console.error(validation.error);
}
```

## API Endpoints

The wallet module communicates with the following API endpoints:

- `GET /wallets` - Get wallet balance
- `POST /wallets/deposit` - Initiate deposit via M-Pesa
- `POST /wallets/withdraw` - Withdraw to M-Pesa
- `POST /wallets/pay-rent` - Pay rent from wallet
- `POST /wallets/transfer` - Transfer funds to another wallet
- `GET /wallets/transactions` - Get transaction history
- `POST /wallets/callbacks/mpesa-deposit` - M-Pesa deposit callback

## Types

### Main Types

```typescript
type Wallet = {
  _id: string;
  userId: string;
  balance: WalletBalance;
  currency: string;
  status: WalletStatus;
  dailyLimit: number;
  monthlyLimit: number;
  metadata: WalletMetadata;
  createdAt: string;
  updatedAt: string;
};

type WalletTransaction = {
  _id: string;
  walletId: string;
  userId: string;
  type: TransactionType;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  status: TransactionStatus;
  reference: string;
  description: string;
  metadata: TransactionMetadata;
  createdAt: string;
  updatedAt: string;
};
```

### Enums

```typescript
enum WalletStatus {
  ACTIVE = "active",
  SUSPENDED = "suspended",
  FROZEN = "frozen",
  CLOSED = "closed",
}

enum TransactionType {
  DEPOSIT = "deposit",
  WITHDRAWAL = "withdrawal",
  RENT_PAYMENT = "rent_payment",
  DEPOSIT_PAYMENT = "deposit_payment",
  REFUND = "refund",
  COMMISSION = "commission",
  TRANSFER = "transfer",
}

enum TransactionStatus {
  PENDING = "pending",
  PROCESSING = "processing",
  COMPLETED = "completed",
  FAILED = "failed",
  REVERSED = "reversed",
}
```

## Validation Schemas

All forms use Zod for validation:

- **Deposit**: Amount (10-150,000 KES), Phone number (254XXXXXXXXX)
- **Withdrawal**: Amount (10-150,000 KES), Phone number (254XXXXXXXXX)
- **Transfer**: Recipient phone, Amount (1-150,000 KES), Optional note (max 200 chars)
- **Pay Rent**: Property ID, Application ID, Amount

## Best Practices

1. **Always handle errors**: Use try-catch blocks with mutations
2. **Provide feedback**: Use toast notifications for success/error states
3. **Validate input**: Use the provided schemas and validation utilities
4. **Check balance**: Validate sufficient balance before transactions
5. **Secure phone numbers**: Always use the 254 format for Kenyan numbers
6. **Monitor limits**: Display and respect daily/monthly transaction limits

## Error Handling

```tsx
import { toast } from 'sonner';

const depositMutation = useDepositToWallet();

const handleDeposit = async (data) => {
  try {
    const result = await depositMutation.mutateAsync(data);
    
    if (result.status === 'success') {
      toast.success('Deposit initiated', {
        description: result.data?.message
      });
    } else {
      toast.error('Deposit failed', {
        description: result.message
      });
    }
  } catch (error) {
    toast.error('An error occurred', {
      description: error.message
    });
  }
};
```

## Integration with M-Pesa

The wallet module integrates with M-Pesa for:

1. **Deposits (C2B)**: Uses STK Push to request payment from user's phone
2. **Withdrawals (B2C)**: Sends funds directly to user's M-Pesa account
3. **Callbacks**: Handles M-Pesa payment confirmations

### M-Pesa Flow

1. User initiates deposit/withdrawal
2. Backend creates pending transaction
3. M-Pesa STK Push sent to user's phone
4. User enters M-Pesa PIN to confirm
5. M-Pesa sends callback with result
6. Transaction status updated
7. Wallet balance updated (if successful)

## Security Considerations

- Transaction limits are enforced at both frontend and backend
- Phone numbers must be validated before submission
- Wallet status is checked before allowing transactions
- All transactions are logged with metadata
- Failed transactions are recorded with failure reasons

## Testing

```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { WalletBalanceCard } from '@/modules/payments/wallets';

describe('WalletBalanceCard', () => {
  it('displays wallet balance', () => {
    render(<WalletBalanceCard />);
    expect(screen.getByText('Wallet Balance')).toBeInTheDocument();
  });

  it('calls onDeposit when deposit button clicked', () => {
    const onDeposit = jest.fn();
    render(<WalletBalanceCard onDeposit={onDeposit} />);
    fireEvent.click(screen.getByText('Deposit'));
    expect(onDeposit).toHaveBeenCalled();
  });
});
```

## Contributing

When adding new features to the wallet module:

1. Add types to `wallet.type.ts`
2. Create validation schemas in `wallet.schema.ts`
3. Add API service functions in `wallet.service.ts`
4. Create React Query hooks in `wallet.queries.ts` or `wallet.mutations.ts`
5. Build UI components in `components/`
6. Export everything from `index.ts`
7. Update this README

## License

Part of the KAA project.