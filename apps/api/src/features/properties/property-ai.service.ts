/**
 * Property AI Service
 *
 * Integrates AI-powered features for property management
 */

import { OpenAIService } from "@kaa/ai";
import type { IProperty } from "@kaa/models/types";
import type mongoose from "mongoose";

const openai = OpenAIService.getInstance();

// ==================== REGEX PATTERNS ====================

const LOCATION_KEYWORDS_REGEX = /nairobi|kenya|kilimani|westlands|karen/i;
const AMENITY_KEYWORDS_REGEX = /parking|security|water|electricity|wifi/i;
const PRICE_INFO_REGEX = /rent|ksh|kes|month/i;
const WORD_SPLIT_REGEX = /\s+/;

// ==================== TYPES ====================

export type PropertyDescriptionOptions = {
  tone?: "professional" | "casual" | "luxury" | "friendly";
  length?: "short" | "medium" | "long";
  targetAudience?: "general" | "families" | "students" | "professionals";
  includeKeywords?: string[];
};

export type PropertyValuationResult = {
  estimatedValue: number;
  confidence: number;
  priceRange: {
    min: number;
    max: number;
  };
  factors: {
    location: number;
    size: number;
    condition: number;
    amenities: number;
    market: number;
  };
  recommendation: string;
};

export type MarketInsightsResult = {
  demand: "low" | "medium" | "high" | "very_high";
  competition: "low" | "medium" | "high";
  trends: {
    priceMovement: "increasing" | "stable" | "decreasing";
    inventoryLevel: "low" | "medium" | "high";
    daysOnMarket: number;
  };
  recommendations: string[];
  opportunities: string[];
  risks: string[];
};

export type PropertyImageAnalysisResult = {
  quality: "poor" | "fair" | "good" | "excellent";
  issues: string[];
  suggestions: string[];
  features: string[];
  aestheticScore: number;
  technicalScore: number;
};

// ==================== AI SERVICES ====================

/**
 * Generate AI property description
 */
export const generatePropertyDescription = async (
  property: IProperty,
  options: PropertyDescriptionOptions = {}
): Promise<string> => {
  try {
    const propertyData = {
      type: property.type,
      title: property.title,
      location: {
        county: property.location.county,
        estate: property.location.estate,
        address: property.location.address.line1,
      },
      specifications: {
        bedrooms: property.specifications.bedrooms,
        bathrooms: property.specifications.bathrooms,
        area: property.specifications.totalArea,
        furnished: property.specifications.furnished,
      },
      amenities: Object.entries(property.amenities || {})
        .filter(([, value]) => value === true)
        .map(([key]) => key),
      pricing: {
        rent: property.pricing.rent,
        currency: property.pricing.currency || "KES",
      },
      nearbyAmenities: property.location.nearbyAmenities || [],
    };

    const description = await openai.generateDescription(propertyData, options);

    return description;
  } catch (error) {
    console.error("Error generating property description:", error);
    throw new Error("Failed to generate property description");
  }
};

/**
 * Get AI-powered property valuation
 */
export const getPropertyValuation = async (
  property: IProperty
): Promise<PropertyValuationResult> => {
  try {
    const propertyData = {
      type: property.type,
      location: {
        county: property.location.county,
        estate: property.location.estate,
        coordinates: {
          latitude: property.location.coordinates.latitude,
          longitude: property.location.coordinates.longitude,
        },
      },
      specifications: {
        bedrooms: property.specifications.bedrooms,
        bathrooms: property.specifications.bathrooms,
        area: property.specifications.totalArea,
        yearBuilt: property.specifications.yearBuilt,
        condition: property.specifications.condition,
      },
      amenities: Object.entries(property.amenities || {})
        .filter(([, value]) => value === true)
        .map(([key]) => key),
      pricing: {
        rent: property.pricing.rent,
        currency: property.pricing.currency || "KES",
      },
    };

    const valuation = await openai.performPropertyValuation(propertyData);

    // Map PropertyValuation to PropertyValuationResult
    return {
      estimatedValue: valuation.estimatedValue,
      confidence: valuation.confidenceScore,
      priceRange: {
        min: valuation.valuationRange.min,
        max: valuation.valuationRange.max,
      },
      factors: valuation.marketFactors as any,
      recommendation: `Based on ${valuation.methodology}, estimated value is KES ${valuation.estimatedValue.toLocaleString()}`,
    };
  } catch (error) {
    console.error("Error getting property valuation:", error);
    throw new Error("Failed to get property valuation");
  }
};

