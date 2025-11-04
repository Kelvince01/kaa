import config from "@kaa/config/api";
import { User, Wallet, WalletTransaction } from "@kaa/models";
import {
  type IWalletTransaction,
  TransactionStatus,
  TransactionType,
} from "@kaa/models/types";
import { mpesaService } from "@kaa/services";
import { Elysia, t } from "elysia";
import mongoose, { type FilterQuery } from "mongoose";
import { authPlugin } from "../auth/auth.plugin";
import { generateReference } from "./wallet.util";

export const walletController = new Elysia({ name: "wallets" }).group(
  "/wallets",
  (app) =>
    app
      .use(authPlugin)
      // Get wallet balance
      .get(
        "/",
        async ({ set, user }) => {
          const wallet = await Wallet.findOne({ userId: user.id });

          if (!wallet) {
            set.status = 404;
            return { status: "error", message: "Wallet not found" };
          }

          set.status = 200;
          return {
            balance: wallet.balance,
            status: wallet.status,
            limits: {
              daily: wallet.dailyLimit,
              monthly: wallet.monthlyLimit,
            },
          };
        },
        {
          detail: {
            tags: ["wallets"],
            summary: "Get wallet balance",
          },
        }
      )

      // Deposit to wallet via M-Pesa
      .post(
        "/deposit",
        async ({ user, body }) => {
          const { amount, phoneNumber } = body;

          const wallet = await Wallet.findOne({ userId: user.id });
          if (!wallet) {
            throw new Error("Wallet not found");
          }

          // Check limits
          const dailyTotal = await calculateDailyTotal(user.id, "deposit");
          if (dailyTotal + amount > wallet.dailyLimit) {
            throw new Error("Daily deposit limit exceeded");
          }

          // Generate unique reference
          const reference = generateReference("DEP");

          // Create pending transaction
          const transaction = await WalletTransaction.create({
            walletId: wallet._id,
            userId: user.id,
            type: TransactionType.DEPOSIT,
            amount,
            balanceBefore: wallet.balance.available,
            balanceAfter: wallet.balance.available, // Will update on success
            status: TransactionStatus.PENDING,
            reference,
            description: "Wallet deposit via M-Pesa",
            metadata: { phoneNumber },
          });

          // Initiate M-Pesa STK Push
          const mpesaResponse = await mpesaService.initiateMpesaPayment({
            amount,
            phoneNumber,
            accountReference: reference,
            transactionDesc: "Wallet Deposit",
            callbackUrl: `${config.app.url}/api/v1/payments/mpesa/callback`,
          });

          // Update transaction with M-Pesa details
          transaction.metadata.mpesaTransactionId =
            mpesaResponse.checkoutRequestID;
          transaction.status = TransactionStatus.PROCESSING;
          await transaction.save();

          return {
            transactionId: transaction._id,
            reference,
            checkoutRequestId: mpesaResponse.checkoutRequestID,
            message: "Please complete payment on your phone",
          };
        },
        {
          body: t.Object({
            amount: t.Number({ minimum: 10 }),
            phoneNumber: t.String({ pattern: "^254[17]\\d{8}$" }),
          }),
          detail: {
            tags: ["wallets"],
            summary: "Deposit to wallet via M-Pesa",
          },
        }
      )

      // M-Pesa Callback Handler
      .post(
        "/callbacks/mpesa-deposit",
        async ({ body }) => {
          const {
            CheckoutRequestID,
            ResultCode,
            ResultDesc,
            CallbackMetadata,
          } = body;

          // Find transaction
          const transaction = await WalletTransaction.findOne({
            "metadata.mpesaTransactionId": CheckoutRequestID,
          });

          if (!transaction) {
            return { status: "error", message: "Transaction not found" };
          }

          const wallet = await Wallet.findById(transaction.walletId);
          if (!wallet) {
            return { status: "error", message: "Wallet not found" };
          }

          if (ResultCode === 0) {
            // Payment successful
            const mpesaReceiptNumber = CallbackMetadata.Item.find(
              (item: any) => item.Name === "MpesaReceiptNumber"
            )?.Value;

            // Update wallet balance atomically
            await Wallet.findByIdAndUpdate(wallet._id, {
              $inc: {
                "balance.available": transaction.amount,
                "balance.total": transaction.amount,
                "metadata.totalDeposited": transaction.amount,
              },
              $set: {
                "metadata.lastTransactionAt": new Date(),
              },
            });

            // Update transaction
            transaction.status = TransactionStatus.COMPLETED;
            transaction.balanceAfter =
              wallet.balance.available + transaction.amount;
            transaction.metadata.mpesaReceiptNumber = mpesaReceiptNumber;
            transaction.processedAt = new Date();
            await transaction.save();

            // Send notification
            // await notificationService.send(...)
          } else {
            // Payment failed
            transaction.status = TransactionStatus.FAILED;
            transaction.failureReason = ResultDesc;
            await transaction.save();
          }

          return { status: "success" };
        },
        {
          body: t.Object({
            CheckoutRequestID: t.String(),
            ResultCode: t.Number(),
            ResultDesc: t.String(),
            CallbackMetadata: t.Object({
              Item: t.Array(
                t.Object({
                  Name: t.String(),
                  Value: t.String(),
                })
              ),
            }),
          }),
          detail: {
            tags: ["wallets"],
            summary: "M-Pesa deposit callback",
          },
        }
      )

      // Withdraw from wallet to M-Pesa
      .post(
        "/withdraw",
        async ({ user, body }) => {
          const { amount, phoneNumber } = body;

          const wallet = await Wallet.findOne({ userId: user.id });
          if (!wallet) {
            throw new Error("Wallet not found");
          }

          // Check sufficient balance
          if (wallet.balance.available < amount) {
            throw new Error("Insufficient balance");
          }

          // Check limits
          const dailyTotal = await calculateDailyTotal(user.id, "withdrawal");
          if (dailyTotal + amount > wallet.dailyLimit) {
            throw new Error("Daily withdrawal limit exceeded");
          }

          const reference = generateReference("WTH");

          // Create transaction and update balance atomically
          const session = await mongoose.startSession();
          session.startTransaction();

          try {
            // Reserve funds
            await Wallet.findByIdAndUpdate(
              wallet._id,
              {
                $inc: {
                  "balance.available": -amount,
                  "balance.pending": amount,
                },
              },
              { session }
            );

            const transaction = await WalletTransaction.create(
              [
                {
                  walletId: wallet._id,
                  userId: user.id,
                  type: TransactionType.WITHDRAWAL,
                  amount,
                  balanceBefore: wallet.balance.available,
                  balanceAfter: wallet.balance.available - amount,
                  status: TransactionStatus.PROCESSING,
                  reference,
                  description: "Withdrawal to M-Pesa",
                  metadata: { phoneNumber },
                },
              ],
              { session }
            );

            await session.commitTransaction();

            // Initiate M-Pesa B2C (Business to Customer)
            const mpesaResponse = await mpesaService.initiateB2CTransaction({
              phoneNumber,
              amount,
              commandID: "BusinessPayment",
              remarks: reference,
              occasion: "Wallet Withdrawal",
            });

            transaction[0].metadata.mpesaTransactionId =
              mpesaResponse.ConversationID;
            await transaction[0].save();

            return {
              transactionId: transaction[0]._id,
              reference,
              message: "Withdrawal processing, you will receive M-Pesa shortly",
            };
          } catch (error) {
            await session.abortTransaction();
            throw error;
          } finally {
            session.endSession();
          }
        },
        {
          body: t.Object({
            amount: t.Number({ minimum: 10 }),
            phoneNumber: t.String({ pattern: "^254[17]\\d{8}$" }),
          }),
          detail: {
            tags: ["wallets"],
            summary: "Withdraw from wallet to M-Pesa",
          },
        }
      )

      // Pay rent from wallet
      .post(
        "/pay-rent",
        async ({ user, body }) => {
          const { propertyId, amount, applicationId } = body;

          const wallet = await Wallet.findOne({ userId: user.id });
          if (!wallet) {
            throw new Error("Wallet not found");
          }

          if (wallet.balance.available < amount) {
            throw new Error("Insufficient balance");
          }

          const reference = generateReference("RNT");
          const session = await mongoose.startSession();
          session.startTransaction();

          try {
            // Deduct from tenant wallet
            await Wallet.findByIdAndUpdate(
              wallet._id,
              {
                $inc: {
                  "balance.available": -amount,
                  "metadata.totalSpent": amount,
                },
              },
              { session }
            );

            // Create transaction
            const transaction = await WalletTransaction.create(
              [
                {
                  walletId: wallet._id,
                  userId: user.id,
                  type: TransactionType.RENT_PAYMENT,
                  amount,
                  balanceBefore: wallet.balance.available,
                  balanceAfter: wallet.balance.available - amount,
                  status: TransactionStatus.COMPLETED,
                  reference,
                  description: "Rent payment for property",
                  metadata: { propertyId, applicationId },
                  processedAt: new Date(),
                },
              ],
              { session }
            );

            // Create payment record in payments feature
            // await Payment.create({ ... }, { session });

            // Credit landlord (if they have wallet)
            // This would integrate with landlord wallet feature

            await session.commitTransaction();

            return {
              transactionId: transaction[0]._id,
              reference,
              message: "Rent payment successful",
            };
          } catch (error) {
            await session.abortTransaction();
            throw error;
          } finally {
            session.endSession();
          }
        },
        {
          body: t.Object({
            propertyId: t.String(),
            applicationId: t.String(),
            amount: t.Number({ minimum: 1 }),
          }),
          detail: {
            tags: ["wallets"],
            summary: "Pay rent from wallet",
          },
        }
      )

      // Get transaction history
      .get(
        "/transactions",
        async ({ set, user, query }) => {
          const { page = 1, limit = 20, type, status } = query;

          const wallet = await Wallet.findOne({ userId: user.id });
          if (!wallet) {
            set.status = 404;
            return { status: "error", message: "Wallet not found" };
          }

          const filter: FilterQuery<IWalletTransaction> = {
            walletId: wallet._id,
          };
          if (type) filter.type = type;
          if (status) filter.status = status;

          const transactions = await WalletTransaction.find(filter)
            .sort({ createdAt: -1 })
            .limit(limit)
            .skip((page - 1) * limit)
            .lean();

          const total = await WalletTransaction.countDocuments(filter);

          set.status = 200;
          return {
            transactions,
            pagination: {
              page,
              limit,
              total,
              pages: Math.ceil(total / limit),
            },
          };
        },
        {
          query: t.Object({
            page: t.Optional(t.Number({ minimum: 1 })),
            limit: t.Optional(t.Number({ minimum: 1 })),
            type: t.Optional(t.String()),
            status: t.Optional(t.String()),
          }),
          detail: {
            tags: ["wallets"],
            summary: "Get transaction history",
          },
        }
      )
      .post(
        "/transfer",
        async ({ body }) => {
          const { recipientPhone, amount } = body;

          // Find recipient by phone
          const recipient = await User.findOne({
            "contact.phone.formatted": recipientPhone,
          });
          if (!recipient) {
            throw new Error("Recipient not found");
          }

          const recipientWallet = await Wallet.findOne({
            userId: recipient._id,
          });
          if (!recipientWallet) {
            throw new Error("Recipient wallet not found");
          }

          // Transfer logic with atomic operations
          // ...
        },
        {
          body: t.Object({
            recipientPhone: t.String(),
            amount: t.Number({ minimum: 1 }),
          }),
          detail: {
            tags: ["wallets"],
            summary: "Transfer funds to another wallet",
          },
        }
      )
);

// Helper function
async function calculateDailyTotal(
  userId: string,
  type: "deposit" | "withdrawal"
) {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const result = await WalletTransaction.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        type:
          type === "deposit"
            ? TransactionType.DEPOSIT
            : TransactionType.WITHDRAWAL,
        status: TransactionStatus.COMPLETED,
        createdAt: { $gte: startOfDay },
      },
    },
    {
      $group: {
        _id: null,
        total: { $sum: "$amount" },
      },
    },
  ]);

  return result[0]?.total || 0;
}

async function addCashback(userId: string, amount: number, reason: string) {
  await WalletTransaction.create({
    // ... cashback transaction
    userId,
    amount,
    type: "CASHBACK",
    description: reason,
  });
}
