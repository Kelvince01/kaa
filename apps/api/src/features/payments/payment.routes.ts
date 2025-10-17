import { Elysia } from "elysia";

import { airtelMoneyController } from "./airtel-money.controller";
import { mpesaController } from "./mpesa.controller";
import { paymentController } from "./payment.controller";
import { paymentMethodController } from "./payment-method.controller";
import { recurringPaymentsController } from "./recurring-payments.controller";
import { stripeController } from "./stripe.controller";
import { walletController } from "./wallet.controller";

export const paymentRoutes = new Elysia({
  detail: {
    tags: ["payments"],
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
}).group("/payments", (app) =>
  app
    .use(paymentController)
    .use(paymentMethodController)
    .use(mpesaController)
    .use(airtelMoneyController)
    .use(stripeController)
    .use(walletController)
    .use(recurringPaymentsController)
);
