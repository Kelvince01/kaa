import type { Viewport } from "next";
import { DM_Sans, DM_Serif_Display } from "next/font/google";
import "./globals.css";
import { notFound } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { getLocale } from "next-intl/server";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { DesktopHeader } from "@/components/desktop/desktop-header";
import { Providers } from "@/components/providers";
import { getMetadata } from "@/config/metadata";
import type { locales } from "@/types/next-int";

const dmSans = DM_Sans({
  variable: "--font-sans",
  weight: ["400", "500", "700"],
  subsets: ["latin"],
});

const dmSerifDisplay = DM_Serif_Display({
  variable: "--font-serif",
  weight: ["400"],
  subsets: ["latin"],
});

// Load messages for the current locale
async function getMessages(locale: (typeof locales)[number]) {
  try {
    return (await import(`../../messages/${locale}.json`)).default;
  } catch (error: unknown) {
    console.error(error);
    notFound();
  }
}

export async function generateMetadata() {
  return await getMetadata();
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#3b82f6",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages(locale as (typeof locales)[number]);

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <meta content="Kaa" name="apple-mobile-web-app-title" />
      </head>
      <body
        className={`${dmSans.variable} ${dmSerifDisplay.variable} font-sans antialiased`}
      >
        <DesktopHeader />

        <NuqsAdapter>
          <NextIntlClientProvider messages={messages}>
            <Providers>{children}</Providers>
          </NextIntlClientProvider>
        </NuqsAdapter>
      </body>
    </html>
  );
}
