import { Button } from "@kaa/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "@kaa/ui/components/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@kaa/ui/components/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@kaa/ui/components/tabs";
import { Building2, CreditCard, Loader2, Plus, Smartphone } from "lucide-react";
import { useState } from "react";
import type { PaymentMethodType } from "../../payment.type";

type PaymentMethodOption = {
  id: PaymentMethodType;
  name: string;
  description: string;
  icon: React.ReactNode;
  isEnabled: boolean;
  isComingSoon?: boolean;
};

type AddPaymentMethodCardProps = {
  onAddMethod: (type: PaymentMethodType) => void;
  isLoading?: boolean;
  options?: PaymentMethodOption[];
};

const DEFAULT_OPTIONS: PaymentMethodOption[] = [
  {
    id: "card",
    name: "Credit or Debit Card",
    description: "Add a card for secure online payments",
    icon: <CreditCard className="h-5 w-5 text-blue-600" />,
    isEnabled: true,
  },
  {
    id: "mpesa",
    name: "M-Pesa",
    description: "Pay using your mobile money account",
    icon: <Smartphone className="h-5 w-5 text-green-600" />,
    isEnabled: true,
  },
  {
    id: "bank",
    name: "Bank Account",
    description: "Link your bank account for direct payments",
    icon: <Building2 className="h-5 w-5 text-gray-600" />,
    isEnabled: false,
    isComingSoon: true,
  },
];

export function AddPaymentMethodCard({
  onAddMethod,
  isLoading = false,
  options = DEFAULT_OPTIONS,
}: AddPaymentMethodCardProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("card");

  const handleAddMethod = (type: PaymentMethodType) => {
    setIsDialogOpen(false);
    onAddMethod(type);
  };

  const enabledOptions = options.filter((option) => option.isEnabled);

  return (
    <>
      <Card className="border-2 border-gray-200 border-dashed transition-colors hover:border-gray-300">
        <CardContent
          className="flex cursor-pointer flex-col items-center justify-center p-6 text-center"
          onClick={() => setIsDialogOpen(true)}
        >
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
            <Plus className="h-6 w-6 text-gray-500" />
          </div>
          <CardTitle className="mb-2 font-medium text-lg">
            Add Payment Method
          </CardTitle>
          <CardDescription>
            Add a new payment method to your account
          </CardDescription>
        </CardContent>
      </Card>

      <Dialog onOpenChange={setIsDialogOpen} open={isDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Payment Method</DialogTitle>
            <DialogDescription>
              Choose a payment method to add to your account
            </DialogDescription>
          </DialogHeader>

          {enabledOptions.length > 1 ? (
            <Tabs
              className="w-full"
              defaultValue={activeTab}
              onValueChange={setActiveTab}
            >
              <TabsList className="mb-4 grid grid-cols-2">
                {enabledOptions.map((option) => (
                  <TabsTrigger
                    disabled={isLoading}
                    key={option.id}
                    value={option.id}
                  >
                    <div className="flex items-center">
                      {option.icon}
                      <span className="ml-2">{option.name}</span>
                    </div>
                  </TabsTrigger>
                ))}
              </TabsList>

              {enabledOptions.map((option) => (
                <TabsContent
                  className="space-y-4"
                  key={option.id}
                  value={option.id}
                >
                  <div className="flex flex-col items-center justify-center p-4 text-center">
                    {option.icon}
                    <h3 className="mt-4 font-medium text-lg">{option.name}</h3>
                    <p className="mt-2 text-gray-500 text-sm">
                      {option.description}
                    </p>
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          ) : (
            <div className="flex flex-col items-center justify-center p-4 text-center">
              {enabledOptions[0]?.icon}
              <h3 className="mt-4 font-medium text-lg">
                {enabledOptions[0]?.name}
              </h3>
              <p className="mt-2 text-gray-500 text-sm">
                {enabledOptions[0]?.description}
              </p>
            </div>
          )}

          <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button
              disabled={isLoading}
              onClick={() => handleAddMethod(activeTab as PaymentMethodType)}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Add{" "}
                  {enabledOptions.find((o) => o.id === activeTab)?.name ||
                    "Payment Method"}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
