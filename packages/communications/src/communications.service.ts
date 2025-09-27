// import { randomUUID } from "node:crypto";
// import { logger } from "@kaa/utils";
// import { providerRegistry } from "./providers";
// import { templateService } from "./templates";
// import type {
//   BulkCommunication,
//   BulkCommunicationResult,
//   Communication,
//   CommunicationResult,
//   CommunicationType,
//   CommunicationWebhookPayload,
//   SendBulkCommunicationRequest,
//   SendCommunicationRequest,
//   TemplateFormat,
// } from "./types";

// /**
//  * Main Communications Service
//  * Orchestrates template rendering, provider selection, and communication sending
//  */
// export class CommunicationsService {
//   /**
//    * Send a single communication
//    */
//   async sendCommunication(
//     request: SendCommunicationRequest
//   ): Promise<CommunicationResult> {
//     try {
//       // Generate communication ID
//       const communicationId = randomUUID();

//       // Render template if provided
//       let content = request.content;
//       if (request.templateId || request.template) {
//         const renderResult = await templateService.render({
//           templateId: request.templateId,
//           template: request.template,
//           data: request.data || {},
//           options: {
//             format: this.getFormatForType(request.type),
//           },
//         });

//         content = {
//           subject: renderResult.subject,
//           body: renderResult.content,
//           html: request.type === "email" ? renderResult.content : undefined,
//           text:
//             request.type === "email"
//               ? renderResult.content.replace(/<[^>]*>/g, "")
//               : renderResult.content,
//         };
//       }

//       // Create communication object
//       const communication: Communication = {
//         id: communicationId,
//         type: request.type,
//         status: "queued",
//         priority: request.priority || "normal",
//         to: request.to,
//         template:
//           request.templateId || request.template
//             ? {
//                 templateId: request.templateId,
//                 data: request.data || {},
//               }
//             : undefined,
//         content: content as any,
//         scheduledAt: request.scheduledAt,
//         context: request.context || {},
//         settings:
//           request.settings ||
//           ({
//             enableDeliveryReports: true,
//             maxRetries: 3,
//             retryInterval: 5,
//             provider: this.getDefaultProviderForType(request.type),
//           } as any),
//         metadata: request.metadata,
//         createdAt: new Date(),
//       } as any;

//       // Select provider
//       const providerName =
//         request.settings?.provider ||
//         this.getDefaultProviderForType(request.type);
//       const provider = providerRegistry.get(providerName);

//       if (!provider) {
//         throw new Error(`Provider ${providerName} not found`);
//       }

//       if (!provider.initialized) {
//         throw new Error(`Provider ${providerName} is not initialized`);
//       }

//       // Send communication
//       const sendResult = await provider.send(communication);

//       // Update communication status based on result
//       communication.status = sendResult.success ? "sent" : "failed";
//       communication.providerMessageId = sendResult.providerMessageId;
//       communication.sentAt = sendResult.success ? new Date() : undefined;
//       communication.cost = sendResult.cost;

//       if (!sendResult.success && sendResult.error) {
//         communication.error = {
//           code: sendResult.error.code || "SEND_FAILED",
//           message: sendResult.error.message,
//           provider: providerName,
//         };
//       }

//       // Store communication in database (would be implemented)
//       await this.storeCommunication(communication);

//       return {
//         success: sendResult.success,
//         communicationId,
//         messageId: sendResult.providerMessageId,
//         segments: sendResult.segments,
//         cost: sendResult.cost,
//         error: sendResult.error,
//       };
//     } catch (error) {
//       logger.error("Failed to send communication:", error);
//       return {
//         success: false,
//         error: {
//           code: "COMMUNICATION_SEND_ERROR",
//           message: error instanceof Error ? error.message : "Unknown error",
//         },
//       };
//     }
//   }

//   /**
//    * Send bulk communications
//    */
//   async sendBulkCommunication(
//     request: SendBulkCommunicationRequest
//   ): Promise<BulkCommunicationResult> {
//     try {
//       // Generate bulk ID
//       const bulkId = randomUUID();
//       const communicationIds: string[] = [];
//       const results: CommunicationResult[] = [];

//       // Create bulk communication record
//       const bulkCommunication: BulkCommunication = {
//         _id: bulkId,
//         name: request.name,
//         description: request.description,
//         type: request.type,
//         priority: request.priority || "normal",
//         recipients: request.recipients,
//         template:
//           request.templateId || request.template
//             ? ({
//                 templateId: request.templateId,
//                 data: request.data || {},
//               } as any)
//             : undefined,
//         settings:
//           request.settings ||
//           ({
//             enableDeliveryReports: true,
//             maxRetries: 3,
//             provider: this.getDefaultProviderForType(request.type),
//           } as any),
//         status: "sending",
//         progress: {
//           total: request.recipients.length,
//           sent: 0,
//           delivered: 0,
//           failed: 0,
//           pending: request.recipients.length,
//           percentage: 0,
//         },
//         context: request.context || {},
//         scheduledAt: request.scheduledAt,
//         startedAt: new Date(),
//         createdAt: new Date(),
//       } as any;

