// /**
//  * Property Webhooks Service
//  *
//  * Handles webhook triggers for property-related events
//  */

// import type { IProperty } from "@kaa/models/types";
// import { WebhookEventType } from "@kaa/models/types";
// import { webhooksService } from "@kaa/services";
// import type mongoose from "mongoose";

// // ==================== WEBHOOK EVENT PAYLOADS ====================

// type PropertyWebhookPayload = {
//   event: WebhookEventType;
//   timestamp: Date;
//   property: {
//     id: string;
//     title: string;
//     type: string;
//     status: string;
//     landlord: string;
//     location: {
//       county: string;
//       estate: string;
//       coordinates: {
//         latitude: number;
//         longitude: number;
//       };
//     };
//     pricing: {
//       rent: number;
//       currency: string;
//     };
//     specifications: {
//       bedrooms: number;
//       bathrooms: number;
//     };
//     metadata?: Record<string, any>;
//   };
//   actor: {
//     id: string;
//     type: "user" | "admin" | "system";
//   };
//   changes?: Record<string, any>;
// };

// // ==================== WEBHOOK TRIGGER FUNCTIONS ====================

// /**
//  * Trigger webhook when property is created
//  */
// export const triggerPropertyCreated = async (
//   property: IProperty,
//   actorId: string
// ): Promise<void> => {
//   try {
//     const payload: PropertyWebhookPayload = {
//       event: WebhookEventType.PROPERTY_CREATED,
//       timestamp: new Date(),
//       property: {
//         id: (property._id as mongoose.Types.ObjectId).toString(),
//         title: property.title,
//         type: property.type,
//         status: property.status,
//         landlord: (property.landlord as mongoose.Types.ObjectId).toString(),
//         location: {
//           county: property.location.county,
//           estate: property.location.estate,
//           coordinates: {
//             latitude: property.location.coordinates.latitude,
//             longitude: property.location.coordinates.longitude,
//           },
//         },
//         pricing: {
//           rent: property.pricing.rent,
//           currency: property.pricing.currency || "KES",
//         },
//         specifications: {
//           bedrooms: property.specifications.bedrooms,
//           bathrooms: property.specifications.bathrooms,
//         },
//       },
//       actor: {
//         id: actorId,
//         type: "user",
//       },
//     };

//     await webhooksService.triggerEvent({
//       eventType: WebhookEventType.PROPERTY_CREATED,
//       payload,
//       userId: actorId,
//     });
//   } catch (error) {
//     console.error("Error triggering property created webhook:", error);
//   }
// };

// /**
//  * Trigger webhook when property is updated
//  */
// export const triggerPropertyUpdated = async (
//   property: IProperty,
//   actorId: string,
//   changes: Record<string, any>
// ): Promise<void> => {
//   try {
//     const payload: PropertyWebhookPayload = {
//       event: WebhookEventType.PROPERTY_UPDATED,
//       timestamp: new Date(),
//       property: {
//         id: (property._id as mongoose.Types.ObjectId).toString(),
//         title: property.title,
//         type: property.type,
//         status: property.status,
//         landlord: (property.landlord as mongoose.Types.ObjectId).toString(),
//         location: {
//           county: property.location.county,
//           estate: property.location.estate,
//           coordinates: {
//             latitude: property.location.coordinates.latitude,
//             longitude: property.location.coordinates.longitude,
//           },
//         },
//         pricing: {
//           rent: property.pricing.rent,
//           currency: property.pricing.currency || "KES",
//         },
//         specifications: {
//           bedrooms: property.specifications.bedrooms,
//           bathrooms: property.specifications.bathrooms,
//         },
//       },
//       actor: {
//         id: actorId,
//         type: "user",
//       },
//       changes,
//     };

//       await webhooksService.triggerEvent({
//         eventType: WebhookEventType.PROPERTY_UPDATED,
//         payload,
//         userId: actorId,
//       });
//   } catch (error) {
//     console.error("Error triggering property updated webhook:", error);
//   }
// };

