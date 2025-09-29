import config from "@kaa/config/api";
import Stripe from "stripe";

// Initialize Stripe with the secret key from environment variables
const stripeClient = new Stripe(
  config.env === "production"
    ? config.stripe.secretKey
    : config.stripe.testSecretKey,
  {
    apiVersion: "2025-08-27.basil",
  }
);

export { stripeClient };
