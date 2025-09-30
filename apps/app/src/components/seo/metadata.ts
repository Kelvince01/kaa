import type { Metadata } from "next";

export const siteConfig = {
  name: "MJML Editor",
  title: "MJMLiquid • Online MJML Email Template Builder with Liquid Support",
  description:
    "Free online MJML editor and email template builder. Create, edit, and preview responsive email templates with MJML and Liquid support. Real-time preview, with local and shared variables for flexible Liquid templating.",
  keywords:
    "mjml, mjml editor, mjml online, email template builder, mjml template, email editor, liquid template, mjml playground, responsive email, email development, mjml live editor, free mjml editor",
  authors: [{ name: "Kok Wee", url: "https://kokwee.com" }],
  url: "https://www.mjmliquid.com",
};

export const generateCustomMetadata = (title: string): Metadata => ({
  ...metadata,
  title: `MJMLiquid • ${title}`,
});

export const metadata: Metadata = {
  title: siteConfig.title,
  description: siteConfig.description,
  keywords: siteConfig.keywords,
  authors: siteConfig.authors,
  metadataBase: new URL(siteConfig.url),
  openGraph: {
    title: siteConfig.title,
    description: siteConfig.description,
    url: siteConfig.url,
    siteName: siteConfig.name,
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: siteConfig.title,
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.title,
    description: siteConfig.description,
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: siteConfig.url,
  },
} as const;
