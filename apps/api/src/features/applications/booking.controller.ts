import {
  sendBookingCancellationEmail,
  sendBookingNotificationEmail,
  sendBookingStatusUpdateEmail,
} from "@kaa/email";
import { Booking, Property, Tenant } from "@kaa/models";
import { BookingStatus, type IBooking, PaymentMethod } from "@kaa/models/types";
import Elysia, { t } from "elysia";
import type mongoose from "mongoose";
import type { FilterQuery } from "mongoose";
import { authPlugin } from "~/features/auth/auth.plugin";
import { accessPlugin } from "~/features/rbac/rbac.plugin";
import { tenantPlugin } from "~/features/users/tenants/tenant.plugin";

export const bookingController = new Elysia().group("bookings", (app) =>
  app
    .use(authPlugin)
    .group("", (app) =>
      app.get(
        "/",
        async ({ set, query }) => {
          try {
            const { status, role, page = "1", limit = "10" } = query;

            // Build filter
            const filter: FilterQuery<IBooking> = {};

            // Filter by user role (landlord or tenant)
            // if (role === "landlord") {
            // 	filter.landlord = user.id;
            // } else {
            // 	filter.tenant = tenant.id;
            // }

            // Filter by status
            if (status) {
              filter.status = status;
            }

            // Parse pagination params
            const pageNum = Number.parseInt(page, 10);
            const limitNum = Number.parseInt(limit, 10);
            const skip = (pageNum - 1) * limitNum;

            // Execute query with pagination
            const bookings = await Booking.find(filter)
              .sort({ startTime: 1 })
              .skip(skip)
              .limit(limitNum)
              .populate("property", "title media location pricing rentPeriod")
              .populate("tenant", "firstName lastName email phone avatar")
              .populate("landlord", "firstName lastName email phone avatar");

            // Get total count for pagination
            const totalBookings = await Booking.countDocuments(filter);
            const totalPages = Math.ceil(totalBookings / limitNum);

            return {
              status: "success",
              items: bookings,
              pagination: {
                total: totalBookings,
                pages: totalPages,
                page: pageNum,
                limit: limitNum,
              },
              message: "Bookings fetched successfully",
            };
          } catch (error) {
            set.status = 500;
            return {
              status: "error",
              message: "Failed to fetch bookings",
            };
          }
        },
        {
          query: t.Object({
            status: t.Optional(t.String()),
            role: t.Optional(t.String()),
            page: t.Optional(t.String()),
            limit: t.Optional(t.String()),
          }),
          detail: {
            tags: ["bookings"],
            summary: "Get all bookings",
            description: "Get all bookings",
          },
        }
      )
    )
    .group("/", (app) =>
      app
        .use(tenantPlugin)
        .post(
          "/",
          async ({ body, set, user }) => {
            try {
              const {
                property: propertyId,
                startTime,
                endTime,
                type,
                bookingType,
                viewingType,
                notes,
                additionalAttendees,
                time,
                date,
              } = body;

              const property = await Property.findById(propertyId);

              if (!property) {
                set.status = 404;
                return {
                  status: "error",
                  message: "Property not found",
                };
              }

              // Check for availability
              // const isAvailable = await Booking.checkAvailability(
              // 	req.body.property,
              // 	new Date(req.body.startTime),
              // 	req.body.endTime ? new Date(req.body.endTime) : null,
              // 	req.body.bookingType
              // );

              // if (!isAvailable) {
              // 	sendError(res, "Property is not available for the selected dates", 400);
              // 	return;
              // }

              // Check if dates are valid
              const start = new Date(startTime);
              const end = new Date(endTime);

              if (start >= end) {
                set.status = 400;
                return {
                  status: "error",
                  message: "End date must be after start date",
                };
              }

              if (start < new Date()) {
                set.status = 400;
                return {
                  status: "error",
                  message: "Start date cannot be in the past",
                };
              }

              // Check if property is already booked for the requested dates
              const existingBooking = await Booking.findOne({
                property: propertyId,
                status: {
                  $in: [BookingStatus.CONFIRMED, BookingStatus.PENDING],
                },
                $or: [{ startDate: { $lte: end }, endDate: { $gte: start } }],
              });

              if (existingBooking) {
                set.status = 400;
                return {
                  status: "error",
                  message: "Property is already booked for the selected dates",
                };
              }

              // Check if property is available for booking
              if (property.status !== "active") {
                set.status = 400;
                return {
                  status: "error",
                  message: "Property is not available for booking",
                };
              }

              // Calculate total amount (price * number of months)
              // const months = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 30));
              // const totalAmount = property.price * months;

              // Calculate total amount based on booking type and duration
              let totalAmount = property.pricing.rent;

              if (bookingType === "short-term") {
                const startDate = new Date(startTime);
                const endDate = new Date(endTime);
                const days = Math.ceil(
                  (endDate.getTime() - startDate.getTime()) /
                    (1000 * 60 * 60 * 24)
                );

                if (property.pricing.paymentFrequency === "monthly") {
                  totalAmount = (property.pricing.rent / 30) * days;
                } else if (property.pricing.paymentFrequency === "quarterly") {
                  totalAmount = (property.pricing.rent / 90) * days;
                } else if (property.pricing.paymentFrequency === "annually") {
                  totalAmount = (property.pricing.rent / 365) * days;
                } else if (property.pricing.paymentFrequency === "daily") {
                  totalAmount = property.pricing.rent * days;
                }
              } else if (
                bookingType === "long-term" &&
                property.pricing.paymentFrequency === "monthly"
              ) {
                // For long-term bookings, typically use monthly price
                totalAmount = property.pricing.rent;
              }

              // Add deposit amount (typically one month's rent for long-term)
              const depositAmount =
                bookingType === "long-term"
                  ? property.pricing.rent
                  : totalAmount * 0.3;

              body.totalAmount = Math.round(totalAmount);
              body.depositAmount = Math.round(depositAmount);

              // Get landlord ID
              const landlordId = property.landlord;

              const bookingTenant = await Tenant.findOne({ user: user.id });

              // Create new booking
              const booking = new Booking({
                property: propertyId,
                tenant: bookingTenant?._id,
                landlord: landlordId,
                time,
                date,
                startTime,
                endTime,
                status: "pending",
                type: type || "viewing",
                viewingType: viewingType || "in-person",
                notes,
                additionalAttendees,
                totalAmount,
                depositAmount,
              });

              await booking.save();

              // Add booking to property's viewings array
              const updatedProperty = await Property.findByIdAndUpdate(
                propertyId,
                {
                  $push: { viewings: booking._id },
                }
              );

              // Send notification to landlord
              await sendBookingNotificationEmail({
                landlordEmail: (property.landlord as any).email,
                landlordName: (property.landlord as any).name,
                propertyTitle: property.title,
                tenantName: `${bookingTenant?.personalInfo.firstName} ${bookingTenant?.personalInfo.lastName}`,
                startDate: startTime,
                endDate: endTime,
                bookingType: body.bookingType,
                totalAmount: body.totalAmount,
                bookingId: (booking._id as mongoose.Types.ObjectId).toString(),
              });

              return {
                status: "success",
                data: booking,
                message: "Booking created successfully",
              };
            } catch (error) {
              set.status = 500;
              return {
                status: "error",
                message: "Failed to create booking",
              };
            }
          },
          {
            body: t.Object({
              property: t.String(),
              startTime: t.String(),
              endTime: t.String(),
              type: t.String(),
              bookingType: t.String(),
              viewingType: t.String(),
              notes: t.String(),
              additionalAttendees: t.Array(t.String()),
              time: t.String(),
              date: t.String(),
              totalAmount: t.Number(),
              depositAmount: t.Number(),
            }),
            detail: {
              tags: ["bookings"],
              summary: "Create a new booking",
              description: "Create a new booking",
            },
          }
        )

        .get(
          "/:id",
          async ({ params, set }) => {
            try {
              const { id } = params;

              // Find booking
              const booking = await Booking.findById(id)
                .populate(
                  "property",
                  "title media address pricing rentPeriod details type"
                )
                .populate("tenant", "firstName lastName email phone avatar")
                .populate("landlord", "firstName lastName email phone avatar");

              if (!booking) {
                set.status = 404;
                return {
                  status: "error",
                  message: "Booking not found",
                };
              }

              return {
                status: "success",
                data: booking,
                message: "Booking fetched successfully",
              };
            } catch (error) {
              set.status = 500;
              return {
                status: "error",
                message: "Failed to fetch booking",
              };
            }
          },
          {
            params: t.Object({
              id: t.String(),
            }),
            detail: {
              tags: ["bookings"],
              summary: "Get a booking by ID",
              description: "Get a booking by ID",
            },
          }
        )
        .use(accessPlugin("bookings", "update"))
        .put(
          "/:id/status",
          async ({ params, body, tenant, set, user, role }) => {
            try {
              const { id } = params;
              const { status, reason } = body;

              const booking = await Booking.findById(id);

              if (!booking) {
                set.status = 404;
                return {
                  status: "error",
                  message: "Booking not found",
                };
              }
              // If rejecting, require a reason
              if (status === "rejected" && !reason) {
                set.status = 400;
                return {
                  status: "error",
                  message: "Please provide a reason for rejection",
                };
              }

              // Check if user is authorized to update the booking
              const isLandlord =
                (booking.landlord as mongoose.Types.ObjectId).toString() ===
                user.id;
              const isTenant =
                (booking.tenant as mongoose.Types.ObjectId).toString() ===
                tenant.id;
              const isAdmin = role.name === "admin";

              // Apply status change rules
              if (status === "cancelled") {
                // Only allow cancellation if the booking is pending or confirmed
                if (
                  booking.status !== "pending" &&
                  booking.status !== "confirmed"
                ) {
                  set.status = 400;
                  return {
                    status: "error",
                    message:
                      "Only pending or confirmed bookings can be cancelled",
                  };
                }

                // Require a reason for cancellation
                if (!reason) {
                  set.status = 400;
                  return {
                    status: "error",
                    message: "Reason for cancellation is required",
                  };
                }

                // Add cancellation reason to notes
                const cancellationNote = `Cancelled by ${
                  isLandlord ? "landlord" : "tenant"
                }. Reason: ${reason}`;
                booking.notes = booking.notes
                  ? `${booking.notes}\n${cancellationNote}`
                  : cancellationNote;
              } else if (status === "confirmed") {
                // Only landlords or admins can confirm bookings
                if (!(isLandlord || isAdmin)) {
                  set.status = 403;
                  return {
                    status: "error",
                    message: "Only landlords can confirm bookings",
                  };
                }

                // Only allow confirmation if the booking is pending
                if (booking.status !== "pending") {
                  set.status = 400;
                  return {
                    status: "error",
                    message: "Only pending bookings can be confirmed",
                  };
                }
              } else if (status === "completed") {
                // Only landlords or admins can mark bookings as completed
                if (!(isLandlord || isAdmin)) {
                  set.status = 403;
                  return {
                    status: "error",
                    message: "Only landlords can mark bookings as completed",
                  };
                }

                // Only allow completion if the booking is confirmed
                if (booking.status !== "confirmed") {
                  set.status = 400;
                  return {
                    status: "error",
                    message:
                      "Only confirmed bookings can be marked as completed",
                  };
                }
              }

              // If approved, update property status for long-term bookings
              if (
                status === "confirmed" &&
                booking.bookingType === "long-term"
              ) {
                await Property.findByIdAndUpdate(booking.property, {
                  status: "rented",
                });
              }

              booking.status = status;
              booking.rejectionReason = reason;

              await booking.save();

              // Send notification about status change
              const property = await Property.findById(booking.property);
              const bookingTenant = await Tenant.findById(booking.tenant);

              await sendBookingStatusUpdateEmail({
                tenantEmail: bookingTenant?.personalInfo.email as string,
                tenantName: `${bookingTenant?.personalInfo.firstName} ${bookingTenant?.personalInfo.lastName}`,
                propertyTitle: property?.title as string,
                status,
                startDate: booking.startTime?.toString() as string,
                totalAmount: 0,
                bookingId: (booking._id as mongoose.Types.ObjectId).toString(),
              });

              return {
                status: "success",
                data: booking,
                message: "Booking status updated successfully",
              };
            } catch (error) {
              set.status = 500;
              return {
                status: "error",
                message: "Failed to update booking status",
              };
            }
          },
          {
            params: t.Object({
              id: t.String(),
            }),
            body: t.Object({
              status: t.Enum(BookingStatus),
              reason: t.String(),
            }),
            detail: {
              tags: ["bookings"],
              summary: "Update booking status",
              description: "Update booking status",
            },
          }
        )
        .use(accessPlugin("bookings", "update"))
        .put(
          "/:id/cancel",
          async ({ params, set, user }) => {
            try {
              const { id } = params;
              const booking = await Booking.findById(id);

              if (!booking) {
                set.status = 404;
                return {
                  status: "error",
                  message: "Booking not found",
                };
              }

              // Check if user is authorized to cancel the booking
              const isLandlord =
                (booking.landlord as mongoose.Types.ObjectId).toString() ===
                user.id;

              if (!isLandlord) {
                set.status = 403;
                return {
                  status: "error",
                  message: "Only landlords can cancel bookings",
                };
              }

              // Check if booking can be cancelled
              if (
                booking.status !== "pending" &&
                booking?.status !== "confirmed"
              ) {
                set.status = 400;
                return {
                  status: "error",
                  message: "Booking cannot be cancelled",
                };
              }

              booking.status = BookingStatus.CANCELLED;

              await booking.save();

              // If it was an approved long-term booking, update property status back to available
              if (
                // @ts-expect-error
                booking.status === BookingStatus.CONFIRMED &&
                booking.bookingType === "long-term"
              ) {
                await Property.findByIdAndUpdate(booking.property, {
                  status: "available",
                });
              }

              // Send email notification to landlord
              const property = await Property.findById(booking.property);

              try {
                await sendBookingCancellationEmail({
                  landlordEmail: (property?.landlord as any).email,
                  landlordName: (property?.landlord as any).name,
                  propertyTitle: property?.title as string,
                  propertyId: (
                    property?._id as mongoose.Types.ObjectId
                  ).toString(),
                  tenantName: (booking.tenant as any).name,
                  startDate: booking.startTime?.toString() as string,
                });
                console.log("Booking cancellation email sent");
              } catch (err) {
                console.error(
                  "Booking cancellation email could not be sent",
                  err
                );
              }

              return {
                status: "success",
                data: booking,
                message: "Booking cancelled successfully",
              };
            } catch (error) {
              set.status = 500;
              return {
                status: "error",
                message: "Failed to cancel booking",
              };
            }
          },
          {
            params: t.Object({
              id: t.String(),
            }),
            body: t.Object({
              paymentStatus: t.Enum({
                PENDING: "pending",
                PARTIAL: "partial",
                PAID: "paid",
              }),
              paymentMethod: t.String(),
            }),
            detail: {
              tags: ["bookings"],
              summary: "Cancel booking",
              description: "Cancel booking",
            },
          }
        )
        .put(
          "/:id/payment",
          async ({ params, body, set, user }) => {
            try {
              const { id } = params;
              const { paymentStatus, paymentMethod } = body;

              const booking = await Booking.findById(id);

              if (!booking) {
                set.status = 404;
                return {
                  status: "error",
                  message: "Booking not found",
                };
              }

              // Check if user is authorized to update the booking
              const isLandlord =
                (booking.landlord as mongoose.Types.ObjectId).toString() ===
                user.id;

              if (!isLandlord) {
                set.status = 403;
                return {
                  status: "error",
                  message: "Only landlords can update booking payment",
                };
              }

              booking.paymentStatus = paymentStatus;
              booking.paymentMethod = paymentMethod;

              if (paymentStatus === "paid" || paymentStatus === "partial") {
                booking.depositPaid = true;
              }

              await booking.save();

              return {
                status: "success",
                data: booking,
                message: "Booking payment updated successfully",
              };
            } catch (error) {
              set.status = 500;
              return {
                status: "error",
                message: "Failed to update booking payment",
              };
            }
          },
          {
            params: t.Object({
              id: t.String(),
            }),
            body: t.Object({
              paymentStatus: t.Enum({
                pending: "pending",
                partial: "partial",
                paid: "paid",
              }),
              paymentMethod: t.Enum(PaymentMethod),
            }),
            detail: {
              tags: ["bookings"],
              summary: "Update booking payment",
              description: "Update booking payment",
            },
          }
        )
        .post(
          "/:id/feedback",
          async ({ params, body, tenant, set }) => {
            try {
              const { id } = params;
              const { rating, comment } = body;

              // Validate rating
              if (!rating || rating < 1 || rating > 5) {
                set.status = 400;
                return {
                  status: "error",
                  message: "Rating must be between 1 and 5",
                };
              }

              const booking = await Booking.findById(id);

              if (!booking) {
                set.status = 404;
                return {
                  status: "error",
                  message: "Booking not found",
                };
              }

              // Check if user is the tenant
              if (
                (booking.tenant as mongoose.Types.ObjectId).toString() !==
                tenant.id
              ) {
                set.status = 403;
                return {
                  status: "error",
                  message: "Only the tenant can add feedback to a booking",
                };
              }

              // Check if booking is completed
              if (booking.status !== "completed") {
                set.status = 400;
                return {
                  status: "error",
                  message: "Feedback can only be added to completed bookings",
                };
              }

              // Check if feedback already exists
              if (booking.feedback?.rating) {
                set.status = 400;
                return {
                  status: "error",
                  message:
                    "Feedback has already been provided for this booking",
                };
              }

              booking.feedback = {
                rating,
                comment,
                createdAt: new Date(),
              };

              await booking.save();
              return {
                status: "success",
                data: booking.feedback,
                message: "Booking feedback added successfully",
              };
            } catch (error) {
              set.status = 500;
              return {
                status: "error",
                message: "Failed to add booking feedback",
              };
            }
          },
          {
            params: t.Object({
              id: t.String(),
            }),
            body: t.Object({
              rating: t.Number(),
              comment: t.String(),
            }),
            detail: {
              tags: ["bookings"],
              summary: "Add booking feedback",
              description: "Add booking feedback",
            },
          }
        )
        .get(
          "/property/:propertyId",
          async ({ params, set, query }) => {
            try {
              const { propertyId } = params;
              const { status, page = "1", limit = "10" } = query;

              const property = await Property.findById(propertyId);

              if (!property) {
                set.status = 404;
                return {
                  status: "error",
                  message: "Property not found",
                };
              }

              // Build filter
              const filter: FilterQuery<IBooking> = { property: propertyId };
              if (status) {
                filter.status = status;
              }

              // Parse pagination params
              const pageNum = Number.parseInt(page, 10);
              const limitNum = Number.parseInt(limit, 10);
              const skip = (pageNum - 1) * limitNum;

              // Execute query with pagination
              const bookings = await Booking.find(filter)
                .sort({ startTime: 1 })
                .skip(skip)
                .limit(limitNum)
                .populate("tenant", "firstName lastName email phone avatar");

              // Get total count for pagination
              const totalBookings = await Booking.countDocuments(filter);
              const totalPages = Math.ceil(totalBookings / limitNum);

              return {
                status: "success",
                data: bookings,
                pagination: {
                  total: totalBookings,
                  pages: totalPages,
                  page: pageNum,
                  limit: limitNum,
                },
                message: "Bookings fetched successfully",
              };
            } catch (error) {
              set.status = 500;
              return {
                status: "error",
                message: "Failed to fetch bookings",
              };
            }
          },
          {
            params: t.Object({
              propertyId: t.String(),
            }),
            query: t.Object({
              status: t.Optional(t.String()),
              page: t.Optional(t.String()),
              limit: t.Optional(t.String()),
            }),
            detail: {
              tags: ["bookings"],
              summary: "Get bookings by property ID",
              description: "Get bookings by property ID",
            },
          }
        )
    )
);
