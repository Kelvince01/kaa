import {
  type UseMutationOptions,
  type UseQueryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useCallback, useEffect, useRef } from "react";
import {
  CACHE_TIME_CONFIG,
  QueryPerformanceMonitor,
  STALE_TIME_CONFIG,
} from "@/lib/performance/query-optimization";

/**
 * Enhanced useQuery hook with performance monitoring and optimization
 */
export function useOptimizedQuery<TData = unknown, TError = Error>(
  options: UseQueryOptions<TData, TError> & {
    performanceCategory?: keyof typeof STALE_TIME_CONFIG;
    enablePerformanceMonitoring?: boolean;
  }
) {
  const {
    performanceCategory = "STATIC",
    enablePerformanceMonitoring = true,
    ...queryOptions
  } = options;
  const startTimeRef = useRef<number>(0);

  // Apply optimized stale time and cache time based on category
  const optimizedOptions: UseQueryOptions<TData, TError> = {
    ...queryOptions,
    staleTime: queryOptions.staleTime ?? STALE_TIME_CONFIG[performanceCategory],
    gcTime: queryOptions.gcTime ?? CACHE_TIME_CONFIG[performanceCategory],

    // Wrap queryFn to add performance monitoring
    queryFn: queryOptions.queryFn
      ? // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: false positive
        async (context) => {
          if (enablePerformanceMonitoring) {
            startTimeRef.current = performance.now();
          }

          try {
            // @ts-expect-error
            const result = await queryOptions.queryFn?.(context);

            if (enablePerformanceMonitoring && startTimeRef.current) {
              const executionTime = performance.now() - startTimeRef.current;
              QueryPerformanceMonitor.recordQuery(
                Array.isArray(queryOptions.queryKey)
                  ? queryOptions.queryKey.join("-")
                  : String(queryOptions.queryKey),
                executionTime,
                false
              );
            }

            return result;
          } catch (error) {
            if (enablePerformanceMonitoring && startTimeRef.current) {
              const executionTime = performance.now() - startTimeRef.current;
              QueryPerformanceMonitor.recordQuery(
                Array.isArray(queryOptions.queryKey)
                  ? queryOptions.queryKey.join("-")
                  : String(queryOptions.queryKey),
                executionTime,
                true
              );
            }
            throw error;
          }
        }
      : undefined,
  };

  return useQuery(optimizedOptions);
}

/**
 * Enhanced useMutation hook with performance monitoring
 */
export function useOptimizedMutation<
  TData = unknown,
  TError = Error,
  TVariables = void,
  TContext = unknown,
