import { PaymentMethod } from "@kaa/models";
import { NotFoundError } from "@kaa/utils";

const getPaymentMethod = async (id: string) => {
  try {
    return await PaymentMethod.findById(id);
  } catch (error) {
    console.error("Error finding payment method:", error);
    return null;
  }
};

export const getPaymentMethods = async () => {
  try {
    return await PaymentMethod.find();
  } catch (error) {
    console.error("Error fetching payment methods:", error);
    return [];
  }
};

export const getUserPaymentMethods = async (userId: string) => {
  try {
    return await PaymentMethod.find({ userId });
  } catch (error) {
    console.error("Error fetching user payment methods:", error);
    return [];
  }
};

export const getPaymentMethodById = async (id: string) => {
  try {
    const paymentMethod = await getPaymentMethod(id);
    if (paymentMethod) {
      return paymentMethod;
    }
    throw new NotFoundError("Payment method not found");
  } catch (error) {
    console.error("Error fetching user:", error);
    throw error;
  }
};
