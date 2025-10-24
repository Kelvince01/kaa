import {
  infiniteQueryOptions,
  queryOptions,
  useQuery,
} from "@tanstack/react-query";
import type { BookingsSearchParams as SchemaSearchParams } from "./booking.schema";
import * as bookingService from "./booking.service";

// Query keys
export const bookingsKeys = {
  all: ["bookings"] as const,
  lists: () => [...bookingsKeys.all, "list"] as const,
  list: (params?: any) => [...bookingsKeys.lists(), { params }] as const,
  details: () => [...bookingsKeys.all, "detail"] as const,
  detail: (id: string) => [...bookingsKeys.details(), id] as const,
  byProperty: (propertyId: string, params?: any) =>
    [...bookingsKeys.all, "property", propertyId, { params }] as const,
  byTenant: (tenantId: string, params?: any) =>
    [...bookingsKeys.all, "tenant", tenantId, { params }] as const,
  byHost: (hostId: string, params?: any) =>
    [...bookingsKeys.all, "host", hostId, { params }] as const,
};

// Query options for infinite query
export const bookingsQueryOptions = (params: SchemaSearchParams) =>
  infiniteQueryOptions({
    queryKey: bookingsKeys.list(params),
    queryFn: ({ pageParam = 1 }) =>
      bookingService.getBookings({ ...params, page: pageParam }),
    getNextPageParam: (lastPage) => {
      const { page, pages } = lastPage.pagination;
      return page < pages ? page + 1 : undefined;
    },
    initialPageParam: 1,
  });

// Single booking query options
export const bookingQueryOptions = (id: string) =>
  queryOptions({
    queryKey: bookingsKeys.detail(id),
    queryFn: () => bookingService.getBooking(id),
    enabled: !!id,
  });

// Get all bookings
export const useBookings = (params: any = {}) =>
  useQuery({
    queryKey: ["bookings", params],
    queryFn: () => bookingService.getBookings(params),
  });

// Get booking by ID
export const useBooking = (id: string) =>
  useQuery({
    queryKey: ["bookings", id],
    queryFn: () => bookingService.getBooking(id),
    enabled: !!id,
  });
