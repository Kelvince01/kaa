"use client";

import { Button, buttonVariants } from "@kaa/ui/components/button";
import { Input } from "@kaa/ui/components/input";
import { cn } from "@kaa/ui/lib/utils";
import { ArrowDown, Check, Copy } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard";
import { useScrollSpy } from "@/hooks/use-scroll-spy";
import CallToAction from "./call-to-action";
import FAQ from "./faq";
import Features from "./features";
import { Hero } from "./hero";
import Integrations from "./integrations";
import Showcase from "./showcase";
import Why from "./why";

import "./glow-button.css";

type AboutSectionProps = {
  section: string;
  title?: string;
  text?: string;
  children?: React.ReactNode;
  alternate?: boolean; // Optional prop for background styling
};

const AboutSection = ({
  title,
  text,
  section,
  children,
  alternate = false,
}: AboutSectionProps) => {
  const t = useTranslations();

  const backgroundClass = alternate ? "bg-accent/40 dark:bg-transparent" : "";

  return (
    <section
      className={`container max-w-none overflow-hidden py-8 md:py-12 lg:py-24 ${backgroundClass}`}
      id={section}
    >
      <div className="mx-auto mb-12 flex max-w-[48rem] flex-col justify-center gap-4">
        {title && (
          <h2 className="font-heading font-semibold text-3xl leading-[1.1] sm:text-center md:text-4xl">
            {t(title)}
          </h2>
        )}
        {text && (
          <p className="text-muted-foreground leading-normal sm:text-center sm:text-lg sm:leading-7">
            {t(text)}
          </p>
        )}
      </div>
      {children}
    </section>
  );
};

const sectionIds = [
  "hero",
  "why",
  "features",
  "integrations",
  "showcase",
  "call-to-action",
];

const AboutContainer = () => {
  const t = useTranslations();
  const router = useRouter();

  const { copyToClipboard, copied } = useCopyToClipboard();

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();

    const currentHash = window.location.hash;

    if (currentHash === "#why") {
      router.replace("/about#top");
    }

    setTimeout(() => {
      router.replace("/about#why");
    }, 20);
  };

  useScrollSpy({ sectionIds });

  return (
    <div>
      {/* Hero landing */}
      <Hero
        badgeText="about.prerelease"
        key={"hero"}
        subtitle="about.hero.subtitle"
        text="about.hero.text"
        title=""
      >
        <div className="glow-button relative mb-8 max-xs:hidden">
          <Input
            className="block h-14 w-96 rounded-full border border-transparent bg-background px-8 py-6 font-light font-mono text-sm ring-4 ring-primary/10 transition focus:border-gray-500 focus:outline-hidden focus-visible:ring-primary/20"
            readOnly
            value="pnpm create @Kelvince01/kaa"
          />
          {copied && (
            <div className="absolute top-2.5 right-2 left-8 rounded-full bg-background py-2 text-left font-mono text-sm">
              copied! bon voyage 🚀
            </div>
          )}

          <Button
            className="absolute top-2 right-2 rounded-full"
            onClick={() => copyToClipboard("pnpm create @Kelvince01/kaa")}
            size="icon"
            variant="ghost"
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
          </Button>
        </div>
        <Link
          aria-label="Read more"
          className={cn(buttonVariants({ variant: "ghost", size: "lg" }))}
          href="/about#why"
          onClick={handleClick}
          scroll={false}
        >
          <span className="font-light">{t("about.why")}</span>
          <ArrowDown className="ml-2 animate-bounce" size={16} />
        </Link>
      </Hero>

      <div className="my-12">
        {/* Why this product */}
        <AboutSection
          key={"why"}
          section="why"
          text="about.text_2"
          title="about.title_2"
        >
          <Why />
        </AboutSection>

        {/* Features */}
        <AboutSection
          alternate={true}
          key={"features"}
          section="features"
          text="about.text_3"
          title="about.title_3"
        >
          <Features />
        </AboutSection>

        {/* Integrations */}
        <AboutSection
          key={"integrations"}
          section="integrations"
          text="about.text_4"
          title="about.title_4"
        >
          <Integrations />
        </AboutSection>

        {/* Showcase */}
        <AboutSection
          key={"showcase"}
          section="showcase"
          text="about.showcase.text"
          title="about.showcase.title"
        >
          <Showcase />
        </AboutSection>

        {/* Call to Action */}
        <AboutSection
          alternate={true}
          key={"call-to-action"}
          section="call-to-action"
        >
          <CallToAction />
        </AboutSection>

        {/* FAQs */}
        <AboutSection
          alternate={true}
          key={"faqs"}
          section="faqs"
          text="about.text_7"
          title="about.title_7"
        >
          <FAQ />
        </AboutSection>
      </div>
    </div>
  );
};

export default AboutContainer;