/**
 * Get market insights for property location
 */
export const getMarketInsights = async (
  property: IProperty
): Promise<MarketInsightsResult> => {
  try {
    /*
    const marketData = {
      location: {
        county: property.location.county,
        estate: property.location.estate,
        coordinates: {
          latitude: property.location.coordinates.latitude,
          longitude: property.location.coordinates.longitude,
        },
      },
      propertyType: property.type,
      pricing: {
        rent: property.pricing.rent,
      },
      specifications: {
        bedrooms: property.specifications.bedrooms,
        bathrooms: property.specifications.bathrooms,
      },
    };*/

    const locationKey = `${property.location.estate}, ${property.location.county}`;

    const insights = await openai.getAdvancedMarketInsights(locationKey);

    // Map MarketInsight to MarketInsightsResult
    const demandSupply = insights.demandSupplyRatio;
    const demand =
      demandSupply > 1.5
        ? ("very_high" as const)
        : demandSupply > 1.2
          ? ("high" as const)
          : demandSupply > 0.8
            ? ("medium" as const)
            : ("low" as const);

    const competition =
      insights.investment_score > 70
        ? ("high" as const)
        : insights.investment_score > 40
          ? ("medium" as const)
          : ("low" as const);

    return {
      demand,
      competition,
      trends: {
        priceMovement:
          insights.trends.direction === "up"
            ? "increasing"
            : insights.trends.direction === "down"
              ? "decreasing"
              : "stable",
        inventoryLevel:
          demandSupply > 1 ? "low" : demandSupply > 0.8 ? "medium" : "high",
        daysOnMarket: 30,
      },
      recommendations: [
        `Average price in area: KES ${insights.averagePrice.toLocaleString()}`,
      ],
      opportunities: insights.popularFeatures,
      risks: insights.trends.direction === "down" ? ["Declining market"] : [],
    };
  } catch (error) {
    console.error("Error getting market insights:", error);
    throw new Error("Failed to get market insights");
  }
};

/**
 * Analyze property images for quality and features
 */
export const analyzePropertyImages = (
  imageUrls: string[]
): PropertyImageAnalysisResult => {
  try {
    // TODO: Implement image fetching and conversion to Buffer
    // For now, return basic analysis based on image count
    if (!imageUrls || imageUrls.length === 0) {
      throw new Error("No images provided");
    }

    // Placeholder analysis until image URL to Buffer conversion is implemented
    const quality =
      imageUrls.length >= 5
        ? ("excellent" as const)
        : imageUrls.length >= 3
          ? ("good" as const)
          : ("fair" as const);

    return {
      quality,
      issues: imageUrls.length < 3 ? ["Consider adding more images"] : [],
      suggestions: [
        "Add images from different angles",
        "Include both interior and exterior shots",
        "Ensure good lighting in photos",
      ],
      features: ["Property images available"],
      aestheticScore: imageUrls.length >= 5 ? 8 : imageUrls.length >= 3 ? 6 : 4,
      technicalScore: 7,
    };
  } catch (error) {
    console.error("Error analyzing property images:", error);
    throw new Error("Failed to analyze property images");
  }
};

/**
 * Generate SEO-optimized property title and meta description
 */
