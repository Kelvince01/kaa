# Wallet Page Architecture

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        Browser (Client)                          │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │              Next.js App Router Layer                       │ │
│  │                                                              │ │
│  │  /account/wallet                                             │ │
│  │  ├── page.tsx (SSR enabled)                                 │ │
│  │  ├── loading.tsx (Skeleton UI)                              │ │
│  │  └── error.tsx (Error Boundary)                             │ │
│  │       │                                                      │ │
│  │       ├─── Dynamic Import ───────────────────────┐          │ │
│  │       │                                           │          │ │
│  │       └─── Metadata (SEO)                        │          │ │
│  └──────────────────────────────────────────────────┼──────────┘ │
│                                                      │            │
│  ┌──────────────────────────────────────────────────▼──────────┐ │
│  │              Route Component Layer                          │ │
│  │                                                              │ │
│  │  /routes/account/wallet/index.tsx                           │ │
│  │  ┌─────────────────────────────────────────┐                │ │
│  │  │  WalletRoute Component                   │                │ │
│  │  │                                          │                │ │
│  │  │  State:                                  │                │ │
│  │  │  ├── selectedTransaction (local)        │                │ │
│  │  │  ├── user (from AuthStore)              │                │ │
│  │  │  └── defaultPhoneNumber (derived)       │                │ │
│  │  │                                          │                │ │
│  │  │  Renders:                                │                │ │
│  │  │  ├── Page Header                        │                │ │
│  │  │  ├── WalletDashboard ──────────────┐    │                │ │
│  │  │  └── TransactionDetailsModal       │    │                │ │
│  │  └─────────────────────────────────────┼────┘                │ │
│  └────────────────────────────────────────┼─────────────────────┘ │
│                                            │                       │
│  ┌────────────────────────────────────────▼─────────────────────┐ │
│  │           Wallet Module Layer                                 │ │
│  │           (@/modules/payments/wallets)                        │ │
│  │                                                                │ │
│  │  ┌──────────────────────────────────────────────────────┐    │ │
│  │  │  WalletDashboard Component                           │    │ │
│  │  │  ┌───────────────────────────────────────────────┐   │    │ │
│  │  │  │  Tabs: Overview | Transactions                │   │    │ │
│  │  │  │  ├── WalletBalanceCard                        │   │    │ │
│  │  │  │  ├── Quick Actions (4 buttons)                │   │    │ │
│  │  │  │  └── TransactionList                          │   │    │ │
│  │  │  │                                               │   │    │ │
│  │  │  │  Modals:                                      │   │    │ │
│  │  │  │  ├── DepositForm                              │   │    │ │
│  │  │  │  ├── WithdrawalForm                           │   │    │ │
│  │  │  │  ├── TransferForm                             │   │    │ │
│  │  │  │  └── PayRentForm                              │   │    │ │
│  │  │  └───────────────────────────────────────────────┘   │    │ │
│  │  └──────────────────────────────────────────────────────┘    │ │
│  │                           │                                   │ │
│  │  ┌────────────────────────┼────────────────────────────┐     │ │
│  │  │  React Query Hooks     │                            │     │ │
│  │  │  ├── useWalletBalance()                            │     │ │
│  │  │  ├── useTransactionHistory()                       │     │ │
│  │  │  ├── useDepositToWallet()                          │     │ │
│  │  │  ├── useWithdrawFromWallet()                       │     │ │
│  │  │  ├── useTransferFunds()                            │     │ │
│  │  │  └── usePayRentFromWallet()                        │     │ │
│  │  └─────────────────────────┬──────────────────────────┘     │ │
│  │                            │                                 │ │
│  │  ┌─────────────────────────▼──────────────────────────┐     │ │
│  │  │  API Service Layer (wallet.service.ts)            │     │ │
│  │  │  ├── getWalletBalance()                            │     │ │
│  │  │  ├── depositToWallet()                             │     │ │
│  │  │  ├── withdrawFromWallet()                          │     │ │
│  │  │  ├── transferFunds()                               │     │ │
│  │  │  ├── payRentFromWallet()                           │     │ │
│  │  │  └── getTransactionHistory()                       │     │ │
│  │  └────────────────────────┬───────────────────────────┘     │ │
│  └───────────────────────────┼─────────────────────────────────┘ │
│                              │                                   │
└──────────────────────────────┼───────────────────────────────────┘
                               │
                  HTTP Requests │ (Axios)
                               │
