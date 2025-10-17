import {
  Booking,
  //   InvestmentOpportunity,
  //   MarketData,
  //   Payment,
  Property,
} from "@kaa/models";
import type { IProperty } from "@kaa/models/types";
import { logger } from "@kaa/utils";
import type mongoose from "mongoose";
import type { FilterQuery } from "mongoose";

type MarketDataResponse = {
  averagePrice: number;
  priceRange: { min: number; max: number };
  demandLevel: "low" | "medium" | "high";
  seasonalAdjustment: number;
  competitorCount: number;
  averageDaysOnMarket: number;
  priceHistory: Array<{ month: string; price: number }>;
  occupancyRate: number;
  rentYield: number;
};

type PropertyComparison = {
  id: string;
  address: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  size?: number;
  similarity: number;
  distance: number;
  daysOnMarket: number;
  photos: string[];
  status: "available" | "rented" | "pending";
  pricePerSqm?: number;
};

type MarketInsight = {
  type: "pricing" | "demand" | "timing" | "features" | "location";
  title: string;
  description: string;
  impact: "positive" | "negative" | "neutral";
  confidence: number;
  actionable: boolean;
  priority: "high" | "medium" | "low";
};

type DemandForecast = {
  nextMonth: number;
  nextQuarter: number;
  nextYear: number;
  seasonal: {
    peak: string;
    low: string;
    factors: string[];
  };
  factors: Array<{
    factor: string;
    impact: number;
    weight: number;
    description: string;
  }>;
  confidence: number;
};

type RentalTrends = {
  priceMovement: {
    direction: "up" | "down" | "stable";
    percentage: number;
    timeframe: string;
  };
  demandTrends: {
    current: "high" | "medium" | "low";
    forecast: "increasing" | "decreasing" | "stable";
    seasonality: Array<{
      month: number;
      demandIndex: number;
      description: string;
    }>;
  };
  supplyTrends: {
    newListings: number;
    withdrawnListings: number;
    netChange: number;
    marketBalance: "oversupply" | "balanced" | "undersupply";
  };
};

type LocationAnalysis = {
  score: number;
  factors: {
    accessibility: number;
    amenities: number;
    safety: number;
    infrastructure: number;
    growth: number;
  };
  nearby: {
    schools: Array<{ name: string; distance: number; rating: number }>;
    hospitals: Array<{ name: string; distance: number; type: string }>;
    shopping: Array<{ name: string; distance: number; type: string }>;
    transport: Array<{ name: string; distance: number; type: string }>;
  };
  futureProjects: Array<{
    name: string;
    type: string;
    expectedCompletion: string;
    impact: "positive" | "negative" | "neutral";
  }>;
};

/**
 * Market Intelligence service for property market analysis
 */
export class MarketIntelligenceService {
  private static instance: MarketIntelligenceService;

  private constructor() {}

  static getInstance(): MarketIntelligenceService {
    if (!MarketIntelligenceService.instance) {
      MarketIntelligenceService.instance = new MarketIntelligenceService();
    }
    return MarketIntelligenceService.instance;
  }

