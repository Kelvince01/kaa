import { Badge } from "@kaa/ui/components/badge";
import { Button } from "@kaa/ui/components/button";
import { ChevronDown } from "lucide-react";
import { useTranslations } from "next-intl";
import type React from "react";
import { useState } from "react";

type ExpandableListProps = {
  items: unknown[];
  renderItem: (item: any, index: number) => React.ReactNode;
  initialDisplayCount: number;
  alwaysShowAll?: boolean;
  expandText: string;
};

export const ExpandableList = ({
  items,
  renderItem,
  initialDisplayCount,
  alwaysShowAll,
  expandText,
}: ExpandableListProps) => {
  const t = useTranslations();
  const [displayCount, setDisplayCount] = useState(
    alwaysShowAll ? items.length : initialDisplayCount
  );

  const handleLoadMore = () => {
    setDisplayCount(items.length);
  };

  const visibleItems = items.slice(0, displayCount);
  return (
    <>
      {visibleItems.map(renderItem)}
      {displayCount < items.length && (
        <Button
          className="group mt-4 w-full"
          onClick={handleLoadMore}
          variant="ghost"
        >
          <Badge className="mr-2 aspect-square px-1 py-0">
            {items.length - initialDisplayCount}
          </Badge>
          {t(expandText)}
          <ChevronDown
            className="ml-2 opacity-50 transition-opacity group-hover:opacity-100"
            size={16}
          />
        </Button>
      )}
    </>
  );
};