┌──────────────────────────────▼───────────────────────────────────┐
│                        Backend Server                             │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  API Routes (/api/v1/wallets)                              │  │
│  │                                                              │  │
│  │  apps/api/src/features/payments/wallet.controller.ts        │  │
│  │  ├── GET    /wallets              (Get balance)            │  │
│  │  ├── POST   /wallets/deposit      (Initiate deposit)       │  │
│  │  ├── POST   /wallets/withdraw     (Initiate withdrawal)    │  │
│  │  ├── POST   /wallets/transfer     (Transfer funds)         │  │
│  │  ├── POST   /wallets/pay-rent     (Pay rent)               │  │
│  │  └── GET    /wallets/transactions (Get history)            │  │
│  └───────────────────────┬──────────────────────────────────────┘  │
│                          │                                         │
│  ┌───────────────────────▼──────────────────────────────────────┐ │
│  │  Business Logic Layer                                        │ │
│  │  ├── Transaction validation                                 │ │
│  │  ├── Balance calculations                                   │ │
│  │  ├── Limit checks (daily/monthly)                           │ │
│  │  └── Wallet status verification                             │ │
│  └───────────────────────┬──────────────────────────────────────┘ │
│                          │                                         │
│  ┌───────────────────────▼──────────────────────────────────────┐ │
│  │  Database Layer (MongoDB)                                    │ │
│  │  ├── Wallet Collection                                       │ │
│  │  │   ├── balance (available, pending, reserved, total)      │ │
│  │  │   ├── limits (daily, monthly)                            │ │
│  │  │   └── status (active, suspended, frozen, closed)         │ │
│  │  │                                                           │ │
│  │  └── WalletTransaction Collection                           │ │
│  │      ├── type (deposit, withdrawal, transfer, rent)         │ │
│  │      ├── status (pending, processing, completed, failed)    │ │
│  │      ├── amount, reference, metadata                        │ │
│  │      └── timestamps (created, processed)                    │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  External Services                                          │  │
│  │  └── M-Pesa API                                             │  │
│  │      ├── STK Push (for deposits)                            │  │
│  │      ├── B2C (for withdrawals)                              │  │
│  │      └── Callback Handler                                   │  │
│  └────────────────────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────────────────┘
```

## Component Hierarchy

```
WalletRoute (index.tsx)
│
├── Header (h1, description)
│
├── WalletDashboard
│   │
│   ├── Tabs
│   │   ├── Overview Tab
│   │   │   ├── WalletBalanceCard
│   │   │   │   ├── Balance Display
│   │   │   │   ├── Status Badge
│   │   │   │   ├── Limits Display
│   │   │   │   └── Action Buttons (Deposit, Withdraw)
│   │   │   │
│   │   │   ├── Quick Actions Card
│   │   │   │   ├── Deposit Button → DepositForm Modal
│   │   │   │   ├── Withdraw Button → WithdrawalForm Modal
│   │   │   │   ├── Transfer Button → TransferForm Modal
│   │   │   │   └── Pay Rent Button → PayRentForm Modal
│   │   │   │
│   │   │   └── TransactionList (Recent, 5 items)
│   │   │       ├── Transaction Items (clickable)
│   │   │       └── Pagination (hidden for recent)
│   │   │
│   │   └── Transactions Tab
│   │       └── TransactionList (Full, 20 items)
│   │           ├── Filters (Type, Status)
│   │           ├── Transaction Items (clickable)
│   │           └── Pagination Controls
│   │
│   └── Modals (Dialog Components)
│       ├── Deposit Modal
│       │   └── DepositForm
│       │       ├── Amount Input
│       │       ├── Phone Number Input
│       │       └── Submit Button
│       │
│       ├── Withdraw Modal
│       │   └── WithdrawalForm
│       │       ├── Balance Display
│       │       ├── Amount Input
│       │       ├── Phone Number Input
│       │       └── Submit Button
│       │
│       ├── Transfer Modal
│       │   └── TransferForm
│       │       ├── Balance Display
│       │       ├── Recipient Phone Input
│       │       ├── Amount Input
│       │       ├── Note Input (optional)
│       │       └── Submit Button
│       │
│       └── Pay Rent Modal
│           └── PayRentForm
│               ├── Balance Display
│               ├── Property Select
│               ├── Application ID Input
│               ├── Amount Input
│               ├── Payment Summary
│               └── Submit Button
│
└── Transaction Details Modal
    ├── Status & Type Badges
    ├── Amount Display (large)
    ├── Reference Number
    ├── Date/Time
    ├── Balance Changes
    ├── Description
    ├── Metadata Section
    │   ├── Phone Number
    │   ├── M-Pesa Receipt
    │   ├── Property ID
    │   └── Application ID
    └── Failure Reason (if failed)
