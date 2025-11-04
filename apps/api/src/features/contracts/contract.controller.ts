import fs from "node:fs/promises";
import path from "node:path";
import {
  contractAmendmentService,
  contractRenewalService,
  contractService,
  contractSigningService,
  type ErrorContext,
  handleContractError,
} from "@kaa/services";
import { createQueue } from "@kaa/utils";
import Elysia, { t } from "elysia";
import { ip } from "elysia-ip";
// import { accessPlugin } from "~/features/rbac/rbac.plugin";
import { tenantPlugin } from "~/features/users/tenants/tenant.plugin";
import { authPlugin } from "../auth/auth.plugin";
import { rolePlugin } from "../rbac/rbac.plugin";
import {
  contractCreateSchema,
  contractDocumentSchema,
  contractQuerySchema,
  contractSigningSchema,
  contractTerminationSchema,
  contractUpdateSchema,
  paramSchemas,
  responseSchemas,
} from "./contract.schema";

/**
 * Contract controller with clean separation of concerns
 */
export const contractController = new Elysia({
  name: "contracts",
  detail: {
    description: "Rental contract management API",
    tags: ["contracts"],
  },
})
  .use(ip())
  .group("/contracts", (app) =>
    app
      // .use(accessPlugin("contracts", "create"))
      // .use(tenantPlugin)
      .use(authPlugin)
      .use(rolePlugin)

      // Create new contract
      .post(
        "/",
        async ({ body, set, user, ip: clientIp, headers }) => {
          const context: ErrorContext = {
            userId: user.id,
            action: "create_contract",
            ipAddress: clientIp,
            userAgent: headers["user-agent"],
          };

          try {
            const contract = await contractService.createContract({
              ...body,
              userId: user.id,
            });

            set.status = 201;
            return {
              status: "success",
              message: "Contract created successfully",
              contract,
            };
          } catch (error) {
            const errorResponse = handleContractError(error as Error, context);
            set.status = errorResponse.status;
            return errorResponse.body;
          }
        },
        {
          body: contractCreateSchema,
          response: {
            201: responseSchemas.contractResponse,
            400: responseSchemas.error,
            403: responseSchemas.error,
            404: responseSchemas.error,
            409: responseSchemas.error,
            500: responseSchemas.error,
          },
          detail: {
            summary: "Create a new contract",
            description: "Create a new rental contract with PDF generation",
            tags: ["contracts"],
          },
        }
      )

      // Get contract by ID
      // .use(accessPlugin("contracts", "read"))
      .get(
        "/:contractId",
        async ({ params, set, user, role, ip: clientIp, headers }) => {
          const context: ErrorContext = {
            contractId: params.contractId,
            userId: user.id,
            action: "get_contract",
            ipAddress: clientIp,
            userAgent: headers["user-agent"],
          };

          try {
            const contract = await contractService.getContractById(
              params.contractId,
              user.id,
              role
            );

            return {
              status: "success",
              contract,
            };
          } catch (error) {
            const errorResponse = handleContractError(error as Error, context);
            set.status = errorResponse.status;
            return errorResponse.body;
          }
        },
        {
          params: paramSchemas.contractId,
          response: {
            200: responseSchemas.contractResponse,
            403: responseSchemas.error,
            404: responseSchemas.error,
            500: responseSchemas.error,
          },
          detail: {
            summary: "Get contract by ID",
            description: "Retrieve a specific contract by its ID",
            tags: ["contracts"],
          },
        }
      )

      // Update contract
      // .use(accessPlugin("contracts", "update"))
      .patch(
        "/:contractId",
        async ({ params, body, set, user, role, ip: clientIp, headers }) => {
          const context: ErrorContext = {
            contractId: params.contractId,
            userId: user.id,
            action: "update_contract",
            ipAddress: clientIp,
            userAgent: headers["user-agent"],
          };

          try {
            const contract = await contractService.updateContract(
              params.contractId,
              body,
              user.id,
              role
            );

            return {
              status: "success",
              message: "Contract updated successfully",
              contract,
            };
          } catch (error) {
            const errorResponse = handleContractError(error as Error, context);
            set.status = errorResponse.status;
            return errorResponse.body;
          }
        },
        {
          params: paramSchemas.contractId,
          body: contractUpdateSchema,
          response: {
            200: responseSchemas.contractResponse,
            400: responseSchemas.error,
            403: responseSchemas.error,
            404: responseSchemas.error,
            500: responseSchemas.error,
          },
          detail: {
            summary: "Update contract",
            description: "Update an existing contract",
            tags: ["contracts"],
          },
        }
      )

      // List contracts with filtering
      // .use(accessPlugin("contracts", "read"))
      .get(
        "/",
        async ({ query, set, user, role, ip: clientIp, headers }) => {
          const context: ErrorContext = {
            userId: user.id,
            action: "list_contracts",
            ipAddress: clientIp,
            userAgent: headers["user-agent"],
          };

          try {
            const result = await contractService.getContracts(
              query,
              user.id,
              role
            );

            return {
              status: "success",
              contracts: result.contracts,
              pagination: result.pagination,
            };
          } catch (error) {
            const errorResponse = handleContractError(error as Error, context);
            set.status = errorResponse.status;
            return errorResponse.body;
          }
        },
        {
          query: contractQuerySchema,
          response: {
            200: responseSchemas.contractsResponse,
            400: responseSchemas.error,
            500: responseSchemas.error,
          },
          detail: {
            summary: "List contracts",
            description:
              "Get contracts with filtering, sorting, and pagination",
            tags: ["contracts"],
          },
        }
      )

      // Get contracts by property
      // .use(accessPlugin("contracts", "read"))
      .get(
        "/property/:propertyId",
        async ({ params, set, user, role, ip: clientIp, headers }) => {
          const context: ErrorContext = {
            userId: user.id,
            action: "get_property_contracts",
            ipAddress: clientIp,
            userAgent: headers["user-agent"],
            additionalData: { propertyId: params.propertyId },
          };

          try {
            const contracts = await contractService.getContractsByProperty(
              params.propertyId,
              user.id,
              role
            );

            return {
              status: "success",
              contracts,
            };
          } catch (error) {
            const errorResponse = handleContractError(error as Error, context);
            set.status = errorResponse.status;
            return errorResponse.body;
          }
        },
        {
          params: paramSchemas.propertyId,
          response: {
            200: t.Object({
              status: t.Literal("success"),
              contracts: t.Array(t.Any()),
            }),
            403: responseSchemas.error,
            404: responseSchemas.error,
            500: responseSchemas.error,
          },
          detail: {
            summary: "Get contracts by property",
            description: "Get all contracts for a specific property",
            tags: ["contracts"],
          },
        }
      )

      // Get contracts by user
      // .use(accessPlugin("contracts", "read"))
      .group("/", (app) =>
        app.use(tenantPlugin).get(
          "/user",
          async ({ params, set, user, tenant, ip: clientIp, headers }) => {
            const context: ErrorContext = {
              userId: user.id,
              action: "get_user_contracts",
              ipAddress: clientIp,
              userAgent: headers["user-agent"],
              additionalData: { propertyId: params.propertyId },
            };

            try {
              const contracts = await contractService.getContractsByUser(
                tenant.id
              );

              return {
                status: "success",
                contracts,
              };
            } catch (error) {
              const errorResponse = handleContractError(
                error as Error,
                context
              );
              set.status = errorResponse.status;
              return errorResponse.body;
            }
          },
          {
            params: paramSchemas.propertyId,
            response: {
              200: t.Object({
                status: t.Literal("success"),
                contracts: t.Array(t.Any()),
              }),
              403: responseSchemas.error,
              404: responseSchemas.error,
              500: responseSchemas.error,
            },
            detail: {
              summary: "Get contracts by user",
              description: "Get all contracts for a specific user",
              tags: ["contracts"],
            },
          }
        )
      )

      // Sign contract
      .post(
        "/:contractId/sign",
        async ({ params, body, set, user, ip: clientIp, headers }) => {
          const context: ErrorContext = {
            contractId: params.contractId,
            userId: user.id,
            action: "sign_contract",
            ipAddress: clientIp,
            userAgent: headers["user-agent"],
          };

          try {
            const contract = await contractService.signContract({
              contractId: params.contractId,
              userId: user.id,
              ipAddress: clientIp,
              userAgent: headers["user-agent"],
              ...body,
            });

            return {
              status: "success",
              message: "Contract signed successfully",
              contract,
            };
          } catch (error) {
            const errorResponse = handleContractError(error as Error, context);
            set.status = errorResponse.status;
            return errorResponse.body;
          }
        },
        {
          params: paramSchemas.contractId,
          body: contractSigningSchema,
          response: {
            200: responseSchemas.contractResponse,
            400: responseSchemas.error,
            403: responseSchemas.error,
            404: responseSchemas.error,
            500: responseSchemas.error,
          },
          detail: {
            summary: "Sign contract",
            description: "Sign a contract with digital signature",
            tags: ["contracts"],
          },
        }
      )

      // Background job endpoint for batch processing
      .post(
        "/batch-sign-contracts",
        async ({ body }) => {
          const results: any[] = [];

          for (const contract of body.contracts) {
            try {
              const signedPdfBuffer =
                await contractSigningService.signPDFWithPdfLib(
                  contract.templatePath,
                  contract.signature,
                  contract.signatureDate,
                  contract.signerName,
                  contract.coordinates
                );

              const signedPdfPath = path.join(
                process.cwd(),
                "signed_contracts",
                `${contract.id}.pdf`
              );
              await fs.writeFile(signedPdfPath, signedPdfBuffer);

              results.push({
                contractId: contract.id,
                success: true,
                path: signedPdfPath,
              });
            } catch (error) {
              results.push({
                contractId: contract.id,
                success: false,
                error: (error as Error).message,
              });
            }
          }

          return {
            message: "Batch signing completed",
            results,
          };
        },
        {
          body: t.Object({
            contracts: t.Any(),
          }),
          detail: {
            summary: "Batch sign contracts",
            description: "Batch sign contracts with digital signature",
            tags: ["contracts"],
          },
        }
      )

      .post(
        "/queue-signing",
        async ({ body }) => {
          const pdfQueue = createQueue("pdf-signing");

          await pdfQueue.add("sign-pdf", body);
          return { message: "Queued for processing" };
        },
        {
          detail: {
            summary: "Queue signing",
            description: "Queue a contract for signing",
            tags: ["contracts"],
          },
        }
      )

      // Download signed contract endpoint
      .get(
        "/download-contract/:contractId",
        async ({ params }) => {
          try {
            const contractPath = path.join(
              process.cwd(),
              "signed_contracts",
              `${params.contractId}.pdf`
            );
            const pdfBuffer = await fs.readFile(contractPath);

            return new Response(pdfBuffer, {
              headers: {
                "Content-Type": "application/pdf",
                "Content-Disposition": `attachment; filename="${params.contractId}.pdf"`,
              },
            });
          } catch (error) {
            return {
              error: "Contract not found",
              message: (error as Error).message,
            };
          }
        },
        {
          detail: {
            summary: "Download signed contract",
            description: "Download a signed contract",
            tags: ["contracts"],
          },
        }
      )

      // Terminate contract
      .post(
        "/:contractId/terminate",
        async ({ params, body, set, user, ip: clientIp, headers }) => {
          const context: ErrorContext = {
            contractId: params.contractId,
            userId: user.id,
            action: "terminate_contract",
            ipAddress: clientIp,
            userAgent: headers["user-agent"],
          };

          try {
            const contract = await contractService.terminateContract({
              contractId: params.contractId,
              userId: user.id,
              ...body,
            });

            return {
              status: "success",
              message: "Contract terminated successfully",
              contract,
            };
          } catch (error) {
            const errorResponse = handleContractError(error as Error, context);
            set.status = errorResponse.status;
            return errorResponse.body;
          }
        },
        {
          params: paramSchemas.contractId,
          body: contractTerminationSchema,
          response: {
            200: responseSchemas.contractResponse,
            400: responseSchemas.error,
            403: responseSchemas.error,
            404: responseSchemas.error,
            500: responseSchemas.error,
          },
          detail: {
            summary: "Terminate contract",
            description: "Terminate an active contract",
            tags: ["contracts"],
          },
        }
      )

      // Delete contract (soft delete)
      // .use(accessPlugin("contracts", "delete"))
      .delete(
        "/:contractId",
        async ({ params, set, user, role, ip: clientIp, headers }) => {
          const context: ErrorContext = {
            contractId: params.contractId,
            userId: user.id,
            action: "delete_contract",
            ipAddress: clientIp,
            userAgent: headers["user-agent"],
          };

          try {
            await contractService.deleteContract(
              params.contractId,
              user.id,
              role
            );

            return {
              status: "success",
              message: "Contract deleted successfully",
            };
          } catch (error) {
            const errorResponse = handleContractError(error as Error, context);
            set.status = errorResponse.status;
            return errorResponse.body;
          }
        },
        {
          params: paramSchemas.contractId,
          response: {
            200: responseSchemas.success,
            403: responseSchemas.error,
            404: responseSchemas.error,
            500: responseSchemas.error,
          },
          detail: {
            summary: "Delete contract",
            description: "Delete a contract (soft delete)",
            tags: ["contracts"],
          },
        }
      )

      // Upload contract document
      .post(
        "/:contractId/documents",
        ({ params, set, user, ip: clientIp, headers }) => {
          const context: ErrorContext = {
            contractId: params.contractId,
            userId: user.id,
            action: "upload_document",
            ipAddress: clientIp,
            userAgent: headers["user-agent"],
          };

          try {
            // This would be implemented with file upload service
            // For now, return a placeholder response
            return {
              status: "success",
              message: "Document upload functionality not implemented yet",
            };
          } catch (error) {
            const errorResponse = handleContractError(error as Error, context);
            set.status = errorResponse.status;
            return errorResponse.body;
          }
        },
        {
          params: paramSchemas.contractId,
          body: contractDocumentSchema,
          response: {
            200: responseSchemas.success,
            400: responseSchemas.error,
            403: responseSchemas.error,
            404: responseSchemas.error,
            500: responseSchemas.error,
          },
          detail: {
            summary: "Upload contract document",
            description: "Upload additional documents for a contract",
            tags: ["contracts"],
          },
        }
      )

      // Get contract statistics
      .get(
        "/stats/summary",
        ({ set, user, ip: clientIp, headers }) => {
          const context: ErrorContext = {
            userId: user.id,
            action: "get_contract_stats",
            ipAddress: clientIp,
            userAgent: headers["user-agent"],
          };

          try {
            // This would be implemented with analytics service
            // For now, return a placeholder response
            return {
              status: "success",
              message: "Contract statistics functionality not implemented yet",
              stats: {
                total: 0,
                active: 0,
                draft: 0,
                expired: 0,
                terminated: 0,
              },
            };
          } catch (error) {
            const errorResponse = handleContractError(error as Error, context);
            set.status = errorResponse.status;
            return errorResponse.body;
          }
        },
        {
          response: {
            200: t.Object({
              status: t.Literal("success"),
              message: t.String(),
              stats: t.Object({
                total: t.Number(),
                active: t.Number(),
                draft: t.Number(),
                expired: t.Number(),
                terminated: t.Number(),
              }),
            }),
            500: responseSchemas.error,
          },
          detail: {
            summary: "Get contract statistics",
            description: "Get summary statistics for contracts",
            tags: ["contracts"],
          },
        }
      )

      // === TEMPLATE ENDPOINTS ===
      .group("/templates", (app) =>
        app
          // .use(accessPlugin("contracts", "read"))
          // List contract templates
          .get(
            "/",
            ({ set }) => {
              // NOTE: Mock implementation. Replace with DB-backed service when available
              set.status = 200;
              return {
                status: "success",
                templates: [],
              };
            },
            {
              response: {
                200: t.Object({
                  status: t.Literal("success"),
                  templates: t.Array(t.Any()),
                }),
              },
              detail: {
                summary: "List contract templates",
                description: "Get all contract templates",
                tags: ["contracts", "templates"],
              },
            }
          )
          // Create template
          // .use(accessPlugin("contracts", "create"))
          .post(
            "/",
            ({ body, user }) => {
              // Mock created template
              const now = new Date().toISOString();
              const template = {
                _id: crypto.randomUUID(),
                name: body.name,
                description: body.description ?? "",
                contractType: body.contractType ?? "residential",
                terms: body.terms ?? [],
                defaultSettings: body.defaultSettings ?? {},
                isActive: body.isActive ?? true,
                createdBy: user.id,
                createdAt: now,
                updatedAt: now,
              };
              return {
                status: "success",
                message: "Template created successfully",
                template,
              };
            },
            {
              body: t.Object({
                name: t.String(),
                description: t.Optional(t.String()),
                contractType: t.Optional(t.String()),
                terms: t.Optional(t.Array(t.Any())),
                defaultSettings: t.Optional(t.Any()),
                isActive: t.Optional(t.Boolean()),
              }),
              response: {
                201: t.Object({
                  status: t.Literal("success"),
                  message: t.String(),
                  template: t.Any(),
                }),
              },
              detail: {
                summary: "Create contract template",
                description: "Create a new contract template",
                tags: ["contracts", "templates"],
              },
            }
          )
          // Update template
          // .use(accessPlugin("contracts", "update"))
          .patch(
            "/:templateId",
            ({ params, body }) => {
              const now = new Date().toISOString();
              // Return merged mock
              return {
                status: "success",
                message: "Template updated successfully",
                template: {
                  _id: params.templateId,
                  ...body,
                  updatedAt: now,
                },
              };
            },
            {
              params: t.Object({ templateId: t.String() }),
              body: t.Object({}, { additionalProperties: true }),
              response: {
                200: t.Object({
                  status: t.Literal("success"),
                  message: t.String(),
                  template: t.Any(),
                }),
              },
              detail: {
                summary: "Update contract template",
                description: "Update an existing contract template",
                tags: ["contracts", "templates"],
              },
            }
          )
          // Delete template
          // .use(accessPlugin("contracts", "delete"))
          .delete(
            "/:templateId",
            async ({ params }) => ({
              status: "success",
              message: `Template ${params.templateId} deleted successfully`,
            }),
            {
              params: t.Object({ templateId: t.String() }),
              response: {
                200: t.Object({
                  status: t.Literal("success"),
                  message: t.String(),
                }),
              },
              detail: {
                summary: "Delete contract template",
                description: "Delete a contract template",
                tags: ["contracts", "templates"],
              },
            }
          )
          // Duplicate template
          .post(
            "/:templateId/duplicate",
            ({ params }) => {
              const now = new Date().toISOString();
              const template = {
                _id: crypto.randomUUID(),
                name: `Template ${params.templateId} (Copy)`,
                createdAt: now,
                updatedAt: now,
              };
              return {
                status: "success",
                message: "Template duplicated successfully",
                template,
              };
            },
            {
              params: t.Object({ templateId: t.String() }),
              response: {
                200: t.Object({
                  status: t.Literal("success"),
                  message: t.String(),
                  template: t.Any(),
                }),
              },
              detail: {
                summary: "Duplicate contract template",
                description:
                  "Create a duplicate of an existing contract template",
                tags: ["contracts", "templates"],
              },
            }
          )
      )

      // === RENEWAL ENDPOINTS ===

      // Create renewal request
      .post(
        "/:contractId/renew",
        async ({ params, body, set, user, ip: clientIp, headers }) => {
          const context: ErrorContext = {
            contractId: params.contractId,
            userId: user.id,
            action: "create_renewal",
            ipAddress: clientIp,
            userAgent: headers["user-agent"],
          };

          try {
            const renewal = await contractRenewalService.createRenewalRequest({
              contractId: params.contractId,
              userId: user.id,
              ...body,
            });

            set.status = 201;
            return {
              status: "success",
              message: "Renewal request created successfully",
              contract: renewal,
            };
          } catch (error) {
            const errorResponse = handleContractError(error as Error, context);
            set.status = errorResponse.status;
            return errorResponse.body;
          }
        },
        {
          params: paramSchemas.contractId,
          body: t.Object({
            newStartDate: t.String(),
            newEndDate: t.String(),
            newRentAmount: t.Optional(t.Number()),
            newDepositAmount: t.Optional(t.Number()),
            newTerms: t.Optional(
              t.Array(
                t.Object({
                  title: t.String(),
                  content: t.String(),
                })
              )
            ),
            renewalNotes: t.Optional(t.String()),
            autoRenewal: t.Optional(t.Boolean()),
          }),
          response: {
            201: responseSchemas.contractResponse,
            400: responseSchemas.error,
            403: responseSchemas.error,
            404: responseSchemas.error,
            500: responseSchemas.error,
          },
          detail: {
            summary: "Create renewal request",
            description: "Create a renewal request for an existing contract",
            tags: ["contracts", "renewals"],
          },
        }
      )

      // Get contracts eligible for renewal
      .get(
        "/renewals/eligible",
        async ({ query, set, user, ip: clientIp, headers }) => {
          const context: ErrorContext = {
            userId: user.id,
            action: "get_renewal_eligible",
            ipAddress: clientIp,
            userAgent: headers["user-agent"],
          };

          try {
            const contracts =
              await contractRenewalService.getContractsEligibleForRenewal(
                user.id,
                query.daysAhead ? Number.parseInt(query.daysAhead, 10) : 90
              );

            return {
              status: "success",
              contracts,
            };
          } catch (error) {
            const errorResponse = handleContractError(error as Error, context);
            set.status = errorResponse.status;
            return errorResponse.body;
          }
        },
        {
          query: t.Object({
            daysAhead: t.Optional(t.String()),
          }),
          response: {
            200: t.Object({
              status: t.Literal("success"),
              contracts: t.Array(t.Any()),
            }),
            500: responseSchemas.error,
          },
          detail: {
            summary: "Get contracts eligible for renewal",
            description: "Get contracts that are eligible for renewal",
            tags: ["contracts", "renewals"],
          },
        }
      )

      // Approve renewal
      .post(
        "/:contractId/renew/approve",
        async ({ params, set, user, ip: clientIp, headers }) => {
          const context: ErrorContext = {
            contractId: params.contractId,
            userId: user.id,
            action: "approve_renewal",
            ipAddress: clientIp,
            userAgent: headers["user-agent"],
          };

          try {
            const contract = await contractRenewalService.approveRenewal(
              params.contractId,
              user.id
            );

            return {
              status: "success",
              message: "Renewal approved successfully",
              contract,
            };
          } catch (error) {
            const errorResponse = handleContractError(error as Error, context);
            set.status = errorResponse.status;
            return errorResponse.body;
          }
        },
        {
          params: paramSchemas.contractId,
          response: {
            200: responseSchemas.contractResponse,
            400: responseSchemas.error,
            403: responseSchemas.error,
            404: responseSchemas.error,
            500: responseSchemas.error,
          },
          detail: {
            summary: "Approve renewal",
            description: "Approve a pending renewal request",
            tags: ["contracts", "renewals"],
          },
        }
      )

      // === AMENDMENT ENDPOINTS ===

      // Create amendment request
      .post(
        "/:contractId/amend",
        async ({ params, body, set, user, ip: clientIp, headers }) => {
          const context: ErrorContext = {
            contractId: params.contractId,
            userId: user.id,
            action: "create_amendment",
            ipAddress: clientIp,
            userAgent: headers["user-agent"],
          };

          try {
            const contract = await contractAmendmentService.createAmendment({
              contractId: params.contractId,
              userId: user.id,
              ...body,
            });

            set.status = 201;
            return {
              status: "success",
              message: "Amendment request created successfully",
              contract,
            };
          } catch (error) {
            const errorResponse = handleContractError(error as Error, context);
            set.status = errorResponse.status;
            return errorResponse.body;
          }
        },
        {
          params: paramSchemas.contractId,
          body: t.Object({
            amendmentReason: t.String(),
            changes: t.Array(
              t.Object({
                field: t.String(),
                oldValue: t.String(),
                newValue: t.String(),
                description: t.Optional(t.String()),
              })
            ),
            effectiveDate: t.Optional(t.String()),
            requiresApproval: t.Optional(t.Boolean()),
            notes: t.Optional(t.String()),
          }),
          response: {
            201: responseSchemas.contractResponse,
            400: responseSchemas.error,
            403: responseSchemas.error,
            404: responseSchemas.error,
            500: responseSchemas.error,
          },
          detail: {
            summary: "Create amendment request",
            description: "Create an amendment request for an existing contract",
            tags: ["contracts", "amendments"],
          },
        }
      )

      // Get pending amendments
      .get(
        "/amendments/pending",
        async ({ set, user, role, ip: clientIp, headers }) => {
          const context: ErrorContext = {
            userId: user.id,
            action: "get_pending_amendments",
            ipAddress: clientIp,
            userAgent: headers["user-agent"],
          };

          try {
            const amendments =
              await contractAmendmentService.getPendingAmendments(
                user.id,
                role
              );

            return {
              status: "success",
              amendments,
            };
          } catch (error) {
            const errorResponse = handleContractError(error as Error, context);
            set.status = errorResponse.status;
            return errorResponse.body;
          }
        },
        {
          response: {
            200: t.Object({
              status: t.Literal("success"),
              amendments: t.Array(t.Any()),
            }),
            500: responseSchemas.error,
          },
          detail: {
            summary: "Get pending amendments",
            description: "Get all pending amendment requests for user",
            tags: ["contracts", "amendments"],
          },
        }
      )

      // Approve/reject amendment
      .post(
        "/amendments/:amendmentId/approve",
        async ({ params, body, set, user, ip: clientIp, headers }) => {
          const context: ErrorContext = {
            userId: user.id,
            action: "process_amendment_approval",
            ipAddress: clientIp,
            userAgent: headers["user-agent"],
            additionalData: { amendmentId: params.amendmentId },
          };

          try {
            const contract =
              await contractAmendmentService.processAmendmentApproval({
                amendmentId: params.amendmentId,
                userId: user.id,
                ...body,
              });

            return {
              status: "success",
              message: body.approved
                ? "Amendment approved successfully"
                : "Amendment rejected",
              contract,
            };
          } catch (error) {
            const errorResponse = handleContractError(error as Error, context);
            set.status = errorResponse.status;
            return errorResponse.body;
          }
        },
        {
          params: t.Object({
            amendmentId: t.String(),
          }),
          body: t.Object({
            approved: t.Boolean(),
            approvalNotes: t.Optional(t.String()),
          }),
          response: {
            200: responseSchemas.contractResponse,
            400: responseSchemas.error,
            403: responseSchemas.error,
            404: responseSchemas.error,
            500: responseSchemas.error,
          },
          detail: {
            summary: "Approve or reject amendment",
            description: "Approve or reject a pending amendment request",
            tags: ["contracts", "amendments"],
          },
        }
      )

      // Get amendment history
      .get(
        "/:contractId/amendments",
        async ({ params, set, user, ip: clientIp, headers }) => {
          const context: ErrorContext = {
            contractId: params.contractId,
            userId: user.id,
            action: "get_amendment_history",
            ipAddress: clientIp,
            userAgent: headers["user-agent"],
          };

          try {
            const amendments =
              await contractAmendmentService.getAmendmentHistory(
                params.contractId,
                user.id
              );

            return {
              status: "success",
              amendments,
            };
          } catch (error) {
            const errorResponse = handleContractError(error as Error, context);
            set.status = errorResponse.status;
            return errorResponse.body;
          }
        },
        {
          params: paramSchemas.contractId,
          response: {
            200: t.Object({
              status: t.Literal("success"),
              amendments: t.Array(t.Any()),
            }),
            403: responseSchemas.error,
            404: responseSchemas.error,
            500: responseSchemas.error,
          },
          detail: {
            summary: "Get amendment history",
            description: "Get amendment history for a specific contract",
            tags: ["contracts", "amendments"],
          },
        }
      )

      // Cancel amendment
      .delete(
        "/:contractId/amendments/:amendmentId",
        async ({ params, set, user, ip: clientIp, headers }) => {
          const context: ErrorContext = {
            contractId: params.contractId,
            userId: user.id,
            action: "cancel_amendment",
            ipAddress: clientIp,
            userAgent: headers["user-agent"],
            additionalData: { amendmentId: params.amendmentId },
          };

          try {
            const contract = await contractAmendmentService.cancelAmendment(
              params.contractId,
              params.amendmentId,
              user.id
            );

            return {
              status: "success",
              message: "Amendment cancelled successfully",
              contract,
            };
          } catch (error) {
            const errorResponse = handleContractError(error as Error, context);
            set.status = errorResponse.status;
            return errorResponse.body;
          }
        },
        {
          params: t.Object({
            contractId: t.String(),
            amendmentId: t.String(),
          }),
          response: {
            200: responseSchemas.contractResponse,
            403: responseSchemas.error,
            404: responseSchemas.error,
            500: responseSchemas.error,
          },
          detail: {
            summary: "Cancel amendment",
            description: "Cancel a pending amendment request",
            tags: ["contracts", "amendments"],
          },
        }
      )

      // Health check endpoint
      .get(
        "/health",
        ({ set }) => {
          try {
            // Basic health check
            return {
              status: "healthy",
              timestamp: new Date().toISOString(),
              service: "contracts",
            };
          } catch (error) {
            set.status = 500;
            return {
              status: "unhealthy",
              timestamp: new Date().toISOString(),
              service: "contracts",
              error: error instanceof Error ? error.message : "Unknown error",
            };
          }
        },
        {
          response: {
            200: t.Object({
              status: t.Literal("healthy"),
              timestamp: t.String(),
              service: t.Literal("contracts"),
            }),
            500: t.Object({
              status: t.Literal("unhealthy"),
              timestamp: t.String(),
              service: t.Literal("contracts"),
              error: t.String(),
            }),
          },
          detail: {
            summary: "Health check",
            description: "Check the health of the contracts service",
            tags: ["contracts", "health"],
          },
        }
      )
  );
