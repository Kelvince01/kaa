"use client";

import { ToggleGroup, ToggleGroupItem } from "@kaa/ui/components/toggle-group";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@kaa/ui/components/tooltip";
import { useQueryState } from "nuqs";
import * as React from "react";
import { type FlagConfig, flagConfig } from "@/config/flag";

type FilterFlag = FlagConfig["featureFlags"][number]["value"];

type FeatureFlagsContextValue = {
  filterFlag: FilterFlag;
  enableAdvancedFilter: boolean;
};

const FeatureFlagsContext =
  React.createContext<FeatureFlagsContextValue | null>(null);

export function useFeatureFlags() {
  const context = React.useContext(FeatureFlagsContext);
  if (!context) {
    throw new Error(
      "useFeatureFlags must be used within a FeatureFlagsProvider"
    );
  }
  return context;
}

type FeatureFlagsProviderProps = {
  children: React.ReactNode;
};

export function FeatureFlagsProvider({ children }: FeatureFlagsProviderProps) {
  const [filterFlag, setFilterFlag] = useQueryState<FilterFlag | null>(
    "filterFlag",
    {
      parse: (value) => {
        if (!value) return null;
        const validValues = flagConfig.featureFlags.map((flag) => flag.value);
        return validValues.includes(value as FilterFlag)
          ? (value as FilterFlag)
          : null;
      },
      serialize: (value) => value ?? "",
      defaultValue: null,
      clearOnDefault: true,
      shallow: false,
      eq: (a, b) => !(a || b) || a === b,
    }
  );

  const onFilterFlagChange = React.useCallback(
    (value: FilterFlag) => {
      setFilterFlag(value);
    },
    [setFilterFlag]
  );

  const contextValue = React.useMemo<FeatureFlagsContextValue>(
    () => ({
      filterFlag,
      enableAdvancedFilter:
        filterFlag === "advancedFilters" || filterFlag === "commandFilters",
    }),
    [filterFlag]
  );

  return (
    <FeatureFlagsContext.Provider value={contextValue}>
      <div className="w-full overflow-x-auto p-1">
        <ToggleGroup
          className="w-fit gap-0"
          onValueChange={onFilterFlagChange}
          size="sm"
          type="single"
          value={filterFlag}
          variant="outline"
        >
          {flagConfig.featureFlags.map((flag) => (
            <Tooltip delayDuration={700} key={flag.value}>
              <ToggleGroupItem
                asChild
                className="whitespace-nowrap px-3 text-xs data-[state=on]:bg-accent/70 data-[state=on]:hover:bg-accent/90"
                value={flag.value}
              >
                <TooltipTrigger>
                  <flag.icon className="size-3.5 shrink-0" />
                  {flag.label}
                </TooltipTrigger>
              </ToggleGroupItem>
              <TooltipContent
                align="start"
                className="flex flex-col gap-1.5 border bg-background py-2 font-semibold text-foreground [&>span]:hidden"
                side="bottom"
                sideOffset={6}
              >
                <div>{flag.tooltipTitle}</div>
                <p className="text-balance text-muted-foreground text-xs">
                  {flag.tooltipDescription}
                </p>
              </TooltipContent>
            </Tooltip>
          ))}
        </ToggleGroup>
      </div>
      {children}
    </FeatureFlagsContext.Provider>
  );
}
