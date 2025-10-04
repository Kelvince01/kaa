"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Alert, AlertDescription } from "@kaa/ui/components/alert";
import { Badge } from "@kaa/ui/components/badge";
import { Button } from "@kaa/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@kaa/ui/components/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@kaa/ui/components/form";
import { Input } from "@kaa/ui/components/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@kaa/ui/components/select";
import { Separator } from "@kaa/ui/components/separator";
import {
  AlertTriangle,
  CreditCard,
  DollarSign,
  Plus,
  Star,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { CreditCardForm } from "./payments/credit-card-form";
import { type PaymentSettingsData, paymentSettingsSchema } from "./schemas";

type PaymentSettingsFormProps = {
  onSave?: (data: PaymentSettingsData) => Promise<void>;
};

export function PaymentSettingsForm({ onSave }: PaymentSettingsFormProps) {
  const [showAddCard, setShowAddCard] = useState(false);

  const form = useForm<PaymentSettingsData>({
    resolver: zodResolver(paymentSettingsSchema),
    defaultValues: {
      paymentMethods: [],
      billingEmail: "",
    },
  });

  // Mock payment methods for demonstration
  const mockPaymentMethods = [
    {
      id: "1",
      type: "card" as const,
      last4: "4242",
      brand: "Visa",
      expiryMonth: 12,
      expiryYear: 2025,
      isDefault: true,
    },
    {
      id: "2",
      type: "card" as const,
      last4: "5555",
      brand: "Mastercard",
      expiryMonth: 8,
      expiryYear: 2026,
      isDefault: false,
    },
  ];

  const handleSubmit = async (data: PaymentSettingsData) => {
    try {
      if (onSave) {
        await onSave(data);
      } else {
        // Default save simulation
        await new Promise((resolve) => setTimeout(resolve, 1500));
      }
      toast.success("Payment settings saved successfully!");
    } catch (error) {
      toast.error("Failed to save payment settings. Please try again.");
      console.error("Error saving payment settings:", error);
    }
  };

  const handleAddCard = () => {
    setShowAddCard(true);
  };

  const handleDeleteCard = (_cardId: string) => {
    toast.success("Payment method removed successfully!");
  };

  const handleSetDefault = (_cardId: string) => {
    toast.success("Default payment method updated!");
  };

  return (
    <div className="space-y-6">
      {/* Payment Methods */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Payment Methods
          </CardTitle>
          <CardDescription>
            Manage your saved payment methods and billing information.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Existing Payment Methods */}
          <div className="space-y-4">
            {mockPaymentMethods.map((method) => (
              <div
                className="flex items-center justify-between rounded-lg border p-4"
                key={method.id}
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
                    <CreditCard className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {method.brand} ending in {method.last4}
                      </span>
                      {method.isDefault && (
                        <Badge className="text-xs" variant="default">
                          <Star className="mr-1 h-3 w-3" />
                          Default
                        </Badge>
                      )}
                    </div>
                    <div className="text-muted-foreground text-sm">
                      Expires {method.expiryMonth}/{method.expiryYear}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {!method.isDefault && (
                    <Button
                      onClick={() => handleSetDefault(method.id)}
                      size="sm"
                      variant="outline"
                    >
                      Set as Default
                    </Button>
                  )}
                  <Button
                    onClick={() => handleDeleteCard(method.id)}
                    size="sm"
                    variant="outline"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}

            {mockPaymentMethods.length === 0 && (
              <div className="py-8 text-center text-muted-foreground">
                No payment methods added yet.
              </div>
            )}
          </div>

          {/* Add New Card Button */}
          {!showAddCard && (
            <Button
              className="w-full"
              onClick={handleAddCard}
              variant="outline"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add New Payment Method
            </Button>
          )}

          {/* Add New Card Form */}
          {showAddCard && (
            <Card>
              <CardHeader>
                <CardTitle>Add New Card</CardTitle>
                <CardDescription>
                  Enter your card details to add a new payment method.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      {/* biome-ignore lint/a11y/noLabelWithoutControl: ignore */}
                      <label className="font-medium text-sm">Card Number</label>
                      <Input
                        className="mt-1"
                        placeholder="1234 5678 9012 3456"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      {/* biome-ignore lint/a11y/noLabelWithoutControl: ignore */}
                      <label className="font-medium text-sm">Expiry Date</label>
                      <Input className="mt-1" placeholder="MM/YY" />
                    </div>
                    <div>
                      {/* biome-ignore lint/a11y/noLabelWithoutControl: ignore */}
                      <label className="font-medium text-sm">CVV</label>
                      <Input className="mt-1" placeholder="123" />
                    </div>
                  </div>

                  <div>
                    {/* biome-ignore lint/a11y/noLabelWithoutControl: ignore */}
                    <label className="font-medium text-sm">
                      Cardholder Name
                    </label>
                    <Input className="mt-1" placeholder="John Doe" />
                  </div>

                  <div className="flex items-center justify-end gap-2">
                    <Button
                      onClick={() => setShowAddCard(false)}
                      variant="outline"
                    >
                      Cancel
                    </Button>
                    <Button onClick={() => setShowAddCard(false)}>
                      Add Card
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      <CreditCardForm onSuccess={() => setShowAddCard(false)} />

      {/* Billing Information */}
      <Card>
        <CardHeader>
          <CardTitle>Billing Information</CardTitle>
          <CardDescription>
            Update your billing details and preferences.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form
              className="space-y-6"
              onSubmit={form.handleSubmit(handleSubmit)}
            >
              <FormField
                control={form.control}
                name="billingEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Billing email</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="billing@example.com"
                        type="email"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Invoices and billing notifications will be sent to this
                      email address.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Separator />

              {/* Billing Address */}
              <div className="space-y-4">
                <h3 className="font-medium text-lg">Billing Address</h3>

                <div className="grid grid-cols-1 gap-4">
                  <div>
                    {/* biome-ignore lint/a11y/noLabelWithoutControl: ignore */}
                    <label className="font-medium text-sm">
                      Address Line 1
                    </label>
                    <Input className="mt-1" placeholder="123 Main Street" />
                  </div>

                  <div>
                    {/* biome-ignore lint/a11y/noLabelWithoutControl: ignore */}
                    <label className="font-medium text-sm">
                      Address Line 2 (Optional)
                    </label>
                    <Input
                      className="mt-1"
                      placeholder="Apartment, suite, etc."
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    {/* biome-ignore lint/a11y/noLabelWithoutControl: ignore */}
                    <label className="font-medium text-sm">City</label>
                    <Input className="mt-1" placeholder="New York" />
                  </div>
                  <div>
                    {/* biome-ignore lint/a11y/noLabelWithoutControl: ignore */}
                    <label className="font-medium text-sm">State</label>
                    <Select>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select state" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ny">New York</SelectItem>
                        <SelectItem value="ca">California</SelectItem>
                        <SelectItem value="tx">Texas</SelectItem>
                        <SelectItem value="fl">Florida</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    {/* biome-ignore lint/a11y/noLabelWithoutControl: ignore */}
                    <label className="font-medium text-sm">ZIP Code</label>
                    <Input className="mt-1" placeholder="10001" />
                  </div>
                  <div>
                    {/* biome-ignore lint/a11y/noLabelWithoutControl: ignore */}
                    <label className="font-medium text-sm">Country</label>
                    <Select>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select country" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="us">United States</SelectItem>
                        <SelectItem value="ca">Canada</SelectItem>
                        <SelectItem value="uk">United Kingdom</SelectItem>
                        <SelectItem value="au">Australia</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button disabled={form.formState.isSubmitting} type="submit">
                  {form.formState.isSubmitting
                    ? "Saving..."
                    : "Save Billing Information"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Billing History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Billing History
          </CardTitle>
          <CardDescription>
            View and download your past invoices and billing statements.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Mock billing history */}
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <div className="font-medium">Invoice #INV-001</div>
                <div className="text-muted-foreground text-sm">
                  December 1, 2023 • $29.99
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">Paid</Badge>
                <Button size="sm" variant="outline">
                  Download
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <div className="font-medium">Invoice #INV-002</div>
                <div className="text-muted-foreground text-sm">
                  January 1, 2024 • $29.99
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">Paid</Badge>
                <Button size="sm" variant="outline">
                  Download
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <div className="font-medium">Invoice #INV-003</div>
                <div className="text-muted-foreground text-sm">
                  February 1, 2024 • $29.99
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="destructive">Overdue</Badge>
                <Button size="sm" variant="outline">
                  Pay Now
                </Button>
              </div>
            </div>
          </div>

          {/* Security Notice */}
          <Alert className="mt-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Your payment information is encrypted and securely stored. We
              never store your complete card details.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}
