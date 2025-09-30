import { cn } from "@kaa/ui/lib/utils";

type FlipTextProps = {
  preTransitionText: React.ReactNode;
  postTransitionText: React.ReactNode;
  srOnlyText: string;
  className?: string;
};

/*
<FlipText
          preTransitionText="MJML + Liquid"
          postTransitionText="MJMLiquid"
          srOnlyText="MJML and Liquid"
          className="text-6xl font-sans"
        />
        */
export const FlipText = ({
  preTransitionText,
  postTransitionText,
  srOnlyText,
  className,
}: FlipTextProps) => {
  const renderFlipText = () => (
    <div aria-hidden="true" className="group relative block overflow-hidden">
      <span className="group-hover:-translate-y-full inline-block py-1 transition-all duration-300 ease-in-out">
        {preTransitionText}
      </span>
      <span className="absolute top-0 left-0 inline-block translate-y-full py-1 transition-all duration-300 ease-in-out group-hover:translate-y-0">
        {postTransitionText}
      </span>
    </div>
  );

  const renderText = () => (
    <div>
      <span className="inline-block py-1">{preTransitionText}</span>
    </div>
  );

  return (
    <div className={cn(className)}>
      <span className="sr-only">{srOnlyText}</span>
      <div className="block md:hidden">{renderText()}</div>
      <div className="hidden md:block">{renderFlipText()}</div>
    </div>
  );
};