// /**
//  * Trigger webhook when property is published (approved)
//  */
// export const triggerPropertyPublished = async (
//   property: IProperty,
//   actorId: string
// ): Promise<void> => {
//   try {
//     const payload: PropertyWebhookPayload = {
//       event: WebhookEventType.PROPERTY_PUBLISHED,
//       timestamp: new Date(),
//       property: {
//         id: (property._id as mongoose.Types.ObjectId).toString(),
//         title: property.title,
//         type: property.type,
//         status: property.status,
//         landlord: (property.landlord as mongoose.Types.ObjectId).toString(),
//         location: {
//           county: property.location.county,
//           estate: property.location.estate,
//           coordinates: {
//             latitude: property.location.coordinates.latitude,
//             longitude: property.location.coordinates.longitude,
//           },
//         },
//         pricing: {
//           rent: property.pricing.rent,
//           currency: property.pricing.currency || "KES",
//         },
//         specifications: {
//           bedrooms: property.specifications.bedrooms,
//           bathrooms: property.specifications.bathrooms,
//         },
//         metadata: {
//           approvedAt: new Date(),
//           moderatedBy: actorId,
//         },
//       },
//       actor: {
//         id: actorId,
//         type: "admin",
//       },
//     };

//     await webhooksService.triggerEvent({
//       eventType: WebhookEventType.PROPERTY_PUBLISHED,
//       payload,
//       userId: actorId,
//     });
//   } catch (error) {
//     console.error("Error triggering property published webhook:", error);
//   }
// };

// /**
//  * Trigger webhook when property is unpublished (rejected/deactivated)
//  */
// export const triggerPropertyUnpublished = async (
//   property: IProperty,
//   actorId: string,
//   reason?: string
// ): Promise<void> => {
//   try {
//     const payload: PropertyWebhookPayload = {
//       event: WebhookEventType.PROPERTY_UNPUBLISHED,
//       timestamp: new Date(),
//       property: {
//         id: (property._id as mongoose.Types.ObjectId).toString(),
//         title: property.title,
//         type: property.type,
//         status: property.status,
//         landlord: (property.landlord as mongoose.Types.ObjectId).toString(),
//         location: {
//           county: property.location.county,
//           estate: property.location.estate,
//           coordinates: {
//             latitude: property.location.coordinates.latitude,
//             longitude: property.location.coordinates.longitude,
//           },
//         },
//         pricing: {
//           rent: property.pricing.rent,
//           currency: property.pricing.currency || "KES",
//         },
//         specifications: {
//           bedrooms: property.specifications.bedrooms,
//           bathrooms: property.specifications.bathrooms,
//         },
//         metadata: {
//           unpublishedAt: new Date(),
//           reason,
//         },
//       },
//       actor: {
//         id: actorId,
//         type: "admin",
//       },
//     };

//     await webhooksService.triggerEvent({
//       eventType: WebhookEventType.PROPERTY_UNPUBLISHED,
//       payload,
//       userId: actorId,
//     });
//   } catch (error) {
//     console.error("Error triggering property unpublished webhook:", error);
//   }
// };

// /**
//  * Trigger webhook when property is deleted
//  */
// export const triggerPropertyDeleted = async (
//   propertyId: string,
//   propertyTitle: string,
//   actorId: string
// ): Promise<void> => {
//   try {
//     const payload = {
//       event: WebhookEventType.PROPERTY_DELETED,
//       timestamp: new Date(),
//       property: {
//         id: propertyId,
//         title: propertyTitle,
//       },
//       actor: {
//         id: actorId,
//         type: "user" as const,
//       },
//     };

//     await webhooksService.triggerEvent({
//       eventType: WebhookEventType.PROPERTY_DELETED,
//       payload,
//       userId: actorId,
//     });
//   } catch (error) {
//     console.error("Error triggering property deleted webhook:", error);
//   }
// };