>(
  options: UseMutationOptions<TData, TError, TVariables, TContext> & {
    enablePerformanceMonitoring?: boolean;
    invalidateQueries?: string[][];
    optimisticUpdate?: {
      queryKey: string[];
      updateFn: (oldData: unknown, variables: TVariables) => unknown;
    };
  }
) {
  const {
    enablePerformanceMonitoring = true,
    invalidateQueries = [],
    optimisticUpdate,
    ...mutationOptions
  } = options;

  const queryClient = useQueryClient();
  const startTimeRef = useRef<number>(0);

  // Wrap mutationFn to add performance monitoring
  const optimizedOptions: UseMutationOptions<
    TData,
    TError,
    TVariables,
    TContext
  > = {
    ...mutationOptions,

    // @ts-expect-error
    mutationFn: mutationOptions.mutationFn
      ? async (variables) => {
          if (enablePerformanceMonitoring) {
            startTimeRef.current = performance.now();
          }

          try {
            const result = await mutationOptions.mutationFn?.(variables);

            if (enablePerformanceMonitoring && startTimeRef.current) {
              const executionTime = performance.now() - startTimeRef.current;
              QueryPerformanceMonitor.recordQuery(
                "mutation",
                executionTime,
                false
              );
            }

            return result;
          } catch (error) {
            if (enablePerformanceMonitoring && startTimeRef.current) {
              const executionTime = performance.now() - startTimeRef.current;
              QueryPerformanceMonitor.recordQuery(
                "mutation",
                executionTime,
                true
              );
            }
            throw error;
          }
        }
      : undefined,

    // Enhanced onMutate for optimistic updates
    // @ts-expect-error
    onMutate: async (variables) => {
      if (optimisticUpdate) {
        // Cancel any outgoing refetches
        await queryClient.cancelQueries({
          queryKey: optimisticUpdate.queryKey,
        });

        // Snapshot the previous value
        const previousData = queryClient.getQueryData(
          optimisticUpdate.queryKey
        );

        // Optimistically update to the new value
        queryClient.setQueryData(optimisticUpdate.queryKey, (old: unknown) =>
          optimisticUpdate.updateFn(old, variables)
        );

        // Return a context object with the snapshotted value
        const context = { previousData };

        // Call original onMutate if provided
        if (mutationOptions.onMutate) {
          const originalContext = await mutationOptions.onMutate(variables);
          return { ...context, ...originalContext };
        }

        return context;
      }

      return mutationOptions.onMutate?.(variables);
    },

    // Enhanced onError for rollback
    onError: (error, variables, context) => {
      // @ts-expect-error
      if (optimisticUpdate && context?.previousData) {
        queryClient.setQueryData(
          optimisticUpdate.queryKey,
          // @ts-expect-error
          context.previousData
        );
      }

      mutationOptions.onError?.(error, variables, context);
    },

    // Enhanced onSuccess for cache invalidation
    onSuccess: (data, variables, context) => {
      // Invalidate specified queries
      for (const queryKey of invalidateQueries) {
        queryClient.invalidateQueries({ queryKey });
      }

      mutationOptions.onSuccess?.(data, variables, context);
    },

    // Enhanced onSettled
    onSettled: (data, error, variables, context) => {
      if (optimisticUpdate) {
        // Always refetch after error or success
        queryClient.invalidateQueries({ queryKey: optimisticUpdate.queryKey });
      }

      mutationOptions.onSettled?.(data, error, variables, context);
    },
  };

  return useMutation(optimizedOptions);
}

/**
 * Hook for batch operations with optimized performance
 */
export function useBatchMutation<
  TData = unknown,
  TError = Error,
  TVariables = void,
>(
  mutationFn: (variables: TVariables[]) => Promise<TData[]>,
  options?: {
    batchSize?: number;
    batchDelay?: number;
    invalidateQueries?: string[][];
  }
) {
  const {
    batchSize = 10,
    batchDelay = 100,
    invalidateQueries = [],
  } = options ?? {};
  const queryClient = useQueryClient();
  const batchRef = useRef<
    {
      items: TVariables[];
      resolve: (value: TData[]) => void;
      reject: (error: TError) => void;
    }[]
  >([]);
  const timeoutRef = useRef<NodeJS.Timeout>(null);

  const processBatch = useCallback(async () => {
    if (batchRef.current.length === 0) {
      return;
    }

    const batch = batchRef.current.splice(0, batchSize);
    const variables = batch.flatMap((item) => item.items);

    try {
      const results = await mutationFn(variables);

      // Resolve all promises in the batch
      let resultIndex = 0;
      for (const { items, resolve } of batch) {
        const batchResults = results.slice(
          resultIndex,
          resultIndex + items.length
        );
        resolve(batchResults);
        resultIndex += items.length;
      }

      // Invalidate queries
      for (const queryKey of invalidateQueries) {
        queryClient.invalidateQueries({ queryKey });
      }
    } catch (error) {
      // Reject all promises in the batch
      for (const { reject } of batch) {
        reject(error as TError);
      }
    }

    // Process next batch if there are more items
    if (batchRef.current.length > 0) {
      timeoutRef.current = setTimeout(processBatch, batchDelay);
    }
  }, [mutationFn, batchSize, batchDelay, invalidateQueries, queryClient]);

  const addToBatch = useCallback(
    (items: TVariables[]): Promise<TData[]> => {
      return new Promise((resolve, reject) => {
        batchRef.current.push({ items, resolve, reject });

        // Clear existing timeout and set a new one
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }

        // Process immediately if batch is full, otherwise wait for delay
        if (batchRef.current.length >= batchSize) {
          processBatch();
        } else {
          timeoutRef.current = setTimeout(processBatch, batchDelay);
        }
      });
    },
    [batchSize, batchDelay, processBatch]
  );

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return { addToBatch };
}

