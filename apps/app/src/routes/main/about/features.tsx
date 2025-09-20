import { useTranslations } from "next-intl";
import { ExpandableList } from "@/components/common/expandable-list";
import { useBreakpoints } from "@/hooks/use-breakpoints";
import { useUIStore } from "@/shared/stores/ui.store";
import { features } from "../marketing-config";

type FeatureProps = {
  icon: string;
  invertClass: string;
  index: number;
};

const Feature = ({ icon, invertClass, index }: FeatureProps) => {
  const t = useTranslations();
  const title = `about.feature.title_${index + 1}`;
  const text = `about.feature.text_${index + 1}`;

  return (
    <div className="relative overflow-hidden rounded-lg bg-card p-2">
      <div className="flex h-44 flex-col justify-between gap-2 rounded-md p-6">
        {/** biome-ignore lint/nursery/useImageSize: useImageSize */}
        {/** biome-ignore lint/performance/noImgElement: noImgElement */}
        <img
          alt={title}
          className={`mb-2 h-8 w-8 object-contain ${invertClass}`}
          loading="lazy"
          src={`/static/images/features/${icon}.svg`}
        />
        <h3 className="font-medium">{t(title)}</h3>
        <p className="grow text-muted-foreground text-sm">{t(text)}</p>
      </div>
    </div>
  );
};

const Features = () => {
  const mode = useUIStore((state) => state.mode);
  const invertClass = mode === "dark" ? "invert" : "";
  const isMediumScreen = useBreakpoints("min", "md");

  return (
    <div className="mx-auto grid max-w-5xl justify-center gap-4 sm:grid-cols-2 md:grid-cols-3">
      <ExpandableList
        alwaysShowAll={isMediumScreen}
        expandText="common.more_features"
        initialDisplayCount={4}
        items={features}
        renderItem={(feature, index) => (
          <Feature
            key={feature.icon}
            {...feature}
            index={index}
            invertClass={invertClass}
          />
        )}
      />
    </div>
  );
};

export default Features;
