import { cn } from "@kaa/ui/lib/utils";
import React from "react";

type EmptyProps = {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
};

/*
1. Basic Empty State:
<Empty 
  title="No documents found" 
  description="Start by uploading your first document." 
/>

2. With Icon and Action:
<Empty 
  title="No results" 
  description="Try adjusting your filters." 
  icon={<FileText className="h-8 w-8" />}
  action={<Button onClick={clearFilters}>Clear Filters</Button>}
/>

3. Custom Content:
<Empty>
  <div>Custom empty state content</div>
</Empty>
*/
const Empty = React.forwardRef<HTMLDivElement, EmptyProps>(
  (
    { title, description, icon, action, className, children, ...props },
    ref
  ) => (
    <div
      className={cn(
        "flex min-h-[400px] flex-col items-center justify-center space-y-4 text-center",
        className
      )}
      ref={ref}
      {...props}
    >
      {icon && (
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
          {icon}
        </div>
      )}

      <div className="space-y-2">
        {title && (
          <h3 className="font-semibold text-lg tracking-tight">{title}</h3>
        )}

        {description && (
          <p className="max-w-md text-muted-foreground text-sm">
            {description}
          </p>
        )}
      </div>

      {action && <div className="pt-4">{action}</div>}

      {children}
    </div>
  )
);

Empty.displayName = "Empty";

export { Empty, type EmptyProps };
