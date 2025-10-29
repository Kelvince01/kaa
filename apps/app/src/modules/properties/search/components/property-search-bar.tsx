/**
 * Property search bar with autocomplete suggestions
 */
"use client";

import { Badge } from "@kaa/ui/components/badge";
import { Button } from "@kaa/ui/components/button";
import { Input } from "@kaa/ui/components/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@kaa/ui/components/popover";
import { Separator } from "@kaa/ui/components/separator";
import { cn } from "@kaa/ui/lib/utils";
import {
  Building,
  Clock,
  Loader2,
  MapPin,
  Search,
  Star,
  TrendingUp,
  X,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import useDebounce from "@/hooks/use-debounce";
import { usePopularSearches, useSearchSuggestions } from "../search.queries";
import type { PropertySearchParams, SearchSuggestion } from "../search.types";

type PropertySearchBarProps = {
  onSearch: (params: PropertySearchParams) => void;
  defaultValue?: string;
  placeholder?: string;
  className?: string;
  showSuggestions?: boolean;
  size?: "sm" | "md" | "lg";
};

const iconMap = {
  location: MapPin,
  property_type: Building,
  feature: Star,
  recent: Clock,
  popular: TrendingUp,
};

export default function PropertySearchBar({
  onSearch,
  defaultValue = "",
  placeholder = "Search properties by location, type, or features...",
  className,
  showSuggestions = true,
  size = "md",
}: PropertySearchBarProps) {
  const [query, setQuery] = useState(defaultValue);
  const [isFocused, setIsFocused] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const debouncedQuery = useDebounce(query, 300);

  // Fetch suggestions
  const { data: suggestionsData, isLoading: isLoadingSuggestions } =
    useSearchSuggestions(debouncedQuery, {
      enabled: showSuggestions && debouncedQuery.length > 0,
    });

  // Fetch popular searches (shown when no query)
  const { data: popularSearchesData } = usePopularSearches();

  const suggestions = suggestionsData?.data || [];
  const popularSearches = popularSearchesData?.data || [];

  // Show suggestions or popular searches
  const showDropdown =
    isOpen &&
    isFocused &&
    (suggestions.length > 0 ||
      (query.length === 0 && popularSearches.length > 0));

  const handleSearch = useCallback(() => {
    if (query.trim()) {
      onSearch({ query: query.trim() });
      setIsOpen(false);
    }
  }, [query, onSearch]);

  const handleSuggestionClick = useCallback(
    (suggestion: SearchSuggestion | { query: string }) => {
      const searchQuery =
        "query" in suggestion ? suggestion.query : suggestion.text;
      setQuery(searchQuery);
      onSearch({ query: searchQuery });
      setIsOpen(false);
    },
    [onSearch]
  );

  const handleClear = useCallback(() => {
    setQuery("");
    onSearch({});
  }, [onSearch]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        handleSearch();
      } else if (e.key === "Escape") {
        setIsOpen(false);
      }
    },
    [handleSearch]
  );

  useEffect(() => {
    if (debouncedQuery.length > 0 && isFocused) {
      setIsOpen(true);
    }
  }, [debouncedQuery, isFocused]);

  const sizeClasses = {
    sm: "h-9 text-sm",
    md: "h-11 text-base",
    lg: "h-14 text-lg",
  };

  return (
    <div className={cn("relative w-full", className)}>
      <Popover onOpenChange={setIsOpen} open={showDropdown}>
        <PopoverTrigger asChild>
          <div className="relative">
            <Search className="-translate-y-1/2 absolute top-1/2 left-3 h-5 w-5 text-muted-foreground" />
            <Input
              className={cn(
                "w-full rounded-lg border-gray-300 pr-20 pl-11 shadow-sm focus:border-primary focus:ring-2 focus:ring-primary/20",
                sizeClasses[size]
              )}
              onBlur={() => setTimeout(() => setIsFocused(false), 200)}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => {
                setIsFocused(true);
                setIsOpen(true);
              }}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              type="text"
              value={query}
            />
            <div className="-translate-y-1/2 absolute top-1/2 right-2 flex items-center gap-1">
              {query && (
                <Button
                  className="h-7 w-7"
                  onClick={handleClear}
                  size="icon"
                  type="button"
                  variant="ghost"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
              <Button
                className={cn("font-medium", sizeClasses[size])}
                onClick={handleSearch}
                size="icon"
                type="button"
              >
                Search
              </Button>
            </div>
          </div>
        </PopoverTrigger>

        {showSuggestions && (
          <PopoverContent
            align="start"
            className="w-(--radix-popover-trigger-width) p-2"
            onOpenAutoFocus={(e) => e.preventDefault()}
            sideOffset={8}
          >
            {isLoadingSuggestions ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="space-y-1">
                {/* Suggestions */}
                {suggestions.length > 0 && (
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
                          onClick={() => handleSuggestionClick(suggestion)}
                          type="button"
                        >
                          <Icon className="h-4 w-4 text-muted-foreground" />
                          <span className="flex-1">{suggestion.text}</span>
                          {suggestion.count !== undefined && (
                            <Badge className="ml-auto" variant="secondary">
                              {suggestion.count}
                            </Badge>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Popular searches */}
                {query.length === 0 && popularSearches.length > 0 && (
                  <>
                    {suggestions.length > 0 && <Separator className="my-2" />}
                    <div>
                      <div className="px-2 py-1.5 font-medium text-muted-foreground text-xs">
                        Popular Searches
                      </div>
                      {popularSearches.slice(0, 5).map((search, index) => (
                        <button
                          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left transition-colors hover:bg-accent"
                          key={`popular-${search.query}-${index}`}
                          onClick={() => handleSuggestionClick(search)}
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
            )}
          </PopoverContent>
        )}
      </Popover>
    </div>
  );
}