export const generateSEOContent = async (
  property: IProperty
): Promise<{
  title: string;
  metaDescription: string;
  keywords: string[];
}> => {
  try {
    const contentToOptimize = `${property.type} in ${property.location.estate}, ${property.location.county}. ${property.specifications.bedrooms}BR, ${property.specifications.bathrooms}BA. Rent: KES ${property.pricing.rent}`;

    const seo = await openai.optimizeForSEO(contentToOptimize, property.type);

    // Extract SEO data from optimized content
    const title = `${property.specifications.bedrooms}BR ${property.type} in ${property.location.estate} - KES ${property.pricing.rent.toLocaleString()}/month`;

    const metaDescription = seo.optimizedContent.slice(0, 160);

    const keywords = Object.keys(seo.keywordDensity).slice(0, 10);

    return {
      title,
      metaDescription,
      keywords,
    };
  } catch (error) {
    console.error("Error generating SEO content:", error);
    throw new Error("Failed to generate SEO content");
  }
};

/**
 * Get pricing suggestions based on market analysis
 */
export const getPricingSuggestions = async (
  property: IProperty
): Promise<{
  suggestedPrice: number;
  priceRange: { min: number; max: number };
  reasoning: string[];
  marketComparison: string;
}> => {
  try {
    const propertyData = {
      type: property.type,
      location: {
        county: property.location.county,
        estate: property.location.estate,
      },
      specifications: {
        bedrooms: property.specifications.bedrooms,
        bathrooms: property.specifications.bathrooms,
        area: property.specifications.totalArea,
        condition: property.specifications.condition,
      },
      amenities: Object.entries(property.amenities || {})
        .filter(([, value]) => value === true)
        .map(([key]) => key),
      currentPrice: property.pricing.rent,
    };

    const suggestions = await openai.suggestPricing(propertyData);

    // Map PricingSuggestion to result format
    const marketComparison = suggestions.marketComparisons
      .slice(0, 3)
      .map((comp) => `${comp.address}: KES ${comp.price.toLocaleString()}`)
      .join("; ");

    return {
      suggestedPrice: suggestions.recommendedPrice,
      priceRange: {
        min: suggestions.range.min,
        max: suggestions.range.max,
      },
      reasoning: suggestions.reasoning,
      marketComparison,
    };
  } catch (error) {
    console.error("Error getting pricing suggestions:", error);
    throw new Error("Failed to get pricing suggestions");
  }
};

/**
 * Generate property tags for better searchability
 */
export const generatePropertyTags = (property: IProperty): string[] => {
  try {
    const propertyInfo = {
      type: property.type,
      location: property.location.estate,
      bedrooms: property.specifications.bedrooms,
      amenities: Object.entries(property.amenities || {})
        .filter(([, value]) => value === true)
        .map(([key]) => key),
      features: property.description,
    };

    // Generate tags based on property characteristics
    const tags: string[] = [];

    // Add location tags
    tags.push(property.location.county.toLowerCase());
    tags.push(property.location.estate.toLowerCase());

    // Add type tags
    tags.push(property.type.toLowerCase());

    // Add bedroom tags
    if (property.specifications.bedrooms) {
      tags.push(`${property.specifications.bedrooms}br`);
      tags.push(`${property.specifications.bedrooms}-bedroom`);
    }

    // Add amenity tags
    if (property.amenities) {
      for (const [key, value] of Object.entries(property.amenities)) {
        if (value) {
          tags.push(key.toLowerCase());
        }
      }
    }

    // Add furnished tag
    if (property.specifications.furnished) {
      tags.push(property.specifications.furnished);
    }

    // Add verified tag
    if (property.verified) {
      tags.push("verified");
    }

    // Add featured tag
    if (property.featured) {
      tags.push("featured");
    }

    // Remove duplicates
    return [...new Set(tags)];
  } catch (error) {
    console.error("Error generating property tags:", error);
    return [];
  }
};

/**
 * Analyze property description for improvements
 */
