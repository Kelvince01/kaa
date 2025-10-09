// ==================== ENUMS ====================

/**
 * Types of reviews in the system
 */
export enum ReviewType {
  PROPERTY = "property", // Review of a property
  USER_LANDLORD = "user_landlord", // Review of a landlord by tenant
  USER_TENANT = "user_tenant", // Review of a tenant by landlord
  AGENT = "agent", // Review of an agent
  PLATFORM = "platform", // Review of the platform itself
}

/**
 * Review status for moderation
 */
export enum ReviewStatus {
  PENDING = "pending", // Awaiting moderation
  APPROVED = "approved", // Approved and visible
  REJECTED = "rejected", // Rejected by moderator
  FLAGGED = "flagged", // Flagged for review
  HIDDEN = "hidden", // Hidden by admin/moderator
  SPAM = "spam", // Marked as spam
}

/**
 * Review categories for properties
 */
export enum PropertyReviewCategory {
  LOCATION = "location",
  AMENITIES = "amenities",
  CONDITION = "condition",
  LANDLORD = "landlord",
  VALUE_FOR_MONEY = "value_for_money",
  SAFETY = "safety",
  NEIGHBORS = "neighbors",
  MAINTENANCE = "maintenance",
}

/**
 * Review categories for users
 */
export enum UserReviewCategory {
  COMMUNICATION = "communication",
  RELIABILITY = "reliability",
  CLEANLINESS = "cleanliness",
  RESPECT = "respect",
  PAYMENT_TIMELINESS = "payment_timeliness",
  PROPERTY_CARE = "property_care",
  RESPONSIVENESS = "responsiveness",
}

/**
 * Sentiment analysis results
 */
export enum ReviewSentiment {
  POSITIVE = "positive",
  NEGATIVE = "negative",
  NEUTRAL = "neutral",
  MIXED = "mixed",
}

/**
 * Flag reasons for inappropriate reviews
 */
export enum ReviewFlagReason {
  INAPPROPRIATE_LANGUAGE = "inappropriate_language",
  FAKE_REVIEW = "fake_review",
  SPAM = "spam",
  PERSONAL_ATTACK = "personal_attack",
  OFF_TOPIC = "off_topic",
  MISLEADING = "misleading",
  HARASSMENT = "harassment",
  PRIVACY_VIOLATION = "privacy_violation",
}
