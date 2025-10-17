import { describe, expect, it } from "bun:test";
import { analyticsService } from "./analytics.service";
import { marketIntelligenceService } from "./market-intelligence.service";

describe("Analytics Service", () => {
  const mockMemberId = "60d5ecb74f4a3c001f2f4e8b";
  const mockPropertyId = "60d5ecb74f4a3c001f2f4e8c";
  const mockSessionId = "session-test-123";

  it("should track analytics events successfully", async () => {
    const event = {
      event: "property-view",
      sessionId: mockSessionId,
      step: "details",
      field: "title",
      value: "Modern Apartment",
      timestamp: new Date(),
      userId: mockMemberId,
      metadata: { propertyId: mockPropertyId },
    };

    // Should not throw error
    await analyticsService.trackEvent(event);
    expect(true).toBe(true); // Event tracking logs but doesn't return data
  });

  it("should get form analytics for a session", async () => {
    const formAnalytics =
      await analyticsService.getFormAnalytics(mockSessionId);

    expect(formAnalytics).toBeDefined();
    expect(formAnalytics.sessionId).toBe(mockSessionId);
    expect(formAnalytics.timePerStep).toBeDefined();
    expect(formAnalytics.fieldInteractions).toBeDefined();
    expect(formAnalytics.completionRate).toBeGreaterThanOrEqual(0);
    expect(formAnalytics.completionRate).toBeLessThanOrEqual(1);
  });

  it("should get user behavior patterns", async () => {
    const behavior = await analyticsService.getUserBehavior(mockMemberId);

    expect(behavior).toBeDefined();
    expect(behavior.averageTimePerStep).toBeGreaterThan(0);
    expect(behavior.mostProblematicFields).toBeInstanceOf(Array);
    expect(behavior.conversionFunnels).toBeDefined();
    expect(["mobile", "tablet", "desktop"]).toContain(behavior.deviceType);
  });

  it("should handle financial analytics gracefully", async () => {
    // Test with mock member ID - should not throw even if no data exists
    const analytics = await analyticsService.getFinancialAnalytics(
      mockMemberId,
      "month"
    );

    expect(analytics).toBeDefined();
    expect(analytics.revenue).toBeDefined();
    expect(analytics.properties).toBeDefined();
    expect(analytics.trends).toBeDefined();
    expect(typeof analytics.revenue.total).toBe("number");
    expect(typeof analytics.properties.occupancyRate).toBe("number");
  });
});