```

## Data Flow

### Read Operations (Query)

```
User Action
    │
    ├─► Page Load
    │       │
    │       ├─► useWalletBalance()
    │       │       │
    │       │       └─► React Query Cache ─┬─► Cached? → Return Data
    │       │                              │
    │       │                              └─► Not Cached?
    │       │                                      │
    │       │                                      ├─► getWalletBalance()
    │       │                                      │       │
    │       │                                      │       ├─► HTTP GET /wallets
    │       │                                      │       │       │
    │       │                                      │       │       └─► Backend API
    │       │                                      │       │               │
    │       │                                      │       │               └─► MongoDB Query
    │       │                                      │       │                       │
    │       │                                      │       └─── Response ◄─────────┘
    │       │                                      │
    │       │                                      └─► Cache & Return Data
    │       │                                              │
    │       │                                              └─► UI Updates
    │       │
    │       └─► useTransactionHistory()
    │               │
    │               └─► Similar flow to balance
    │
    └─► Click Transaction
            │
            └─► TransactionDetailsModal
                    │
                    └─► Display cached transaction data
```

### Write Operations (Mutation)

```
User Action (e.g., Deposit)
    │
    ├─► Fill Form
    │       │
    │       └─► Validation (Zod Schema)
    │               │
    │               ├─► Invalid → Show Errors
    │               │
    │               └─► Valid
    │                       │
    │                       └─► Submit
    │
    └─► useDepositToWallet().mutateAsync()
            │
            ├─► Optimistic Update (optional)
            │       │
            │       └─► UI shows "processing"
            │
            ├─► depositToWallet(data)
            │       │
            │       └─► HTTP POST /wallets/deposit
            │               │
            │               └─► Backend API
            │                       │
            │                       ├─► Validate Request
            │                       │
            │                       ├─► Check Limits
            │                       │
            │                       ├─► Create Transaction (pending)
            │                       │
            │                       ├─► Initiate M-Pesa STK Push
            │                       │       │
            │                       │       └─► M-Pesa API
            │                       │               │
            │                       │               ├─► Send STK Push
            │                       │               │
            │                       │               └─► Return CheckoutRequestID
            │                       │
            │                       └─── Response ──┐
            │                                       │
            └──────────────────────────────────────┘
                    │
                    ├─► onSuccess Callback
                    │       │
                    │       ├─► Invalidate Queries
                    │       │       ├─► ["wallet", "balance"]
                    │       │       └─► ["wallet", "transactions"]
                    │       │
                    │       ├─► React Query Refetches
                    │       │       │
                    │       │       └─► Fresh data from API
                    │       │
                    │       ├─► Toast Notification (Success)
                    │       │
                    │       └─► Close Modal
                    │
                    └─► onError Callback
                            │
                            └─► Toast Notification (Error)

