"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@kaa/ui/components/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@kaa/ui/components/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@kaa/ui/components/tabs";
import { useState } from "react";
import { toast } from "sonner";
import { DepositForm } from "../components/deposit-form";
// import { TransferForm } from "../components/transfer-form";
import { PayRentForm } from "../components/pay-rent-form";
import { TransactionList } from "../components/transaction-list";
import { WalletBalanceCard } from "../components/wallet-balance-card";
import { WalletDashboard } from "../components/wallet-dashboard";
import { WithdrawalForm } from "../components/withdrawal-form";
import { useDepositToWallet, useWithdrawFromWallet } from "../wallet.mutations";
import {
  useTransactionHistory,
  useWalletBalance,
  // useTransferFunds,
  // usePayRentFromWallet,
} from "../wallet.queries";
import { TransactionStatus, type WalletTransaction } from "../wallet.type";

/**
 * Example 1: Full Wallet Dashboard
 * This is the simplest way to use the wallet module.
 * It includes everything you need in one component.
 */
export function Example1_FullDashboard() {
  const handleTransactionClick = (transaction: WalletTransaction) => {
    console.log("Transaction clicked:", transaction);
  };

  return (
    <div className="container mx-auto py-8">
      <WalletDashboard
        defaultPhoneNumber="254712345678"
        onTransactionClick={handleTransactionClick}
        showPayRent={true}
      />
    </div>
  );
}

/**
 * Example 2: Custom Layout with Individual Components
 * Build your own layout using individual components.
 */
