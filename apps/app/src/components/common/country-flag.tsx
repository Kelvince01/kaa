import { cn } from "@kaa/ui/lib/utils";
import Image from "next/image";
import type React from "react";
import { useOnlineManager } from "@/hooks/use-online-manager";

interface ImgProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  countryCode: string;
  className?: string;
  imgType?: "svg" | "png";
}

export const CountryFlag = ({
  countryCode,
  className,
  imgType = "svg",
  width = 16,
  height = 12,
  ...props
}: ImgProps) => {
  const { isOnline } = useOnlineManager();

  if (typeof countryCode !== "string") return null;
  if (countryCode.toLowerCase() === "en") countryCode = "gb";

  const flagUrl =
    imgType === "svg"
      ? `/static/flags/${countryCode.toLowerCase()}.svg`
      : `/static/flags/png/${countryCode.toLowerCase()}.png`;

  if (!isOnline) return null;
  return (
    <Image
      className={cn("inline overflow-hidden shadow-xs", className)}
      {...props}
      alt={`Flag of ${countryCode.toUpperCase()}`}
      decoding="async"
      height={height as number}
      loading="lazy"
      src={flagUrl}
      width={width as number}
    />
  );
};

export default CountryFlag;
