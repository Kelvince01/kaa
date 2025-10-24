# Wallet Module - Quick Start Guide

Get up and running with the Wallet module in under 5 minutes!

## 🚀 Quick Setup

### 1. Import the Dashboard (Easiest)

```tsx
import { WalletDashboard } from '@/modules/payments/wallets';

export default function WalletPage() {
  return <WalletDashboard />;
}
```

That's it! You now have a fully functional wallet with:
- Balance display
- Deposit functionality
- Withdrawal functionality
- Transfer functionality
- Transaction history
- Rent payment

## 📦 What's Included

### Components
- `WalletDashboard` - Complete wallet interface
- `WalletBalanceCard` - Balance display
- `DepositForm` - Add funds via M-Pesa
- `WithdrawalForm` - Withdraw to M-Pesa
- `TransferForm` - Send to other wallets
- `PayRentForm` - Pay rent from wallet
- `TransactionList` - View transaction history

### Hooks
- `useWalletBalance()` - Get balance
- `useTransactionHistory()` - Get transactions
- `useDepositToWallet()` - Deposit mutation
- `useWithdrawFromWallet()` - Withdraw mutation
- `useTransferFunds()` - Transfer mutation
- `usePayRentFromWallet()` - Pay rent mutation

### Utils
- `formatCurrency()` - Format amounts
- `formatDate()` - Format dates
- `formatPhoneNumber()` - Format phone numbers
- `isValidKenyanPhone()` - Validate phone numbers

## 💡 Common Use Cases

### Show Balance Only
```tsx
import { WalletBalanceCard } from '@/modules/payments/wallets';

function MyComponent() {
  return (
    <WalletBalanceCard 
      showActions={false}
    />
  );
}
```

### Custom Deposit Form
```tsx
import { DepositForm } from '@/modules/payments/wallets';
import { Dialog } from '@kaa/ui/components/dialog';

function MyComponent() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DepositForm
        defaultPhoneNumber="254712345678"
        onSuccess={() => {
          console.log('Deposit successful!');
          setOpen(false);
        }}
      />
    </Dialog>
  );
}
```

### Display Transactions
```tsx
import { TransactionList } from '@/modules/payments/wallets';

function MyComponent() {
  return (
    <TransactionList 
      showFilters={true}
      pageSize={10}
      onTransactionClick={(tx) => console.log(tx)}
    />
  );
}
```

### Use Hooks Directly
```tsx
import { useWalletBalance, useDepositToWallet } from '@/modules/payments/wallets';

function MyComponent() {
  const { data: balance, isLoading } = useWalletBalance();
  const deposit = useDepositToWallet();

  const handleDeposit = async () => {
    await deposit.mutateAsync({
      amount: 1000,
      phoneNumber: '254712345678'
    });
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      <p>Balance: {balance?.balance}</p>
      <button onClick={handleDeposit}>Deposit 1000</button>
    </div>
  );
}
```

## 📝 Required Props

### WalletDashboard
- All props are optional!
- `defaultPhoneNumber?: string` - Pre-fill phone number
- `showPayRent?: boolean` - Show rent payment (default: true)
- `onTransactionClick?: (tx) => void` - Handle transaction click

### DepositForm / WithdrawalForm / TransferForm
- `onSuccess?: (data) => void` - Success callback
- `onCancel?: () => void` - Cancel callback
- `defaultPhoneNumber?: string` - Pre-fill phone number

### PayRentForm
- `onSuccess?: (data) => void` - Success callback
- `onCancel?: () => void` - Cancel callback
- `defaultPropertyId?: string` - Pre-select property
- `defaultApplicationId?: string` - Pre-fill application
- `defaultAmount?: number` - Pre-fill amount

### TransactionList
- `showFilters?: boolean` - Show filters (default: true)
- `pageSize?: number` - Items per page (default: 20)
- `onTransactionClick?: (tx) => void` - Click handler

## 🔧 Configuration

### Phone Number Format
Always use Kenyan format: `254XXXXXXXXX`
- Example: `254712345678`
- NOT: `0712345678` or `+254712345678`

### Amount Limits
- Minimum: KES 10
- Maximum: KES 150,000
- Validated on both client and server

### Transaction Types
- `deposit` - Add funds via M-Pesa
- `withdrawal` - Send to M-Pesa
- `transfer` - Wallet to wallet
- `rent_payment` - Pay rent
- `refund` - Refunded amount
- `commission` - Commission payment

### Transaction Status
- `pending` - Awaiting processing
- `processing` - Being processed
- `completed` - Successful
- `failed` - Failed
- `reversed` - Reversed/Refunded

## 🎨 Styling

All components use Tailwind CSS and shadcn/ui components. They automatically adapt to your theme.

### Custom Styling
```tsx
<WalletBalanceCard className="custom-class" />
```

## 🐛 Troubleshooting

### Balance Not Showing
- Check authentication
- Verify API endpoint is accessible
- Check React Query devtools

### Phone Number Invalid
- Must be 254XXXXXXXXX format (12 digits)
- Must start with 2547 or 2541

### Transaction Not Appearing
- Wait for M-Pesa callback
- Check transaction status
- Refresh the page

### Form Not Submitting
- Check console for errors
- Verify all required fields
- Check network tab

## 📚 More Information

- See `README.md` for detailed documentation
- See `IMPLEMENTATION_SUMMARY.md` for technical details
- See `examples/wallet-page-example.tsx` for 6 complete examples

## 🤝 Support

For issues:
1. Check the error message
2. Review the documentation
3. Check the example implementations
4. Contact the development team

## ✅ Checklist

Before deploying:
- [ ] Test deposit flow
- [ ] Test withdrawal flow
- [ ] Test transaction history
- [ ] Verify error handling
- [ ] Check mobile responsiveness
- [ ] Test with real M-Pesa credentials
- [ ] Verify balance updates correctly
- [ ] Test all form validations

## 🎉 You're Ready!

You now have everything you need to integrate wallet functionality into your application. Start with the dashboard and customize as needed!

```tsx
import { WalletDashboard } from '@/modules/payments/wallets';

export default function App() {
  return <WalletDashboard />;
}
```

Happy coding! 🚀