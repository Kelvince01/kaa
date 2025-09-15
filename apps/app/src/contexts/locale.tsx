import {
  NextIntlClientProvider,
  useLocale,
  useMessages,
  useTimeZone,
} from "next-intl";
import type { FC, PropsWithChildren } from "react";
import { captureNextIntlError } from "@/lib/capture-next-intl-error";

export const LocaleProvider: FC<PropsWithChildren> = ({ children }) => {
  const locale = useLocale();

  // Receive messages provided in `i18n.ts`
  const messages = useMessages();
  const timezone = useTimeZone();

  return (
    <NextIntlClientProvider
      locale={locale}
      messages={messages}
      onError={captureNextIntlError}
      timeZone={timezone}
    >
      {children}
    </NextIntlClientProvider>
  );
};
