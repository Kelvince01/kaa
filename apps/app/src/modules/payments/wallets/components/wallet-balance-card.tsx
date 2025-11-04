"use client";

import { Badge } from "@kaa/ui/components/badge";
import { Button } from "@kaa/ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@kaa/ui/components/card";
import { Skeleton } from "@kaa/ui/components/skeleton";
import {
  ArrowDownLeft,
  ArrowUpRight,
  RefreshCw,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { useWalletBalance } from "../wallet.queries";
import { WalletStatus } from "../wallet.type";
import { formatCurrency } from "../wallet.utils";

type WalletBalanceCardProps = {
  /**
   * Callback when deposit button is clicked
   */
  onDeposit?: () => void;

  /**
   * Callback when withdraw button is clicked
   */
  onWithdraw?: () => void;

  /**
   * Show action buttons
   * @default true
   */
  showActions?: boolean;
};

/**
 * Wallet balance card component that displays the user's wallet balance,
 * status, and transaction limits.
 *
 * @component
 * @param {WalletBalanceCardProps} props - The component props
 * @returns {JSX.Element} The rendered wallet balance card
 */
export function WalletBalanceCard({
  onDeposit,
  onWithdraw,
  showActions = true,
}: WalletBalanceCardProps) {
  const { data, isLoading, isError, refetch, isRefetching } =
    useWalletBalance();

  // Get status badge variant
  const getStatusVariant = (status: WalletStatus) => {
    switch (status) {
      case WalletStatus.ACTIVE:
        return "default";
      case WalletStatus.SUSPENDED:
        return "secondary";
      case WalletStatus.FROZEN:
        return "destructive";
      case WalletStatus.CLOSED:
        return "outline";
      default:
        return "default";
    }
  };

  // Get status display text
  const getStatusText = (status: WalletStatus) => {
    switch (status) {
      case WalletStatus.ACTIVE:
        return "Active";
      case WalletStatus.SUSPENDED:
        return "Suspended";
      case WalletStatus.FROZEN:
        return "Frozen";
      case WalletStatus.CLOSED:
        return "Closed";
      default:
        return status;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <div className="flex gap-2">
            <Skeleton className="h-10 flex-1" />
            <Skeleton className="h-10 flex-1" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isError || !data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Wallet Balance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 py-6 text-center">
            <p className="text-muted-foreground">
              Failed to load wallet balance or no wallet found.
            </p>
            <Button onClick={() => refetch()} variant="outline">
              <RefreshCw className="mr-2 h-4 w-4" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { balance, status, limits } = data;
  const isWalletActive = status === WalletStatus.ACTIVE;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="flex items-center gap-2 font-medium text-base">
          <Wallet className="h-5 w-5" />
          Wallet Balance
        </CardTitle>
        <div className="flex items-center gap-2">
          <Badge variant={getStatusVariant(status)}>
            {getStatusText(status)}
          </Badge>
          <Button
            disabled={isRefetching}
            onClick={() => refetch()}
            size="icon"
            variant="ghost"
          >
            <RefreshCw
              className={`h-4 w-4 ${isRefetching ? "animate-spin" : ""}`}
            />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Main Balance */}
        <div className="space-y-1">
          <p className="text-muted-foreground text-sm">Available Balance</p>
          <p className="font-bold text-3xl tracking-tight">
            {balance ? formatCurrency(balance) : "KES 0.00"}
          </p>
        </div>

        {/* Limits */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
              <TrendingUp className="h-3.5 w-3.5" />
              Daily Limit
            </div>
            <p className="font-medium text-sm">
              {formatCurrency(limits.daily)}
            </p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
              <TrendingDown className="h-3.5 w-3.5" />
              Monthly Limit
            </div>
            <p className="font-medium text-sm">
              {formatCurrency(limits.monthly)}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        {showActions && (
          <div className="flex gap-2 pt-2">
            <Button
              className="flex-1"
              disabled={!isWalletActive}
              onClick={onDeposit}
            >
              <ArrowDownLeft className="mr-2 h-4 w-4" />
              Deposit
            </Button>
            <Button
              className="flex-1"
              disabled={!isWalletActive || balance <= 0}
              onClick={onWithdraw}
              variant="outline"
            >
              <ArrowUpRight className="mr-2 h-4 w-4" />
              Withdraw
            </Button>
          </div>
        )}

        {/* Warning message for non-active wallets */}
        {!isWalletActive && (
          <div className="rounded-md bg-muted p-3 text-muted-foreground text-xs">
            Your wallet is currently {getStatusText(status).toLowerCase()}.
            Please contact support for assistance.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