//       // Select provider
//       const providerName =
//         request.settings?.provider ||
//         this.getDefaultProviderForType(request.type);
//       const provider = providerRegistry.get(providerName);

//       if (!provider) {
//         throw new Error(`Provider ${providerName} not found`);
//       }

//       if (!provider.initialized) {
//         throw new Error(`Provider ${providerName} is not initialized`);
//       }

//       // Process recipients in batches
//       const batchSize = provider.capabilities.maxRecipientsPerMessage || 100;
//       const batches = this.chunkArray(request.recipients, batchSize);

//       for (const batch of batches) {
//         try {
//           // Create communications for this batch
//           const batchCommunications: Communication[] = [];

//           for (const recipient of batch) {
//             const communicationId = randomUUID();

//             // Render template for this recipient (with recipient-specific data)
//             let content = (request as any).content as any;
//             if (request.templateId || request.template) {
//               const renderData = {
//                 ...request.data,
//                 ...recipient.metadata, // Merge recipient-specific data
//                 recipient,
//               };

//               const renderResult = await templateService.render({
//                 templateId: request.templateId,
//                 template: request.template,
//                 data: renderData,
//                 options: {
//                   format: this.getFormatForType(request.type),
//                 },
//               });

//               content = {
//                 subject: renderResult.subject,
//                 body: renderResult.content,
//                 html:
//                   request.type === "email" ? renderResult.content : undefined,
//                 text:
//                   request.type === "email"
//                     ? renderResult.content.replace(/<[^>]*>/g, "")
//                     : renderResult.content,
//               };
//             }

//             const communication: Communication = {
//               id: communicationId,
//               type: request.type,
//               status: "queued",
//               priority: request.priority || "normal",
//               to: [recipient],
//               template:
//                 request.templateId || request.template
//                   ? {
//                       templateId: request.templateId,
//                       data: { ...request.data, ...recipient.metadata },
//                     }
//                   : undefined,
//               content,
//               scheduledAt: request.scheduledAt,
//               context: request.context || {},
//               settings:
//                 request.settings ||
//                 ({
//                   enableDeliveryReports: true,
//                   maxRetries: 3,
//                   retryInterval: 5,
//                   provider: providerName,
//                 } as any),
//               metadata: (request as any).metadata as any,
//               createdAt: new Date(),
//             } as any;

//             batchCommunications.push(communication);
//             communicationIds.push(communicationId);
//           }

//           // Send batch
//           const batchResults = await provider.sendBulk(batchCommunications);

//           // Process results
//           for (let i = 0; i < batchCommunications.length; i++) {
//             const communication = batchCommunications[i];
//             const sendResult = batchResults[i];

//             if (!communication) {
//               continue;
//             }

//             // Update communication status
//             communication.status = sendResult?.success ? "sent" : "failed";
//             communication.providerMessageId = sendResult?.providerMessageId;
//             communication.sentAt = sendResult?.success ? new Date() : undefined;
//             communication.cost = sendResult?.cost;

//             if (!sendResult?.success && sendResult?.error) {
//               communication.error = {
//                 code: sendResult?.error?.code || "SEND_FAILED",
//                 message: sendResult?.error?.message,
//                 provider: providerName,
//               };
//             }

//             // Store communication
//             await this.storeCommunication(communication as Communication);

//             // Update bulk progress
//             bulkCommunication.progress.sent += 1;
//             if (sendResult?.success) {
//               // We'll assume delivered for now, in reality this would come from webhooks
//               bulkCommunication.progress.delivered += 1;
//             } else {
//               bulkCommunication.progress.failed += 1;
//             }
//             bulkCommunication.progress.pending -= 1;
//             bulkCommunication.progress.percentage = Math.round(
//               ((bulkCommunication.progress.sent +
//                 bulkCommunication.progress.delivered +
//                 bulkCommunication.progress.failed) /
//                 bulkCommunication.progress.total) *
//                 100
//             );

//             results.push({
//               success: sendResult?.success as boolean,
//               communicationId: communication?.id,
//               messageId: sendResult?.providerMessageId,
//               segments: sendResult?.segments,
//               cost: sendResult?.cost,
//               error: sendResult?.error,
//             });
//           }
//         } catch (error) {
//           logger.error("Failed to process batch:", error);

