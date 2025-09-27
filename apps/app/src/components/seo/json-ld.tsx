import { siteConfig } from "./metadata";

export function JsonLd() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: siteConfig.name,
    description: siteConfig.description,
    url: siteConfig.url,
    applicationCategory: "DeveloperApplication",
    operatingSystem: "Any",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    image: {
      "@type": "ImageObject",
      url: `${siteConfig.url}/og-image.png`,
      width: "1200",
      height: "630",
    },
    featureList: [
      "Real-time MJML preview",
      "Liquid template support",
      "Local and shared variables",
      "Responsive design",
      "Dark mode support",
      "Keyboard shortcuts",
      "Hotkey navigation",
      "Syntax highlighting",
      "Autocompletion",
      "Export to HTML",
      "Export to MJML",
    ],
    keywords: siteConfig.keywords,
  };

  return (
    <script
      // biome-ignore lint/security/noDangerouslySetInnerHtml: ignore
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      type="application/ld+json"
    />
  );
}
