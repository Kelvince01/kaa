"use client";

import {
  useSearchParams as useNextSearchParams,
  useRouter,
} from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { objectKeys } from "@/shared/utils/object.util";

type SearchParams<T> = {
  defaultValues?: Partial<T>;
  saveDataInSearch?: boolean;
  useCurrentSearch?: boolean;
};

/**
 * Hook to manage and synchronize search parameters (query string) with the URL.
 *
 * @template T - The type of search parameters (query string).
 * @param defaultValues - Default values for search parameters (optional).
 * @param saveDataInSearch - A flag (default: `true`) that controls whether changes to search parameters should be saved in the URL.
 * @param useCurrentSearch - A flag (default: saveDataInSearch) that controls whether use search parameters that already exist in url.
 * @returns An object with:
 *   - `search`: The current search parameters (query string).
 *   - `setSearch`: A function to update the search parameters and sync with the URL.
 */
const useSearchParams = <
  T extends Record<string, string | string[] | undefined>,
>({
  defaultValues,
  saveDataInSearch = true,
  useCurrentSearch = saveDataInSearch,
}: SearchParams<T>) => {
  const router = useRouter();
  const searchParams = useNextSearchParams();

  // Get initial search params from URL
  const getInitialSearch = () => {
    const params: Record<string, string | string[]> = {};
    searchParams.forEach((value, key) => {
      // Handle array values (split by underscore)
      if (value.includes("_")) {
        params[key] = value.split("_");
      } else {
        params[key] = value;
      }
    });
    return params;
  };

  // Memoize merged search params with default values
  // biome-ignore lint/correctness/useExhaustiveDependencies: false positive
  const mergedSearch = useMemo(
    () =>
      ({
        ...defaultValues,
        ...(useCurrentSearch ? getInitialSearch() : {}),
      }) as T,
    [defaultValues, useCurrentSearch]
  );

  // State to hold the current search parameters
  const [currentSearch, setCurrentSearch] = useState<T>(mergedSearch);

  const setSearch = (newValues: Partial<T>) => {
    const updatedSearch = { ...currentSearch, ...newValues };

    for (const key of objectKeys(updatedSearch)) {
      const currentValue = updatedSearch[key];

      // Handle empty or undefined values by setting to default
      if (currentValue === "" || currentValue === undefined) {
        updatedSearch[key] = defaultValues?.[key] ?? (undefined as T[keyof T]);
      }

      // Join array values into a string
      if (Array.isArray(updatedSearch[key])) {
        updatedSearch[key] = (
          updatedSearch[key].length
            ? updatedSearch[key].length === 1
              ? updatedSearch[key][0]
              : updatedSearch[key].join("_")
            : undefined
        ) as T[keyof T];
      }
    }

    // Check if any search parameters have changed
    const hasChanges = Object.keys(updatedSearch).some(
      (key) => updatedSearch[key] !== currentSearch[key]
    );

    if (hasChanges) {
      setCurrentSearch(updatedSearch);
      if (saveDataInSearch) {
        const params = new URLSearchParams();
        for (const [key, value] of Object.entries(updatedSearch)) {
          if (value !== undefined) {
            params.set(key, value.toString());
          }
        }
        router.replace(`?${params.toString()}`);
      }
    }
  };

  // Sync default values on mount if necessary
  useEffect(() => {
    if (!defaultValues) {
      return;
    }
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(defaultValues)) {
      if (value !== undefined) {
        params.set(key, value.toString());
      }
    }
    router.replace(`?${params.toString()}`);
  }, [defaultValues, router]);

  // Update current search state when URL search changes
  useEffect(() => {
    if (
      !saveDataInSearch ||
      JSON.stringify(currentSearch) === JSON.stringify(mergedSearch)
    ) {
      return;
    }
    setCurrentSearch(mergedSearch);
  }, [mergedSearch, currentSearch, saveDataInSearch]);

  return { search: currentSearch, setSearch };
};

export default useSearchParams;
