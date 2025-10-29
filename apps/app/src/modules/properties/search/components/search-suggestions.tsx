/**
 * Search suggestions component - displays autocomplete suggestions
 */
"use client";

import { Badge } from "@kaa/ui/components/badge";
import { Button } from "@kaa/ui/components/button";
import { Card, CardContent } from "@kaa/ui/components/card";
import { Separator } from "@kaa/ui/components/separator";
import { Skeleton } from "@kaa/ui/components/skeleton";
import {
  Building,
  Clock,
  MapPin,
  Search,
  Star,
  TrendingUp,
} from "lucide-react";
import type { SearchSuggestion } from "../search.types";

type SearchSuggestionsProps = {
  suggestions: SearchSuggestion[];
  recentSearches?: string[];
  popularSearches?: Array<{ query: string; count: number }>;
  isLoading?: boolean;
  onSuggestionClick: (
    suggestion: SearchSuggestion | { query: string; text: string }
  ) => void;
  onClearRecent?: () => void;
  className?: string;
};

const iconMap = {
  location: MapPin,
  property_type: Building,
  feature: Star,
  recent: Clock,
  popular: TrendingUp,
};

export default function SearchSuggestions({
  suggestions,
  recentSearches = [],
  popularSearches = [],
  isLoading = false,
  onSuggestionClick,
  onClearRecent,
  className,
}: SearchSuggestionsProps) {
  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="p-4">
          <div className="space-y-2">
            {Array.from({ length: 5 }, (_, i) => (
              <Skeleton className="h-10 w-full" key={`skeleton-${i + 1}`} />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const hasSuggestions = suggestions.length > 0;
  const hasRecentSearches = recentSearches.length > 0;
  const hasPopularSearches = popularSearches.length > 0;
  const hasContent = hasSuggestions || hasRecentSearches || hasPopularSearches;

  if (!hasContent) {
    return null;
  }

  return (
    <Card className={className}>
      <CardContent className="p-2">
        <div className="space-y-1">
          {/* Suggestions */}
          {hasSuggestions && (
            <div>
              <div className="px-2 py-1.5 font-medium text-muted-foreground text-xs">
                Suggestions
              </div>
              {suggestions.map((suggestion, index) => {
                const Icon = iconMap[suggestion.type] || Search;
                return (
                  <button
                    className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left transition-colors hover:bg-accent"
                    key={`suggestion-${suggestion.text}-${index}`}
                    onClick={() => onSuggestionClick(suggestion)}
                    type="button"
                  >
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <span className="flex-1">{suggestion.text}</span>
                    {suggestion.count !== undefined && (
                      <Badge variant="secondary">{suggestion.count}</Badge>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* Recent Searches */}
          {hasRecentSearches && (
            <>
              {hasSuggestions && <Separator className="my-2" />}
              <div>
                <div className="flex items-center justify-between px-2 py-1.5">
                  <span className="font-medium text-muted-foreground text-xs">
                    Recent Searches
                  </span>
                  {onClearRecent && (
                    <Button
                      className="h-auto p-0 text-xs"
                      onClick={onClearRecent}
                      size="sm"
                      variant="ghost"
                    >
                      Clear
                    </Button>
                  )}
                </div>
                {recentSearches.slice(0, 5).map((query, index) => (
                  <button
                    className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left transition-colors hover:bg-accent"
                    key={`recent-${query}-${index.toString()}`}
                    onClick={() => onSuggestionClick({ query, text: query })}
                    type="button"
                  >
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="flex-1">{query}</span>
                  </button>
                ))}
              </div>
            </>
          )}

          {/* Popular Searches */}
          {hasPopularSearches && (
            <>
              {(hasSuggestions || hasRecentSearches) && (
                <Separator className="my-2" />
              )}
              <div>
                <div className="px-2 py-1.5 font-medium text-muted-foreground text-xs">
                  Popular Searches
                </div>
                {popularSearches.slice(0, 5).map((search, index) => (
                  <button
                    className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left transition-colors hover:bg-accent"
                    key={`popular-${search.query}-${index}`}
                    onClick={() =>
                      onSuggestionClick({
                        query: search.query,
                        text: search.query,
                      })
                    }
                    type="button"
                  >
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    <span className="flex-1">{search.query}</span>
                    <Badge variant="secondary">{search.count}</Badge>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
