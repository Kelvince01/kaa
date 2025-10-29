import { Alert, AlertDescription } from "@kaa/ui/components/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@kaa/ui/components/alert-dialog";
import { Badge } from "@kaa/ui/components/badge";
import { Button } from "@kaa/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@kaa/ui/components/card";
import { CreditCard, ExternalLink, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  useCreateStripeSetupIntent,
  useDeleteStripePaymentMethod,
  useStripePaymentMethods,
} from "../stripe.queries";
import type { StripePaymentMethodResponse } from "../stripe.service";
import { formatCardDisplay, getStripeCardBrand } from "../stripe.service";

type StripePaymentMethodsProps = {
  onSelect?: (method: StripePaymentMethodResponse) => void;
  showAddNew?: boolean;
};

export function StripePaymentMethods({
  onSelect,
  showAddNew = true,
}: StripePaymentMethodsProps) {
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [setupClientSecret, setSetupClientSecret] = useState<string>("");

  const { data: paymentMethods, isLoading: isLoadingMethods } =
    useStripePaymentMethods("card");
  const { mutateAsync: deletePaymentMethod } = useDeleteStripePaymentMethod();
  const { mutateAsync: createSetupIntent } = useCreateStripeSetupIntent();

  const handleDelete = async (methodId: string, cardDisplay: string) => {
    try {
      setIsLoading(methodId);
      await deletePaymentMethod(methodId);
      toast.success(`${cardDisplay} removed successfully`);
    } catch (error) {
      toast.error("Failed to remove payment method");
    } finally {
      setIsLoading(null);
    }
  };

  const handleAddNew = async () => {
    try {
      const response = await createSetupIntent({
        paymentMethodTypes: ["card"],
      });

      setSetupClientSecret(response.clientSecret);
      toast.success("Setup intent created. Complete the setup in Stripe.");

      // In a real implementation, you would redirect to Stripe Setup or
      // initialize Stripe Elements here with the client secret
      window.open(
        `https://js.stripe.com/v3/setup/${response.clientSecret}`,
        "_blank"
      );
    } catch (error) {
      toast.error("Failed to create setup intent");
    }
  };

  if (isLoadingMethods) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="h-8 w-8 animate-spin rounded-full border-gray-900 border-b-2" />
        <span className="ml-2 text-gray-600 text-sm">
          Loading payment methods...
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {showAddNew && (
        <Button className="w-full" onClick={handleAddNew} variant="outline">
          <Plus className="mr-2 h-4 w-4" />
          Add New Card
        </Button>
      )}

      {setupClientSecret && (
        <Alert>
          <CreditCard className="h-4 w-4" />
          <AlertDescription>
            If the setup window didn't open,{" "}
            <Button asChild className="h-auto p-0" variant="link">
              <a
                href={`https://js.stripe.com/v3/setup/${setupClientSecret}`}
                rel="noopener noreferrer"
                target="_blank"
              >
                click here to add your card
                <ExternalLink className="ml-1 h-3 w-3" />
              </a>
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {!paymentMethods?.data || paymentMethods.data.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center">
            <CreditCard className="mx-auto mb-4 h-12 w-12 text-gray-400" />
            <h3 className="mb-2 font-semibold text-gray-900 text-lg">
              No payment methods
            </h3>
            <p className="mb-4 text-gray-600 text-sm">
              Add a credit or debit card to make payments.
            </p>
            {showAddNew && (
              <Button onClick={handleAddNew}>
                <Plus className="mr-2 h-4 w-4" />
                Add Your First Card
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {paymentMethods.data.map((method: StripePaymentMethodResponse) => (
            <Card className="relative" key={method.id}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="font-medium text-sm">
                  {method.card ? (
                    <div className="flex items-center space-x-2">
                      <CreditCard className="h-4 w-4" />
                      <span>
                        {formatCardDisplay(
                          method.card.last4,
                          method.card.brand
                        )}
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <CreditCard className="h-4 w-4" />
                      <span className="capitalize">{method.type}</span>
                    </div>
                  )}
                </CardTitle>
                {method.card && (
                  <Badge variant="outline">
                    {getStripeCardBrand(method.card.brand)}
                  </Badge>
                )}
              </CardHeader>
              <CardContent>
                {method.card && (
                  <CardDescription className="mb-3 text-xs">
                    Expires {method.card.exp_month.toString().padStart(2, "0")}/
                    {method.card.exp_year}
                  </CardDescription>
                )}
                <div className="flex space-x-2">
                  {onSelect && (
                    <Button
                      className="flex-1"
                      onClick={() => onSelect(method)}
                      size="sm"
                      variant="secondary"
                    >
                      Select
                    </Button>
                  )}
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        disabled={!!isLoading}
                        size="sm"
                        variant="outline"
                      >
                        {isLoading === method.id ? (
                          <div className="h-4 w-4 animate-spin rounded-full border-red-500 border-b-2" />
                        ) : (
                          <Trash2 className="h-4 w-4 text-red-500" />
                        )}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          Remove Payment Method
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to remove{" "}
                          {method.card
                            ? formatCardDisplay(
                                method.card.last4,
                                method.card.brand
                              )
                            : method.type}
                          ? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          className="bg-red-600 hover:bg-red-700"
                          onClick={() =>
                            handleDelete(
                              method.id,
                              method.card
                                ? formatCardDisplay(
                                    method.card.last4,
                                    method.card.brand
                                  )
                                : method.type
                            )
                          }
                        >
                          Remove
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