M-Pesa Callback (Async)
    │
    └─► Backend receives callback
            │
            ├─► Find Transaction
            │
            ├─► Update Status (completed/failed)
            │
            ├─► Update Wallet Balance (if successful)
            │
            └─► Next user request will get updated data
```

## State Management

```
┌─────────────────────────────────────────────────────────────┐
│                    State Sources                             │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Global State (Zustand)                                      │
│  ├── AuthStore                                               │
│  │   ├── user (User object)                                 │
│  │   ├── isAuthenticated (boolean)                          │
│  │   └── isLoading (boolean)                                │
│                                                              │
│  Server State (React Query)                                  │
│  ├── ["wallet", "balance"]                                  │
│  │   ├── balance (number)                                   │
│  │   ├── status (WalletStatus)                              │
│  │   └── limits (daily, monthly)                            │
│  │                                                           │
│  ├── ["wallet", "transactions", params]                     │
│  │   ├── transactions (WalletTransaction[])                 │
│  │   └── pagination (page, limit, total, pages)             │
│  │                                                           │
│  └── Mutations                                               │
│      ├── depositToWallet                                    │
│      ├── withdrawFromWallet                                 │
│      ├── transferFunds                                      │
│      └── payRentFromWallet                                  │
│                                                              │
│  Local State (useState)                                      │
│  └── WalletRoute                                             │
│      ├── selectedTransaction (WalletTransaction | null)     │
│      └── modal states (handled by WalletDashboard)          │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

## Security Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   Security Layers                            │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Frontend Security                                           │
│  ├── Route Protection                                        │
│  │   └── AuthGuard (requiredRole: "tenant")                 │
│  │                                                           │
│  ├── Input Validation                                        │
│  │   ├── Zod Schemas                                        │
│  │   │   ├── Phone number format (254XXXXXXXXX)             │
│  │   │   ├── Amount limits (10-150,000)                     │
│  │   │   └── Required fields                                │
│  │   │                                                       │
│  │   └── Client-side checks                                 │
│  │       ├── Balance verification                           │
│  │       └── Wallet status checks                           │
│  │                                                           │
│  └── Data Sanitization                                       │
│      ├── XSS prevention (React escaping)                    │
│      └── No eval() or dangerous operations                  │
│                                                              │
│  Backend Security                                            │
│  ├── Authentication                                          │
│  │   ├── JWT verification                                   │
│  │   └── Session validation                                 │
│  │                                                           │
│  ├── Authorization                                           │
│  │   ├── Role-based access control                          │
│  │   └── User owns wallet verification                      │
│  │                                                           │
│  ├── Input Validation                                        │
│  │   ├── Request schema validation                          │
│  │   ├── Amount limit enforcement                           │
│  │   └── Phone number validation                            │
│  │                                                           │
│  ├── Business Rules                                          │
│  │   ├── Daily/monthly limits                               │
│  │   ├── Wallet status checks                               │
│  │   ├── Balance sufficiency                                │
│  │   └── Transaction atomicity                              │
│  │                                                           │
│  └── Data Protection                                         │
│      ├── Generic error messages                             │
│      ├── Transaction logging                                │
│      ├── Audit trails                                       │
│      └── Encrypted communication (HTTPS)                    │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

## Navigation Flow

