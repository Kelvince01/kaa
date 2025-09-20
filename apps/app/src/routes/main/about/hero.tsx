import { config } from "@kaa/config";
import { Badge } from "@kaa/ui/components/badge";
import { useTranslations } from "next-intl";
import { useInView } from "react-intersection-observer";
import { useUIStore } from "@/shared/stores/ui.store";

type HeroProps = {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  text?: string;
  badgeText?: string;
};

export const Hero = ({
  title,
  subtitle,
  text,
  children,
  badgeText,
}: HeroProps) => {
  const t = useTranslations();
  const { theme } = useUIStore();
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.5,
  });

  const gradientClass =
    theme === "none"
      ? "from-slate-600 via-neutral-400 to-stone-700 text-primary/50"
      : "from-rose-800 via-rose-600 to-pink-800 text-transparent";
  const sectionClass =
    "rich-gradient relative flex min-h-[90vh] items-center justify-center space-y-6 py-24 px-4 lg:py-32";
  const headerClass = `transition-all will-change-transform duration-500 ease-out ${inView ? "opacity-100" : "opacity-0 scale-95 translate-y-4"}`;

  return (
    <>
      <section className={sectionClass} id="hero">
        <header className={headerClass} ref={ref}>
          <div className="container flex max-w-5xl flex-col items-center gap-4 text-center">
            {badgeText && (
              <Badge className="hidden sm:block">{t(badgeText)}</Badge>
            )}
            <h1 className="test-primary mt-6 mb-6 font-heading text-4xl sm:text-5xl md:text-6xl lg:text-7xl">
              {title && <span>{t(title)}</span>}
              {title && subtitle && <br />}
              {subtitle && (
                <span
                  className={`bg-linear-to-br ${gradientClass} bg-clip-text font-bold`}
                >
                  {t(subtitle)}
                </span>
              )}
            </h1>
            {text && (
              <h2 className="mx-auto mb-8 max-w-[48rem] text-foreground/80 text-xl md:text-2xl">
                {t.rich(text, {
                  strong: (chunks: React.ReactNode) => (
                    <strong>{chunks}</strong>
                  ),
                })}
              </h2>
            )}
            <div className="space-x-4">{children}</div>
          </div>
        </header>
      </section>
      <div className="absolute z-[-1] mt-[-16vw] w-full rotate-180">
        <BackgroundCurve />
      </div>
    </>
  );
};

export const BackgroundCurve = () => {
  const mode = useUIStore((state) => state.mode);
  const fillColor = mode === "dark" ? config.theme.colorDarkBackground : "#fff";

  return (
    <svg aria-hidden="true" className="transition" viewBox="0 0 800 400">
      <title>Background curve</title>
      <path
        className="transition"
        d="M 800 300 Q 400 250 0 300 L 0 0 L 800 0 L 800 300 Z"
        fill={fillColor}
        id="curve"
      />
    </svg>
  );
};
