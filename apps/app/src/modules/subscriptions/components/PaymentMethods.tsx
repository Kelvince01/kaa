"use client";

import { Alert, AlertDescription } from "@kaa/ui/components/alert";
import { Badge } from "@kaa/ui/components/badge";
import { Button } from "@kaa/ui/components/button";
import { Card, CardContent } from "@kaa/ui/components/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@kaa/ui/components/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@kaa/ui/components/dropdown-menu";
import { Input } from "@kaa/ui/components/input";
import { Label } from "@kaa/ui/components/label";
import { cn } from "@kaa/ui/lib/utils";
import {
  AlertTriangle,
  CreditCard,
  Loader2,
  MoreVertical,
  Plus,
  Shield,
  Star,
  Trash2,
} from "lucide-react";
import type React from "react";
import { useState } from "react";
import {
  useAddPaymentMethod,
  usePaymentMethods,
  useRemovePaymentMethod,
  useSetDefaultPaymentMethod,
} from "../subscriptions.queries";
import type { PaymentMethod } from "../subscriptions.type";

type PaymentMethodsProps = {
  className?: string;
};

function PaymentMethodCard({
  method,
  isDefault,
}: {
  method: PaymentMethod;
  isDefault: boolean;
}) {
  const deletePaymentMethod = useRemovePaymentMethod();
  const setDefaultPaymentMethod = useSetDefaultPaymentMethod();

  const handleDelete = () => {
    // biome-ignore lint/suspicious/noAlert: confirmed delete
    if (window.confirm("Remove this payment method?")) {
      deletePaymentMethod.mutate(method.id);
    }
  };

  const handleSetDefault = () => {
    setDefaultPaymentMethod.mutate(method.id);
  };

  const getBrandColor = (brand: string) => {
    const colors = {
      visa: "bg-blue-500",
      mastercard: "bg-red-500",
      amex: "bg-green-500",
      discover: "bg-orange-500",
    };
    return colors[brand?.toLowerCase() as keyof typeof colors] || "bg-gray-500";
  };

  return (
    <Card className={cn("relative", isDefault && "ring-2 ring-primary")}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div
              className={cn(
                "rounded p-2 text-white",
                getBrandColor(method.details.brand || "")
              )}
            >
              <CreditCard className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-medium">•••• {method.details.last4}</span>
                {isDefault && (
                  <Badge className="text-xs" variant="secondary">
                    Default
                  </Badge>
                )}
              </div>
              <p className="text-muted-foreground text-sm capitalize">
                {method.details.brand} • {method.details.expiryMonth}/
                {method.details.expiryYear}
              </p>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="ghost">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {!isDefault && (
                <DropdownMenuItem onClick={handleSetDefault}>
                  <Star className="mr-2 h-4 w-4" />
                  Set as default
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                disabled={isDefault}
                onClick={handleDelete}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Remove
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  );
}

function AddCardForm({ onClose }: { onClose: () => void }) {
  const [formData, setFormData] = useState({
    cardNumber: "",
    expMonth: "",
    expYear: "",
    cvc: "",
    name: "",
  });

  const addPaymentMethod = useAddPaymentMethod();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const paymentData = {
      cardNumber: formData.cardNumber.replace(/\s/g, ""),
      expMonth: formData.expMonth,
      expYear: formData.expYear,
      cvc: formData.cvc,
      cardholderName: formData.name,
      billingAddress: {
        line1: "",
        city: "",
        state: "",
        postalCode: "",
        country: "US",
      },
      stripePaymentMethodId: "",
    };

    addPaymentMethod.mutate(paymentData, {
      onSuccess: () => {
        onClose();
      },
    });
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    const parts: string[] = [];
    for (let i = 0, len = Math.min(v.length, 16); i < len; i += 4) {
      parts.push(v.substring(i, i + 4));
    }
    return parts.join(" ");
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 20 }, (_, i) => currentYear + i);

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div>
        <Label htmlFor="name">Cardholder Name</Label>
        <Input
          id="name"
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, name: e.target.value }))
          }
          placeholder="John Doe"
          required
          value={formData.name}
        />
      </div>

      <div>
        <Label htmlFor="cardNumber">Card Number</Label>
        <Input
          id="cardNumber"
          maxLength={19}
          onChange={(e) =>
            setFormData((prev) => ({
              ...prev,
              cardNumber: formatCardNumber(e.target.value),
            }))
          }
          placeholder="1234 5678 9012 3456"
          required
          value={formData.cardNumber}
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label htmlFor="expMonth">Month</Label>
          <select
            className="w-full rounded-md border bg-background px-3 py-2"
            id="expMonth"
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, expMonth: e.target.value }))
            }
            required
            value={formData.expMonth}
          >
            <option value="">MM</option>
            {Array.from({ length: 12 }, (_, i) => {
              const month = (i + 1).toString().padStart(2, "0");
              return (
                <option key={month} value={month}>
                  {month}
                </option>
              );
            })}
          </select>
        </div>

        <div>
          <Label htmlFor="expYear">Year</Label>
          <select
            className="w-full rounded-md border bg-background px-3 py-2"
            id="expYear"
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, expYear: e.target.value }))
            }
            required
            value={formData.expYear}
          >
            <option value="">YYYY</option>
            {years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>

        <div>
          <Label htmlFor="cvc">CVC</Label>
          <Input
            id="cvc"
            maxLength={4}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                cvc: e.target.value.replace(/\D/g, ""),
              }))
            }
            placeholder="123"
            required
            value={formData.cvc}
          />
        </div>
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button onClick={onClose} type="button" variant="outline">
          Cancel
        </Button>
        <Button disabled={addPaymentMethod.isPending} type="submit">
          {addPaymentMethod.isPending && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          Add Card
        </Button>
      </div>
    </form>
  );
}