//           // Mark all in this batch as failed
//           for (const recipient of batch) {
//             const communicationId = randomUUID();
//             communicationIds.push(communicationId);

//             const failedResult: CommunicationResult = {
//               success: false,
//               communicationId,
//               error: {
//                 code: "BATCH_SEND_ERROR",
//                 message:
//                   error instanceof Error ? error.message : "Batch send failed",
//               },
//             };
//             results.push(failedResult);

//             // Update bulk progress
//             bulkCommunication.progress.failed += 1;
//             bulkCommunication.progress.pending -= 1;
//           }
//         }
//       }

//       // Update bulk communication final status
//       bulkCommunication.status =
//         bulkCommunication.progress.failed === 0 ? "completed" : "failed";
//       bulkCommunication.completedAt = new Date();
//       bulkCommunication.communicationIds = communicationIds;

//       // Store bulk communication
//       await this.storeBulkCommunication(bulkCommunication);

//       const successful = results.filter((r) => r.success).length;
//       const failed = results.length - successful;

//       return {
//         success: failed === 0,
//         bulkId,
//         totalCommunications: results.length,
//         successfulCommunications: successful,
//         failedCommunications: failed,
//         results,
//       };
//     } catch (error) {
//       logger.error("Failed to send bulk communication:", error);
//       return {
//         success: false,
//         totalCommunications: 0,
//         successfulCommunications: 0,
//         failedCommunications: 0,
//         results: [],
//         error: error instanceof Error ? error.message : "Unknown error",
//       };
//     }
//   }

//   /**
//    * Process webhook from provider
//    */
//   async processWebhook(payload: CommunicationWebhookPayload): Promise<void> {
//     try {
//       // Find the provider that should handle this webhook
//       // For now, we'll try all providers of the appropriate type
//       const providers: any[] = providerRegistry.getByType(payload.type as any);

//       for (const provider of providers) {
//         try {
//           await provider.processWebhook(payload);
//         } catch (error) {
//           logger.error(
//             `Provider ${provider.name} failed to process webhook:`,
//             error
//           );
//         }
//       }

//       // Update communication status in database
//       await this.updateCommunicationStatus(payload);
//     } catch (error) {
//       logger.error("Failed to process webhook:", error);
//     }
//   }

//   /**
//    * Get communication by ID
//    */
//   getCommunication(communicationId: string): Communication | null {
//     // This would query the database
//     // For now, return null
//     logger.warn(
//       `getCommunication not implemented yet for ID: ${communicationId}`
//     );
//     return null;
//   }

//   /**
//    * Get bulk communication by ID
//    */
//   getBulkCommunication(bulkId: string): BulkCommunication | null {
//     // This would query the database
//     // For now, return null
//     logger.warn(`getBulkCommunication not implemented yet for ID: ${bulkId}`);
//     return null;
//   }

//   /**
//    * Get default provider for communication type
//    */
//   private getDefaultProviderForType(type: CommunicationType): string {
//     const provider = providerRegistry.getDefault(type);
//     if (!provider) {
//       throw new Error(`No default provider configured for type: ${type}`);
//     }
//     return provider.name;
//   }

//   /**
//    * Get format for communication type
//    */
//   private getFormatForType(type: CommunicationType): TemplateFormat {
//     switch (type.toLowerCase()) {
//       case "email":
//         return "html";
//       case "sms":
//         return "sms";
//       case "push":
//         return "json";
//       default:
//         return "text";
//     }
//   }

//   /**
//    * Chunk array into smaller arrays
//    */
//   private chunkArray<T>(array: T[], chunkSize: number): T[][] {
//     const chunks: T[][] = [];
//     for (let i = 0; i < array.length; i += chunkSize) {
//       chunks.push(array.slice(i, i + chunkSize));
//     }
//     return chunks;
//   }

//   /**
//    * Store communication in database
//    */
//   private storeCommunication(communication: Communication): void {
//     // This would save to the database
//     // For now, just log
//     logger.info(`Storing communication: ${communication.id}`);
//   }

//   /**
//    * Store bulk communication in database
//    */
//   private storeBulkCommunication(bulkCommunication: BulkCommunication): void {
//     // This would save to the database
//     // For now, just log
//     logger.info(`Storing bulk communication: ${bulkCommunication._id}`);
//   }

//   /**
//    * Update communication status from webhook
//    */
//   private updateCommunicationStatus(
//     payload: CommunicationWebhookPayload
//   ): void {
//     // This would update the database
//     // For now, just log
//     logger.info(
//       `Updating communication status: ${payload.communicationId} -> ${payload.status}`
//     );
//   }
// }

// export const communicationsService = new CommunicationsService();
