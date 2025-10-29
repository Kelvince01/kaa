"use client";

import { Button } from "@kaa/ui/components/button";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CreditCard, Star, Trash } from "lucide-react";
import Link from "next/link";
import type React from "react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { httpClient } from "@/lib/axios";
import type { PaymentMethod } from "@/modules/payments/payment.type";
import { formatCardBrand } from "@/shared/utils/format.util";

export type PaymentMethodsListResponse = {
  paymentMethods: PaymentMethod[];
};

type PaymentMethodsListProps = {
  onSelect?: (paymentMethod: PaymentMethod) => void;
  selectable?: boolean;
  showAddNew?: boolean;
  className?: string;
};

const PaymentMethodsList: React.FC<PaymentMethodsListProps> = ({
  onSelect,
  selectable = false,
  showAddNew = true,
  className = "",
}) => {
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Fetch payment methods
  const { data: paymentMethods = [], isLoading } = useQuery({
    queryKey: ["paymentMethods"],
    queryFn: async () => {
      const response =
        await httpClient.api.get<PaymentMethodsListResponse>(
          "/payment-methods"
        );
      return response.data.paymentMethods || [];
    },
  });

  // Set default payment method
  const setDefaultMutation = useMutation({
    mutationFn: async (paymentMethodId: string) => {
      await httpClient.api.post("/payment-methods/default", {
        paymentMethodId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["paymentMethods"] });
      toast.success("Default payment method updated");
    },

    onError: (error: any) => {
      toast.error(error.message || "Failed to update default payment method");
    },
  });

  // Delete payment method
  const deleteMutation = useMutation({
    mutationFn: async (paymentMethodId: string) =>
      httpClient.api.delete(`/payment-methods/${paymentMethodId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["paymentMethods"] });
      toast.success("Payment method removed");
    },

    onError: (error: any) => {
      toast.error(error.message || "Failed to remove payment method");
    },
  });

  // Set the first payment method as selected by default if selectable
  useEffect(() => {
    if (selectable && paymentMethods.length > 0 && !selectedId) {
      const defaultMethod = paymentMethods.find(
        (pm: PaymentMethod) => pm.isDefault
      );
      setSelectedId(defaultMethod?.id || paymentMethods[0]?.id || null);

      if (onSelect) {
        onSelect(defaultMethod || (paymentMethods[0] as PaymentMethod));
      }
    }
  }, [paymentMethods, selectable, selectedId, onSelect]);

  const handleSelect = (paymentMethod: PaymentMethod) => {
    if (selectable) {
      setSelectedId(paymentMethod.id);
      if (onSelect) {
        onSelect(paymentMethod);
      }
    }
  };

  const handleSetDefault = (paymentMethodId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDefaultMutation.mutate(paymentMethodId);
  };

  const handleDelete = (paymentMethodId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (
      // biome-ignore lint/suspicious/noAlert: confirmed delete
      window.confirm("Are you sure you want to remove this payment method?")
    ) {
      deleteMutation.mutate(paymentMethodId);
    }
  };

  if (isLoading) {
    return <div className="py-4 text-center">Loading payment methods...</div>;
  }

  if (paymentMethods.length === 0) {
    return (
      <div className="py-6 text-center">
        <p className="mb-4 text-gray-500">No payment methods found</p>
        {showAddNew && (
          <Link href="/account/payment-methods/add">
            <Button variant="default">Add Payment Method</Button>
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="grid gap-3">
        {paymentMethods.map((method: PaymentMethod) => (
          <div
            className={`flex items-center justify-between rounded-lg border p-4 ${selectable ? "cursor-pointer hover:border-primary-500" : ""}
              ${selectedId === method.id ? "border-primary-500 bg-primary-50" : "bg-white"}
            `}
            key={method.id}
            onClick={() => handleSelect(method)}
          >
            <div className="flex items-center space-x-3">
              {selectable && (
                <div className="w-5">
                  <input
                    checked={selectedId === method.id}
                    className="h-4 w-4 text-primary-600"
                    onChange={() => {
                      /**/
                    }}
                    type="radio"
                  />
                </div>
              )}

              <div className="flex items-center space-x-2">
                <CreditCard className="text-gray-600" />
                <div>
                  <p className="font-medium">
                    {formatCardBrand(method.brand ?? "")} •••• {method.lastFour}
                  </p>
                  <p className="text-gray-500 text-sm">
                    Expires {method.expiryMonth?.toString().padStart(2, "0")}/
                    {method.expiryYear?.toString()}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                className="p-2 text-gray-500 hover:text-yellow-500"
                onClick={(e) => handleSetDefault(method.id, e)}
                title={
                  method.isDefault ? "Default payment method" : "Set as default"
                }
                type="button"
              >
                {method.isDefault ? (
                  <Star className="text-yellow-500" />
                ) : (
                  <Star />
                )}
              </button>

              <button
                className="p-2 text-gray-500 hover:text-red-500"
                disabled={method.isDefault}
                onClick={(e) => handleDelete(method.id, e)}
                title="Remove payment method"
                type="button"
              >
                <Trash />
              </button>
            </div>
          </div>
        ))}
      </div>

      {showAddNew && (
        <div className="mt-4">
          <Link href="/account/payment-methods/add">
            <Button className="w-full" variant="outline">
              Add New Payment Method
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
};

export default PaymentMethodsList;
