import type { Payment, PaymentMethod, PaymentMethodType } from "./payment.type";

// Format amount with currency
export const formatAmount = (amount: number, currency: string): string =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amount);

// Format card number to show only last 4 digits
export const formatCardNumber = (cardNumber: string): string =>
  `•••• ${cardNumber.slice(-4)}`;

// Get payment method icon
export const getPaymentMethodIcon = (type: PaymentMethodType): string => {
  switch (type) {
    case "mpesa":
      return "/icons/mpesa.svg";
    case "card":
      return "/icons/credit-card.svg";
    case "bank":
      return "/icons/bank.svg";
    default:
      return "/icons/payment.svg";
  }
};

// Format payment method display name
export const formatPaymentMethodName = (method: PaymentMethod): string => {
  switch (method.type) {
    case "mpesa":
      return `M-PESA (${method.phoneNumber})`;
    case "card":
      return `${method.brand} ending in ${method.lastFour}`;
    case "bank":
      return "Bank Account";
    default:
      return "Unknown Payment Method";
  }
};

// Calculate payment total with fees
export const calculatePaymentTotal = (
  amount: number,
  feePercentage: number
): number => {
  const fee = (amount * feePercentage) / 100;
  return amount + fee;
};

// Group payments by status
export const groupPaymentsByStatus = (
  payments: Payment[]
): Record<string, Payment[]> =>
  payments.reduce(
    (acc, payment) => {
      if (!acc[payment.status]) {
        acc[payment.status] = [];
      }
      acc[payment.status]?.push(payment);
      return acc;
    },
    {} as Record<string, Payment[]>
  );
