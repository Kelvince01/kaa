import config from "@kaa/config/api";
import {
  Booking,
  MpesaTransaction,
  Payment,
  Property,
  Tenant,
} from "@kaa/models";
import {
  BookingStatus,
  NotificationType,
  PaymentMethod,
  PaymentStatus,
  PaymentType,
} from "@kaa/models/types";
import { emailService, mpesaService, notificationFactory } from "@kaa/services";
import { AppError } from "@kaa/utils";
import Elysia, { t } from "elysia";
import type mongoose from "mongoose";
// import { authPlugin } from "~/features/auth/auth.plugin";
import { rolePlugin } from "~/features/rbac/rbac.plugin";

export const mpesaController = new Elysia({
  detail: {
    tags: ["payments"],
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
})
  .use(rolePlugin)
  .group("/mpesa", (app) =>
    app
      .post(
        "/initiate",
        async ({ set, user, body, role }) => {
          try {
            const userId = user?.id;
            const {
              bookingId,
              phoneNumber,
              amount,
              paymentMethod,
              paymentType,
            } = body;

            // Validate booking
            const booking = await Booking.findById(bookingId);

            if (!booking) {
              set.status = 404;
              return {
                status: "error",
                message: "Booking not found",
              };
            }

            if (
              (booking?.tenant as mongoose.Types.ObjectId).toString() !==
                userId &&
              role.name !== "admin"
            ) {
              set.status = 403;
              return {
                status: "error",
                message: "You can only make payments for your own bookings",
              };
            }

            // Check if booking is approved
            if (booking?.status !== BookingStatus.CONFIRMED) {
              set.status = 400;
              return {
                status: "error",
                message:
                  "Cannot make payment for a booking that is not approved",
              };
            }

            // Get property and landlord details
            const property = await Property.findById(booking?.property);

            if (!property) {
              set.status = 404;
              return {
                status: "error",
                message: "Property not found",
              };
            }

            // Format phone number (remove leading 0 and add country code if needed)
            let formattedPhone = phoneNumber;
            if (phoneNumber.startsWith("0")) {
              formattedPhone = `254${phoneNumber.substring(1)}`;
            }
            if (!phoneNumber.startsWith("254")) {
              formattedPhone = `254${phoneNumber}`;
            }

            // Determine payment amount (deposit or full amount)
            const paymentAmount = amount || booking?.depositAmount;

            // Create payment record
            const payment = new Payment({
              booking: bookingId,
              property: booking?.property,
              tenant: userId,
              landlord: property?.landlord,
              amount: paymentAmount,
              paymentMethod,
              paymentType,
              status: PaymentStatus.PENDING,
            });

            await payment.save();

            // If payment method is M-Pesa, initiate M-Pesa payment
            if (paymentMethod === PaymentMethod.MPESA) {
              try {
                const mpesaResponse = await mpesaService.initiateMpesaPayment({
                  phoneNumber: user?.phone as string,
                  amount,
                  accountReference: `Rental-${bookingId}`,
                  transactionDesc: `Payment for ${paymentType}`,
                  callbackUrl: `${config.app.url}/api/v1/payments/mpesa/callback`,
                });

                // Update payment with M-Pesa checkout request ID
                payment.transactionId = mpesaResponse.checkoutRequestID;
                payment.paymentDetails = mpesaResponse;
                await payment.save();

                const mpesaTransaction = new MpesaTransaction({
                  payment: payment._id,
                  receiptNumber: "",
                  phoneNumber: formattedPhone,
                });

                await mpesaTransaction.save();

                return {
                  status: "success",
                  message:
                    "M-Pesa payment initiated. Please complete the payment on your phone.",
                  data: {
                    payment,
                    mpesaResponse,
                  },
                };
              } catch (error: any) {
                // Update payment status to failed
                payment.status = PaymentStatus.FAILED;
                payment.paymentDetails = error.response
                  ? error.response.data
                  : error.message;
                await payment.save();

                throw new AppError(
                  "Failed to initiate M-Pesa payment. Please try again.",
                  500
                );
              }
            }

            set.status = 200;

            return {
              status: "success",
              message: "Payment initiated successfully",
              data: payment,
            };
          } catch (error) {
            if (error instanceof AppError) {
              set.status = error.statusCode;
              return {
                status: "error",
                message: error.message,
              };
            }

            set.status = 500;
            return {
              status: "error",
              message: "An error occurred while initiating payment",
            };
          }
        },
        {
          response: {
            // 	200: t.Object({
            // 		success: t.Boolean(),
            // 		message: t.String(),
            // 		data: t.Object({
            // 			payment: paymentResponseSchema,
            // 			mpesaResponse: MpesaResponseSchema,
            // 		}),
            // 	}),
            400: t.Object({
              success: t.Boolean(),
              message: t.String(),
            }),
            500: t.Object({
              success: t.Boolean(),
              message: t.String(),
            }),
          },
          body: t.Object({
            bookingId: t.String(),
            phoneNumber: t.String(),
            amount: t.Number(),
            paymentMethod: t.String(),
            paymentType: t.String(),
          }),
          detail: {
            tags: ["payments"],
            summary: "Initiate M-Pesa payment",
            description: "Initiate M-Pesa payment",
          },
        }
      )
      .post(
        "/callback",
        async ({ set, body }) => {
          try {
            const { Body } = body;

            // Process the callback data
            const callbackResult = mpesaService.processMpesaCallback(body);

            // Handle M-Pesa callback
            if (callbackResult.success) {
              // Payment successful
              const checkoutRequestID = Body.stkCallback.CheckoutRequestID;
              const mpesaReceiptNumber = callbackResult.mpesaReceiptNumber;

              // Find payment by transaction ID
              const payment = await Payment.findOne({
                transactionId: checkoutRequestID,
              });

              const mpesaTransaction = await MpesaTransaction.findOne({
                payment: payment?._id,
              });

              if (payment) {
                // Update payment status
                payment.status = PaymentStatus.COMPLETED;
                payment.updatedAt = new Date();
                payment.paidDate = new Date();
                payment.paymentDetails = Body;
                await payment.save();

                if (mpesaTransaction) {
                  mpesaTransaction.mpesaReceiptNumber = mpesaReceiptNumber;
                  await mpesaTransaction.save();
                }

                // Update booking payment status
                const booking = await Booking.findById(payment.booking);

                if (booking) {
                  // Add payment to booking payment details
                  booking.paymentDetails.push({
                    amount: payment.amount,
                    paymentMethod: payment.paymentMethod,
                    transactionId:
                      mpesaTransaction?.mpesaReceiptNumber as string,
                    paymentDate: payment.paidDate as Date,
                    status: "completed",
                  });

                  // Calculate total paid amount
                  const totalPaid = booking.paymentDetails.reduce(
                    (sum, detail) =>
                      detail.status === "completed" ? sum + detail.amount : sum,
                    0
                  );

                  // Update booking payment status
                  if (
                    totalPaid >=
                    booking.totalAmount + booking.depositAmount
                  ) {
                    booking.paymentStatus = "paid";
                    booking.depositPaid = true;
                  } else if (totalPaid > 0) {
                    booking.paymentStatus = "partial";
                  }

                  // If this is the first payment and it's for deposit or first month, confirm booking
                  if (
                    booking.status === BookingStatus.PENDING &&
                    (payment.type === PaymentType.DEPOSIT ||
                      payment.type === PaymentType.RENT)
                  ) {
                    booking.status = BookingStatus.CONFIRMED;
                  }

                  await booking.save();

                  // Send confirmation email to tenant
                  const tenant = await Tenant.findById(booking.tenant);

                  if (tenant) {
                    const message = `
                                                  Hello ${tenant.personalInfo.firstName},
                                                  
                                                  Your payment of KES ${callbackResult.amount} for booking ID ${booking._id} has been received.
                                                  
                                                  Payment details:
                                                  - M-Pesa Receipt Number: ${mpesaReceiptNumber}
                                                  - Amount: KES ${callbackResult.amount}
                                                  - Phone Number: ${callbackResult.phoneNumber}
                                                  - Transaction Date: ${callbackResult.transactionDate}
                                                  
                                                  Thank you for using our platform.
                                                `;

                    try {
                      await emailService.sendEmail({
                        to: [tenant.personalInfo.email],
                        subject: "Payment Confirmation",
                        text: message,
                        content: message,
                      });
                    } catch (err) {
                      console.error("Email could not be sent", err);
                    }
                  }
                }
              }
            } else {
              // Payment failed
              const checkoutRequestID = Body.stkCallback.CheckoutRequestID;

              // Find payment by transaction ID
              const payment = await Payment.findOne({
                transactionId: checkoutRequestID,
              });

              if (payment) {
                // Update payment status
                payment.status = PaymentStatus.FAILED;
                payment.notes = `M-Pesa payment failed: ${Body.stkCallback.ResultDesc}`;
                payment.updatedAt = new Date();
                payment.paymentDetails = Body;
                await payment.save();

                // Create payment notification
                await notificationFactory.createPaymentNotification(
                  payment,
                  NotificationType.PAYMENT_FAILED
                );
              }
            }

            // Respond to M-Pesa
            set.status = 200;
            return { ResultCode: 0, ResultDesc: "Accepted" };
          } catch (error) {
            console.error("M-Pesa callback error:", error);
            set.status = 200;
            return { ResultCode: 0, ResultDesc: "Accepted" };
          }
        },
        {
          response: {
            200: t.Object({
              ResultCode: t.Number(),
              ResultDesc: t.String(),
            }),
          },
          body: t.Object({
            Body: t.Object({
              stkCallback: t.Object({
                CheckoutRequestID: t.String(),
                ResultCode: t.Number(),
                ResultDesc: t.String(),
              }),
            }),
          }),
          detail: {
            tags: ["payments"],
            summary: "Process M-Pesa callback data",
            description: "Process M-Pesa callback data",
          },
        }
      )
      .post(
        "/verify",
        async ({ set, body }) => {
          try {
            const { checkoutRequestID } = body;

            const result =
              await mpesaService.verifyMpesaPayment(checkoutRequestID);

            return {
              status: "success",
              data: result,
            };
          } catch (error: any) {
            set.status = 500;
            return {
              status: "error",
              message: error.message || "Failed to verify M-Pesa payment",
            };
          }
        },
        {
          body: t.Object({
            checkoutRequestID: t.String(),
          }),
          detail: {
            tags: ["payments"],
            summary: "Verify M-Pesa payment status",
            description: "Query the status of an M-Pesa payment",
          },
        }
      )
      .post(
        "/b2c",
        async ({ set, body, role }) => {
          try {
            // Only admins and landlords can initiate B2C payments
            if (!["admin", "landlord"].includes(role.name)) {
              set.status = 403;
              return {
                status: "error",
                message: "Not authorized to initiate B2C payments",
              };
            }

            const { phoneNumber, amount, remarks, occassion, commandId } = body;

            const result = await mpesaService.initiateB2CTransaction({
              phoneNumber,
              amount,
              remarks,
              occasion: occassion as string,
              commandID: commandId as
                | "SalaryPayment"
                | "BusinessPayment"
                | "PromotionPayment",
            });

            return {
              status: "success",
              data: result,
            };
          } catch (error: any) {
            set.status = 500;
            return {
              status: "error",
              message: error.message || "Failed to initiate B2C payment",
            };
          }
        },
        {
          body: t.Object({
            phoneNumber: t.String(),
            amount: t.Number(),
            remarks: t.String(),
            occassion: t.Optional(t.String()),
            commandId: t.Optional(t.String()),
          }),
          detail: {
            tags: ["payments"],
            summary: "Initiate B2C payment",
            description: "Send money from business to customer",
          },
        }
      )
      .post(
        "/b2b",
        async ({ set, body, role }) => {
          try {
            // Only admins can initiate B2B payments
            if (role.name !== "admin") {
              set.status = 403;
              return {
                status: "error",
                message: "Not authorized to initiate B2B payments",
              };
            }

            const {
              receivingShortCode,
              amount,
              remarks,
              accountReference,
              commandId,
            } = body;

            const result = await mpesaService.initiateB2BTransaction(
              receivingShortCode,
              amount,
              remarks,
              accountReference,
              commandId
            );

            return {
              status: "success",
              data: result,
            };
          } catch (error: any) {
            set.status = 500;
            return {
              status: "error",
              message: error.message || "Failed to initiate B2B payment",
            };
          }
        },
        {
          body: t.Object({
            receivingShortCode: t.String(),
            amount: t.Number(),
            remarks: t.String(),
            accountReference: t.Optional(t.String()),
            commandId: t.Optional(t.String()),
          }),
          detail: {
            tags: ["payments"],
            summary: "Initiate B2B payment",
            description: "Send money from business to business",
          },
        }
      )
      .post(
        "/reverse",
        async ({ set, body, role }) => {
          try {
            // Only admins can reverse transactions
            if (role.name !== "admin") {
              set.status = 403;
              return {
                status: "error",
                message: "Not authorized to reverse transactions",
              };
            }

            const { transactionId, amount, remarks, occassion } = body;

            const result = await mpesaService.reverseTransaction(
              transactionId,
              amount,
              remarks,
              occassion
            );

            return {
              status: "success",
              data: result,
            };
          } catch (error: any) {
            set.status = 500;
            return {
              status: "error",
              message: error.message || "Failed to reverse transaction",
            };
          }
        },
        {
          body: t.Object({
            transactionId: t.String(),
            amount: t.Number(),
            remarks: t.String(),
            occassion: t.Optional(t.String()),
          }),
          detail: {
            tags: ["payments"],
            summary: "Reverse M-Pesa transaction",
            description: "Reverse a completed M-Pesa transaction",
          },
        }
      )
      .get(
        "/balance",
        async ({ set, role }) => {
          try {
            // Only admins can check balance
            if (role.name !== "admin") {
              set.status = 403;
              return {
                status: "error",
                message: "Not authorized to check balance",
              };
            }

            const result = await mpesaService.checkAccountBalance();

            return {
              status: "success",
              data: result,
            };
          } catch (error: any) {
            set.status = 500;
            return {
              status: "error",
              message: error.message || "Failed to check account balance",
            };
          }
        },
        {
          detail: {
            tags: ["payments"],
            summary: "Check M-Pesa account balance",
            description: "Get the current account balance",
          },
        }
      )
      .post(
        "/query-status",
        async ({ set, body }) => {
          try {
            const { originatorConversationId, conversationId } = body;

            const result = await mpesaService.queryTransactionStatus(
              originatorConversationId,
              conversationId
            );

            return {
              status: "success",
              data: result,
            };
          } catch (error: any) {
            set.status = 500;
            return {
              status: "error",
              message: error.message || "Failed to query transaction status",
            };
          }
        },
        {
          body: t.Object({
            originatorConversationId: t.String(),
            conversationId: t.String(),
          }),
          detail: {
            tags: ["payments"],
            summary: "Query transaction status",
            description: "Check the status of a specific transaction",
          },
        }
      )
      .post(
        "/register-urls",
        async ({ set, role }) => {
          try {
            // Only admins can register URLs
            if (role.name !== "admin") {
              set.status = 403;
              return {
                status: "error",
                message: "Not authorized to register URLs",
              };
            }

            const result = await mpesaService.registerC2BUrls();

            return {
              status: "success",
              data: result,
            };
          } catch (error: any) {
            set.status = 500;
            return {
              status: "error",
              message: error.message || "Failed to register URLs",
            };
          }
        },
        {
          detail: {
            tags: ["payments"],
            summary: "Register validation and confirmation URLs",
            description:
              "Register URLs for C2B validation and confirmation callbacks",
          },
        }
      )
  );
