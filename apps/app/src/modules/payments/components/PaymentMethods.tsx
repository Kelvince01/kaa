import { useState } from "react";
import { usePaymentMethods, useSetDefaultPaymentMethod } from "../payment.queries";
import { formatPaymentMethodName, getPaymentMethodIcon } from "../payment.util";
import type { PaymentMethod } from "../payment.type";
import { Button } from "@kaa/ui/components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@kaa/ui/components/card";
import { toast } from "sonner";

interface PaymentMethodsProps {
	tenantId: string;
	onSelect?: (method: PaymentMethod) => void;
}

export function PaymentMethods({ tenantId, onSelect }: PaymentMethodsProps) {
	const [isLoading, setIsLoading] = useState<string | null>(null);
	const { data: paymentMethods, isLoading: isLoadingMethods } = usePaymentMethods(tenantId);
	const { mutateAsync: setDefault } = useSetDefaultPaymentMethod();

	const handleSetDefault = async (method: PaymentMethod) => {
		try {
			setIsLoading(method.id);
			await setDefault({ tenantId, paymentMethodId: method.id });
			toast.success("Default payment method updated");
		} catch (error) {
			toast.error("Failed to update default payment method");
		} finally {
			setIsLoading(null);
		}
	};

	if (isLoadingMethods) {
		return <div>Loading payment methods...</div>;
	}

	return (
		<div className="space-y-4">
			{paymentMethods?.map((method) => (
				<Card key={method.id} className={method.isDefault ? "border-primary" : ""}>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="font-medium text-sm">{formatPaymentMethodName(method)}</CardTitle>
						<img src={getPaymentMethodIcon(method.type)} alt={method.type} className="h-4 w-4" />
					</CardHeader>
					<CardContent>
						<CardDescription className="text-xs">
							{method.isDefault ? "Default payment method" : ""}
						</CardDescription>
						<div className="mt-2 flex space-x-2">
							{!method.isDefault && (
								<Button
									variant="outline"
									size="sm"
									onClick={() => handleSetDefault(method)}
									disabled={!!isLoading}
								>
									{isLoading === method.id ? "Setting..." : "Set as Default"}
								</Button>
							)}
							{onSelect && (
								<Button variant="secondary" size="sm" onClick={() => onSelect(method)}>
									Select
								</Button>
							)}
						</div>
					</CardContent>
				</Card>
			))}
		</div>
	);
}
