import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

export async function getMetadata(
  params: { title?: string; description?: string } = {}
): Promise<Metadata> {
  const t = await getTranslations("metadata");
  const defaultTitle = t("default_title") as string;
  const defaultDescription = t("default_description") as string;

  return {
    title: params.title ? `${params.title} | ${defaultTitle}` : defaultTitle,
    description: params.description || defaultDescription,
    keywords:
      "rent, property, apartments, houses, flats, rental, tenants, landlords",
    metadataBase: new URL(
      process.env.NEXT_PUBLIC_APP_URL || "https://kaa.co.ke"
    ),
    openGraph: {
      title: params.title || defaultTitle,
      description: params.description || defaultDescription,
      url: "./",
      siteName: defaultTitle,
      locale: "en_KE",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: params.title || defaultTitle,
      description: params.description || defaultDescription,
      images: ["/og-image.png"],
    },
    robots: {
      index: true,
      follow: true,
    },
    icons: {
      icon: [
        { url: "/favicon.ico" },
        { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
        { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      ],
      apple: [
        { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
      ],
      other: [
        { rel: "mask-icon", url: "/icons/icon.svg" },
        { rel: "manifest", url: "/manifest.json" },
      ],
    },
    manifest: "/manifest.json",
    appleWebApp: {
      capable: true,
      statusBarStyle: "default",
      title: "Kaa",
    },
  };
}
