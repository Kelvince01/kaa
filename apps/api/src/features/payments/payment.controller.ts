import {
  AppSubscription,
  Booking,
  Payment,
  Property,
  Tenant,
  User,
} from "@kaa/models";
import type { IAppSubscription } from "@kaa/models/types";
import { PaymentStatus } from "@kaa/models/types";
import { paymentService, ReceiptGenerator } from "@kaa/services";
import { logger } from "@kaa/utils";
import Elysia, { t } from "elysia";
import type mongoose from "mongoose";
import type { FilterQuery } from "mongoose";
// import { authPlugin } from "~/features/auth/auth.plugin";
import { accessPlugin } from "~/features/rbac/rbac.plugin";
// import { encryptionPlugin } from "~/plugins/encryption.plugin";
import {
  type PaymentResponse,
  paymentFiltersSchema,
  paymentSchema,
  paymentsResponseSchema,
} from "./payment.schema";

export const paymentController = new Elysia()
  .use(accessPlugin("payments", "create"))
  // .use(encryptionPlugin)
  .post(
    "/manual",
    async ({
      set,
      body,
      role,
      // getDecryptedData
    }) => {
      try {
        const { bookingId, amount, paymentMethod, transactionId, paymentDate } =
          body;

        // const decrypted = getDecryptedData();

        // if (!decrypted) {
        //   throw new Error("Decrypted data is not available");
        // }

        // Check if booking exists
        const booking = await Booking.findById(bookingId);

        if (!booking) {
          set.status = 404;
          return { status: "error", message: "Booking not found" };
        }

        // Only admin can record manual payments
        if (role.name !== "admin") {
          set.status = 403;
          return {
            status: "error",
            message: "Not authorized to record manual payments",
          };
        }

        // Create payment record
        const payment = await Payment.create({
          booking: bookingId,
          amount,
          paymentMethod,
          transactionId,
          paymentDate: paymentDate || new Date(),
          status: "completed",
        });

        // Update booking payment status
        if (amount >= booking?.totalAmount) {
          booking.paymentStatus = "paid";
        } else if (amount >= booking?.depositAmount) {
          booking.paymentStatus = "partial";
        }

        booking.depositPaid = true;
        await booking.save();

        set.status = 201;
        return {
          status: "success",
          data: payment,
        };
      } catch (error) {
        set.status = 500;
        return {
          status: "error",
          message: "",
        };
      }
    },
    {
      body: t.Object({
        bookingId: t.String(),
        amount: t.Number(),
        paymentMethod: t.String(),
        transactionId: t.String(),
        paymentDate: t.Date(),
      }),
      detail: {
        tags: ["payments"],
        summary: "Create a payment method",
        description: "Create a payment method",
      },
    }
  )
  .use(accessPlugin("payments", "read"))
  .get(
    "/",
    async ({ set, user, query }) => {
      const {
        status,
        paymentType,
        propertyId,
        startDate,
        endDate,
        search,
        sortBy = "createdAt",
        sortOrder = "desc",
        page = 1,
        limit = 10,
      } = query;

      const res = await paymentService.getPayments({
        userRole: (user.role as mongoose.Types.ObjectId)._id.toString(),
        userId: user.id,
        status,
        paymentType,
        propertyId,
        startDate,
        endDate,
        search,
        sortBy,
        sortOrder,
        page: page.toString(),
        limit: limit.toString(),
      });

      set.status = 200;

      const paymentsList: PaymentResponse[] = res.payments.map((payment) => ({
        _id: (payment._id as mongoose.Types.ObjectId).toString(),
        amount: payment.amount,
        currency: payment.currency,
        status: payment.status,
        type: payment.type,
        paymentMethod: payment.paymentMethod.toString(),
        paymentIntentId: payment.paymentIntentId,
        stripeChargeId: payment.stripeChargeId,
        paymentType: payment.type,
        description: payment.description,
        metadata: payment.metadata as any,
        tenant: payment.tenant.toString(),
        booking: payment.booking.toString(),
        landlord: payment.landlord.toString(),
        property: payment.property?.toString(),
        contract: payment.contract?.toString(),
        receiptUrl: payment.receiptUrl,
        refunded: payment.refunded,
        refundAmount: payment.refundAmount,
        refundId: payment.refundId,
        transactionId: payment.transactionId,
        referenceNumber: payment.referenceNumber,
        completedAt: payment.completedAt,
        paymentDate: payment.paidDate,
        paymentDetails: payment.paymentDetails,
        notes: payment.notes,
      }));

      return {
        status: "success",
        data: {
          payments: paymentsList,
          pagination: res.pagination,
        },
      };
    },
    {
      response: {
        200: t.Object({
          status: t.Literal("success"),
          data: paymentsResponseSchema,
        }),
      },
      query: paymentFiltersSchema,
      detail: {
        tags: ["payments"],
        summary: "Get user payments",
        description: "Get user payments",
      },
    }
  )
  .use(accessPlugin("payments", "read"))
  .get(
    "/history",
    async ({ set, user, query, role }) => {
      const {
        propertyId,
        paymentType,
        status,
        startDate,
        endDate,
        search,
        sortBy = "createdAt",
        sortOrder = "desc",
        page = 1,
        limit = 10,
        includeSubscriptions = true,
      } = query;

      const { payments, pagination } = await paymentService.getPayments({
        userRole: (user.role as mongoose.Types.ObjectId)._id.toString(),
        userId: user.id,
        status,
        paymentType,
        propertyId,
        startDate,
        endDate,
        search,
        sortBy,
        sortOrder,
        page: page.toString(),
        limit: limit.toString(),
      });

      // Format the response
      const formattedPayments = payments.map((payment) => ({
        _id: payment._id,
        paymentIntentId: payment.paymentIntentId,
        amount: payment.amount,
        amountFormatted: `£${(payment.amount / 100).toFixed(2)}`,
        currency: payment.currency,
        status: payment.status,
        paymentType: payment.type,
        paymentMethod: payment.paymentMethod,
        description: payment.description,
        property: payment.property,
        tenant: payment.tenant,
        landlord: payment.landlord,
        receiptUrl: payment.receiptUrl,
        refunded: payment.refunded,
        refundAmount: payment.refundAmount,
        createdAt: payment.createdAt,
      }));

      // If includeSubscriptions is true, get subscription payments as well
      let subscriptionPayments: any[] = [];
      if (includeSubscriptions) {
        // Build subscription filter
        const subscriptionFilter: FilterQuery<IAppSubscription> = {};

        // Filter by user role (tenant or landlord)
        if (role.name === "tenant") {
          subscriptionFilter.tenant = user.id;
        } else if (role.name === "landlord") {
          subscriptionFilter.landlord = user.id;
        }

        // Filter by property if provided
        if (propertyId) {
          subscriptionFilter.property = propertyId;
        }

        // Get active subscriptions
        const subscriptions = await AppSubscription.find(subscriptionFilter)
          .populate("tenant", "firstName lastName email")
          .populate("landlord", "firstName lastName email")
          .populate("property", "title address");

        // Add subscription info to response
        subscriptionPayments = subscriptions.map((subscription) => ({
          _id: subscription._id,
          stripeSubscriptionId: subscription.stripeSubscriptionId,
          amount: subscription.amount,
          amountFormatted: `£${(subscription.amount / 100).toFixed(2)}`,
          currency: subscription.currency,
          status: subscription.status,
          paymentType: "subscription",
          interval: subscription.interval,
          nextBillingDate: subscription.nextBillingDate,
          property: subscription.property,
          tenant: subscription.tenant,
          landlord: subscription.landlord,
          createdAt: subscription.createdAt,
        }));
      }

      set.status = 200;
      return {
        status: "success",
        data: {
          payments: [...formattedPayments, ...subscriptionPayments],
          pagination: {
            total:
              pagination.total +
              (includeSubscriptions ? subscriptionPayments.length : 0),
            page: pagination.page,
            limit: pagination.limit,
            pages: Math.ceil(pagination.total / pagination.limit),
          },
        } as any,
      };
    },
    {
      query: paymentFiltersSchema,
      response: {
        200: t.Object({
          status: t.Literal("success"),
          data: t.Array(t.Any()),
        }),
      },
      detail: {
        tags: ["payments"],
        summary: "Get user payment history",
        description: "Get user payment history",
      },
    }
  )
  .use(accessPlugin("payments", "read"))
  .get(
    "/user",
    async ({ set, user, role }) => {
      let query = {};

      if (role.name === "tenant") {
        query = { tenant: user.id };
      } else if (role.name === "landlord") {
        query = { landlord: user.id };
      }

      const payments = await Payment.find(query)
        .populate("booking", "startDate endDate status")
        .populate("property", "title address")
        .populate("tenant", "firstName lastName email phoneNumber")
        .populate("landlord", "firstName lastName email phoneNumber")
        .sort("-createdAt");

      set.status = 200;
      return {
        status: "success",
        data: payments as any,
      };
    },
    {
      response: {
        200: t.Object({
          status: t.Literal("success"),
          data: t.Array(paymentSchema),
        }),
      },
      detail: {
        tags: ["payments"],
        summary: "Get user payments",
        description: "Get user payments",
      },
    }
  )
  .use(accessPlugin("payments", "read"))
  .get(
    "/:id",
    async ({ set, params, user, role }) => {
      try {
        const { id } = params;
        const Payment = (await import("@kaa/models")).Payment;
        const payment = await Payment.findById(id)
          .populate("booking")
          .populate("property")
          .populate("tenant")
          .populate("landlord");

        if (!payment) {
          set.status = 404;
          return { status: "error", message: "Payment not found" };
        }

        if (
          (role.name === "tenant" && payment.tenant.toString() !== user.id) ||
          (role.name === "landlord" && payment.landlord.toString() !== user.id)
        ) {
          set.status = 403;
          return {
            status: "error",
            message: "You do not have permission to view this payment",
          };
        }

        set.status = 200;
        return {
          status: "success",
          data: {
            ...payment.toObject(),
            _id: (payment._id as mongoose.Types.ObjectId).toString(),
            paymentMethod: payment.paymentMethod?.toString?.() ?? "",
            tenant: payment.tenant?.toString?.() ?? "",
            landlord: payment.landlord?.toString?.() ?? "",
            property: payment.property?.toString?.() ?? "",
            booking: payment.booking?.toString?.() ?? "",
          } as any,
        };
      } catch (error) {
        set.status = 500;
        return {
          status: "error",
          message:
            error instanceof Error ? error.message : "Failed to get payment",
        };
      }
    },
    {
      response: {
        200: t.Object({
          status: t.Literal("success"),
          data: paymentSchema,
        }),
        404: t.Object({
          status: t.Literal("error"),
          message: t.String(),
        }),
        403: t.Object({
          status: t.Literal("error"),
          message: t.String(),
        }),
        500: t.Object({
          status: t.Literal("error"),
          message: t.String(),
        }),
      },
      details: {
        tags: ["payments"],
        summary: "Get payment by ID",
        description: "Get payment by ID",
      },
    }
  )
  .use(accessPlugin("payments", "read"))
  .get(
    "/:id/status",
    async ({ set, params, user, role }) => {
      try {
        const { id } = params;
        const Payment = (await import("@kaa/models")).Payment;
        const Booking = (await import("@kaa/models")).Booking;

        const payment = await Payment.findById(id);
        if (!payment) {
          set.status = 404;
          return { status: "error", message: "Payment not found" };
        }

        const booking = await Booking.findById(payment.booking);
        if (
          booking?.tenant?.toString() !== user.id &&
          booking?.landlord?.toString() !== user.id &&
          role.name !== "admin"
        ) {
          set.status = 403;
          return {
            status: "error",
            message: "Not authorized to view this payment",
          };
        }

        set.status = 200;
        return {
          status: "success",
          data: {
            ...payment.toObject(),
            _id: (payment._id as mongoose.Types.ObjectId).toString(),
            paymentMethod: payment.paymentMethod?.toString?.() ?? "",
            tenant: payment.tenant?.toString?.() ?? "",
            landlord: payment.landlord?.toString?.() ?? "",
            property: payment.property?.toString?.() ?? "",
            booking: payment.booking?.toString?.() ?? "",
          } as any,
        };
      } catch (error) {
        set.status = 500;
        return {
          status: "error",
          message:
            error instanceof Error
              ? error.message
              : "Failed to get payment status",
        };
      }
    },
    {
      response: {
        200: t.Object({
          status: t.Literal("success"),
          data: paymentSchema,
        }),
        404: t.Object({
          status: t.Literal("error"),
          message: t.String(),
        }),
        403: t.Object({
          status: t.Literal("error"),
          message: t.String(),
        }),
        500: t.Object({
          status: t.Literal("error"),
          message: t.String(),
        }),
      },
      detail: {
        tags: ["payments"],
        summary: "Get payment status",
        description: "Get payment status",
      },
    }
  )
  .use(accessPlugin("payments", "read"))
  .get(
    "/booking/:bookingId",
    async ({ set, params, user, role }) => {
      try {
        const { bookingId } = params;
        const Booking = (await import("@kaa/models")).Booking;
        const Payment = (await import("@kaa/models")).Payment;

        const booking = await Booking.findById(bookingId);
        if (!booking) {
          set.status = 404;
          return { status: "error", message: "Booking not found" };
        }

        if (
          booking.tenant?.toString() !== user.id &&
          booking.landlord?.toString() !== user.id &&
          role.name !== "admin"
        ) {
          set.status = 403;
          return {
            status: "error",
            message: "Not authorized to view these payments",
          };
        }

        const payments = await Payment.find({ booking: bookingId }).sort(
          "-createdAt"
        );
        set.status = 200;
        return {
          status: "success",
          data: payments.map((payment) => ({
            ...payment.toObject(),
            _id: (payment._id as mongoose.Types.ObjectId).toString(),
            paymentMethod: payment.paymentMethod?.toString?.() ?? "",
            tenant: payment.tenant?.toString?.() ?? "",
            landlord: payment.landlord?.toString?.() ?? "",
            property: payment.property?.toString?.() ?? "",
            booking: payment.booking?.toString?.() ?? "",
          })) as any,
        };
      } catch (error) {
        set.status = 500;
        return {
          status: "error",
          message:
            error instanceof Error
              ? error.message
              : "Failed to get payment receipt",
        };
      }
    },
    {
      response: {
        200: t.Object({
          status: t.Literal("success"),
          data: t.Array(paymentSchema),
        }),
        404: t.Object({
          status: t.Literal("error"),
          message: t.String(),
        }),
        403: t.Object({
          status: t.Literal("error"),
          message: t.String(),
        }),
        500: t.Object({
          status: t.Literal("error"),
          message: t.String(),
        }),
      },
      detail: {
        tags: ["payments"],
        summary: "Get all booking payments",
        description: "Get all payments for a specific booking",
      },
    }
  )
  .use(accessPlugin("payments", "update"))
  .patch(
    "/:paymentId/verify",
    async ({ set, params, body, user, role }) => {
      try {
        const { paymentId } = params;
        const { transactionId, notes } = body;
        const Payment = (await import("@kaa/models")).Payment;
        const Booking = (await import("@kaa/models")).Booking;

        const payment = await Payment.findById(paymentId);
        if (!payment) {
          set.status = 404;
          return { status: "error", message: "Payment not found" };
        }

        if (role.name !== "admin" && role.name !== "landlord") {
          set.status = 403;
          return {
            status: "error",
            message: "You do not have permission to verify payments",
          };
        }

        if (
          role.name === "landlord" &&
          payment.landlord.toString() !== user.id
        ) {
          set.status = 403;
          return {
            status: "error",
            message: "You can only verify payments for your own properties",
          };
        }

        payment.status = PaymentStatus.COMPLETED;
        payment.transactionId = transactionId || payment.transactionId;
        payment.notes = notes;
        payment.updatedAt = new Date();
        await payment.save();

        const booking = await Booking.findById(payment.booking);
        if (booking) {
          booking.paymentDetails.push({
            amount: payment.amount,
            paymentMethod: payment.paymentMethod,
            transactionId: payment.transactionId as string,
            paymentDate: payment.paidDate as Date,
            status: PaymentStatus.COMPLETED,
          });

          const totalPaid = booking.paymentDetails.reduce(
            (sum, detail) =>
              detail.status === "completed" ? sum + detail.amount : sum,
            0
          );

          if (totalPaid >= booking.totalAmount + booking.depositAmount) {
            booking.paymentStatus = "paid";
          } else if (totalPaid > 0) {
            booking.paymentStatus = "partial";
          }

          await booking.save();
        }

        set.status = 200;
        return {
          status: "success",
          data: {
            ...payment.toObject(),
            _id: (payment._id as mongoose.Types.ObjectId).toString(),
            paymentMethod: payment.paymentMethod?.toString?.() ?? "",
            tenant: payment.tenant?.toString?.() ?? "",
            landlord: payment.landlord?.toString?.() ?? "",
            property: payment.property?.toString?.() ?? "",
            booking: payment.booking?.toString?.() ?? "",
          } as any,
        };
      } catch (error) {
        set.status = 500;
        return {
          status: "error",
          message:
            error instanceof Error ? error.message : "Failed to verify payment",
        };
      }
    },
    {
      body: t.Object({
        transactionId: t.String(),
        notes: t.String(),
      }),
      response: {
        200: t.Object({
          status: t.Literal("success"),
          data: paymentSchema,
        }),
        404: t.Object({
          status: t.Literal("error"),
          message: t.String(),
        }),
        403: t.Object({
          status: t.Literal("error"),
          message: t.String(),
        }),
        500: t.Object({
          status: t.Literal("error"),
          message: t.String(),
        }),
      },
      detail: {
        tags: ["payments"],
        summary: "Verify payment",
        description: "Verify payment",
      },
    }
  )
  .use(accessPlugin("payments", "read"))
  .get(
    "/generate/:paymentId/receipt",
    async ({ set, params, user, role, query }) => {
      try {
        const { paymentId } = params;
        const { format = "pdf" } = query;

        const Payment = (await import("@kaa/models")).Payment;

        const userObj = await User.findById(user.id);
        if (!userObj) {
          set.status = 404;
          return { status: "error", message: "User not found" };
        }

        try {
          const paymentIntent = await Payment.findById(paymentId);

          const isAuthorized =
            paymentIntent?.tenant?.toString() === user.id ||
            paymentIntent?.landlord?.toString() === user.id ||
            role.name === "admin";

          if (!isAuthorized) {
            set.status = 403;
            return {
              status: "error",
              message: "Not authorized to access this payment",
            };
          }

          // Get property details if available
          let property: any = null;
          if (paymentIntent?.property) {
            property = await Property.findById(paymentIntent.property)
              .select("title location")
              .populate("landlord", "firstName lastName email address");
          }

          // Get tenant details
          let tenant: any = null;
          if (paymentIntent?.tenant) {
            tenant = await Tenant.findById(paymentIntent.tenant).select(
              "personalInfo"
            );
          }

          // Generate receipt data
          const receipt = {
            paymentId: paymentIntent?._id,
            receiptNumber: `R-${new Date().getFullYear()}-${Math.floor(
              Math.random() * 100_000
            )
              .toString()
              .padStart(5, "0")}`,
            issueDate: new Date(),
            paymentDate: paymentIntent?.createdAt,
            paymentMethod: paymentIntent?.paymentMethod, // This would be more detailed in a real implementation
            amount: paymentIntent?.amount || 0,
            amountFormatted: `£${((paymentIntent?.amount || 0) / 100).toFixed(2)}`,
            currency: paymentIntent?.currency?.toUpperCase() || "GBP",
            description:
              paymentIntent?.description || `${paymentIntent?.type} payment`,
            from: tenant
              ? {
                  name: `${tenant.personalInfo.firstName} ${tenant.personalInfo.lastName}`,
                  email: tenant.personalInfo.email,
                }
              : {
                  name: "Tenant",
                  email: "tenant@example.com",
                },
            to: property?.landlord
              ? {
                  name: `${(property.landlord as any).firstName} ${(property.landlord as any).lastName}`,
                  address: (property.landlord as any).address
                    ? `${(property.landlord as any)?.address?.line1}, ${(property.landlord as any)?.address?.town}, ${(property.landlord as any)?.address?.postalCode}`
                    : "Address not available",
                }
              : {
                  name: "Kaa Softwares Ltd",
                  address: "123 Company Road, London, SW1A 1AA",
                },
            property: property
              ? {
                  id: property._id,
                  address: property.location.address
                    ? `${property.location.address.line1}, ${property.location.address.town}, ${property.location.address.postalCode}`
                    : "Address not available",
                }
              : null,
          };

          // Generate a PDF receipt if format is 'pdf'
          if (format === "pdf") {
            const receiptGenerator = new ReceiptGenerator();
            const receiptData = {
              receiptNumber: receipt.receiptNumber,
              paymentDate: receipt.paymentDate as Date,
              tenantName: receipt.from.name,
              phoneNumber: receipt.from.email, // Using email as we don't have phone in the current data
              propertyName:
                receipt.property?.address || "Property Address Not Available",
              unitNumber: receipt.property?.id?.toString() || "N/A",
              description: receipt.description,
              amount: receipt.amount / 100, // Convert from cents to actual amount
              paymentMethod: receipt.paymentMethod?.toString() as string,
              transactionId: receipt.paymentId as string,
            };

            try {
              // Generate PDF as buffer
              const pdfBuffer =
                await receiptGenerator.generateReceipt(receiptData);

              // Or save directly to file
              await receiptGenerator.saveToFile(
                receiptData,
                "../../receipts/receipt.pdf"
              );

              // Set appropriate headers for PDF download
              set.headers["Content-Type"] = "application/pdf";
              set.headers["Content-Disposition"] =
                `attachment; filename="receipt-${receipt.receiptNumber}.pdf"`;
              set.headers["Content-Length"] = pdfBuffer.length;

              // Send the PDF buffer
              // res.end(pdfBuffer);
              return pdfBuffer;
            } catch (pdfError) {
              logger.error("PDF generation error:", pdfError);
              set.status = 500;
              return {
                status: "error",
                message: "Failed to generate PDF receipt",
              };
            }
          } else {
            // Return JSON data for non-PDF formats
            set.status = 200;
            return {
              status: "success",
              data: receipt,
            };
          }
        } catch (stripeError) {
          set.status = 404;
          return {
            status: "error",
            message: "Payment not found",
          };
        }
      } catch (error) {
        set.status = 500;
        return {
          status: "error",
          message:
            error instanceof Error
              ? error.message
              : "Failed to get payment receipt",
        };
      }
    },
    {
      params: t.Object({
        paymentId: t.String(),
      }),
      response: {
        // 200: t.Object({
        // 	status: t.Literal("success"),
        // 	data: paymentSchema,
        // }),
        404: t.Object({
          status: t.Literal("error"),
          message: t.String(),
        }),
        403: t.Object({
          status: t.Literal("error"),
          message: t.String(),
        }),
        500: t.Object({
          status: t.Literal("error"),
          message: t.String(),
        }),
      },
      detail: {
        tags: ["payments"],
        summary: "Get payment receipt",
        description: "Get payment receipt",
      },
    }
  )
  .get(
    "/statistics",
    async ({ set, user, query }) => {
      try {
        const { propertyId, timeframe = "month" } = query;

        // Find the user
        const userObj = await User.findById(user.id);

        if (!userObj) {
          set.status = 404;
          return {
            status: "error",
            message: "User not found",
          };
        }

        // Check if user has a Stripe customer ID
        // if (!user.stripeCustomerId && user.role !== "admin" && user.role !== "landlord") {
        // 	set.status = 200;
        // 	return {
        // 		status: "success",
        // 		data: {
        // 			statistics: { totalAmount: 0, totalPayments: 0 },
        // 		},
        // 	};
        // }

        // In a real implementation, you would fetch from a Payment model
        // For demo purposes, generate mock statistics

        // Calculate date range based on timeframe
        const now = new Date();
        let startDate = new Date();
        switch (timeframe) {
          case "month":
            startDate.setMonth(now.getMonth() - 1);
            break;
          case "quarter":
            startDate.setMonth(now.getMonth() - 3);
            break;
          case "year":
            startDate.setFullYear(now.getFullYear() - 1);
            break;
          case "all":
            startDate = new Date(0); // Beginning of time
            break;
          default:
            startDate = new Date(0); // Beginning of time
            break;
        }

        // Mock statistics data
        const totalAmount = 4_500_000; // £45,000 in pence
        const totalPayments = 30;
        const averageAmount = Math.round(totalAmount / totalPayments);

        // Payment types breakdown
        const byType = {
          rent: {
            count: 24,
            amount: 3600000n,
            amountFormatted: "£36,000.00",
          },
          deposit: {
            count: 3,
            amount: 600000n,
            amountFormatted: "£6,000.00",
          },
          fee: {
            count: 3,
            amount: 300000n,
            amountFormatted: "£3,000.00",
          },
        };

        // Monthly breakdown
        const byMonth = [
          {
            month: "2023-06",
            count: 10,
            amount: 1500000n,
            amountFormatted: "£15,000.00",
          },
          {
            month: "2023-07",
            count: 10,
            amount: 1500000n,
            amountFormatted: "£15,000.00",
          },
          {
            month: "2023-08",
            count: 10,
            amount: 1500000n,
            amountFormatted: "£15,000.00",
          },
        ];

        const statistics = {
          totalAmount,
          totalAmountFormatted: "£45,000.00",
          totalPayments,
          averageAmount,
          averageAmountFormatted: "£1,500.00",
          byType,
          byMonth,
        };

        const statisticsOld = {
          totalAmount: 4500000n,
          totalAmountFormatted: "£45,000.00",
          totalPayments: 30,
          averageAmount: 150000n,
          averageAmountFormatted: "£1,500.00",
          byType: {
            rent: {
              count: 24,
              amount: 3600000n,
              amountFormatted: "£36,000.00",
            },
            deposit: {
              count: 3,
              amount: 600000n,
              amountFormatted: "£6,000.00",
            },
            fee: {
              count: 3,
              amount: 300000n,
              amountFormatted: "£3,000.00",
            },
          },
          byMonth: [
            {
              month: "2023-06",
              count: 10,
              amount: 1500000n,
              amountFormatted: "£15,000.00",
            },
            {
              month: "2023-07",
              count: 10,
              amount: 1500000n,
              amountFormatted: "£15,000.00",
            },
            {
              month: "2023-08",
              count: 10,
              amount: 1500000n,
              amountFormatted: "£15,000.00",
            },
          ],
        };

        set.status = 200;
        return {
          status: "success",
          data: statistics as any,
        };
      } catch (error) {
        set.status = 500;
        return {
          status: "error",
          message:
            error instanceof Error
              ? error.message
              : "Failed to get payment statistics",
        };
      }
    },
    {
      query: t.Object({
        propertyId: t.String(),
        timeframe: t.String(),
      }),
      response: {
        200: t.Object({
          status: t.Literal("success"),
          data: paymentSchema,
        }),
        404: t.Object({
          status: t.Literal("error"),
          message: t.String(),
        }),
        403: t.Object({
          status: t.Literal("error"),
          message: t.String(),
        }),
        500: t.Object({
          status: t.Literal("error"),
          message: t.String(),
        }),
      },
      detail: {
        tags: ["payments"],
        summary: "Get payment statistics",
        description: "Get payment statistics",
      },
    }
  );