  /**
   * Get market data for a specific location and property type
   */
  async getMarketData(
    location: string,
    propertyType: string,
    _memberId?: string
  ): Promise<MarketDataResponse> {
    try {
      // Extract location components
      const locationParts = location.split(",").map((part) => part.trim());
      const county = locationParts.at(-1) || location;

      // Get properties in the area
      const marketProperties = await Property.find({
        "location.county": { $regex: county, $options: "i" },
        type: propertyType,
        status: { $ne: "draft" },
      });

      if (marketProperties.length === 0) {
        // Return default market data if no properties found
        return this.getDefaultMarketData(county, propertyType);
      }

      // Calculate market metrics
      const rentAmounts = marketProperties
        .map((p) => p.pricing?.rent || 0)
        .filter((amount) => amount > 0);

      const averagePrice =
        rentAmounts.reduce((sum, price) => sum + price, 0) /
          rentAmounts.length || 0;
      const sortedPrices = rentAmounts.sort((a, b) => a - b);

      const priceRange = {
        min: sortedPrices[Math.floor(sortedPrices.length * 0.1)] || 0,
        max: sortedPrices[Math.floor(sortedPrices.length * 0.9)] || 0,
      };

      // Calculate demand level based on booking activity
      const recentBookings = await Booking.aggregate([
        {
          $lookup: {
            from: "properties",
            localField: "property",
            foreignField: "_id",
            as: "propertyDetails",
          },
        },
        {
          $match: {
            "propertyDetails.location.county": {
              $regex: county,
              $options: "i",
            },
            "propertyDetails.type": propertyType,
            createdAt: {
              $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            },
          },
        },
      ]);

      const demandLevel: "low" | "medium" | "high" =
        recentBookings.length > marketProperties.length * 0.3
          ? "high"
          : recentBookings.length > marketProperties.length * 0.1
            ? "medium"
            : "low";

      // Calculate seasonal adjustment (mock implementation)
      const currentMonth = new Date().getMonth();
      const seasonalMultipliers = [
        1.1, 1.15, 1.2, 1.0, 0.9, 0.85, 0.8, 0.85, 0.9, 1.0, 1.05, 1.1,
      ];
      const seasonalAdjustment = (seasonalMultipliers[currentMonth] - 1) * 100;

      // Calculate average days on market
      const averageDaysOnMarket =
        marketProperties.reduce((sum, p) => {
          const days = Math.floor(
            (Date.now() - p.createdAt.getTime()) / (1000 * 60 * 60 * 24)
          );
          return sum + days;
        }, 0) / marketProperties.length || 30;

      // Generate price history (mock data - would come from historical records)
      const priceHistory = this.generatePriceHistory(averagePrice);

      // Calculate occupancy rate
      const occupiedProperties = await Booking.distinct("property", {
        status: { $in: ["approved", "active"] },
      });
      const occupancyRate =
        marketProperties.length > 0
          ? (occupiedProperties.filter((id) =>
              marketProperties.some(
                (p) =>
                  (p._id as mongoose.Types.ObjectId).toString() ===
                  id.toString()
              )
            ).length /
              marketProperties.length) *
            100
          : 0;

      // Calculate rent yield (mock calculation)
      const rentYield = ((averagePrice * 12) / (averagePrice * 200)) * 100; // Rough estimation

      const result: MarketDataResponse = {
        averagePrice,
        priceRange,
        demandLevel,
        seasonalAdjustment,
        competitorCount: marketProperties.length,
        averageDaysOnMarket,
        priceHistory,
        occupancyRate,
        rentYield,
      };

      logger.info("Market data calculated", {
        location: county,
        propertyType,
        averagePrice,
        competitorCount: marketProperties.length,
      });

      return result;
    } catch (error) {
      logger.error("Error getting market data:", error);
      throw new Error("Failed to get market data");
    }
  }

