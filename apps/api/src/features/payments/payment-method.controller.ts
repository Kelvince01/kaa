import { paymentMethodService } from "@kaa/services";
import Elysia, { t } from "elysia";
import type mongoose from "mongoose";
import { authPlugin } from "~/features/auth/auth.plugin";
import {
  type PaymentMethodResponse,
  paymentMethodSchema,
} from "./payment-method.schema";

export const paymentMethodController = new Elysia({
  detail: {
    tags: ["payments"],
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
}).group("/methods", (app) =>
  app.use(authPlugin).get(
    "/",
    async ({ set, user }) => {
      const paymentMethods = await paymentMethodService.getUserPaymentMethods(
        user.id
      );
      set.status = 200;
      const methods: PaymentMethodResponse[] = paymentMethods.map(
        (paymentMethod) => ({
          _id: (paymentMethod._id as mongoose.Types.ObjectId).toString(),
          type: paymentMethod.type,
          memberId: paymentMethod.memberId.toString(),
          userId: paymentMethod.userId.toString(),
          details: paymentMethod.details,
          isDefault: paymentMethod.isDefault,
        })
      );

      return {
        status: "success",
        data: methods,
      };
    },
    {
      response: {
        200: t.Object({
          status: t.Literal("success"),
          data: t.Array(paymentMethodSchema),
        }),
      },
      detail: {
        tags: ["payments"],
        summary: "Get user payment methods",
        description: "Get user payment methods",
      },
    }
  )
);