export function PaymentMethods({ className }: PaymentMethodsProps) {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const { data: paymentMethodsData, isLoading, error } = usePaymentMethods();

  if (isLoading) {
    return (
      <div className={cn("space-y-6", className)}>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="mr-2 h-6 w-6 animate-spin" />
          <span>Loading payment methods...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn("space-y-6", className)}>
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Failed to load payment methods. Please try again.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const methods = paymentMethodsData?.paymentMethods || [];
  const defaultMethod = methods.find((method) => method.isDefault);
  const otherMethods = methods.filter((method) => !method.isDefault);

  return (
    <div className={cn("space-y-6", className)}>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-bold text-2xl">Payment Methods</h2>
          <p className="text-muted-foreground">
            Manage your payment methods for subscriptions
          </p>
        </div>

        <Dialog onOpenChange={setShowAddDialog} open={showAddDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Card
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Payment Method</DialogTitle>
              <DialogDescription>
                Add a new payment method to your account
              </DialogDescription>
            </DialogHeader>
            <AddCardForm onClose={() => setShowAddDialog(false)} />
          </DialogContent>
        </Dialog>
      </div>

      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          Your payment information is encrypted and secure.
        </AlertDescription>
      </Alert>

      {methods.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <CreditCard className="mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="mb-2 font-medium text-lg">No payment methods</h3>
            <p className="mb-6 text-muted-foreground">
              Add a payment method to manage your subscriptions.
            </p>
            <Button onClick={() => setShowAddDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Your First Card
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {defaultMethod && (
            <div>
              <h3 className="mb-2 font-medium">Default Payment Method</h3>
              <PaymentMethodCard isDefault={true} method={defaultMethod} />
            </div>
          )}

          {otherMethods.length > 0 && (
            <div>
              <h3 className="mb-2 font-medium">Other Payment Methods</h3>
              <div className="space-y-2">
                {otherMethods.map((method) => (
                  <PaymentMethodCard
                    isDefault={false}
                    key={method.id}
                    method={method}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
