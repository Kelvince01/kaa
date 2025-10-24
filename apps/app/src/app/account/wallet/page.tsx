import type { Metadata } from "next";
import dynamic from "next/dynamic";

// Dynamically import the client component
const WalletClient = dynamic(() => import("@/routes/account/wallet"), {
  ssr: true,
});

export const metadata: Metadata = {
  title: "Wallet | Kaa",
  description:
    "Manage your wallet, view balance, make deposits and withdrawals, and track transaction history.",
};

export default function WalletPage() {
  return <WalletClient />;
}
