import type { Entity } from "@kaa/config";
import { Avatar, AvatarFallback, AvatarImage } from "@kaa/ui/components/avatar";
import { cn } from "@kaa/ui/lib/utils";
import type { AvatarProps } from "@radix-ui/react-avatar";
import { memo, useMemo } from "react";
import { numberToColorClass } from "@/shared/utils/number-to-color-class";

export interface AvatarWrapProps extends AvatarProps {
  id?: string;
  type?: Entity;
  name?: string | null;
  url?: string | null;
  className?: string;
}

const AvatarWrap = memo(
  ({ type, id, name, url, className, ...props }: AvatarWrapProps) => {
    const avatarBackground = useMemo(() => numberToColorClass(id), [id]);

    return (
      //key will force remounting of AvatarImage or AvatarFallback when URL changes
      <Avatar
        key={url ? "image" : "fallback"}
        {...props}
        className={cn("group", className)}
        data-type={type}
      >
        {url ? (
          <AvatarImage
            className="rounded-md bg-muted group-data-[type=user]:rounded-full"
            draggable="false"
            src={`${url}?width=100&format=avif`}
          />
        ) : (
          <AvatarFallback
            className={cn(
              "bg-muted",
              avatarBackground,
              type && type === "user" ? "rounded-full" : "rounded-md"
            )}
          >
            <span className="sr-only">{name}</span>
            <div className="flex h-full items-center justify-center text-black opacity-80">
              {name?.charAt(0).toUpperCase() || "-"}
            </div>
          </AvatarFallback>
        )}
      </Avatar>
    );
  }
);

export { AvatarWrap };