describe("Market Intelligence Service", () => {
  const testLocation = "Nairobi, Kenya";
  const testPropertyType = "apartment";

  it("should get market data for a location", async () => {
    const marketData = await marketIntelligenceService.getMarketData(
      testLocation,
      testPropertyType
    );

    expect(marketData).toBeDefined();
    expect(typeof marketData.averagePrice).toBe("number");
    expect(marketData.priceRange).toBeDefined();
    expect(["low", "medium", "high"]).toContain(marketData.demandLevel);
    expect(typeof marketData.competitorCount).toBe("number");
    expect(marketData.priceHistory).toBeInstanceOf(Array);
    expect(typeof marketData.occupancyRate).toBe("number");
    expect(typeof marketData.rentYield).toBe("number");
  });

  it("should get comparable properties", async () => {
    const comparables = await marketIntelligenceService.getComparableProperties(
      testLocation,
      2, // bedrooms
      2, // bathrooms
      80 // size
    );

    expect(comparables).toBeInstanceOf(Array);

    if (comparables.length > 0) {
      const firstComparable = comparables[0];
      expect(firstComparable.id).toBeDefined();
      expect(firstComparable.address).toBeDefined();
      expect(typeof firstComparable.price).toBe("number");
      expect(typeof firstComparable.bedrooms).toBe("number");
      expect(typeof firstComparable.bathrooms).toBe("number");
      expect(typeof firstComparable.similarity).toBe("number");
      expect(firstComparable.similarity).toBeGreaterThanOrEqual(0);
      expect(firstComparable.similarity).toBeLessThanOrEqual(1);
      expect(["available", "rented", "pending"]).toContain(
        firstComparable.status
      );
    }
  });

  it("should generate market insights for property data", async () => {
    const propertyData = {
      location: { county: "Nairobi", city: "Westlands" },
      specifications: { bedrooms: 2, bathrooms: 2, size: 80 },
      pricing: { rent: 75_000 },
      amenities: ["parking", "security", "generator"],
      type: "apartment",
    };

    const insights =
      await marketIntelligenceService.getMarketInsights(propertyData);

    expect(insights).toBeInstanceOf(Array);
    expect(insights.length).toBeGreaterThan(0);

    const firstInsight = insights[0];
    expect(["pricing", "demand", "timing", "features", "location"]).toContain(
      firstInsight.type
    );
    expect(firstInsight.title).toBeDefined();
    expect(firstInsight.description).toBeDefined();
    expect(["positive", "negative", "neutral"]).toContain(firstInsight.impact);
    expect(typeof firstInsight.confidence).toBe("number");
    expect(firstInsight.confidence).toBeGreaterThan(0);
    expect(firstInsight.confidence).toBeLessThanOrEqual(1);
    expect(typeof firstInsight.actionable).toBe("boolean");
    expect(["high", "medium", "low"]).toContain(firstInsight.priority);
  });

  it("should get demand forecast for a location", async () => {
    const forecast =
      await marketIntelligenceService.getDemandForecast(testLocation);

    expect(forecast).toBeDefined();
    expect(typeof forecast.nextMonth).toBe("number");
    expect(typeof forecast.nextQuarter).toBe("number");
    expect(typeof forecast.nextYear).toBe("number");
    expect(forecast.seasonal).toBeDefined();
    expect(forecast.seasonal.peak).toBeDefined();
    expect(forecast.seasonal.low).toBeDefined();
    expect(forecast.factors).toBeInstanceOf(Array);
    expect(typeof forecast.confidence).toBe("number");
    expect(forecast.confidence).toBeGreaterThan(0);
    expect(forecast.confidence).toBeLessThanOrEqual(1);
  });

  it("should get rental trends for a location", async () => {
    const trends = await marketIntelligenceService.getRentalTrends(
      testLocation,
      testPropertyType,
      "6m"
    );

    expect(trends).toBeDefined();
    expect(trends.priceMovement).toBeDefined();
    expect(["up", "down", "stable"]).toContain(trends.priceMovement.direction);
    expect(typeof trends.priceMovement.percentage).toBe("number");

    expect(trends.demandTrends).toBeDefined();
    expect(["high", "medium", "low"]).toContain(trends.demandTrends.current);
    expect(["increasing", "decreasing", "stable"]).toContain(
      trends.demandTrends.forecast
    );
    expect(trends.demandTrends.seasonality).toBeInstanceOf(Array);
    expect(trends.demandTrends.seasonality.length).toBe(12);

    expect(trends.supplyTrends).toBeDefined();
    expect(typeof trends.supplyTrends.newListings).toBe("number");
    expect(typeof trends.supplyTrends.withdrawnListings).toBe("number");
    expect(["oversupply", "balanced", "undersupply"]).toContain(
      trends.supplyTrends.marketBalance
    );
  });

  it("should get location analysis", async () => {
    const location = { county: "Nairobi", city: "Westlands" };
    const analysis =
      await marketIntelligenceService.getLocationAnalysis(location);

    expect(analysis).toBeDefined();
    expect(typeof analysis.score).toBe("number");
    expect(analysis.score).toBeGreaterThan(0);
    expect(analysis.score).toBeLessThanOrEqual(100);

    expect(analysis.factors).toBeDefined();
    expect(typeof analysis.factors.accessibility).toBe("number");
    expect(typeof analysis.factors.amenities).toBe("number");
    expect(typeof analysis.factors.safety).toBe("number");
    expect(typeof analysis.factors.infrastructure).toBe("number");
    expect(typeof analysis.factors.growth).toBe("number");

    expect(analysis.nearby).toBeDefined();
    expect(analysis.nearby.schools).toBeInstanceOf(Array);
    expect(analysis.nearby.hospitals).toBeInstanceOf(Array);
    expect(analysis.nearby.shopping).toBeInstanceOf(Array);
    expect(analysis.nearby.transport).toBeInstanceOf(Array);

    expect(analysis.futureProjects).toBeInstanceOf(Array);
  });

  it("should get investment opportunities", async () => {
    const opportunities =
      await marketIntelligenceService.getInvestmentOpportunities(
        testLocation,
        5_000_000, // 5M budget
        "medium"
      );

    expect(opportunities).toBeInstanceOf(Array);

    for (const opportunity of opportunities) {
      expect(["buy", "develop", "renovate"]).toContain(opportunity.type);
      expect(opportunity.description).toBeDefined();
      expect(typeof opportunity.investment).toBe("number");
      expect(typeof opportunity.expectedReturn).toBe("number");
      expect(typeof opportunity.paybackPeriod).toBe("number");
      expect(["low", "medium", "high"]).toContain(opportunity.riskLevel);
      expect(typeof opportunity.confidence).toBe("number");
      expect(opportunity.location).toBeDefined();
      expect(opportunity.reasoning).toBeInstanceOf(Array);
      expect(opportunity.reasoning.length).toBeGreaterThan(0);
    }
  });
});

describe("Error Handling", () => {
  it("should handle invalid property ID gracefully", async () => {
    try {
      await analyticsService.getPropertyPerformance(
        "invalid-id",
        "invalid-member-id"
      );
      expect(false).toBe(true); // Should not reach here
    } catch (error) {
      expect(error.message).toContain("Failed to get property performance");
    }
  });

  it("should handle empty location gracefully", async () => {
    const marketData = await marketIntelligenceService.getMarketData(
      "",
      "apartment"
    );

    // Should return default data
    expect(marketData).toBeDefined();
    expect(typeof marketData.averagePrice).toBe("number");
    expect(marketData.competitorCount).toBe(0);
  });
});

describe("Data Validation", () => {
  it("should validate similarity scores are between 0 and 1", async () => {
    const comparables = await marketIntelligenceService.getComparableProperties(
      "Nairobi",
      2,
      2,
      80
    );

    for (const comparable of comparables) {
      expect(comparable.similarity).toBeGreaterThanOrEqual(0);
      expect(comparable.similarity).toBeLessThanOrEqual(1);
    }
  });

  it("should validate confidence levels are between 0 and 1", async () => {
    const insights = await marketIntelligenceService.getMarketInsights({
      location: { county: "Nairobi" },
      pricing: { rent: 50_000 },
      type: "apartment",
    });

    for (const insight of insights) {
      expect(insight.confidence).toBeGreaterThan(0);
      expect(insight.confidence).toBeLessThanOrEqual(1);
    }
  });

  it("should validate forecast values are within reasonable ranges", async () => {
    const forecast =
      await marketIntelligenceService.getDemandForecast("Nairobi");

    expect(forecast.nextMonth).toBeGreaterThanOrEqual(0.3);
    expect(forecast.nextMonth).toBeLessThanOrEqual(1.0);
    expect(forecast.nextQuarter).toBeGreaterThanOrEqual(0.4);
    expect(forecast.nextQuarter).toBeLessThanOrEqual(1.0);
    expect(forecast.nextYear).toBeGreaterThanOrEqual(0.5);
    expect(forecast.nextYear).toBeLessThanOrEqual(1.0);
  });
});
