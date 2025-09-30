import { cn } from "@kaa/ui/lib/utils";
import type { LucideProps } from "lucide-react";
import type React from "react";

type Props = {
  title: string;
  Icon?: React.ElementType<LucideProps>;
  text?: string | React.ReactNode;
  className?: string;
  textClassName?: string;
};

const ContentPlaceholder = ({
  title,
  Icon,
  text,
  textClassName = "",
  className = "",
}: Props) => (
  <div
    className={cn(
      "relative flex h-full w-full flex-col items-center justify-center p-8 text-center",
      className
    )}
  >
    {Icon && <Icon className="opacity-50" size={80} strokeWidth={0.7} />}
    <p className="mt-4 text-sm opacity-60">{title}</p>
    {text && (
      <div className={cn("mt-12 font-medium text-sm", textClassName)}>
        {text}
      </div>
    )}
  </div>
);

export default ContentPlaceholder;