```
Account Section (/account)
│
├── Profile (/account/profile)
│
├── Wallet (/account/wallet) ◄─── YOU ARE HERE
│   │
│   ├── Overview Tab (default)
│   │   ├── View Balance
│   │   ├── Deposit → Deposit Modal
│   │   ├── Withdraw → Withdraw Modal
│   │   ├── Transfer → Transfer Modal
│   │   ├── Pay Rent → Pay Rent Modal
│   │   └── Click Transaction → Details Modal
│   │
│   └── Transactions Tab
│       ├── Filter by Type
│       ├── Filter by Status
│       ├── Navigate Pages
│       └── Click Transaction → Details Modal
│
├── Documents (/account/documents)
│
├── Security (/account/security)
│
└── Settings (/account/settings)
```

## Error Handling Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   Error Handling Layers                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Layer 1: Form Validation Errors                            │
│  ├── Caught by: Zod Schema + react-hook-form                │
│  ├── Display: Inline form field errors                      │
│  └── Action: User corrects input                            │
│                                                              │
│  Layer 2: API Request Errors                                │
│  ├── Caught by: Try-catch in mutation handlers              │
│  ├── Display: Toast notifications                           │
│  └── Action: User retries or adjusts input                  │
│                                                              │
│  Layer 3: React Query Errors                                │
│  ├── Caught by: React Query error state                     │
│  ├── Display: Error state in components                     │
│  └── Action: Retry button or fallback UI                    │
│                                                              │
│  Layer 4: Component Errors                                  │
│  ├── Caught by: Error boundary (error.tsx)                  │
│  ├── Display: Error page with recovery options              │
│  └── Action: Retry or navigate away                         │
│                                                              │
│  Layer 5: Network Errors                                    │
│  ├── Caught by: Axios interceptors                          │
│  ├── Display: Toast or error state                          │
│  └── Action: Check connection, retry                        │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

## Performance Architecture

```
┌─────────────────────────────────────────────────────────────┐
│              Performance Optimizations                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Code Splitting                                              │
│  ├── Dynamic import of WalletRoute                          │
│  ├── Lazy loading of modals                                 │
│  └── Route-based splitting (Next.js)                        │
│                                                              │
│  Caching Strategy                                            │
│  ├── React Query Cache (5 min default)                      │
│  ├── Stale-while-revalidate                                 │
│  └── Smart cache invalidation                               │
│                                                              │
│  Data Fetching                                               │
│  ├── Parallel queries                                        │
│  ├── Pagination (20 items)                                  │
│  └── SSR enabled for initial load                           │
│                                                              │
│  Rendering Optimizations                                     │
│  ├── Skeleton loaders (loading.tsx)                         │
│  ├── Memoized calculations                                  │
│  ├── Optimistic updates                                     │
│  └── Debounced inputs                                       │
│                                                              │
│  Bundle Size                                                 │
│  ├── Tree shaking                                            │
│  ├── Dynamic imports                                         │
│  └── Minimal dependencies                                    │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

## Deployment Architecture

```
Development → Staging → Production

Each Environment:
├── Frontend (Next.js)
│   ├── Build process
│   ├── Static optimization
│   └── API routes
│
├── Backend (Elysia)
│   ├── Wallet API endpoints
│   ├── M-Pesa integration
│   └── Database connection
│
└── Database (MongoDB)
    ├── Wallet collection
    └── WalletTransaction collection
```

## Monitoring & Analytics

```
┌─────────────────────────────────────────────────────────────┐
│                    Monitoring Points                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Frontend Monitoring                                         │
│  ├── Page load time                                         │
│  ├── Component render time                                  │
│  ├── API request duration                                   │
│  ├── Error rate                                             │
│  └── User interactions                                      │
│                                                              │
│  Backend Monitoring                                          │
│  ├── API response time                                      │
│  ├── Database query time                                    │
│  ├── M-Pesa API latency                                     │
│  ├── Transaction success rate                               │
│  └── Error logs                                             │
│                                                              │
│  Business Metrics                                            │
│  ├── Total transactions                                     │
│  ├── Transaction volume                                     │
│  ├── Active wallets                                         │
│  ├── Average balance                                        │
│  └── Failed transaction rate                                │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```
