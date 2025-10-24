"use client";

import { Button } from "@kaa/ui/components/button";
import { Card, CardContent } from "@kaa/ui/components/card";
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
import {
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowUpRight,
  History,
  Receipt,
  Wallet,
} from "lucide-react";
import { useState } from "react";
import type { WalletTransaction } from "../wallet.type";
import { DepositForm } from "./deposit-form";
import { PayRentForm } from "./pay-rent-form";
import { TransactionList } from "./transaction-list";
import { TransferForm } from "./transfer-form";
import { WalletBalanceCard } from "./wallet-balance-card";
import { WithdrawalForm } from "./withdrawal-form";

type DialogType = "deposit" | "withdraw" | "transfer" | "payRent" | null;

type WalletDashboardProps = {
  /**
   * Default phone number for forms
   */
  defaultPhoneNumber?: string;

  /**
   * Show pay rent button
   * @default true
   */
  showPayRent?: boolean;

  /**
   * Callback when a transaction is clicked
   */
  onTransactionClick?: (transaction: WalletTransaction) => void;
};

/**
 * Comprehensive wallet dashboard component that displays balance,
 * transaction history, and provides access to all wallet operations.
 *
 * @component
 * @param {WalletDashboardProps} props - The component props
 * @returns {JSX.Element} The rendered wallet dashboard
 */
export function WalletDashboard({
  defaultPhoneNumber,
  showPayRent = true,
  onTransactionClick,
}: WalletDashboardProps) {
  const [activeDialog, setActiveDialog] = useState<DialogType>(null);
  const [activeTab, setActiveTab] = useState<string>("overview");

  const closeDialog = () => setActiveDialog(null);

  const handleOperationSuccess = () => {
    closeDialog();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      {/*<div className="flex items-center justify-between">
        <div>
          <h1 className="font-bold text-3xl tracking-tight">Wallet</h1>
          <p className="text-muted-foreground">
            Manage your funds, make payments, and view transaction history
          </p>
        </div>
      </div>*/}

      {/* Main Content */}
      <Tabs
        className="space-y-6"
        onValueChange={setActiveTab}
        value={activeTab}
      >
        <TabsList className="grid w-full grid-cols-2 lg:w-auto">
          <TabsTrigger className="gap-2" value="overview">
            <Wallet className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger className="gap-2" value="transactions">
            <History className="h-4 w-4" />
            Transactions
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent className="space-y-6" value="overview">
          {/* Balance Card */}
          <WalletBalanceCard
            onDeposit={() => setActiveDialog("deposit")}
            onWithdraw={() => setActiveDialog("withdraw")}
          />

          {/* Quick Actions */}
          <Card>
            <CardContent className="pt-6">
              <h3 className="mb-4 font-semibold text-lg">Quick Actions</h3>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                <Button
                  className="h-auto flex-col gap-2 py-4"
                  onClick={() => setActiveDialog("deposit")}
                  variant="outline"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                    <ArrowDownLeft className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="space-y-0.5 text-center">
                    <p className="font-medium">Deposit</p>
                    <p className="text-muted-foreground text-xs">
                      Add funds via M-Pesa
                    </p>
                  </div>
                </Button>

                <Button
                  className="h-auto flex-col gap-2 py-4"
                  onClick={() => setActiveDialog("withdraw")}
                  variant="outline"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-100">
                    <ArrowUpRight className="h-6 w-6 text-orange-600" />
                  </div>
                  <div className="space-y-0.5 text-center">
                    <p className="font-medium">Withdraw</p>
                    <p className="text-muted-foreground text-xs">
                      Send to M-Pesa
                    </p>
                  </div>
                </Button>

                <Button
                  className="h-auto flex-col gap-2 py-4"
                  onClick={() => setActiveDialog("transfer")}
                  variant="outline"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                    <ArrowLeftRight className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="space-y-0.5 text-center">
                    <p className="font-medium">Transfer</p>
                    <p className="text-muted-foreground text-xs">
                      Send to another wallet
                    </p>
                  </div>
                </Button>

                {showPayRent && (
                  <Button
                    className="h-auto flex-col gap-2 py-4"
                    onClick={() => setActiveDialog("payRent")}
                    variant="outline"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-100">
                      <Receipt className="h-6 w-6 text-purple-600" />
                    </div>
                    <div className="space-y-0.5 text-center">
                      <p className="font-medium">Pay Rent</p>
                      <p className="text-muted-foreground text-xs">
                        Pay from wallet
                      </p>
                    </div>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recent Transactions */}
          <TransactionList
            onTransactionClick={onTransactionClick}
            pageSize={5}
            showFilters={false}
          />
        </TabsContent>

        {/* Transactions Tab */}
        <TabsContent className="space-y-6" value="transactions">
          <TransactionList
            onTransactionClick={onTransactionClick}
            pageSize={20}
            showFilters={true}
          />
        </TabsContent>
      </Tabs>

      {/* Deposit Dialog */}
      <Dialog
        onOpenChange={(open) => !open && closeDialog()}
        open={activeDialog === "deposit"}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ArrowDownLeft className="h-5 w-5 text-green-600" />
              Deposit to Wallet
            </DialogTitle>
            <DialogDescription>
              Add funds to your wallet using M-Pesa. You'll receive a prompt on
              your phone to complete the payment.
            </DialogDescription>
          </DialogHeader>
          <DepositForm
            defaultPhoneNumber={defaultPhoneNumber}
            onCancel={closeDialog}
            onSuccess={handleOperationSuccess}
          />
        </DialogContent>
      </Dialog>

      {/* Withdraw Dialog */}
      <Dialog
        onOpenChange={(open) => !open && closeDialog()}
        open={activeDialog === "withdraw"}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ArrowUpRight className="h-5 w-5 text-orange-600" />
              Withdraw from Wallet
            </DialogTitle>
            <DialogDescription>
              Withdraw funds from your wallet to your M-Pesa account.
            </DialogDescription>
          </DialogHeader>
          <WithdrawalForm
            defaultPhoneNumber={defaultPhoneNumber}
            onCancel={closeDialog}
            onSuccess={handleOperationSuccess}
          />
        </DialogContent>
      </Dialog>

      {/* Transfer Dialog */}
      <Dialog
        onOpenChange={(open) => !open && closeDialog()}
        open={activeDialog === "transfer"}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ArrowLeftRight className="h-5 w-5 text-blue-600" />
              Transfer Funds
            </DialogTitle>
            <DialogDescription>
              Transfer funds instantly to another wallet user.
            </DialogDescription>
          </DialogHeader>
          <TransferForm
            onCancel={closeDialog}
            onSuccess={handleOperationSuccess}
          />
        </DialogContent>
      </Dialog>

      {/* Pay Rent Dialog */}
      <Dialog
        onOpenChange={(open) => !open && closeDialog()}
        open={activeDialog === "payRent"}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5 text-purple-600" />
              Pay Rent
            </DialogTitle>
            <DialogDescription>
              Pay your rent securely using your wallet balance.
            </DialogDescription>
          </DialogHeader>
          <PayRentForm
            onCancel={closeDialog}
            onSuccess={handleOperationSuccess}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
