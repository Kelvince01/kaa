"use client";

import { Badge } from "@kaa/ui/components/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@kaa/ui/components/dialog";
import { Separator } from "@kaa/ui/components/separator";
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Clock,
  Hash,
  Receipt,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { useAuthStore } from "@/modules/auth/auth.store";
import type { WalletTransaction } from "@/modules/payments/wallets";
import {
  formatCurrency,
  formatDate,
  formatPhoneNumber,
  WalletDashboard,
} from "@/modules/payments/wallets";

/**
 * Wallet route component for the account section.
 * Displays the complete wallet dashboard with balance, transactions,
 * and all wallet operations (deposit, withdraw, transfer, pay rent).
 * Includes a transaction details modal for viewing individual transactions.
 *
 * @component
 * @returns {JSX.Element} The wallet page
 */
export default function WalletRoute() {
  const { user } = useAuthStore();
  const [selectedTransaction, setSelectedTransaction] =
    useState<WalletTransaction | null>(null);

  // Get user's phone number from profile if available
  const defaultPhoneNumber = user?.phone || undefined;

  // Handle transaction click to show details
  const handleTransactionClick = (transaction: WalletTransaction) => {
    setSelectedTransaction(transaction);
  };

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case "failed":
        return <XCircle className="h-5 w-5 text-red-600" />;
      case "pending":
      case "processing":
        return <Clock className="h-5 w-5 text-yellow-600" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-600" />;
    }
  };

  // Get status variant
  const getStatusVariant = (
    status: string
  ): "default" | "destructive" | "secondary" | "outline" => {
    switch (status) {
      case "completed":
        return "default";
      case "failed":
        return "destructive";
      case "pending":
      case "processing":
        return "secondary";
      default:
        return "outline";
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-bold text-3xl tracking-tight">Wallet</h1>
        <p className="mt-2 text-muted-foreground">
          Manage your funds, make payments, and view transaction history
        </p>
      </div>

      <WalletDashboard
        defaultPhoneNumber={defaultPhoneNumber}
        onTransactionClick={handleTransactionClick}
        showPayRent={true}
      />

      {/* Transaction Details Modal */}
      <Dialog
        onOpenChange={(open) => !open && setSelectedTransaction(null)}
        open={!!selectedTransaction}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Transaction Details
            </DialogTitle>
            <DialogDescription>
              View complete details for this transaction
            </DialogDescription>
          </DialogHeader>

          {selectedTransaction && (
            <div className="space-y-6">
              {/* Status and Type */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getStatusIcon(selectedTransaction.status)}
                  <Badge variant={getStatusVariant(selectedTransaction.status)}>
                    {selectedTransaction.status}
                  </Badge>
                </div>
                <Badge variant="outline">{selectedTransaction.type}</Badge>
              </div>

              <Separator />

              {/* Amount */}
              <div className="py-4 text-center">
                <p className="mb-2 text-muted-foreground text-sm">Amount</p>
                <p className="font-bold text-4xl">
                  {formatCurrency(selectedTransaction.amount)}
                </p>
              </div>

              <Separator />

              {/* Transaction Details Grid */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-muted-foreground text-sm">
                    <Hash className="h-4 w-4" />
                    Reference
                  </div>
                  <p className="font-mono text-sm">
                    {selectedTransaction.reference}
                  </p>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-muted-foreground text-sm">
                    <Calendar className="h-4 w-4" />
                    Date
                  </div>
                  <p className="text-sm">
                    {formatDate(selectedTransaction.createdAt)}
                  </p>
                </div>

                <div className="space-y-1">
                  <p className="text-muted-foreground text-sm">
                    Balance Before
                  </p>
                  <p className="font-medium text-sm">
                    {formatCurrency(selectedTransaction.balanceBefore)}
                  </p>
                </div>

                <div className="space-y-1">
                  <p className="text-muted-foreground text-sm">Balance After</p>
                  <p className="font-medium text-sm">
                    {formatCurrency(selectedTransaction.balanceAfter)}
                  </p>
                </div>
              </div>

              {/* Description */}
              {selectedTransaction.description && (
                <>
                  <Separator />
                  <div className="space-y-1">
                    <p className="text-muted-foreground text-sm">Description</p>
                    <p className="text-sm">{selectedTransaction.description}</p>
                  </div>
                </>
              )}

              {/* Metadata */}
              {selectedTransaction.metadata &&
                Object.keys(selectedTransaction.metadata).length > 0 && (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      <p className="font-medium text-sm">Additional Details</p>
                      <div className="space-y-2 rounded-lg border bg-muted/50 p-3">
                        {selectedTransaction.metadata.phoneNumber && (
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">
                              Phone Number
                            </span>
                            <span className="font-mono">
                              {formatPhoneNumber(
                                selectedTransaction.metadata.phoneNumber
                              )}
                            </span>
                          </div>
                        )}
                        {selectedTransaction.metadata.mpesaReceiptNumber && (
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">
                              M-Pesa Receipt
                            </span>
                            <span className="font-mono">
                              {selectedTransaction.metadata.mpesaReceiptNumber}
                            </span>
                          </div>
                        )}
                        {selectedTransaction.metadata.propertyId && (
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">
                              Property ID
                            </span>
                            <span className="font-mono">
                              {selectedTransaction.metadata.propertyId}
                            </span>
                          </div>
                        )}
                        {selectedTransaction.metadata.applicationId && (
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">
                              Application ID
                            </span>
                            <span className="font-mono">
                              {selectedTransaction.metadata.applicationId}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}

              {/* Failure Reason */}
              {selectedTransaction.failureReason && (
                <>
                  <Separator />
                  <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-3">
                    <p className="mb-1 font-medium text-destructive text-sm">
                      Failure Reason
                    </p>
                    <p className="text-destructive/80 text-sm">
                      {selectedTransaction.failureReason}
                    </p>
                  </div>
                </>
              )}

              {/* Processed At */}
              {selectedTransaction.processedAt && (
                <div className="text-center text-muted-foreground text-xs">
                  Processed on {formatDate(selectedTransaction.processedAt)}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