/**
 * Hook for infinite query with optimized performance
 */
export function useOptimizedInfiniteQuery<_TData = unknown, _TError = Error>(
  options: Parameters<
    typeof import("@tanstack/react-query").useInfiniteQuery
  >[0] & {
    performanceCategory?: keyof typeof STALE_TIME_CONFIG;
    enablePerformanceMonitoring?: boolean;
  }
) {
  const {
    performanceCategory = "STATIC",
    enablePerformanceMonitoring = true,
    ...queryOptions
  } = options;

  const startTimeRef = useRef<number>(0);

  // Apply optimized stale time and cache time based on category
  const optimizedOptions = {
    ...queryOptions,
    staleTime: queryOptions.staleTime ?? STALE_TIME_CONFIG[performanceCategory],
    gcTime: queryOptions.gcTime ?? CACHE_TIME_CONFIG[performanceCategory],

    // Wrap queryFn to add performance monitoring
    queryFn: queryOptions.queryFn
      ? // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: false positive
        async (context: unknown) => {
          if (enablePerformanceMonitoring) {
            startTimeRef.current = performance.now();
          }

          try {
            // @ts-expect-error
            const result = await queryOptions.queryFn?.(context);

            if (enablePerformanceMonitoring && startTimeRef.current) {
              const executionTime = performance.now() - startTimeRef.current;
              QueryPerformanceMonitor.recordQuery(
                `infinite-${
                  Array.isArray(queryOptions.queryKey)
                    ? queryOptions.queryKey.join("-")
                    : String(queryOptions.queryKey)
                }`,
                executionTime,
                false
              );
            }

            return result;
          } catch (error) {
            if (enablePerformanceMonitoring && startTimeRef.current) {
              const executionTime = performance.now() - startTimeRef.current;
              QueryPerformanceMonitor.recordQuery(
                `infinite-${
                  Array.isArray(queryOptions.queryKey)
                    ? queryOptions.queryKey.join("-")
                    : String(queryOptions.queryKey)
                }`,
                executionTime,
                true
              );
            }
            throw error;
          }
        }
      : undefined,
  };

  return import("@tanstack/react-query").then(({ useInfiniteQuery }) =>
    // biome-ignore lint/correctness/useHookAtTopLevel: false positive
    useInfiniteQuery(optimizedOptions)
  );
}

/**
 * Hook for prefetching data with smart timing
 */
export function usePrefetch() {
  const queryClient = useQueryClient();

  const prefetchOnHover = useCallback(
    (
      queryKey: string[],
      queryFn: () => Promise<unknown>,
      options?: { delay?: number; staleTime?: number }
    ) => {
      const { delay = 200, staleTime = STALE_TIME_CONFIG.STATIC } =
        options ?? {};

      let timeoutId: NodeJS.Timeout;

      const handleMouseEnter = () => {
        timeoutId = setTimeout(() => {
          queryClient.prefetchQuery({
            queryKey,
            queryFn,
            staleTime,
          });
        }, delay);
      };

      const handleMouseLeave = () => {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
      };

      return { handleMouseEnter, handleMouseLeave };
    },
    [queryClient]
  );

  const prefetchOnViewport = useCallback(
    (
      queryKey: string[],
      queryFn: () => Promise<unknown>,
      options?: { threshold?: number; staleTime?: number }
    ) => {
      const { threshold = 0.1, staleTime = STALE_TIME_CONFIG.STATIC } =
        options ?? {};

      // biome-ignore lint/correctness/useHookAtTopLevel: false positive
      const observerRef = useRef<IntersectionObserver>(null);

      const observe = (element: Element) => {
        if (observerRef.current) {
          observerRef.current.disconnect();
        }

        observerRef.current = new IntersectionObserver(
          (entries) => {
            for (const entry of entries) {
              if (entry.isIntersecting) {
                queryClient.prefetchQuery({
                  queryKey,
                  queryFn,
                  staleTime,
                });
                observerRef.current?.disconnect();
              }
            }
          },
          { threshold }
        );

        observerRef.current.observe(element);
      };

      return { observe };
    },
    [queryClient]
  );

  return { prefetchOnHover, prefetchOnViewport };
}
