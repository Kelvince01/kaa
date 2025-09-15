import { cookies } from "next/headers";
import { getRequestConfig } from "next-intl/server";
import type { locales } from "@/types/next-int";

export default getRequestConfig(async () => {
  // Provide a static locale, fetch a user setting,
  // read from `cookies()`, `headers()`, etc.
  const langCookie = await cookies();
  const locale =
    (langCookie.get("NEXT_LOCALE")?.value as (typeof locales)[number]) ||
    "en-KE";

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
