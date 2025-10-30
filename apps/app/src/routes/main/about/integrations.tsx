import { ScrollArea, ScrollBar } from "@kaa/ui/components/scroll-area";
import { ArrowUpRight } from "lucide-react";
import { useTranslations } from "next-intl";
import CountryFlag from "@/components/common/country-flag";
import { useUIStore } from "@/shared/stores/ui.store";

type Integrations = {
  name: string;
  planned?: boolean;
  url: string;
  invert?: boolean;
  logo: string;
  country: string;
};

const integrations: Integrations[] = [
  { name: "Sentry", country: "US", url: "sentry.io", logo: "sentry.svg" },
  {
    name: "Better Stack",
    invert: true,
    country: "CZ",
    url: "betterstack.com",
    logo: "betterstack.svg",
  },
  { name: "Paddle", country: "GB", url: "paddle.com", logo: "paddle.svg" },
  {
    name: "Tiptap",
    country: "NL",
    url: "tiptap.org",
    logo: "tiptap.svg",
  },
  { name: "Novu", country: "IL", url: "novu.co", logo: "novu.svg" },
  { name: "Gleap", country: "AT", url: "gleap.io", logo: "gleap.svg" },
  { name: "Imado", country: "NL", url: "imado.eu", logo: "imado.svg" },
];

const Integrations = () => {
  const t = useTranslations();
  const mode = useUIStore((state) => state.mode);

  return (
    <ScrollArea
      className="w-full"
      orientation="horizontal"
      size="defaultHorizontal"
    >
      <div className="flex w-max space-x-4 px-2 py-8">
        {integrations.map(
          ({ planned, url, logo, name, invert, country }, index) => {
            const text = `about.integrations.text_${index + 1}`;
            const purpose = `about.integrations.purpose_${index + 1}`;

            return (
              <a
                className="group relative flex h-96 w-72 shrink-0 flex-col justify-between rounded-lg border p-5 hover:cursor-pointer hover:border-primary hover:ring-4 hover:ring-primary/10"
                href={`https://${url}`}
                key={name}
                rel="noreferrer"
                target="_blank"
              >
                {planned && (
                  <div className="absolute top-0 right-0 rounded-tr-md rounded-bl-md bg-foreground/25 px-2 py-1 text-white text-xs">
                    Planned
                  </div>
                )}
                <div className="flex items-center space-x-2">
                  {/** biome-ignore lint/nursery/useImageSize: useImageSize */}
                  {/** biome-ignore lint/performance/noImgElement: noImgElement */}
                  <img
                    alt={name}
                    className={`h-8 w-8 object-contain ${invert && mode === "dark" && "invert"}`}
                    loading="lazy"
                    src={`/static/images/integrations/${logo}`}
                  />
                  <span className="ml-4 font-medium">{name}</span>
                </div>
                <div className="grow overflow-hidden pt-4 text-sm">
                  <span className="font-light">{t(text)}</span>
                </div>
                <div className="pt-2 text-xs">
                  <div className="mb-2 text-muted-foreground italic">
                    {t(purpose)}
                  </div>
                  <div className="font-semibold text-muted-foreground underline-offset-4 group-hover:underline">
                    <CountryFlag className="mr-2" countryCode={country} />
                    {url}
                    <ArrowUpRight
                      className="-mt-2 ml-1 inline-block text-primary opacity-50 group-hover:opacity-100"
                      size={12}
                    />
                  </div>
                </div>
              </a>
            );
          }
        )}
      </div>

      <ScrollBar orientation="horizontal" size="defaultHorizontal" />
    </ScrollArea>
  );
};

export default Integrations;
