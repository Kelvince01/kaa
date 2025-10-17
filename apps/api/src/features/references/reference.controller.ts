import crypto from "node:crypto";
import {
  sendReferenceCompletedEmail,
  sendReferenceDeclinedEmail,
  sendReferenceReminderEmail,
  sendReferenceRequestEmail,
  sendTenantVerificationStatusEmail,
} from "@kaa/email";
import { Consent, Reference, Tenant } from "@kaa/models";
import Elysia, { t } from "elysia";
import { authPlugin } from "~/features/auth/auth.plugin";
import { createConsentSchema, declineResponseSchema } from "./reference.schema";

export const referenceController = new Elysia().group("/reference", (app) =>
  app
    .use(authPlugin)
    // Create consent for tenant
    .post(
      "/consent/:tenantId",
      async ({ body, params, set, user }) => {
        try {
          const { tenantId } = params;
          const { permissions, dataRetention } = body;

          // Validate tenant existence
          const tenant = await Tenant.findById(tenantId);
          if (!tenant) {
            set.status = 404;
            return {
              status: "error",
              message: "Tenant not found",
            };
          }

          // Revoke any existing active consent
          await Consent.updateMany(
            { tenant: tenantId, status: "active" },
            {
              status: "revoked",
              revokedAt: new Date(),
              revokedReason: "new_consent_created",
            }
          );

          // Create new consent
          const consent = new Consent({
            tenant: tenantId,
            requesterId: user?.id || tenantId,
            permissions,
            dataRetention: dataRetention || {
              retentionPeriodMonths: 24,
              allowDataSharing: false,
              allowAnalytics: true,
            },
          });

          await consent.save();

          return {
            status: "success",
            data: { consent },
            message: "Consent created successfully",
          };
        } catch (error) {
          set.status = 500;
          return {
            status: "error",
            message: "Failed to create consent",
          };
        }
      },
      {
        params: t.Object({ tenantId: t.String() }),
        body: createConsentSchema,
        detail: {
          tags: ["reference"],
          summary: "Create consent for reference checks",
          description:
            "Creates consent record for tenant allowing specific types of reference checks.",
        },
      }
    )

    // Decline reference request
    .post(
      "/decline/:token",
      async ({ body, params, set }) => {
        try {
          const { token } = params;
          const { declineReason, declineComment } = body;

          // Find the reference request by token
          const reference = await Reference.findOne({
            referenceToken: token,
            status: "pending",
            expiresAt: { $gt: new Date() },
          });

          if (!reference) {
            set.status = 404;
            return {
              status: "error",
              message: "Reference request not found or has expired",
            };
          }

          // Update reference with decline information
          reference.status = "declined";
          reference.declinedAt = new Date();
          reference.declineReason = declineReason as
            | "unreachable"
            | "not_acquainted"
            | "conflict_of_interest"
            | "insufficient_information"
            | "other";
          reference.declineComment = declineComment;

          await reference.save();

          // Notify tenant about decline (get tenant details first)
          const tenant = await Tenant.findById(reference.tenant);
          if (tenant) {
            await sendReferenceDeclinedEmail({
              tenantEmail: tenant.personalInfo.email,
              tenantName: `${tenant.personalInfo.firstName} ${tenant.personalInfo.lastName}`,
              providerName: reference.referenceProvider.name,
              referenceType: reference.referenceType,
              propertyName: "Property Name", // TODO: Get from property lookup
              declineReason,
              declineComment,
            });
          }

          return {
            status: "success",
            data: { reference },
            message: "Reference declined successfully",
          };
        } catch (error) {
          set.status = 500;
          return {
            status: "error",
            message: "Failed to decline reference",
          };
        }
      },
      {
        params: t.Object({ token: t.String() }),
        body: declineResponseSchema,
        detail: {
          tags: ["reference"],
          summary: "Decline to provide reference",
          description:
            "Allows a reference provider to decline providing a reference with reason.",
        },
      }
    )

    // Respond to reference request (now with dynamic validation)
    .post(
      "/respond/:token",
      async ({ body, params, set }) => {
        try {
          const { token } = params;

          // Find the reference request by token
          const reference = await Reference.findOne({
            referenceToken: token,
            status: "pending",
            expiresAt: { $gt: new Date() }, // Make sure it hasn't expired
          });

          if (!reference) {
            set.status = 404;
            return {
              status: "error",
              message: "Reference request not found or has expired",
            };
          }

          const { feedback, rating, verificationDetails } = body;

          // Update the reference with the provider's response
          reference.status = "completed";
          reference.completedAt = new Date();
          reference.feedback = feedback;
          reference.rating = rating;

          // Update verification details based on reference type
          if (reference.referenceType === "employer") {
            reference.verificationDetails = {
              ...reference.verificationDetails,
              employmentStatus: verificationDetails.employmentStatus as string,
              annualIncome: verificationDetails.annualIncome as number,
              lengthOfEmployment:
                verificationDetails.lengthOfEmployment as string,
              positionHeld: verificationDetails.positionHeld as string,
              // employerKRAPin: verificationDetails.employerKRAPin as string,
              // salarySlipVerified: verificationDetails.salarySlipVerified as boolean,
            };
          } else if (reference.referenceType === "previous_landlord") {
            reference.verificationDetails = {
              ...reference.verificationDetails,
              landlordFeedback: verificationDetails.landlordFeedback as string,
              rentPaymentHistory:
                verificationDetails.rentPaymentHistory as string,
              rentAmount: verificationDetails.rentAmount as number,
              tenancyLength: verificationDetails.tenancyLength as string,
              reasonForLeaving: verificationDetails.reasonForLeaving as string,
              // waterBillsPaid: verificationDetails.waterBillsPaid as boolean,
              // electricalBillsPaid: verificationDetails.electricalBillsPaid as boolean,
              // propertyCondition: verificationDetails.propertyCondition as string,
            };
          } else if (
            ["character", "religious_leader", "community_elder"].includes(
              reference.referenceType
            )
          ) {
            reference.verificationDetails = {
              ...reference.verificationDetails,
              characterReference:
                verificationDetails.characterReference as string,
              communityStanding:
                verificationDetails.communityStanding as string,
              religiousAffiliation:
                verificationDetails.religiousAffiliation as string,
              knownSince: verificationDetails.knownSince as string,
            };
          } else if (
            ["saccos_member", "chama_member", "business_partner"].includes(
              reference.referenceType
            )
          ) {
            reference.verificationDetails = {
              ...reference.verificationDetails,
              saccosAccountStatus:
                verificationDetails.saccosAccountStatus as string,
              chamaContribution:
                verificationDetails.chamaContribution as string,
              mobileMoneyHistory:
                verificationDetails.mobileMoneyHistory as string,
              crbStatus: verificationDetails.crbStatus as string,
              relationshipDuration:
                verificationDetails.relationshipDuration as string,
            };
          } else if (reference.referenceType === "family_guarantor") {
            reference.verificationDetails = {
              ...reference.verificationDetails,
              guarantorNetWorth:
                verificationDetails.guarantorNetWorth as number,
              guarantorProperty:
                verificationDetails.guarantorProperty as string,
              relationshipDuration:
                verificationDetails.relationshipDuration as string,
              willingnessToGuarantee:
                verificationDetails.willingnessToGuarantee as boolean,
            };
          }

          await reference.save();

          // Notify tenant about completed reference
          try {
            const tenant = await Tenant.findById(reference.tenant);
            if (tenant) {
              await sendReferenceCompletedEmail({
                tenantEmail: tenant.personalInfo.email,
                tenantName: `${tenant.personalInfo.firstName} ${tenant.personalInfo.lastName}`,
                providerName: reference.referenceProvider.name,
                referenceType: reference.referenceType,
                propertyName: "Property Name", // TODO: Get from property lookup
                rating,
                feedback,
              });
            }
          } catch (emailError) {
            console.error(
              "Failed to send reference completed email:",
              emailError
            );
          }

          set.status = 201;
          return {
            status: "success",
            data: { reference },
            message: "Reference response submitted successfully",
          };
        } catch (error) {
          set.status = 500;
          return {
            status: "error",
            message: "Failed to create reference request",
          };
        }
      },
      {
        params: t.Object({
          token: t.String(),
          tenantId: t.Optional(t.String()),
        }),
        body: t.Object({
          feedback: t.String(),
          rating: t.Number(),
          verificationDetails: t.Object({
            employmentStatus: t.String(),
            annualIncome: t.Number(),
            lengthOfEmployment: t.String(),
            positionHeld: t.String(),
            landlordFeedback: t.String(),
            rentPaymentHistory: t.String(),
            rentAmount: t.Number(),
            tenancyLength: t.String(),
            reasonForLeaving: t.String(),
            characterReference: t.String(),
            communityStanding: t.String(),
            religiousAffiliation: t.String(),
            knownSince: t.String(),
            saccosAccountStatus: t.String(),
            chamaContribution: t.String(),
            mobileMoneyHistory: t.String(),
            crbStatus: t.String(),
            relationshipDuration: t.String(),
            guarantorNetWorth: t.Number(),
            guarantorProperty: t.String(),
            willingnessToGuarantee: t.Boolean(),
          }),
        }),
        detail: {
          tags: ["reference"],
          summary: "Respond to a reference request",
          description:
            "Allows a reference provider to submit their response and feedback for a reference request using a unique token.",
        },
      }
    )
    .use(authPlugin)
    .post(
      "/request/:tenantId",
      async ({ body, params, set }) => {
        try {
          const { tenantId } = params;

          // Validate tenant existence
          const tenant = await Tenant.findById(tenantId);
          if (!tenant) {
            set.status = 404;
            return {
              status: "error",
              message: "Tenant not found",
            };
          }

          const { referenceType, referenceProvider } = body;

          // Generate a unique token for this reference
          const token = crypto.randomBytes(32).toString("hex");

          // Set expiration date (14 days from now)
          const expiresAt = new Date();
          expiresAt.setDate(expiresAt.getDate() + 14);

          // Create the reference request
          const referenceRequest = new Reference({
            tenant: tenantId,
            referenceType,
            referenceProvider,
            referenceToken: token,
            expiresAt,
            status: "pending",
          });

          // Initialize request attempts tracking
          referenceRequest.requestAttempts = [
            {
              attemptNumber: 1,
              sentAt: new Date(),
              deliveryStatus: "sent",
              deliveryDetails: "Initial reference request",
            },
          ];

          await referenceRequest.save();

          // Send email notification to reference provider
          try {
            const emailSent = await sendReferenceRequestEmail({
              providerEmail: referenceProvider.email,
              providerName: referenceProvider.name,
              tenantName: `${tenant.personalInfo.firstName} ${tenant.personalInfo.lastName}`,
              tenantEmail: tenant.personalInfo.email,
              propertyName: "Property Name", // TODO: Get from property lookup
              referenceType,
              referenceToken: token,
              expiresAt,
            });

            // Update delivery status based on email result
            if (emailSent) {
              referenceRequest.requestAttempts[0].deliveryStatus = "delivered";
              referenceRequest.requestAttempts[0].deliveryDetails =
                "Email sent successfully";
            } else {
              referenceRequest.requestAttempts[0].deliveryStatus = "failed";
              referenceRequest.requestAttempts[0].deliveryDetails =
                "Email delivery failed";
            }
            await referenceRequest.save();
          } catch (emailError) {
            console.error(
              "Failed to send reference request email:",
              emailError
            );
          }

          set.status = 201;
          return {
            status: "success",
            data: { reference: referenceRequest },
            message: "Reference request created successfully",
          };
        } catch (error) {
          set.status = 500;
          return {
            status: "error",
            message: "Failed to create reference request",
          };
        }
      },
      {
        params: t.Object({
          tenantId: t.String(),
        }),
        body: t.Object({
          referenceType: t.String(),
          referenceProvider: t.Object({
            name: t.String(),
            email: t.String(),
            phone: t.Optional(t.String()),
            relationship: t.String(),
          }),
        }),
        detail: {
          tags: ["reference"],
          summary: "Create a reference request",
          description:
            "Creates a new reference request for a tenant. Generates a unique token and sends a request to the specified reference provider.",
        },
      }
    )

    // Resend reference request
    .post(
      "/resend/:referenceId",
      async ({ params, set }) => {
        try {
          const { referenceId } = params;

          // Find the reference request
          const reference =
            await Reference.findById(referenceId).populate("tenant");
          if (!reference) {
            set.status = 404;
            return {
              status: "error",
              message: "Reference request not found",
            };
          }

          // Check if reference is still pending and not expired
          if (reference.status !== "pending") {
            set.status = 400;
            return {
              status: "error",
              message: "Reference request is no longer pending",
            };
          }

          if (reference.expiresAt < new Date()) {
            set.status = 400;
            return {
              status: "error",
              message: "Reference request has expired",
            };
          }

          // Rate limiting - prevent spam (max 3 attempts per reference)
          if (reference.requestAttempts.length >= 3) {
            set.status = 429;
            return {
              status: "error",
              message: "Maximum resend attempts reached",
            };
          }

          // Check if enough time has passed since last attempt (minimum 1 hour)
          const lastAttempt = reference.requestAttempts.at(-1);
          const hoursSinceLastAttempt =
            (Date.now() - (lastAttempt?.sentAt.getTime() || 0)) /
            (1000 * 60 * 60);
          if (hoursSinceLastAttempt < 1) {
            set.status = 429;
            return {
              status: "error",
              message: "Please wait at least 1 hour before resending",
              nextAllowedTime: new Date(
                lastAttempt?.sentAt.getTime() || 0 + 60 * 60 * 1000
              ),
            };
          }

          // Send reminder email
          const tenant = reference.tenant as any;
          const daysUntilExpiry = Math.ceil(
            (reference.expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
          );

          try {
            const emailSent = await sendReferenceReminderEmail({
              providerEmail: reference.referenceProvider.email,
              providerName: reference.referenceProvider.name,
              tenantName: `${tenant.personalInfo.firstName} ${tenant.personalInfo.lastName}`,
              propertyName: "Property Name", // TODO: Get from property lookup
              referenceType: reference.referenceType,
              referenceToken: reference.referenceToken,
              expiresAt: reference.expiresAt,
              daysUntilExpiry,
            });

            // Track the resend attempt
            const newAttempt = {
              attemptNumber: reference.requestAttempts.length + 1,
              sentAt: new Date(),
              deliveryStatus: emailSent
                ? "delivered"
                : ("failed" as "sent" | "delivered" | "failed" | "bounced"),
              deliveryDetails: emailSent
                ? "Reminder email sent successfully"
                : "Reminder email delivery failed",
            };

            reference.requestAttempts.push(newAttempt);
            reference.lastReminderSent = new Date();
            reference.reminderCount += 1;
            await reference.save();

            return {
              status: "success",
              data: {
                reference,
                emailSent,
                attemptNumber: newAttempt.attemptNumber,
                remainingAttempts: 3 - newAttempt.attemptNumber,
              },
              message: emailSent
                ? "Reference reminder sent successfully"
                : "Reference reminder failed to send",
            };
          } catch (emailError) {
            console.error("Failed to send reference reminder:", emailError);
            set.status = 500;
            return {
              status: "error",
              message: "Failed to send reminder email",
            };
          }
        } catch (error) {
          set.status = 500;
          return {
            status: "error",
            message: "Failed to resend reference request",
          };
        }
      },
      {
        params: t.Object({ referenceId: t.String() }),
        detail: {
          tags: ["reference"],
          summary: "Resend reference request",
          description:
            "Resends a reference request email with rate limiting (max 3 attempts, minimum 1 hour between attempts).",
        },
      }
    )

    .get(
      "/tenant/:tenantId",
      async ({ params, set }) => {
        const { tenantId } = params;

        try {
          const references = await Reference.find({ tenant: tenantId }).sort({
            createdAt: -1,
          });

          return {
            status: "success",
            data: { references },
          };
        } catch (error) {
          set.status = 500;
          return {
            status: "error",
            message: "Failed to get references",
          };
        }
      },
      {
        params: t.Object({
          tenantId: t.String(),
        }),
        detail: {
          tags: ["reference"],
          summary: "Get all references for a tenant",
          description:
            "Retrieves all reference requests and responses associated with a specific tenant.",
        },
      }
    )
    .post(
      "/verify/:tenantId",
      async ({ params, set }) => {
        try {
          const { tenantId } = params;

          const references = await Reference.find({
            tenant: tenantId,
            status: "completed",
          });

          if (references.length === 0) {
            set.status = 400;
            return {
              status: "error",
              message: "No completed references found for this tenant",
            };
          }

          let verificationScore = 0;
          let totalPossibleScore = 0;

          for (const reference of references) {
            // Enhanced Kenyan-specific weight system
            let weight = 1;
            let bonusMultiplier = 1;

            // Primary reference types (highest weight)
            if (reference.referenceType === "previous_landlord") {
              weight = 4; // Most important for rental history
              // Additional bonus for utility payment history
              if (
                reference.verificationDetails?.waterBillsPaid &&
                reference.verificationDetails?.electricalBillsPaid
              ) {
                bonusMultiplier = 1.2;
              }
            } else if (reference.referenceType === "employer") {
              weight = 3; // Important for income verification
              // Bonus for KRA PIN verification and salary slip
              if (
                reference.verificationDetails?.employerKRAPin &&
                reference.verificationDetails?.salarySlipVerified
              ) {
                bonusMultiplier = 1.15;
              }
            }
            // Financial community references
            else if (
              ["saccos_member", "chama_member"].includes(
                reference.referenceType
              )
            ) {
              weight = 2.5; // High importance in Kenyan context
              // Bonus for good CRB status
              if (reference.verificationDetails?.crbStatus === "good") {
                bonusMultiplier = 1.1;
              }
            }
            // Guarantor references
            else if (reference.referenceType === "family_guarantor") {
              weight = 2.2;
              // Bonus for property ownership and willingness
              if (
                reference.verificationDetails?.guarantorProperty &&
                reference.verificationDetails?.willingnessToGuarantee
              ) {
                bonusMultiplier = 1.25;
              }
            }
            // Community/Character references
            else if (
              ["religious_leader", "community_elder"].includes(
                reference.referenceType
              )
            ) {
              weight = 1.8; // Important in Kenyan social context
              // Bonus for long-term community standing
              if (
                reference.verificationDetails?.communityStanding === "excellent"
              ) {
                bonusMultiplier = 1.1;
              }
            } else if (reference.referenceType === "business_partner") {
              weight = 1.5;
            } else if (reference.referenceType === "character") {
              weight = 1.2;
            }

            // Calculate weighted score with bonuses
            if (reference.rating) {
              const baseScore = reference.rating * weight;
              verificationScore += baseScore * bonusMultiplier;
              totalPossibleScore += 5 * weight * bonusMultiplier; // Max rating is 5
            }
          }

          // Calculate percentage
          const verificationPercentage =
            totalPossibleScore > 0
              ? Math.round((verificationScore / totalPossibleScore) * 100)
              : 0;

          // Update tenant's verification progress
          const tenant = await Tenant.findById(tenantId);
          if (tenant) {
            const previousVerificationPercentage =
              tenant.verificationProgress || 0;
            const wasVerified = tenant.isVerified;

            tenant.verificationProgress = verificationPercentage;

            // If verification is above 70%, mark as verified
            const isNowVerified = verificationPercentage >= 70;
            if (isNowVerified) {
              tenant.isVerified = true;
            }

            await tenant.save();

            // Send verification status update email if there's a significant change
            const percentageChange =
              verificationPercentage - previousVerificationPercentage;
            const newlyVerified = isNowVerified && !wasVerified;

            if (newlyVerified || percentageChange >= 10) {
              try {
                await sendTenantVerificationStatusEmail({
                  tenantId,
                  verificationPercentage,
                  newlyVerified,
                });
              } catch (emailError) {
                console.error(
                  "Failed to send tenant verification status email:",
                  emailError
                );
              }
            }
          }

          return {
            status: "success",
            data: {
              verificationScore,
              totalPossibleScore,
              verificationPercentage,
              references,
              isVerified: verificationPercentage >= 70,
            },
          };
        } catch (error) {
          set.status = 500;
          return {
            status: "error",
            message: "Failed to verify references",
          };
        }
      },
      {
        params: t.Object({
          tenantId: t.String(),
        }),
        detail: {
          tags: ["reference"],
          summary: "Verify references for a tenant",
          description:
            "Calculates the verification score for a tenant based on completed references and updates the tenant's verification status if the score meets the threshold.",
        },
      }
    )
);
