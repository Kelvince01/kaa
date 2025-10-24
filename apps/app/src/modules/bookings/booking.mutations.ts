import { useMutation, useQueryClient } from "@tanstack/react-query";
import { bookingsKeys } from "./booking.queries";
import * as bookingService from "./booking.service";
import type { BookingUpdateInput } from "./booking.type";

// Create booking mutation
export const useCreateBooking = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: bookingService.createBooking,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bookingsKeys.all });
    },
  });
};

// Update booking mutation
export const useUpdateBooking = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: BookingUpdateInput }) =>
      bookingService.updateBooking(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: bookingsKeys.all });
      queryClient.invalidateQueries({
        queryKey: bookingsKeys.detail(variables.id),
      });
    },
  });
};

// Delete booking mutation
export const useDeleteBooking = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: bookingService.deleteBooking,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bookingsKeys.all });
    },
  });
};

// Delete multiple bookings mutation
export const useDeleteBookings = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) =>
      Promise.all(ids.map((id) => bookingService.deleteBooking(id))),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bookingsKeys.all });
    },
  });
};

// Cancel booking mutation
export const useCancelBooking = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      bookingService.cancelBooking(id, reason),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: bookingsKeys.all });
      queryClient.invalidateQueries({
        queryKey: bookingsKeys.detail(variables.id),
      });
    },
  });
};

// Confirm booking mutation
export const useConfirmBooking = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      checkInInstructions,
    }: {
      id: string;
      checkInInstructions?: string;
    }) => bookingService.confirmBooking(id, checkInInstructions),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: bookingsKeys.all });
      queryClient.invalidateQueries({
        queryKey: bookingsKeys.detail(variables.id),
      });
    },
  });
};

// Reject booking mutation
export const useRejectBooking = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      rejectionReason,
    }: {
      id: string;
      rejectionReason: string;
    }) => bookingService.rejectBooking(id, rejectionReason),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: bookingsKeys.all });
      queryClient.invalidateQueries({
        queryKey: bookingsKeys.detail(variables.id),
      });
    },
  });
};

// Complete booking mutation
export const useCompleteBooking = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: bookingService.completeBooking,
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: bookingsKeys.all });
      queryClient.invalidateQueries({ queryKey: bookingsKeys.detail(id) });
    },
  });
};
