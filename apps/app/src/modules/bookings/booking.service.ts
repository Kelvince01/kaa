import { httpClient } from "@/lib/axios";
import type {
  BookingCreateInput,
  BookingListResponse,
  BookingResponse,
  BookingUpdateInput,
} from "./booking.type";

// Create booking
export const createBooking = async (
  data: BookingCreateInput
): Promise<BookingResponse> => {
  const response = await httpClient.api.post("/bookings", data);
  return response.data;
};

// Get all bookings (with optional filters)
export const getBookings = async (
  params: any = {}
): Promise<BookingListResponse> => {
  const response = await httpClient.api.get("/bookings", { params });
  return response.data;
};

// Get booking by ID
export const getBooking = async (id: string): Promise<BookingResponse> => {
  const response = await httpClient.api.get(`/bookings/${id}`);
  return response.data;
};

// Update booking
export const updateBooking = async (
  id: string,
  data: BookingUpdateInput
): Promise<BookingResponse> => {
  const response = await httpClient.api.patch(`/bookings/${id}`, data);
  return response.data;
};

// Cancel booking
export const cancelBooking = async (
  id: string,
  reason: string
): Promise<BookingResponse> => {
  const response = await httpClient.api.post(`/bookings/${id}/cancel`, {
    reason,
  });
  return response.data;
};

// Reject booking
export const rejectBooking = async (
  id: string,
  rejectionReason: string
): Promise<BookingResponse> => {
  const response = await httpClient.api.post(`/bookings/${id}/reject`, {
    rejectionReason,
  });
  return response.data;
};

// Complete booking
export const completeBooking = async (id: string): Promise<BookingResponse> => {
  const response = await httpClient.api.post(`/bookings/${id}/complete`);
  return response.data;
};

// Delete booking
export const deleteBooking = async (
  id: string
): Promise<{ success: boolean; message?: string }> => {
  const response = await httpClient.api.delete(`/bookings/${id}`);
  return response.data;
};

// Confirm booking with optional check-in instructions
export const confirmBooking = async (
  id: string,
  checkInInstructions?: string
): Promise<BookingResponse> => {
  const response = await httpClient.api.post(`/bookings/${id}/confirm`, {
    checkInInstructions,
  });
  return response.data;
};

// Get bookings by property
export const getBookingsByProperty = async (
  propertyId: string,
  params: any = {}
): Promise<BookingListResponse> => {
  const response = await httpClient.api.get(
    `/bookings/property/${propertyId}`,
    { params }
  );
  return response.data;
};

// Get bookings by tenant
export const getBookingsByTenant = async (
  tenantId: string,
  params: any = {}
): Promise<BookingListResponse> => {
  const response = await httpClient.api.get(`/bookings/tenant/${tenantId}`, {
    params,
  });
  return response.data;
};

// Get bookings by host
export const getBookingsByHost = async (
  hostId: string,
  params: any = {}
): Promise<BookingListResponse> => {
  const response = await httpClient.api.get(`/bookings/host/${hostId}`, {
    params,
  });
  return response.data;
};
