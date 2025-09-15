import type messages from "../../messages/en-KE.json" with { type: "json" };

const locales = ["en-KE", "sw-KE"] as const;

declare module "next-intl" {
  type AppConfig = {
    Messages: typeof messages;
    Locale: (typeof locales)[number];
  };
}