export const analyzePropertyDescription = (
  description: string
): {
  score: number;
  strengths: string[];
  improvements: string[];
  suggestions: string[];
} => {
  try {
    // Simple analysis rules
    const wordCount = description.split(WORD_SPLIT_REGEX).length;
    const hasLocationKeywords = LOCATION_KEYWORDS_REGEX.test(description);
    const hasAmenityKeywords = AMENITY_KEYWORDS_REGEX.test(description);
    const hasPriceInfo = PRICE_INFO_REGEX.test(description);

    const strengths: string[] = [];
    const improvements: string[] = [];
    const suggestions: string[] = [];

    // Evaluate strengths
    if (wordCount >= 100) {
      strengths.push("Good length - detailed description");
    }
    if (hasLocationKeywords) {
      strengths.push("Includes location information");
    }
    if (hasAmenityKeywords) {
      strengths.push("Mentions key amenities");
    }

    // Evaluate improvements needed
    if (wordCount < 50) {
      improvements.push("Description is too short - add more details");
      suggestions.push(
        "Describe the property's unique features and nearby amenities"
      );
    }
    if (!hasLocationKeywords) {
      improvements.push("Missing location context");
      suggestions.push("Mention the specific area, landmarks, or neighborhood");
    }
    if (!hasAmenityKeywords) {
      improvements.push("No amenities mentioned");
      suggestions.push("List key amenities like parking, security, utilities");
    }
    if (!hasPriceInfo && wordCount > 50) {
      suggestions.push("Consider mentioning payment terms or pricing details");
    }

    // Calculate score
    const maxPoints = 10;
    let score = 0;
    if (wordCount >= 100) score += 3;
    else if (wordCount >= 50) score += 2;
    else score += 1;

    if (hasLocationKeywords) score += 2;
    if (hasAmenityKeywords) score += 2;
    if (hasPriceInfo) score += 1;
    if (description.length > 200) score += 2;

    return {
      score: Math.min(score, maxPoints),
      strengths,
      improvements,
      suggestions,
    };
  } catch (error) {
    console.error("Error analyzing property description:", error);
    return {
      score: 0,
      strengths: [],
      improvements: ["Unable to analyze description"],
      suggestions: [],
    };
  }
};

/**
 * Generate property comparison report
 */
export const generateComparisonReport = (
  properties: IProperty[]
): {
  summary: string;
  comparisons: Array<{
    propertyId: string;
    title: string;
    pros: string[];
    cons: string[];
    score: number;
  }>;
  recommendation: string;
} => {
  try {
    if (properties.length === 0) {
      throw new Error("No properties provided for comparison");
    }

    const comparisons = properties.map((property) => {
      const pros: string[] = [];
      const cons: string[] = [];
      let score = 50; // Base score

      // Evaluate pros
      if (property.verified) {
        pros.push("Verified property");
        score += 10;
      }
      if (property.media.images && property.media.images.length > 5) {
        pros.push("Well documented with photos");
        score += 5;
      }
      if (property.amenities?.parking) {
        pros.push("Includes parking");
        score += 5;
      }
      if (property.amenities?.security) {
        pros.push("Security provided");
        score += 5;
      }

      // Evaluate cons
      if (!property.media.images || property.media.images.length < 3) {
        cons.push("Limited photos");
        score -= 10;
      }
      if (
        property.specifications.yearBuilt &&
        property.specifications.yearBuilt < 2010
      ) {
        cons.push("Older building");
        score -= 5;
      }
      if (!property.verified) {
        cons.push("Not verified");
        score -= 10;
      }

      return {
        propertyId: (property._id as mongoose.Types.ObjectId).toString(),
        title: property.title,
        pros,
        cons,
        score: Math.max(0, Math.min(100, score)),
      };
    });

    // Sort by score
    comparisons.sort((a, b) => b.score - a.score);

    const summary = `Compared ${properties.length} properties based on verification, amenities, documentation, and building age.`;
    const bestProperty = comparisons[0];
    const recommendation = `${bestProperty?.title} scores highest with ${bestProperty?.score}/100. ${bestProperty?.pros.join(", ")}.`;

    return {
      summary,
      comparisons,
      recommendation,
    };
  } catch (error) {
    console.error("Error generating comparison report:", error);
    throw new Error("Failed to generate comparison report");
  }
};

// ==================== EXPORT ====================

export const propertyAI = {
  generateDescription: generatePropertyDescription,
  getValuation: getPropertyValuation,
  getMarketInsights,
  analyzeImages: analyzePropertyImages,
  generateSEOContent,
  getPricingSuggestions,
  generateTags: generatePropertyTags,
  analyzeDescription: analyzePropertyDescription,
  generateComparisonReport,
};
