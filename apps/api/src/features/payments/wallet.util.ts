import crypto from "node:crypto";
import { Wallet } from "@kaa/models";
import { WalletStatus } from "@kaa/models/types";

export function generateReference(prefix: string): string {
  const timestamp = Date.now().toString(36);
  const random = crypto.randomBytes(4).toString("hex").toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}

export function formatKES(amount: number): string {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    minimumFractionDigits: 2,
  }).format(amount);
}

export async function validateWalletStatus(walletId: string): Promise<boolean> {
  const wallet = await Wallet.findById(walletId);
  return wallet?.status === WalletStatus.ACTIVE;
}

export async function reserveFunds(
  walletId: string,
  amount: number,
  _metadata: any
): Promise<void> {
  await Wallet.findByIdAndUpdate(walletId, {
    $inc: {
      "balance.available": -amount,
      "balance.reserved": amount,
    },
  });
}

export async function releaseFunds(
  walletId: string,
  amount: number,
  complete = false
): Promise<void> {
  const update: any = {
    $inc: {
      "balance.reserved": -amount,
    },
  };

  if (complete) {
    update.$inc["metadata.totalSpent"] = amount;
  } else {
    update.$inc["balance.available"] = amount;
  }

  await Wallet.findByIdAndUpdate(walletId, update);
}