export function Example2_CustomLayout() {
  const [isDepositOpen, setIsDepositOpen] = useState(false);
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);

  return (
    <div className="container mx-auto space-y-6 py-8">
      {/* Header */}
      <div>
        <h1 className="font-bold text-3xl">My Wallet</h1>
        <p className="text-muted-foreground">Manage your funds</p>
      </div>

      {/* Balance Card */}
      <WalletBalanceCard
        onDeposit={() => setIsDepositOpen(true)}
        onWithdraw={() => setIsWithdrawOpen(true)}
        showActions={true}
      />

      {/* Transaction List */}
      <TransactionList pageSize={10} showFilters={true} />

      {/* Deposit Dialog */}
      <Dialog onOpenChange={setIsDepositOpen} open={isDepositOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Deposit to Wallet</DialogTitle>
            <DialogDescription>Add funds using M-Pesa</DialogDescription>
          </DialogHeader>
          <DepositForm
            onCancel={() => setIsDepositOpen(false)}
            onSuccess={() => setIsDepositOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Withdraw Dialog */}
      <Dialog onOpenChange={setIsWithdrawOpen} open={isWithdrawOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Withdraw from Wallet</DialogTitle>
            <DialogDescription>Send funds to M-Pesa</DialogDescription>
          </DialogHeader>
          <WithdrawalForm
            onCancel={() => setIsWithdrawOpen(false)}
            onSuccess={() => setIsWithdrawOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

/**
 * Example 3: Using Hooks Directly
 * For advanced use cases where you need direct access to the data.
 */
export function Example3_UsingHooks() {
  const { data: balance, isLoading, refetch } = useWalletBalance();
  const { data: transactions } = useTransactionHistory({
    page: 1,
    limit: 5,
    status: TransactionStatus.COMPLETED,
  });

  const depositMutation = useDepositToWallet();
  const withdrawMutation = useWithdrawFromWallet();

  const handleDeposit = async () => {
    try {
      const result = await depositMutation.mutateAsync({
        amount: 1000,
        phoneNumber: "254712345678",
      });
      console.log("Deposit result:", result);
    } catch (error) {
      console.error("Deposit error:", error);
    }
  };

  if (isLoading) {
    return <div>Loading wallet...</div>;
  }

  return (
    <div className="container mx-auto space-y-6 py-8">
      <Card>
        <CardHeader>
          <CardTitle>Wallet Balance</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="font-bold text-3xl">KES {balance?.balance || 0}</p>
          <button
            className="mt-4 rounded bg-primary px-4 py-2 text-white"
            disabled={depositMutation.isPending}
            onClick={handleDeposit}
            type="button"
          >
            {depositMutation.isPending ? "Processing..." : "Deposit KES 1,000"}
          </button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          {transactions?.transactions.map((tx) => (
            <div className="border-b py-2" key={tx._id}>
              <p className="font-medium">{tx.type}</p>
              <p className="text-muted-foreground text-sm">
                KES {tx.amount} - {tx.status}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Example 4: Tabbed Interface
 * Organize wallet operations in tabs.
 */
export function Example4_TabbedInterface() {
  const [activeTab, setActiveTab] = useState("balance");

  return (
    <div className="container mx-auto py-8">
      <h1 className="mb-6 font-bold text-3xl">Wallet Management</h1>

      <Tabs onValueChange={setActiveTab} value={activeTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="balance">Balance</TabsTrigger>
          <TabsTrigger value="deposit">Deposit</TabsTrigger>
          <TabsTrigger value="withdraw">Withdraw</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
        </TabsList>

        <TabsContent className="space-y-4" value="balance">
          <WalletBalanceCard showActions={false} />
        </TabsContent>

        <TabsContent value="deposit">
          <Card>
            <CardContent className="pt-6">
              <DepositForm onSuccess={() => setActiveTab("balance")} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="withdraw">
          <Card>
            <CardContent className="pt-6">
              <WithdrawalForm onSuccess={() => setActiveTab("balance")} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions">
          <TransactionList pageSize={20} showFilters={true} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

/**
 * Example 5: Embedded Wallet Widget
 * A compact wallet widget for sidebars or dashboards.
 */
export function Example5_WalletWidget() {
  const { data: balance } = useWalletBalance();
  const { data: transactions } = useTransactionHistory({ limit: 3 });
  const [showDeposit, setShowDeposit] = useState(false);

  return (
    <Card className="w-80">
      <CardHeader>
        <CardTitle className="text-base">Quick Wallet</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Balance */}
        <div className="rounded-lg bg-muted p-4">
          <p className="text-muted-foreground text-sm">Available Balance</p>
          <p className="font-bold text-2xl">KES {balance?.balance || 0}</p>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-2">
          <button
            className="flex-1 rounded bg-primary px-3 py-2 text-sm text-white"
            onClick={() => setShowDeposit(true)}
            type="button"
          >
            Deposit
          </button>
          <button
            className="flex-1 rounded border px-3 py-2 text-sm"
            type="button"
          >
            Withdraw
          </button>
        </div>

        {/* Recent Transactions */}
        <div>
          <p className="mb-2 font-medium text-sm">Recent</p>
          <div className="space-y-2">
            {transactions?.transactions.slice(0, 3).map((tx) => (
              <div className="flex justify-between text-sm" key={tx._id}>
                <span className="text-muted-foreground">{tx.type}</span>
                <span className="font-medium">KES {tx.amount}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>

      {/* Deposit Dialog */}
      <Dialog onOpenChange={setShowDeposit} open={showDeposit}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Deposit Funds</DialogTitle>
          </DialogHeader>
          <DepositForm onSuccess={() => setShowDeposit(false)} />
        </DialogContent>
      </Dialog>
    </Card>
  );
}

/**
 * Example 6: Pay Rent Flow
 * Specific flow for paying rent from wallet.
 */
export function Example6_PayRentFlow() {
  const { data: balance } = useWalletBalance();
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);

  return (
    <div className="container mx-auto space-y-6 py-8">
      <h1 className="font-bold text-2xl">Pay Rent</h1>

      {/* Balance Display */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm">Available Balance</p>
              <p className="font-bold text-2xl">KES {balance?.balance || 0}</p>
            </div>
            <button
              className="rounded-lg bg-primary px-6 py-2 text-white"
              onClick={() => setIsPaymentOpen(true)}
              type="button"
            >
              Pay Rent
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Payment Dialog */}
      <Dialog onOpenChange={setIsPaymentOpen} open={isPaymentOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pay Rent from Wallet</DialogTitle>
            <DialogDescription>
              Pay your rent securely using your wallet balance
            </DialogDescription>
          </DialogHeader>
          <PayRentForm
            defaultApplicationId="app-456"
            defaultPropertyId="property-123"
            onCancel={() => setIsPaymentOpen(false)}
            onSuccess={() => {
              setIsPaymentOpen(false);
              toast.success("Rent payment successful!");
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

/**
 * Default export: Choose which example to display
 */
export default function WalletExamplesPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Choose which example to render */}
      <Example1_FullDashboard />
      {/* <Example2_CustomLayout /> */}
      {/* <Example3_UsingHooks /> */}
      {/* <Example4_TabbedInterface /> */}
      {/* <Example5_WalletWidget /> */}
      {/* <Example6_PayRentFlow /> */}
    </div>
  );
}
