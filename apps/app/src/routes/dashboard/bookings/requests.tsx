"use client";

import axios from "axios";
import { format } from "date-fns";
import {
  Calendar,
  Check,
  Clock,
  Eye,
  Home,
  MapPin,
  MessageSquare,
  RefreshCw,
  UserIcon,
  X,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuthStore } from "@/modules/auth/auth.store";
import type { Booking, BookingStatus } from "@/modules/bookings/booking.type";
import type { Property } from "@/modules/properties/property.type";
import type { User } from "@/modules/users/user.type";

type BookingStatusBadgeProps = {
  status: string;
};

const BookingStatusBadge: React.FC<BookingStatusBadgeProps> = ({ status }) => {
  let bgColor = "bg-gray-100 text-gray-800";

  switch (status) {
    case "pending":
      bgColor = "bg-yellow-100 text-yellow-800";
      break;
    case "confirmed":
      bgColor = "bg-green-100 text-green-800";
      break;
    case "declined":
      bgColor = "bg-red-100 text-red-800";
      break;
    case "cancelled":
      bgColor = "bg-gray-100 text-gray-800";
      break;
    case "completed":
      bgColor = "bg-blue-100 text-blue-800";
      break;
    default:
      bgColor = "bg-gray-100 text-gray-800";
  }

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 font-medium text-xs ${bgColor}`}
    >
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
};

const BookingRequests = () => {
  const { user, isAuthenticated, isLoading: loading } = useAuthStore();
  const [bookingRequests, setBookingRequests] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("pending");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalBookings: 0,
  });
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [responseComment, setResponseComment] = useState("");
  const [isResponding, setIsResponding] = useState(false);

  // Check if user is landlord
  useEffect(() => {
    if (
      !loading &&
      isAuthenticated &&
      user?.role !== "landlord" &&
      user?.role !== "admin"
    ) {
      window.location.href = "/dashboard";
    }
  }, [isAuthenticated, loading, user?.role]);

  // Fetch booking requests
  const fetchBookingRequests = async (page = 1) => {
    if (!isAuthenticated) return;

    try {
      setIsLoading(true);

      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/bookings/requests`,
        {
          params: {
            page,
            limit: 10,
            status: statusFilter,
            sortBy,
            sortOrder,
          },
        }
      );

      setBookingRequests(response.data.bookings);
      setPagination({
        currentPage: response.data.currentPage,
        totalPages: response.data.totalPages,
        totalBookings: response.data.totalBookings,
      });
    } catch (error) {
      console.error("Error fetching booking requests:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: ignore
  useEffect(() => {
    if (isAuthenticated) {
      fetchBookingRequests(pagination.currentPage);
    }
  }, [isAuthenticated, pagination.currentPage]);

  // Handle pagination
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination({ ...pagination, currentPage: newPage });
      fetchBookingRequests(newPage);
    }
  };

  // Handle filter change
  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setStatusFilter(e.target.value);
    setPagination({ ...pagination, currentPage: 1 });
  };

  // Handle sort change
  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    const [newSortBy, newSortOrder] = value.split("_");
    if (newSortBy) setSortBy(newSortBy);
    if (newSortOrder) setSortOrder(newSortOrder);
    setPagination({ ...pagination, currentPage: 1 });
  };

  // View booking details
  const viewBookingDetails = (booking: Booking) => {
    setSelectedBooking(booking);
    setShowDetailsModal(true);
    setResponseComment("");
  };

  // Handle booking response (confirm/decline)
  const handleBookingResponse = async (bookingId: string, status: string) => {
    try {
      setIsResponding(true);

      await axios.patch(
        `${process.env.NEXT_PUBLIC_API_URL}/bookings/${bookingId}/status`,
        {
          status,
          comment: responseComment,
        }
      );

      // Update booking in list
      setBookingRequests(
        bookingRequests.map((booking) =>
          booking._id === bookingId
            ? { ...booking, status: status as BookingStatus }
            : booking
        )
      );

      // Update selected booking if in modal
      if (selectedBooking && selectedBooking._id === bookingId) {
        setSelectedBooking({
          ...selectedBooking,
          status: status as BookingStatus,
        });
      }

      setShowDetailsModal(false);

      // Refresh booking list
      fetchBookingRequests(pagination.currentPage);
    } catch (error) {
      console.error("Error responding to booking:", error);
      // biome-ignore lint/suspicious/noAlert: ignore
      alert("Failed to update booking status.");
    } finally {
      setIsResponding(false);
    }
  };

  // Format date and time
  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, "EEEE, MMMM d, yyyy 'at' h:mm a");
  };

  // Get booking type display value
  const getBookingTypeDisplay = (type: string, viewingType: string) => {
    if (type === "viewing") {
      return `${viewingType === "virtual" ? "Virtual" : "In-person"} Viewing`;
    }
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  // Show loading state
  if (loading || !(isAuthenticated || loading)) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-12 w-full rounded-lg bg-gray-200" />
        <div className="h-64 w-full rounded-lg bg-gray-200" />
      </div>
    );
  }

  return (
    <>
      {/* Filters */}
      <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row">
        <div className="font-medium text-lg">
          {pagination.totalBookings}{" "}
          {pagination.totalBookings === 1 ? "Request" : "Requests"}
        </div>

        <div className="flex flex-col gap-2 md:flex-row">
          <select
            className="rounded-md border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            onChange={handleFilterChange}
            value={statusFilter}
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="declined">Declined</option>
            <option value="cancelled">Cancelled</option>
            <option value="completed">Completed</option>
          </select>

          <select
            className="rounded-md border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            onChange={handleSortChange}
            value={`${sortBy}_${sortOrder}`}
          >
            <option value="startTime_asc">Earliest First</option>
            <option value="startTime_desc">Latest First</option>
            <option value="createdAt_desc">Recently Requested</option>
            <option value="createdAt_asc">Oldest Requests</option>
            <option value="updatedAt_desc">Recently Updated</option>
          </select>
        </div>
      </div>
      {/* Booking Requests List */}
      {isLoading ? (
        <div className="animate-pulse space-y-4">
          {new Array(3).map((_, i) => (
            <div
              className="rounded-lg border border-gray-200 p-4"
              key={`skeleton-${i.toString()}`}
            >
              <div className="mb-4 h-10 w-1/3 rounded bg-gray-200" />
              <div className="h-24 w-full rounded bg-gray-200" />
            </div>
          ))}
        </div>
      ) : bookingRequests.length === 0 ? (
        <div className="rounded-lg bg-gray-50 py-12 text-center">
          <Calendar className="mx-auto mb-4 h-12 w-12 text-gray-400" />
          <h3 className="mb-2 font-medium text-gray-900 text-lg">
            No booking requests found
          </h3>
          <p className="mb-6 text-gray-500">
            {statusFilter
              ? "Try adjusting your filter"
              : "You haven't received any booking requests yet"}
          </p>
          <Link
            className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
            href="/dashboard/properties"
          >
            <RefreshCw className="mr-2" />
            Manage Properties
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {bookingRequests.map((booking) => (
            <div
              className="overflow-hidden rounded-lg border border-gray-200 shadow-sm transition-shadow hover:shadow-md"
              key={booking._id}
            >
              <div className="p-6">
                <div className="flex flex-col md:flex-row md:justify-between">
                  <div className="mb-4 md:mb-0">
                    {/* Booking info */}
                    <div className="mb-2 flex items-center justify-between">
                      <h3 className="font-medium text-gray-900 text-lg">
                        {(booking.property as Property)?.title || "Property"}
                      </h3>
                      <div className="ml-2">
                        <BookingStatusBadge status={booking.status} />
                      </div>
                    </div>

                    {/* Property address */}
                    <p className="mb-1 flex items-center text-gray-600 text-sm">
                      <MapPin className="mr-1 text-gray-400" />
                      {(booking.property as Property)?.location.address.line1},{" "}
                      {(booking.property as Property)?.location.address.town}
                    </p>

                    {/* Booking time */}
                    <p className="mb-1 flex items-center text-gray-600 text-sm">
                      <Clock className="mr-1 text-gray-400" />
                      {formatDateTime(booking.startTime || "")}
                    </p>

                    {/* Tenant */}
                    <p className="flex items-center text-gray-600 text-sm">
                      <UserIcon className="mr-1 text-gray-400" />
                      {(booking.tenant as User)?.firstName}{" "}
                      {(booking.tenant as User)?.lastName}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-start space-x-2">
                    {booking.status === "pending" && (
                      <>
                        <button
                          className="inline-flex items-center justify-center rounded-md border border-transparent bg-green-600 px-4 py-2 font-medium text-sm text-white shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                          onClick={() =>
                            handleBookingResponse(booking._id, "confirmed")
                          }
                          type="button"
                        >
                          <Check className="mr-2" />
                          Confirm
                        </button>

                        <button
                          className="inline-flex items-center justify-center rounded-md border border-transparent bg-red-600 px-4 py-2 font-medium text-sm text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                          onClick={() =>
                            handleBookingResponse(booking._id, "declined")
                          }
                          type="button"
                        >
                          <X className="mr-2" />
                          Decline
                        </button>
                      </>
                    )}

                    <button
                      className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 font-medium text-gray-700 text-sm shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                      onClick={() => viewBookingDetails(booking)}
                      type="button"
                    >
                      <Eye className="mr-2" />
                      Details
                    </button>

                    <Link
                      className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 font-medium text-gray-700 text-sm shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                      href={`/messages?property=${(booking.property as Property)?._id}&tenant=${(booking.tenant as User)?.id}`}
                    >
                      <MessageSquare className="mr-2" />
                      Message
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between border-gray-200 border-t px-4 py-3 sm:px-6">
          <div className="flex flex-1 justify-between sm:hidden">
            <button
              className={`relative inline-flex items-center rounded-md border border-gray-300 px-4 py-2 font-medium text-sm ${
                pagination.currentPage === 1
                  ? "cursor-not-allowed bg-gray-50 text-gray-300"
                  : "bg-white text-gray-700 hover:bg-gray-50"
              }`}
              disabled={pagination.currentPage === 1}
              onClick={() => handlePageChange(pagination.currentPage - 1)}
              type="button"
            >
              Previous
            </button>
            <button
              className={`relative ml-3 inline-flex items-center rounded-md border border-gray-300 px-4 py-2 font-medium text-sm ${
                pagination.currentPage === pagination.totalPages
                  ? "cursor-not-allowed bg-gray-50 text-gray-300"
                  : "bg-white text-gray-700 hover:bg-gray-50"
              }`}
              disabled={pagination.currentPage === pagination.totalPages}
              onClick={() => handlePageChange(pagination.currentPage + 1)}
              type="button"
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
            <div>
              <p className="text-gray-700 text-sm">
                Showing{" "}
                <span className="font-medium">
                  {(pagination.currentPage - 1) * 10 + 1}
                </span>{" "}
                to{" "}
                <span className="font-medium">
                  {Math.min(
                    pagination.currentPage * 10,
                    pagination.totalBookings
                  )}
                </span>{" "}
                of{" "}
                <span className="font-medium">{pagination.totalBookings}</span>{" "}
                results
              </p>
            </div>
            <div>
              <nav
                aria-label="Pagination"
                className="-space-x-px isolate inline-flex rounded-md shadow-sm"
              >
                <button
                  className={`relative inline-flex items-center rounded-l-md border border-gray-300 bg-white px-2 py-2 font-medium text-sm ${
                    pagination.currentPage === 1
                      ? "cursor-not-allowed text-gray-400"
                      : "text-gray-500 hover:bg-gray-50"
                  }`}
                  disabled={pagination.currentPage === 1}
                  onClick={() => handlePageChange(pagination.currentPage - 1)}
                  type="button"
                >
                  <span className="sr-only">Previous</span>← Previous
                </button>

                {new Array(pagination.totalPages).map((_, i) => (
                  <button
                    className={`relative inline-flex items-center border ${
                      pagination.currentPage === i + 1
                        ? "z-10 border-blue-500 bg-blue-50 text-blue-600"
                        : "border-gray-300 bg-white text-gray-500 hover:bg-gray-50"
                    } px-4 py-2 font-medium text-sm`}
                    key={`page-${i.toString()}`}
                    onClick={() => handlePageChange(i + 1)}
                    type="button"
                  >
                    {i + 1}
                  </button>
                ))}

                <button
                  className={`relative inline-flex items-center rounded-r-md border border-gray-300 bg-white px-2 py-2 font-medium text-sm ${
                    pagination.currentPage === pagination.totalPages
                      ? "cursor-not-allowed text-gray-400"
                      : "text-gray-500 hover:bg-gray-50"
                  }`}
                  disabled={pagination.currentPage === pagination.totalPages}
                  onClick={() => handlePageChange(pagination.currentPage + 1)}
                  type="button"
                >
                  <span className="sr-only">Next</span>
                  Next →
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}
      {/* Booking Details Modal */}
      {showDetailsModal && selectedBooking && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center px-4 pt-4 pb-20 text-center">
            <div
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
              onClick={() => setShowDetailsModal(false)}
            />

            <div className="relative inline-block transform overflow-hidden rounded-lg bg-white text-left align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:align-middle">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 w-full text-center sm:mt-0 sm:text-left">
                    <h3 className="mb-4 flex items-center justify-between font-medium text-gray-900 text-lg leading-6">
                      <span>Booking Details</span>
                      <BookingStatusBadge status={selectedBooking.status} />
                    </h3>

                    {/* Property details */}
                    <div className="mb-4 rounded-lg bg-gray-50 p-4">
                      <h4 className="mb-2 flex items-center font-medium text-gray-900">
                        <Home className="mr-2 text-gray-500" />
                        {(selectedBooking.property as Property)?.title ||
                          "Property"}
                      </h4>
                      <p className="mb-1 flex items-center text-gray-700 text-sm">
                        <MapPin className="mr-2 text-gray-400" />
                        {
                          (selectedBooking.property as Property)?.location
                            .address.line1
                        }
                        ,{" "}
                        {
                          (selectedBooking.property as Property)?.location
                            .address.town
                        }
                        ,{" "}
                        {
                          (selectedBooking.property as Property)?.location
                            .address.postalCode
                        }
                      </p>
                    </div>

                    {/* Booking details */}
                    <div className="mb-6 space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Booking Type:</span>
                        <span className="text-gray-900">
                          {getBookingTypeDisplay(
                            selectedBooking.type || "",
                            selectedBooking.viewingType as string
                          )}
                        </span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-gray-500">Date & Time:</span>
                        <span className="text-gray-900">
                          {formatDateTime(selectedBooking.startTime || "")}
                        </span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-gray-500">Duration:</span>
                        <span className="text-gray-900">
                          {Math.round(
                            (new Date(selectedBooking.endTime || "").getTime() -
                              new Date(
                                selectedBooking.startTime || ""
                              ).getTime()) /
                              (1000 * 60)
                          )}{" "}
                          minutes
                        </span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-gray-500">Tenant:</span>
                        <span className="text-gray-900">
                          {(selectedBooking.tenant as User)?.firstName}{" "}
                          {(selectedBooking.tenant as User)?.lastName}
                        </span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-gray-500">Contact:</span>
                        <span className="text-gray-900">
                          {(selectedBooking.tenant as User)?.email}
                          {(selectedBooking.tenant as User)?.phone && (
                            <span className="ml-1">
                              / {(selectedBooking.tenant as User)?.phone}
                            </span>
                          )}
                        </span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-gray-500">Requested on:</span>
                        <span className="text-gray-900">
                          {format(
                            new Date(selectedBooking.createdAt || ""),
                            "MMMM d, yyyy"
                          )}
                        </span>
                      </div>

                      {selectedBooking.additionalAttendees?.length &&
                        selectedBooking.additionalAttendees?.length > 0 && (
                          <div className="flex justify-between">
                            <span className="text-gray-500">
                              Additional Attendees:
                            </span>
                            <span className="text-gray-900">
                              {selectedBooking.additionalAttendees?.[0]?.name}{" "}
                              {
                                selectedBooking.additionalAttendees?.[0]
                                  ?.relationship
                              }
                            </span>
                          </div>
                        )}

                      {selectedBooking.notes && (
                        <div>
                          <span className="mb-1 block text-gray-500">
                            Tenant's Notes:
                          </span>
                          <p className="rounded-md bg-gray-50 p-3 text-gray-900 text-sm">
                            {selectedBooking.notes}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Response section */}
                    {selectedBooking.status === "pending" && (
                      <div>
                        <label
                          className="mb-1 block font-medium text-gray-700 text-sm"
                          htmlFor="responseComment"
                        >
                          Add a comment with your response (optional):
                        </label>
                        <textarea
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                          id="responseComment"
                          onChange={(e) => setResponseComment(e.target.value)}
                          placeholder="E.g., 'Looking forward to meeting you' or 'Sorry, the property is no longer available'"
                          rows={3}
                          value={responseComment}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                {selectedBooking.status === "pending" ? (
                  <>
                    <button
                      className="inline-flex w-full justify-center rounded-md border border-transparent bg-green-600 px-4 py-2 font-medium text-base text-white shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm"
                      disabled={isResponding}
                      onClick={() =>
                        handleBookingResponse(selectedBooking._id, "confirmed")
                      }
                      type="button"
                    >
                      {isResponding ? "Processing..." : "Confirm Booking"}
                    </button>
                    <button
                      className="mt-3 inline-flex w-full justify-center rounded-md border border-transparent bg-red-600 px-4 py-2 font-medium text-base text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                      disabled={isResponding}
                      onClick={() =>
                        handleBookingResponse(selectedBooking._id, "declined")
                      }
                      type="button"
                    >
                      {isResponding ? "Processing..." : "Decline Booking"}
                    </button>
                  </>
                ) : (
                  <button
                    className="inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 font-medium text-base text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm"
                    onClick={() => setShowDetailsModal(false)}
                    type="button"
                  >
                    Close
                  </button>
                )}

                <Link
                  className="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 font-medium text-base text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  href={`/messages?property=${(selectedBooking.property as Property)?._id}&tenant=${(selectedBooking.tenant as User)?.id}`}
                >
                  <MessageSquare className="mr-2" />
                  Message Tenant
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default BookingRequests;
