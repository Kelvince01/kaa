import { SpinnerV3 } from "@kaa/ui/components/spinner";
import { cn } from "@kaa/ui/lib/utils";
import type { VariantProps } from "class-variance-authority";
import * as React from "react";

interface LoadingProps extends React.HTMLAttributes<HTMLDivElement> {
  fullPage?: boolean;
  spinnerSize?: VariantProps<typeof SpinnerV3>["size"];
}

const PageLoading = React.forwardRef<HTMLDivElement, LoadingProps>(
  ({ className, fullPage = true, spinnerSize = "md", ...props }, ref) => {
    return (
      <div
        className={cn(
          "flex items-center justify-center",
          fullPage && "fixed inset-0 bg-background/60 backdrop-blur-sm",
          className
        )}
        ref={ref}
        {...props}
      >
        <SpinnerV3 className="bg-black dark:bg-white" size={spinnerSize} />
      </div>
    );
  }
);

PageLoading.displayName = "PageLoading";

export { PageLoading };