// /**
//  * Trigger webhook when property is featured
//  */
// export const triggerPropertyFeatured = async (
//   property: IProperty,
//   actorId: string,
//   duration?: number
// ): Promise<void> => {
//   try {
//     const payload: PropertyWebhookPayload = {
//       event: WebhookEventType.PROPERTY_FEATURED,
//       timestamp: new Date(),
//       property: {
//         id: (property._id as mongoose.Types.ObjectId).toString(),
//         title: property.title,
//         type: property.type,
//         status: property.status,
//         landlord: (property.landlord as mongoose.Types.ObjectId).toString(),
//         location: {
//           county: property.location.county,
//           estate: property.location.estate,
//           coordinates: {
//             latitude: property.location.coordinates.latitude,
//             longitude: property.location.coordinates.longitude,
//           },
//         },
//         pricing: {
//           rent: property.pricing.rent,
//           currency: property.pricing.currency || "KES",
//         },
//         specifications: {
//           bedrooms: property.specifications.bedrooms,
//           bathrooms: property.specifications.bathrooms,
//         },
//         metadata: {
//           featuredAt: new Date(),
//           duration,
//         },
//       },
//       actor: {
//         id: actorId,
//         type: "admin",
//       },
//     };

//     await webhooksService.triggerEvent({
//       eventType: WebhookEventType.PROPERTY_FEATURED,
//       payload,
//       userId: actorId,
//     });
//   } catch (error) {
//     console.error("Error triggering property featured webhook:", error);
//   }
// };

// /**
//  * Trigger webhook for property inquiry
//  */
// export const triggerPropertyInquiry = async (
//   property: IProperty,
//   inquirerId: string,
//   inquiryData: {
//     message?: string;
//     phone?: string;
//     email?: string;
//   }
// ): Promise<void> => {
//   try {
//     const payload = {
//       event: "property.inquiry" as const,
//       timestamp: new Date(),
//       property: {
//         id: (property._id as mongoose.Types.ObjectId).toString(),
//         title: property.title,
//         type: property.type,
//         landlord: (property.landlord as mongoose.Types.ObjectId).toString(),
//       },
//       inquirer: {
//         id: inquirerId,
//         ...inquiryData,
//       },
//     };

//     await webhooksService.triggerEvent({
//       eventType: "property.inquiry" as WebhookEventType,
//       payload,
//       userId: inquirerId,
//     });
//   } catch (error) {
//     console.error("Error triggering property inquiry webhook:", error);
//   }
// };

// /**
//  * Trigger webhook for property pricing update
//  */
// export const triggerPropertyPricingUpdated = async (
//   property: IProperty,
//   actorId: string,
//   oldPrice: number,
//   newPrice: number,
//   reason?: string
// ): Promise<void> => {
//   try {
//     const payload = {
//       event: "property.pricing_updated" as const,
//       timestamp: new Date(),
//       property: {
//         id: (property._id as mongoose.Types.ObjectId).toString(),
//         title: property.title,
//         type: property.type,
//         landlord: (property.landlord as mongoose.Types.ObjectId).toString(),
//       },
//       pricing: {
//         old: oldPrice,
//         new: newPrice,
//         change: newPrice - oldPrice,
//         percentageChange: ((newPrice - oldPrice) / oldPrice) * 100,
//         reason,
//       },
//       actor: {
//         id: actorId,
//         type: "user" as const,
//       },
//     };

//     await webhooksService.triggerEvent({
//       eventType: "property.pricing_updated" as WebhookEventType,
//       payload,
//       userId: actorId,
//     });
//   } catch (error) {
//     console.error("Error triggering property pricing updated webhook:", error);
//   }
// };

// /**
//  * Trigger webhook for property verification
//  */
// export const triggerPropertyVerified = async (
//   property: IProperty,
//   verifierId: string
// ): Promise<void> => {
//   try {
//     const payload = {
//       event: "property.verified" as const,
//       timestamp: new Date(),
//       property: {
//         id: (property._id as mongoose.Types.ObjectId).toString(),
//         title: property.title,
//         type: property.type,
//         landlord: (property.landlord as mongoose.Types.ObjectId).toString(),
//         location: {
//           county: property.location.county,
//           estate: property.location.estate,
//         },
//       },
//       verifier: {
//         id: verifierId,
//         verifiedAt: new Date(),
//       },
//     };

