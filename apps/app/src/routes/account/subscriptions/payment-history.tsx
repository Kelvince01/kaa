"use client";

// import { PaymentHistory } from "@/modules/subscriptions";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/modules/auth/auth.store";

const PaymentHistoryClient = () => {
  const { user, isLoading } = useAuthStore();
  const router = useRouter();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-gray-500">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    router.push("/accounts/login");
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Page header */}
        <div className="mb-8">
          <h1 className="font-bold text-2xl text-gray-900">Payment History</h1>
          <p className="mt-1 text-gray-500 text-sm">
            View your payment history and transaction details
          </p>
        </div>

        {/* Payment history component */}
        <div className="overflow-hidden bg-white shadow sm:rounded-lg">
          {/* <PaymentHistory /> */}
        </div>
      </div>
    </div>
  );
};

export default PaymentHistoryClient;
