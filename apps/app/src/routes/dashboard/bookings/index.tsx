"use client";

import { Badge } from "@kaa/ui/components/badge";
import { Button } from "@kaa/ui/components/button";
import { Card, CardContent } from "@kaa/ui/components/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@kaa/ui/components/dialog";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@kaa/ui/components/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@kaa/ui/components/select";
import { Skeleton } from "@kaa/ui/components/skeleton";
import { format } from "date-fns";
import {
  Calendar,
  Clock,
  Eye,
  Home,
  MapPin,
  MessageSquare,
  RefreshCw,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useAuthStore } from "@/modules/auth/auth.store";
import { useUpdateBooking } from "@/modules/bookings/booking.mutations";
import { useBookings } from "@/modules/bookings/booking.queries";
import { type Booking, BookingStatus } from "@/modules/bookings/booking.type";

type BookingStatusBadgeProps = {
  status: string;
};

const BookingStatusBadge: React.FC<BookingStatusBadgeProps> = ({ status }) => {
  const getVariant = () => {
    switch (status) {
      case "pending":
        return "secondary";
      case "confirmed":
        return "default";
      case "declined":
        return "destructive";
      case "cancelled":
        return "secondary";
      case "completed":
        return "default";
      default:
        return "secondary";
    }
  };

  return (
    <Badge
      className={`
			${status === "pending" ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-200" : ""}
			${status === "confirmed" ? "bg-green-100 text-green-800 hover:bg-green-200" : ""}
			${status === "completed" ? "bg-blue-100 text-blue-800 hover:bg-blue-200" : ""}
		`}
      variant={
        getVariant() as "default" | "secondary" | "destructive" | "outline"
      }
    >
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
};

const Bookings = () => {
  const { user, isAuthenticated, isLoading: loading } = useAuthStore();
  const [statusFilter, setStatusFilter] = useState("");
  const [sortBy, setSortBy] = useState("startTime");
  const [sortOrder, setSortOrder] = useState("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const {
    data: bookingsData,
    isLoading,
    error,
  } = useBookings({
    page: currentPage,
    limit: 10,
    status: statusFilter,
    sortBy,
    sortOrder,
  });
  const { mutate: updateBooking } = useUpdateBooking();

  // Extract data from the hook
  const bookings = bookingsData?.items || [];
  const pagination = {
    page: bookingsData?.pagination?.page || 1,
    pages: bookingsData?.pagination?.pages || 1,
    total: bookingsData?.pagination?.total || 0,
  };

  // Handle pagination
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.pages) {
      setCurrentPage(newPage);
    }
  };

  // Handle filter change
  const handleFilterChange = (value: string) => {
    setStatusFilter(value);
    setCurrentPage(1); // Reset to first page when filtering
  };

  // Handle sort change
  const handleSortChange = (value: string) => {
    const [newSortBy, newSortOrder] = value.split("_");
    setSortBy(newSortBy || "startTime");
    setSortOrder(newSortOrder || "desc");
    setCurrentPage(1); // Reset to first page when sorting
  };

  // Handle booking cancellation
  const handleCancelBooking = async (bookingId: string) => {
    // biome-ignore lint/suspicious/noAlert: ignore
    if (!confirm("Are you sure you want to cancel this booking?")) return;

    try {
      await updateBooking({
        id: bookingId,
        data: {
          status: BookingStatus.CANCELLED,
        },
      });

      // Update selectedBooking if it's the one being cancelled
      if (selectedBooking && selectedBooking._id === bookingId) {
        setSelectedBooking({
          ...selectedBooking,
          status: BookingStatus.CANCELLED,
        });
      }
    } catch (error) {
      console.error("Error cancelling booking:", error);
      // biome-ignore lint/suspicious/noAlert: ignore
      alert("Failed to cancel booking.");
    }
  };

  // View booking details
  const viewBookingDetails = (booking: Booking) => {
    setSelectedBooking(booking);
    setShowDetailsModal(true);
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
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <>
      {/* Filters */}
      <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row">
        <div className="font-medium text-lg">
          {pagination.total} {pagination.total === 1 ? "Booking" : "Bookings"}
        </div>

        <div className="flex flex-col gap-2 md:flex-row">
          <Select onValueChange={handleFilterChange} value={statusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              {/* <SelectItem value="">All Statuses</SelectItem> */}
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="declined">Declined</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>

          <Select
            onValueChange={handleSortChange}
            value={`${sortBy}_${sortOrder}`}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="startTime_desc">Upcoming First</SelectItem>
              <SelectItem value="startTime_asc">Oldest First</SelectItem>
              <SelectItem value="createdAt_desc">Recently Requested</SelectItem>
              <SelectItem value="updatedAt_desc">Recently Updated</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      {/* Bookings List */}
      {isLoading ? (
        <div className="space-y-4">
          {new Array(3).map((_, i) => (
            <Card key={`skeleton-${i.toString()}`}>
              <CardContent className="p-6">
                <div className="flex flex-col space-y-3">
                  <Skeleton className="h-6 w-1/3" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-4 w-2/3" />
                  <div className="flex justify-end space-x-2 pt-4">
                    <Skeleton className="h-8 w-20" />
                    <Skeleton className="h-8 w-16" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : bookings.length === 0 ? (
        <div className="rounded-lg bg-gray-50 py-12 text-center">
          <Calendar className="mx-auto mb-4 h-12 w-12 text-gray-400" />
          <h3 className="mb-2 font-medium text-gray-900 text-lg">
            No bookings found
          </h3>
          <p className="mb-6 text-gray-500">
            {statusFilter
              ? "Try adjusting your filter"
              : "You haven't made any booking requests yet"}
          </p>
          <Button asChild>
            <Link href="/properties">
              <RefreshCw className="mr-2 h-4 w-4" />
              Find Properties to Book
            </Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => (
            <Card
              className="py-0 transition-shadow hover:shadow-md"
              key={booking._id}
            >
              <CardContent className="p-0">
                <div className="grid grid-cols-1 md:grid-cols-4">
                  {/* Property Image */}
                  <div className="relative h-48 md:h-full">
                    {booking.property?.media.photos &&
                    booking.property.media.photos.length > 0 ? (
                      <Image
                        alt={booking.property.title}
                        className="rounded-t-lg object-cover md:rounded-t-none md:rounded-l-lg"
                        fill
                        src={booking.property.media.photos[0]?.url || ""}
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center rounded-t-lg bg-gray-200 text-gray-500 md:rounded-t-none md:rounded-l-lg">
                        <Home className="h-12 w-12" />
                      </div>
                    )}
                  </div>

                  {/* Booking Details */}
                  <div className="p-4 md:col-span-3">
                    <div className="mb-2 flex flex-wrap justify-between">
                      <h3 className="mr-2 font-medium text-gray-900 text-lg">
                        {booking.property?.title || "Property"}
                      </h3>
                      <BookingStatusBadge status={booking.status} />
                    </div>

                    <div className="flex flex-col md:flex-row md:justify-between">
                      <div className="space-y-2">
                        {/* Address */}
                        <p className="flex items-center text-gray-600">
                          <MapPin className="mr-2 h-4 w-4 text-gray-400" />
                          {booking.property?.location.address.line1},{" "}
                          {booking.property?.location.address.town},{" "}
                          {booking.property?.location.address.postalCode}
                        </p>

                        {/* Booking time */}
                        <p className="flex items-center text-gray-600">
                          <Clock className="mr-2 h-4 w-4 text-gray-400" />
                          {formatDateTime(booking.startTime || "")}
                        </p>

                        {/* Booking type */}
                        <p className="flex items-center text-gray-600">
                          <Calendar className="mr-2 h-4 w-4 text-gray-400" />
                          {getBookingTypeDisplay(
                            booking.type || "",
                            booking.viewingType || ""
                          )}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="mt-4 flex items-start space-x-2 md:mt-0">
                        <Button
                          onClick={() => viewBookingDetails(booking)}
                          size="sm"
                          variant="outline"
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          Details
                        </Button>

                        {booking.status === "pending" && (
                          <Button
                            onClick={() => handleCancelBooking(booking._id)}
                            size="sm"
                            variant="destructive"
                          >
                            <X className="mr-2 h-4 w-4" />
                            Cancel
                          </Button>
                        )}

                        <Button asChild size="sm" variant="outline">
                          <Link
                            href={`/messages?property=${booking.property?._id}`}
                          >
                            <MessageSquare className="mr-2 h-4 w-4" />
                            Message
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="mt-6 flex flex-col items-center gap-4 border-gray-200 border-t pt-4">
          <div className="text-gray-700 text-sm">
            Showing{" "}
            <span className="font-medium">
              {(pagination.page - 1) * 10 + 1}
            </span>{" "}
            to{" "}
            <span className="font-medium">
              {Math.min(pagination.page * 10, pagination.total)}
            </span>{" "}
            of <span className="font-medium">{pagination.total}</span> results
          </div>

          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  className={
                    pagination.page === 1
                      ? "pointer-events-none opacity-50"
                      : "cursor-pointer"
                  }
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (pagination.page > 1) {
                      handlePageChange(pagination.page - 1);
                    }
                  }}
                />
              </PaginationItem>

              {/* Show first few pages */}
              {pagination.pages <= 7 ? (
                // Show all pages if 7 or fewer
                new Array(pagination.pages).map((_, i) => (
                  <PaginationItem key={`page-${i.toString()}`}>
                    <PaginationLink
                      className="cursor-pointer"
                      href="#"
                      isActive={pagination.page === i + 1}
                      onClick={(e) => {
                        e.preventDefault();
                        handlePageChange(i + 1);
                      }}
                    >
                      {i + 1}
                    </PaginationLink>
                  </PaginationItem>
                ))
              ) : (
                // Show with ellipsis for more pages
                <>
                  {/* First page */}
                  <PaginationItem>
                    <PaginationLink
                      className="cursor-pointer"
                      href="#"
                      isActive={pagination.page === 1}
                      onClick={(e) => {
                        e.preventDefault();
                        handlePageChange(1);
                      }}
                    >
                      1
                    </PaginationLink>
                  </PaginationItem>

                  {/* Left ellipsis */}
                  {pagination.page > 3 && (
                    <PaginationItem>
                      <PaginationEllipsis />
                    </PaginationItem>
                  )}

                  {/* Current page area */}
                  {[...new Array(3)].map((_, i) => {
                    const pageNum = pagination.page - 1 + i;
                    if (
                      pageNum < 1 ||
                      pageNum > pagination.pages ||
                      pageNum === 1 ||
                      pageNum === pagination.pages
                    ) {
                      return null;
                    }
                    return (
                      <PaginationItem key={pageNum}>
                        <PaginationLink
                          className="cursor-pointer"
                          href="#"
                          isActive={pagination.page === pageNum}
                          onClick={(e) => {
                            e.preventDefault();
                            handlePageChange(pageNum);
                          }}
                        >
                          {pageNum}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  })}

                  {/* Right ellipsis */}
                  {pagination.page < pagination.pages - 2 && (
                    <PaginationItem>
                      <PaginationEllipsis />
                    </PaginationItem>
                  )}

                  {/* Last page */}
                  {pagination.pages > 1 && (
                    <PaginationItem>
                      <PaginationLink
                        className="cursor-pointer"
                        href="#"
                        isActive={pagination.page === pagination.pages}
                        onClick={(e) => {
                          e.preventDefault();
                          handlePageChange(pagination.pages);
                        }}
                      >
                        {pagination.pages}
                      </PaginationLink>
                    </PaginationItem>
                  )}
                </>
              )}

              <PaginationItem>
                <PaginationNext
                  className={
                    pagination.page === pagination.pages
                      ? "pointer-events-none opacity-50"
                      : "cursor-pointer"
                  }
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (pagination.page < pagination.pages) {
                      handlePageChange(pagination.page + 1);
                    }
                  }}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
      {/* Booking Details Modal */}
      <Dialog onOpenChange={setShowDetailsModal} open={showDetailsModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Booking Details</DialogTitle>
          </DialogHeader>

          {selectedBooking && (
            <>
              <div className="mb-4 rounded-lg bg-gray-50 p-4">
                <h4 className="mb-2 font-medium text-gray-900">
                  {selectedBooking.property?.title || "Property"}
                </h4>
                <p className="mb-1 flex items-center text-gray-700">
                  <MapPin className="mr-2 h-4 w-4 text-gray-400" />
                  {selectedBooking.property?.location.address.line1},{" "}
                  {selectedBooking.property?.location.address.town},{" "}
                  {selectedBooking.property?.location.address.postalCode}
                </p>
                <p className="mb-1 text-gray-700">
                  £{selectedBooking.property?.pricing.rentAmount} per{" "}
                  {selectedBooking.property?.pricing.paymentFrequency}
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-500">Status:</span>
                  <BookingStatusBadge status={selectedBooking.status} />
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-500">Booking Type:</span>
                  <span className="text-gray-900">
                    {getBookingTypeDisplay(
                      selectedBooking.type || "",
                      selectedBooking.viewingType || ""
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
                        new Date(selectedBooking.startTime || "").getTime()) /
                        (1000 * 60)
                    )}{" "}
                    minutes
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-500">Landlord:</span>
                  <span className="text-gray-900">
                    {selectedBooking.property?.landlord?.firstName}{" "}
                    {selectedBooking.property?.landlord?.lastName}
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
                        {selectedBooking.additionalAttendees?.[0]?.relationship}
                      </span>
                    </div>
                  )}

                {selectedBooking.notes && (
                  <div>
                    <span className="mb-1 block text-gray-500">Notes:</span>
                    <p className="rounded-md bg-gray-50 p-3 text-gray-900">
                      {selectedBooking.notes}
                    </p>
                  </div>
                )}
              </div>

              <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
                <Button asChild variant="outline">
                  <Link
                    href={`/messages?property=${selectedBooking.property?._id}`}
                  >
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Message Landlord
                  </Link>
                </Button>

                {selectedBooking.status === "pending" && (
                  <Button
                    onClick={() => {
                      handleCancelBooking(selectedBooking._id);
                      setShowDetailsModal(false);
                    }}
                    variant="destructive"
                  >
                    Cancel Booking
                  </Button>
                )}

                <Button onClick={() => setShowDetailsModal(false)}>
                  Close
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Bookings;