//     await webhooksService.triggerEvent({
//       eventType: "property.verified" as WebhookEventType,
//       payload,
//       userId: verifierId,
//     });
//   } catch (error) {
//     console.error("Error triggering property verified webhook:", error);
//   }
// };

// /**
//  * Trigger webhook for property availability change
//  */
// export const triggerPropertyAvailabilityChanged = async (
//   property: IProperty,
//   actorId: string,
//   isAvailable: boolean,
//   availableFrom?: Date
// ): Promise<void> => {
//   try {
//     const payload = {
//       event: "property.availability_changed" as const,
//       timestamp: new Date(),
//       property: {
//         id: (property._id as mongoose.Types.ObjectId).toString(),
//         title: property.title,
//         type: property.type,
//         landlord: (property.landlord as mongoose.Types.ObjectId).toString(),
//       },
//       availability: {
//         isAvailable,
//         availableFrom: availableFrom?.toISOString(),
//         changedAt: new Date(),
//       },
//       actor: {
//         id: actorId,
//         type: "user" as const,
//       },
//     };

//     await webhooksService.triggerEvent({
//       eventType: "property.availability_changed" as WebhookEventType,
//       payload,
//       userId: actorId,
//     });
//   } catch (error) {
//     console.error(
//       "Error triggering property availability changed webhook:",
//       error
//     );
//   }
// };

// /**
//  * Trigger webhook for property image added
//  */
// export const triggerPropertyImageAdded = async (
//   propertyId: string,
//   propertyTitle: string,
//   actorId: string,
//   imageData: {
//     id: string;
//     url: string;
//     isPrimary?: boolean;
//   }
// ): Promise<void> => {
//   try {
//     const payload = {
//       event: "property.image_added" as const,
//       timestamp: new Date(),
//       property: {
//         id: propertyId,
//         title: propertyTitle,
//       },
//       image: imageData,
//       actor: {
//         id: actorId,
//         type: "user" as const,
//       },
//     };

//     await webhooksService.triggerEvent({
//       eventType: "property.image_added" as WebhookEventType,
//       payload,
//       userId: actorId,
//     });
//   } catch (error) {
//     console.error("Error triggering property image added webhook:", error);
//   }
// };

// /**
//  * Trigger webhook for property flagged
//  */
// export const triggerPropertyFlagged = async (
//   property: IProperty,
//   flaggerId: string,
//   reason: string
// ): Promise<void> => {
//   try {
//     const payload = {
//       event: "property.flagged" as const,
//       timestamp: new Date(),
//       property: {
//         id: (property._id as mongoose.Types.ObjectId).toString(),
//         title: property.title,
//         type: property.type,
//         landlord: (property.landlord as mongoose.Types.ObjectId).toString(),
//       },
//       flag: {
//         reason,
//         flaggedBy: flaggerId,
//         flaggedAt: new Date(),
//       },
//       actor: {
//         id: flaggerId,
//         type: "user" as const,
//       },
//     };

//     await webhooksService.triggerEvent({
//       eventType: "property.flagged" as WebhookEventType,
//       payload,
//       userId: flaggerId,
//     });
//   } catch (error) {
//     console.error("Error triggering property flagged webhook:", error);
//   }
// };

// // ==================== EXPORT ====================

// export const propertyWebhooks = {
//   triggerPropertyCreated,
//   triggerPropertyUpdated,
//   triggerPropertyPublished,
//   triggerPropertyUnpublished,
//   triggerPropertyDeleted,
//   triggerPropertyFeatured,
//   triggerPropertyInquiry,
//   triggerPropertyPricingUpdated,
//   triggerPropertyVerified,
//   triggerPropertyAvailabilityChanged,
//   triggerPropertyImageAdded,
//   triggerPropertyFlagged,
// };
