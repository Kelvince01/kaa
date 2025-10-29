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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@kaa/ui/components/dropdown-menu";
import {
  Building2,
  CreditCard,
  MoreVertical,
  Smartphone,
  Star,
  StarOff,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  useDeletePaymentMethod,
  usePaymentMethods,
  useSetDefaultPaymentMethod,
} from "../methods.queries";
import {
  formatPaymentMethodName,
  getPaymentMethodDisplayInfo,
  type PaymentMethodResponse,
} from "../methods.service";

type PaymentMethodsListProps = {
  tenantId: string;
  onSelect?: (method: PaymentMethodResponse) => void;
  onEdit?: (method: PaymentMethodResponse) => void;
  showActions?: boolean;
  emptyState?: React.ReactNode;
};

export function PaymentMethodsList({
  tenantId,
  onSelect,
  onEdit,
  showActions = true,
  emptyState,
}: PaymentMethodsListProps) {
  const [isLoading, setIsLoading] = useState<string | null>(null);

  const { data: paymentMethods, isLoading: isLoadingMethods } =
    usePaymentMethods(tenantId);
  const { mutateAsync: setDefault } = useSetDefaultPaymentMethod();
  const { mutateAsync: deleteMethod } = useDeletePaymentMethod();

  const handleSetDefault = async (method: PaymentMethodResponse) => {
    if (method.isDefault) return;

    try {
      setIsLoading(method.id);
      await setDefault({ tenantId, methodId: method.id });
      toast.success(`${formatPaymentMethodName(method)} set as default`);
    } catch (error) {
      toast.error("Failed to update default payment method");
    } finally {
      setIsLoading(null);
    }
  };

  const handleDelete = async (method: PaymentMethodResponse) => {
    if (method.isDefault) {
      toast.error(
        "Cannot delete the default payment method. Set another as default first."
      );
      return;
    }

    try {
      setIsLoading(method.id);
      await deleteMethod({ tenantId, methodId: method.id });
      toast.success(`${formatPaymentMethodName(method)} removed successfully`);
    } catch (error) {
      toast.error("Failed to remove payment method");
    } finally {
      setIsLoading(null);
    }
  };

  const getTypeIcon = (type: PaymentMethodResponse["type"]) => {
    switch (type) {
      case "mpesa":
        return <Smartphone className="h-4 w-4 text-green-600" />;
      case "card":
        return <CreditCard className="h-4 w-4 text-blue-600" />;
      case "bank":
        return <Building2 className="h-4 w-4 text-gray-600" />;
      default:
        return <CreditCard className="h-4 w-4" />;
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

  if (!paymentMethods || paymentMethods.length === 0) {
    return (
      emptyState || (
        <Card>
          <CardContent className="pt-6 text-center">
            <CreditCard className="mx-auto mb-4 h-12 w-12 text-gray-400" />
            <h3 className="mb-2 font-semibold text-gray-900 text-lg">
              No payment methods
            </h3>
            <p className="text-gray-600 text-sm">
              Add a payment method to get started with making payments.
            </p>
          </CardContent>
        </Card>
      )
    );
  }

  return (
    <div className="space-y-4">
      {paymentMethods.map((method) => {
        const displayInfo = getPaymentMethodDisplayInfo(method);

        return (
          <Card
            className={`relative ${method.isDefault ? "ring-2 ring-blue-500" : ""}`}
            key={method.id}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="flex items-center space-x-3">
                {getTypeIcon(method.type)}
                <div>
                  <CardTitle className="flex items-center space-x-2 font-medium text-sm">
                    <span>{displayInfo.title}</span>
                    {method.isDefault && (
                      <Badge className="text-xs" variant="default">
                        <Star className="mr-1 h-3 w-3" />
                        Default
                      </Badge>
                    )}
                  </CardTitle>
                  <CardDescription className="text-xs">
                    {displayInfo.subtitle}
                  </CardDescription>
                </div>
              </div>

              {showActions && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button disabled={!!isLoading} size="sm" variant="ghost">
                      {isLoading === method.id ? (
                        <div className="h-4 w-4 animate-spin rounded-full border-gray-500 border-b-2" />
                      ) : (
                        <MoreVertical className="h-4 w-4" />
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {onSelect && (
                      <DropdownMenuItem onClick={() => onSelect(method)}>
                        Select
                      </DropdownMenuItem>
                    )}
                    {onEdit && (
                      <DropdownMenuItem onClick={() => onEdit(method)}>
                        Edit
                      </DropdownMenuItem>
                    )}
                    {!method.isDefault && (
                      <DropdownMenuItem
                        onClick={() => handleSetDefault(method)}
                      >
                        <Star className="mr-2 h-4 w-4" />
                        Set as Default
                      </DropdownMenuItem>
                    )}
                    {method.isDefault && (
                      <DropdownMenuItem disabled>
                        <StarOff className="mr-2 h-4 w-4" />
                        Already Default
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem
                      className="text-red-600"
                      disabled={method.isDefault}
                      onClick={() => handleDelete(method)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Remove
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </CardHeader>

            {displayInfo.expiry && (
              <CardContent className="pt-0">
                <CardDescription className="text-xs">
                  Expires {displayInfo.expiry}
                </CardDescription>
              </CardContent>
            )}

            {onSelect && !showActions && (
              <CardContent className="pt-0">
                <Button
                  className="w-full"
                  onClick={() => onSelect(method)}
                  size="sm"
                  variant="secondary"
                >
                  Select Payment Method
                </Button>
              </CardContent>
            )}
          </Card>
        );
      })}
    </div>
  );
}