  /**
   * Get comparable properties
   */
  async getComparableProperties(
    location: string,
    bedrooms: number,
    bathrooms: number,
    size?: number,
    _memberId?: string
  ): Promise<PropertyComparison[]> {
    try {
      const locationParts = location.split(",").map((part) => part.trim());
      const county = locationParts.at(-1) || location;

      // Build query for similar properties
      const query: FilterQuery<IProperty> = {
        "location.county": { $regex: county, $options: "i" },
        "details.bedrooms": { $gte: bedrooms - 1, $lte: bedrooms + 1 },
        "details.bathrooms": {
          $gte: Math.max(1, bathrooms - 1),
          $lte: bathrooms + 1,
        },
        status: { $ne: "draft" },
      };

      if (size) {
        query["details.size"] = { $gte: size * 0.8, $lte: size * 1.2 };
      }

      const properties = await Property.find(query).limit(20);

      // Calculate similarity scores
      const comparables: PropertyComparison[] = properties.map((property) => {
        let similarity = 0.5; // Base similarity

        // Bedroom similarity
        if (property.specifications?.bedrooms === bedrooms) similarity += 0.3;
        else if (
          Math.abs((property.specifications?.bedrooms || 0) - bedrooms) === 1
        )
          similarity += 0.1;

        // Bathroom similarity
        if (property.specifications?.bathrooms === bathrooms) similarity += 0.2;
        else if (
          Math.abs((property.specifications?.bathrooms || 0) - bathrooms) === 1
        )
          similarity += 0.1;

        // Size similarity (if provided)
        if (size && property.specifications?.totalArea) {
          const sizeDiff =
            Math.abs(property.specifications.totalArea - size) / size;
          if (sizeDiff < 0.1) similarity += 0.2;
          else if (sizeDiff < 0.2) similarity += 0.1;
        }

        // Location similarity (mock calculation)
        similarity += 0.1; // Base location match

        return {
          id: (property._id as mongoose.Types.ObjectId).toString(),
          address:
            property.location.address?.line1 ||
            `${property.location.county}, Kenya`,
          price: property.pricing?.rent || 0,
          bedrooms: property.specifications?.bedrooms || 0,
          bathrooms: property.specifications?.bathrooms || 0,
          size: property.specifications?.totalArea,
          similarity: Math.min(1, similarity),
          distance: Math.random() * 10, // Mock distance in km
          daysOnMarket: Math.floor(
            (Date.now() - property.createdAt.getTime()) / (1000 * 60 * 60 * 24)
          ),
          photos:
            property.media?.images?.slice(0, 3).map((photo) => photo.url) || [],
          status: property.status === "active" ? "available" : "rented",
          pricePerSqm: property.specifications?.totalArea
            ? (property.pricing?.rent || 0) / property.specifications.totalArea
            : undefined,
        };
      });

      // Sort by similarity score
      const sortedComparables = comparables
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, 10);

      logger.info("Comparable properties found", {
        location: county,
        bedrooms,
        bathrooms,
        count: sortedComparables.length,
      });

      return sortedComparables;
    } catch (error) {
      logger.error("Error getting comparable properties:", error);
      throw new Error("Failed to get comparable properties");
    }
  }

  /**
   * Get market insights for a property
   */
  async getMarketInsights(
    propertyData: {
      location?: { county?: string; city?: string; neighborhood?: string };
      specifications?: { bedrooms?: number; bathrooms?: number; size?: number };
      pricing?: { rent?: number };
      amenities?: string[];
      type?: string;
    },
    _memberId?: string
  ): Promise<MarketInsight[]> {
    try {
      const insights: MarketInsight[] = [];
      const county = propertyData.location?.county || "";

      // Get market context
      const marketData = await this.getMarketData(
        county,
        propertyData.type || "apartment"
      );

      // Pricing insights
      if (propertyData.pricing?.rent) {
        const priceComparison =
          ((propertyData.pricing.rent - marketData.averagePrice) /
            marketData.averagePrice) *
          100;

        if (priceComparison > 15) {
          insights.push({
            type: "pricing",
            title: "Premium Pricing Detected",
            description: `Your price is ${priceComparison.toFixed(1)}% above market average. Ensure your property justifies the premium with superior amenities or location.`,
            impact: "neutral",
            confidence: 0.85,
            actionable: true,
            priority: "medium",
          });
        } else if (priceComparison < -15) {
          insights.push({
            type: "pricing",
            title: "Below Market Pricing",
            description: `Your price is ${Math.abs(priceComparison).toFixed(1)}% below market average. You may be missing revenue opportunity.`,
            impact: "negative",
            confidence: 0.8,
            actionable: true,
            priority: "high",
          });
        } else {
          insights.push({
            type: "pricing",
            title: "Competitive Pricing",
            description:
              "Your price is well-aligned with market rates, which should attract steady interest.",
            impact: "positive",
            confidence: 0.75,
            actionable: false,
            priority: "low",
          });
        }
      }

      // Demand insights
      insights.push({
        type: "demand",
        title: `${marketData.demandLevel.charAt(0).toUpperCase() + marketData.demandLevel.slice(1)} Demand Area`,
        description: `Market demand for ${propertyData.specifications?.bedrooms || 1}-bedroom ${propertyData.type}s is ${marketData.demandLevel} in ${county}.`,
        impact:
          marketData.demandLevel === "high"
            ? "positive"
            : marketData.demandLevel === "low"
              ? "negative"
              : "neutral",
        confidence: 0.78,
        actionable: marketData.demandLevel === "low",
        priority: marketData.demandLevel === "high" ? "low" : "medium",
      });

      // Timing insights
      const currentMonth = new Date().getMonth();
      const isPeakSeason = currentMonth >= 0 && currentMonth <= 2; // Jan-Mar peak season in Kenya

      insights.push({
        type: "timing",
        title: isPeakSeason ? "Peak Rental Season" : "Off-Peak Period",
        description: isPeakSeason
          ? "January to March is peak rental season in Kenya. Excellent timing for property listings!"
          : "Consider seasonal pricing adjustments or enhanced marketing during off-peak periods.",
        impact: isPeakSeason ? "positive" : "neutral",
        confidence: 0.72,
        actionable: !isPeakSeason,
        priority: isPeakSeason ? "low" : "medium",
      });

      // Feature insights based on amenities
      if (propertyData.amenities?.length) {
        const premiumAmenities = [
          "pool",
          "gym",
          "generator",
          "elevator",
          "security",
          "parking",
        ];
        const hasPremiumAmenities = propertyData.amenities.some((amenity) =>
          premiumAmenities.some((premium) =>
            amenity.toLowerCase().includes(premium)
          )
        );

        if (hasPremiumAmenities) {
          insights.push({
            type: "features",
            title: "Premium Amenities Advantage",
            description:
              "Your property features high-demand amenities that justify premium pricing and faster rentals.",
            impact: "positive",
            confidence: 0.83,
            actionable: false,
            priority: "low",
          });
        }
      }

      // Location-specific insights
      if (county.toLowerCase().includes("nairobi")) {
        insights.push({
          type: "location",
          title: "Prime Market Location",
          description:
            "Nairobi properties typically have higher demand and faster rental cycles due to business and job opportunities.",
          impact: "positive",
          confidence: 0.9,
          actionable: false,
          priority: "low",
        });
      }

      // Size insights
      if (propertyData.specifications?.size && propertyData.pricing?.rent) {
        const pricePerSqm =
          propertyData.pricing.rent / propertyData.specifications.size;
        const avgPricePerSqm = marketData.averagePrice / 80; // Assume 80 sqm average

        if (pricePerSqm > avgPricePerSqm * 1.2) {
          insights.push({
            type: "pricing",
            title: "High Price Per Square Meter",
            description: `At KES ${pricePerSqm.toFixed(0)}/sqm, your property is priced significantly above the area average. Ensure the quality justifies the premium.`,
            impact: "neutral",
            confidence: 0.77,
            actionable: true,
            priority: "medium",
          });
        }
      }

      logger.info("Market insights generated", {
        location: county,
        propertyType: propertyData.type || "apartment",
        insightCount: insights.length,
      });

      return insights;
    } catch (error) {
      logger.error("Error getting market insights:", error);
      throw new Error("Failed to get market insights");
    }
  }

  /**
   * Get demand forecast for a location
   */
  async getDemandForecast(location: string): Promise<DemandForecast> {
    try {
      const locationParts = location.split(",").map((part) => part.trim());
      const county = locationParts.at(-1) || location;

      // Get historical booking data
      const bookingTrends = await Booking.aggregate([
        {
          $lookup: {
            from: "properties",
            localField: "property",
            foreignField: "_id",
            as: "propertyDetails",
          },
        },
        {
          $match: {
            "propertyDetails.location.county": {
              $regex: county,
              $options: "i",
            },
            createdAt: {
              $gte: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000),
            }, // Last 6 months
          },
        },
        {
          $group: {
            _id: {
              year: { $year: "$createdAt" },
              month: { $month: "$createdAt" },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { "_id.year": 1, "_id.month": 1 } },
      ]);

      // Calculate trend
      const recentBookings = bookingTrends.slice(-3);
      const olderBookings = bookingTrends.slice(-6, -3);

      const recentAvg =
        recentBookings.reduce((sum, item) => sum + item.count, 0) /
        Math.max(recentBookings.length, 1);
      const olderAvg =
        olderBookings.reduce((sum, item) => sum + item.count, 0) /
        Math.max(olderBookings.length, 1);

      const trend = olderAvg > 0 ? (recentAvg - olderAvg) / olderAvg : 0;

      // Forecast future demand
      const baselineBookings = recentAvg || 10;
      const nextMonth = Math.max(0.3, Math.min(1.0, 0.7 + trend * 0.3));
      const nextQuarter = Math.max(0.4, Math.min(1.0, 0.65 + trend * 0.25));
      const nextYear = Math.max(0.5, Math.min(1.0, 0.75 + trend * 0.2));

      // Define factors affecting demand
      const factors = [
        {
          factor: "University Semester Cycles",
          impact: county.toLowerCase().includes("nairobi") ? 0.15 : 0.08,
          weight: 0.7,
          description: "Student housing demand peaks during semester starts",
        },
        {
          factor: "Corporate Relocations",
          impact: 0.12,
          weight: 0.6,
          description: "Business relocations drive rental demand",
        },
        {
          factor: "Economic Growth",
          impact: 0.08,
          weight: 0.5,
          description: "Economic conditions affect rental market activity",
        },
        {
          factor: "Infrastructure Development",
          impact: 0.1,
          weight: 0.6,
          description:
            "New infrastructure projects increase area attractiveness",
        },
      ];

      const forecast: DemandForecast = {
        nextMonth,
        nextQuarter,
        nextYear,
        seasonal: {
          peak: "January - March",
          low: "July - September",
          factors: [
            "University academic calendar",
            "Corporate fiscal year cycles",
            "Holiday seasons",
            "School calendar transitions",
          ],
        },
        factors,
        confidence: 0.75,
      };

      logger.info("Demand forecast calculated", { location: county });
      return forecast;
    } catch (error) {
      logger.error("Error getting demand forecast:", error);
      throw new Error("Failed to get demand forecast");
    }
  }

  /**
   * Get rental market trends
   */
  async getRentalTrends(
    location: string,
    propertyType: string,
    timeframe: "3m" | "6m" | "1y" = "6m"
  ): Promise<RentalTrends> {
    try {
      const county = location.split(",").pop()?.trim() || location;

      // Calculate timeframe dates
      const months = timeframe === "1y" ? 12 : timeframe === "6m" ? 6 : 3;
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - months);

      // Get historical property data (mock implementation)
      const properties = await Property.find({
        "location.county": { $regex: county, $options: "i" },
        type: propertyType,
        createdAt: { $gte: startDate },
      });

      // Calculate price movement
      const pricesByMonth = properties.reduce(
        (acc, property) => {
          const month = property.createdAt.getMonth();
          if (!acc[month]) acc[month] = [];
          acc[month].push(property.pricing?.rent || 0);
          return acc;
        },
        {} as Record<number, number[]>
      );

      const monthlyAverages = Object.entries(pricesByMonth)
        .map(([month, prices]) => ({
          month: Number.parseInt(month, 10),
          average:
            prices.reduce((sum, price) => sum + price, 0) / prices.length,
        }))
        .sort((a, b) => a.month - b.month);

      let priceDirection: "up" | "down" | "stable" = "stable";
      let priceChangePercentage = 0;

      if (monthlyAverages.length >= 2) {
        const latest = monthlyAverages.at(-1);
        const earliest = monthlyAverages[0];
        priceChangePercentage =
          ((latest?.average || 0 - earliest?.average || 0) /
            earliest?.average || 0) * 100;

        if (priceChangePercentage > 5) priceDirection = "up";
        else if (priceChangePercentage < -5) priceDirection = "down";
      }

      // Get supply trends
      const newListings = await Property.countDocuments({
        "location.county": { $regex: county, $options: "i" },
        type: propertyType,
        createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      });

      const withdrawnListings = await Property.countDocuments({
        "location.county": { $regex: county, $options: "i" },
        type: propertyType,
        status: "inactive",
        updatedAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      });

      const trends: RentalTrends = {
        priceMovement: {
          direction: priceDirection,
          percentage: Math.abs(priceChangePercentage),
          timeframe: `${months} months`,
        },
        demandTrends: {
          current:
            newListings > withdrawnListings * 2
              ? "high"
              : newListings > withdrawnListings
                ? "medium"
                : "low",
          forecast:
            priceDirection === "up"
              ? "increasing"
              : priceDirection === "down"
                ? "decreasing"
                : "stable",
          seasonality: [
            { month: 1, demandIndex: 1.2, description: "Peak season start" },
            { month: 2, demandIndex: 1.3, description: "Highest demand" },
            { month: 3, demandIndex: 1.1, description: "Peak season end" },
            { month: 4, demandIndex: 0.9, description: "Moderate demand" },
            { month: 5, demandIndex: 0.8, description: "Lower activity" },
            { month: 6, demandIndex: 0.7, description: "Seasonal low" },
            { month: 7, demandIndex: 0.6, description: "Lowest demand" },
            { month: 8, demandIndex: 0.7, description: "Gradual recovery" },
            { month: 9, demandIndex: 0.8, description: "Back to school boost" },
            {
              month: 10,
              demandIndex: 0.9,
              description: "Pre-holiday activity",
            },
            { month: 11, demandIndex: 1.0, description: "Year-end movement" },
            { month: 12, demandIndex: 1.1, description: "Holiday relocations" },
          ],
        },
        supplyTrends: {
          newListings,
          withdrawnListings,
          netChange: newListings - withdrawnListings,
          marketBalance:
            newListings > withdrawnListings * 1.5
              ? "oversupply"
              : newListings < withdrawnListings * 0.7
                ? "undersupply"
                : "balanced",
        },
      };

      logger.info("Rental trends calculated", {
        location: county,
        propertyType,
        priceDirection,
        demandLevel: trends.demandTrends.current,
      });

      return trends;
    } catch (error) {
      logger.error("Error getting rental trends:", error);
      throw new Error("Failed to get rental trends");
    }
  }

  /**
   * Get location analysis and scoring
   */
  async getLocationAnalysis(
    location: { county: string; city?: string; neighborhood?: string },
    _memberId?: string
  ): Promise<LocationAnalysis> {
    try {
      // Mock location scoring (in real implementation, integrate with external APIs)
      const scores = {
        accessibility: Math.random() * 40 + 60, // 60-100
        amenities: Math.random() * 30 + 70, // 70-100
        safety: Math.random() * 20 + 70, // 70-90
        infrastructure: Math.random() * 30 + 65, // 65-95
        growth: Math.random() * 35 + 55, // 55-90
      };

      const overallScore =
        scores.accessibility * 0.25 +
        scores.amenities * 0.2 +
        scores.safety * 0.25 +
        scores.infrastructure * 0.15 +
        scores.growth * 0.15;

      // Mock nearby amenities (in real implementation, use Google Places API or similar)
      const nearby = {
        schools: [
          { name: "Nairobi Academy", distance: 1.2, rating: 4.5 },
          { name: "International School Kenya", distance: 2.8, rating: 4.7 },
          { name: "St. Mary's Primary", distance: 0.8, rating: 4.2 },
        ],
        hospitals: [
          { name: "Aga Khan Hospital", distance: 3.5, type: "Private" },
          { name: "Nairobi Hospital", distance: 4.2, type: "Private" },
          { name: "Kenyatta National Hospital", distance: 6.8, type: "Public" },
        ],
        shopping: [
          { name: "Westgate Shopping Mall", distance: 2.1, type: "Mall" },
          { name: "Sarit Centre", distance: 1.8, type: "Mall" },
          { name: "Local Market", distance: 0.5, type: "Market" },
        ],
        transport: [
          { name: "Westlands Bus Station", distance: 1.0, type: "Bus" },
          { name: "Museum Hill", distance: 2.5, type: "Matatu" },
          { name: "JKIA Airport", distance: 18.5, type: "Airport" },
        ],
      };

      const futureProjects = [
        {
          name: "Nairobi Metropolitan Area Transport",
          type: "Infrastructure",
          expectedCompletion: "2025-12",
          impact: "positive" as const,
        },
        {
          name: "New Shopping Complex",
          type: "Commercial",
          expectedCompletion: "2024-08",
          impact: "positive" as const,
        },
      ];

      const result: LocationAnalysis = {
        score: overallScore,
        factors: scores,
        nearby,
        futureProjects,
      };

      logger.info("Location analysis completed", {
        county: location.county,
        score: overallScore,
      });

      return await result;
    } catch (error) {
      logger.error("Error analyzing location:", error);
      throw new Error("Failed to analyze location");
    }
  }

  /**
   * Get investment opportunities in a market
   */
  async getInvestmentOpportunities(
    location: string,
    budget: number,
    riskTolerance: "low" | "medium" | "high" = "medium",
    _memberId?: string
  ): Promise<
    Array<{
      type: "buy" | "develop" | "renovate";
      description: string;
      investment: number;
      expectedReturn: number;
      paybackPeriod: number;
      riskLevel: "low" | "medium" | "high";
      confidence: number;
      location: string;
      reasoning: string[];
    }>
  > {
    try {
      const county = location.split(",").pop()?.trim() || location;

      // Get market data for context
      const marketData = await this.getMarketData(county, "apartment");

      const opportunities: Array<{
        type: "buy" | "develop" | "renovate";
        description: string;
        investment: number;
        expectedReturn: number;
        paybackPeriod: number;
        riskLevel: "low" | "medium" | "high";
        confidence: number;
        location: string;
        reasoning: string[];
      }> = [];

      // Buy opportunities - underpriced properties
      if (budget >= marketData.averagePrice * 200) {
        // Rough purchase price estimate
        opportunities.push({
          type: "buy" as const,
          description: `Purchase undervalued property in ${county}`,
          investment: marketData.averagePrice * 180,
          expectedReturn: 12.5,
          paybackPeriod: 96, // months
          riskLevel: riskTolerance,
          confidence: 0.75,
          location: county,
          reasoning: [
            "Market prices are below historical average",
            "Strong rental demand in the area",
            "Infrastructure development planned",
          ],
        });
      }

      // Development opportunities
      if (budget >= 5_000_000 && marketData.demandLevel === "high") {
        opportunities.push({
          type: "develop" as const,
          description: `New development opportunity in high-demand ${county} area`,
          investment: 8_000_000,
          expectedReturn: 18.5,
          paybackPeriod: 60, // months
          riskLevel: "high" as const,
          confidence: 0.65,
          location: county,
          reasoning: [
            "High demand with limited supply",
            "Zoning permits favorable",
            "Growing population in area",
          ],
        });
      }

      // Renovation opportunities
      if (budget >= 500_000) {
        opportunities.push({
          type: "renovate" as const,
          description: "Renovation opportunity to increase rental value",
          investment: 800_000,
          expectedReturn: 15.0,
          paybackPeriod: 48, // months
          riskLevel: "medium" as const,
          confidence: 0.8,
          location: county,
          reasoning: [
            "Older properties with renovation potential",
            "Market premium for modern amenities",
            "Relatively low renovation costs",
          ],
        });
      }

      logger.info("Investment opportunities found", {
        location: county,
        budget,
        opportunityCount: opportunities.length,
      });

      return opportunities.filter((opp) => opp.investment <= budget);
    } catch (error) {
      logger.error("Error getting investment opportunities:", error);
      throw new Error("Failed to get investment opportunities");
    }
  }

  /**
   * Private helper methods
   */
  private getDefaultMarketData(
    county: string,
    _propertyType: string
  ): MarketDataResponse {
    // Provide default market data when no properties found
    const basePrice = county.toLowerCase().includes("nairobi")
      ? 75_000
      : 45_000;

    return {
      averagePrice: basePrice,
      priceRange: {
        min: basePrice * 0.7,
        max: basePrice * 1.4,
      },
      demandLevel: "medium",
      seasonalAdjustment: 0,
      competitorCount: 0,
      averageDaysOnMarket: 30,
      priceHistory: this.generatePriceHistory(basePrice),
      occupancyRate: 75,
      rentYield: 8.5,
    };
  }

  private generatePriceHistory(
    averagePrice: number
  ): Array<{ month: string; price: number }> {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
    const baselineVariation = 0.1; // 10% variance

    return months.map((month, index) => ({
      month,
      price:
        averagePrice * (0.9 + index * 0.02 + Math.random() * baselineVariation),
    }));
  }
}

// Export singleton instance
export const marketIntelligenceService =
  MarketIntelligenceService.getInstance();
