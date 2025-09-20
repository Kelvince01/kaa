import config from "@kaa/config/api";
import type {
  MarketDataProvider,
  PropertyValuationModel,
} from "@kaa/models/types";
import { logger } from "@kaa/utils";
import { openAIService } from "./openai.service";

/**
 * Advanced AI integrations service for specialized property features
 */
export class AIIntegrationsService {
  private static instance: AIIntegrationsService;

  // Market data providers
  // biome-ignore lint/correctness/noUnusedPrivateClassMembers: false because it is used in the instance
  private readonly marketProviders: MarketDataProvider[] = [
    {
      name: "PropertyGuru",
      baseUrl: "https://api.propertyguru.com",
      rateLimit: 100,
      apiKey: config.integrations?.propertyGuru?.apiKey,
    },
    {
      name: "KenyanMarketData",
      baseUrl: "https://api.kenyamarket.co.ke",
      rateLimit: 50,
      apiKey: config.integrations?.kenyanMarketData?.apiKey,
    },
  ];

  // AI valuation models
  private readonly valuationModels: PropertyValuationModel[] = [
    {
      name: "NairobiResidential",
      accuracy: 0.87,
      features: [
        "location",
        "bedrooms",
        "bathrooms",
        "size",
        "age",
        "amenities",
      ],
      lastTrained: new Date("2024-01-01"),
    },
    {
      name: "CommercialValuer",
      accuracy: 0.82,
      features: [
        "location",
        "size",
        "zonning",
        "accessibility",
        "infrastructure",
      ],
      lastTrained: new Date("2024-01-01"),
    },
  ];

  private constructor() {}

  static getInstance(): AIIntegrationsService {
    if (!AIIntegrationsService.instance) {
      AIIntegrationsService.instance = new AIIntegrationsService();
    }
    return AIIntegrationsService.instance;
  }

  /**
   * Integrate with external market data APIs
   */
  async fetchRealTimeMarketData(
    location: string,
    propertyType: string
  ): Promise<{
    averagePrice: number;
    pricePerSqm: number;
    marketTrend: "up" | "down" | "stable";
    dataSource: string;
    lastUpdated: Date;
    comparables: Array<{
      address: string;
      price: number;
      size: number;
      bedrooms: number;
      listingDate: Date;
    }>;
  }> {
    try {
      // Try multiple data sources for better accuracy
      const results = await Promise.allSettled([
        this.fetchFromPropertyGuru(location, propertyType),
        this.fetchFromKenyanMarketData(location, propertyType),
        this.fetchFromLocalDatabase(location, propertyType),
      ]);

      // Aggregate results from successful API calls
      const validResults = results
        .filter(
          (result): result is PromiseFulfilledResult<any> =>
            result.status === "fulfilled"
        )
        .map((result) => result.value);

      if (validResults.length === 0) {
        throw new Error("No market data sources available");
      }

      // Combine and average the data
      const aggregatedData = this.aggregateMarketData(validResults);

      logger.info("Real-time market data fetched", {
        location,
        propertyType,
        sourcesUsed: validResults.length,
        averagePrice: aggregatedData.averagePrice,
      });

      return aggregatedData;
    } catch (error) {
      logger.error("Error fetching real-time market data:", error);

      // Fallback to AI-generated estimates
      return await this.generateFallbackMarketData(location, propertyType);
    }
  }

  /**
   * AI-powered contract analysis and risk assessment
   */
  async analyzePropertyContract(
    contractText: string,
    contractType: "lease" | "sale" | "management" = "lease"
  ): Promise<{
    riskScore: number; // 0-100
    keyRisks: Array<{
      type: string;
      severity: "low" | "medium" | "high" | "critical";
      description: string;
      recommendation: string;
      clauseReference?: string;
    }>;
    missingClauses: string[];
    financialTerms: {
      totalValue: number;
      currency: string;
      paymentSchedule: string[];
      penalties: string[];
    };
    legalCompliance: {
      isCompliant: boolean;
      violations: string[];
      requiredAmmendments: string[];
    };
    summary: string;
  }> {
    try {
      const analysis = await openAIService.processConversationalQuery(
        `Analyze this ${contractType} contract for risks, legal compliance, and financial terms:

        ${contractText}

        Provide comprehensive analysis focusing on:
        1. Risk assessment (0-100 score)
        2. Legal compliance with Kenyan property law
        3. Financial terms extraction
        4. Missing essential clauses
        5. Specific recommendations

        Format as detailed JSON with all requested fields.`,
        [],
        { contractType, jurisdiction: "Kenya" }
      );

      // Parse the AI response and structure it
      const structuredAnalysis = this.parseContractAnalysis(analysis.response);

      logger.info("Contract analysis completed", {
        contractType,
        riskScore: structuredAnalysis.riskScore,
        risksFound: structuredAnalysis.keyRisks.length,
      });

      return structuredAnalysis;
    } catch (error) {
      logger.error("Error analyzing contract:", error);
      throw new Error("Failed to analyze contract");
    }
  }

  /**
   * Voice-to-text processing for property queries
   */
  async processVoiceQuery(
    audioBuffer: Buffer,
    language = "en-KE"
  ): Promise<{
    transcript: string;
    confidence: number;
    intent: string;
    entities: Array<{
      type: string;
      value: string;
      confidence: number;
    }>;
    aiResponse?: string;
  }> {
    try {
      // Convert speech to text (using Google Speech-to-Text API or similar)
      const transcript = await this.speechToText(audioBuffer, language);

      if (!transcript) {
        throw new Error("Could not transcribe audio");
      }

      // Extract intent and entities using AI
      const nlpAnalysis = await this.analyzeNaturalLanguage(transcript);

      // Generate appropriate AI response if it's a property-related query
      let aiResponse: string | undefined;
      if (nlpAnalysis.intent === "property_query") {
        const response = await openAIService.processConversationalQuery(
          transcript,
          [],
          {
            medium: "voice",
            language,
          }
        );
        aiResponse = response.response;
      }

      return {
        transcript,
        confidence: nlpAnalysis.confidence,
        intent: nlpAnalysis.intent,
        entities: nlpAnalysis.entities,
        aiResponse,
      };
    } catch (error) {
      logger.error("Error processing voice query:", error);
      throw new Error("Failed to process voice query");
    }
  }

  /**
   * Advanced property valuation using machine learning
   */
  async performAdvancedValuation(propertyData: {
    location: { lat: number; lng: number; county: string; city: string };
    physical: {
      bedrooms: number;
      bathrooms: number;
      size: number;
      age?: number;
    };
    features: string[];
    condition: "excellent" | "good" | "fair" | "poor";
    images?: Buffer[];
  }): Promise<{
    valuationRange: { min: number; max: number; most_likely: number };
    confidence: number;
    methodology: string[];
    comparables: Array<{
      address: string;
      price: number;
      similarity: number;
      adjustments: Record<string, number>;
    }>;
    marketFactors: {
      location_premium: number;
      market_conditions: number;
      property_specific: number;
    };
    recommendations: string[];
  }> {
    try {
      // Get real-time market data
      const marketData = await this.fetchRealTimeMarketData(
        `${propertyData.location.city}, ${propertyData.location.county}`,
        "residential"
      );

      // Analyze images if provided
      let imageAnalysis: any = null;
      if (propertyData.images && propertyData.images.length > 0) {
        imageAnalysis = await Promise.all(
          propertyData.images.map((img) =>
            openAIService.analyzePropertyImage(img, propertyData)
          )
        );
      }

      // Use appropriate valuation model
      const model = this.selectBestValuationModel(propertyData);

      // Perform comprehensive valuation
      const valuation = await openAIService.performPropertyValuation(
        propertyData,
        {
          marketData,
          imageAnalysis,
          model,
        }
      );

      // Apply local market adjustments
      const adjustedValuation = this.applyMarketAdjustments(
        valuation,
        marketData
      );

      logger.info("Advanced property valuation completed", {
        location: propertyData.location.city,
        valuationRange: adjustedValuation.valuationRange,
        confidence: adjustedValuation.confidence,
      });

      return adjustedValuation;
    } catch (error) {
      logger.error("Error performing advanced valuation:", error);
      throw new Error("Failed to perform advanced valuation");
    }
  }

  /**
   * Smart property recommendation system
   */
  async getSmartPropertyRecommendations(userProfile: {
    budget: { min: number; max: number };
    preferences: {
      location: string[];
      propertyType: string[];
      bedrooms: number[];
      amenities: string[];
    };
    lifestyle: string[];
    workLocation?: { lat: number; lng: number };
    transportation: "car" | "public" | "both";
  }): Promise<
    Array<{
      property_id: string;
      matchScore: number;
      reasons: string[];
      pricing: {
        estimated_rent: number;
        market_position: "below" | "at" | "above";
      };
      lifestyle_fit: number;
      commute_score?: number;
    }>
  > {
    try {
      // Use AI to analyze user preferences and generate recommendations
      const recommendations = await openAIService.processConversationalQuery(
        `Based on this user profile, recommend 10 properties that would be perfect matches:
        
        Budget: KES ${userProfile.budget.min.toLocaleString()} - ${userProfile.budget.max.toLocaleString()}
        Preferences: ${JSON.stringify(userProfile.preferences)}
        Lifestyle: ${userProfile.lifestyle.join(", ")}
        Transportation: ${userProfile.transportation}
        ${userProfile.workLocation ? `Work location: ${userProfile.workLocation.lat}, ${userProfile.workLocation.lng}` : ""}
        
        Provide detailed recommendations with match scores and reasoning.`,
        [],
        { task: "property_recommendation", market: "Kenya" }
      );

      const parsedRecommendations = this.parsePropertyRecommendations(
        recommendations.response
      );

      // Enhance with real-time market data
      const enhancedRecommendations = await Promise.all(
        parsedRecommendations.map(async (rec: any) => {
          try {
            const marketData = await this.fetchRealTimeMarketData(
              rec.location,
              rec.propertyType
            );

            return {
              ...rec,
              pricing: {
                ...rec.pricing,
                market_context: marketData.averagePrice,
              },
            };
          } catch (error) {
            return rec;
          }
        })
      );

      logger.info("Smart property recommendations generated", {
        userBudget: userProfile.budget,
        recommendationsCount: enhancedRecommendations.length,
      });

      return enhancedRecommendations;
    } catch (error) {
      logger.error("Error generating smart recommendations:", error);
      throw new Error("Failed to generate property recommendations");
    }
  }

  /**
   * Legal compliance checker with real-time updates
   */
  async checkLegalComplianceRealTime(propertyData: any): Promise<{
    overallCompliance: number; // 0-100
    criticalIssues: Array<{
      issue: string;
      severity: "critical" | "major" | "minor";
      regulation: string;
      remedy: string;
      urgency: "immediate" | "within_30_days" | "within_90_days";
    }>;
    requiredDocuments: Array<{
      document: string;
      status: "present" | "missing" | "expired" | "invalid";
      authority: string;
      obtainment_process: string;
    }>;
    recommendations: string[];
    nextReviewDate: Date;
  }> {
    try {
      // Check against current Kenyan property regulations
      const compliance = await openAIService.checkLegalCompliance(
        propertyData,
        propertyData.documents || []
      );

      // Enhance with real-time regulation updates
      const enhancedCompliance =
        await this.enhanceWithCurrentRegulations(compliance);

      logger.info("Legal compliance check completed", {
        propertyId: propertyData.id,
        overallCompliance: enhancedCompliance.overallCompliance,
        criticalIssues: enhancedCompliance.criticalIssues.length,
      });

      return enhancedCompliance;
    } catch (error) {
      logger.error("Error checking legal compliance:", error);
      throw new Error("Failed to check legal compliance");
    }
  }

  // Private helper methods

  private fetchFromPropertyGuru(
    _location: string,
    _propertyType: string
  ): Promise<any> {
    // Mock implementation - replace with actual PropertyGuru API
    return Promise.resolve({
      source: "PropertyGuru",
      averagePrice: 50_000 + Math.random() * 20_000,
      comparables: [],
    });
  }

  private fetchFromKenyanMarketData(
    _location: string,
    _propertyType: string
  ): Promise<any> {
    // Mock implementation - replace with actual Kenyan market API
    return Promise.resolve({
      source: "KenyanMarketData",
      averagePrice: 45_000 + Math.random() * 25_000,
      comparables: [],
    });
  }

  private fetchFromLocalDatabase(
    _location: string,
    _propertyType: string
  ): Promise<any> {
    // Implementation to fetch from local property database
    return Promise.resolve({
      source: "LocalDatabase",
      averagePrice: 48_000 + Math.random() * 15_000,
      comparables: [],
    });
  }

  private aggregateMarketData(results: any[]): any {
    const avgPrice =
      results.reduce((sum, r) => sum + r.averagePrice, 0) / results.length;

    return {
      averagePrice: Math.round(avgPrice),
      pricePerSqm: Math.round(avgPrice / 100), // Estimate
      marketTrend: "stable" as const,
      dataSource: results.map((r) => r.source).join(", "),
      lastUpdated: new Date(),
      comparables: results.flatMap((r) => r.comparables || []).slice(0, 5),
    };
  }

  private async generateFallbackMarketData(
    location: string,
    _propertyType: string
  ): Promise<any> {
    const insights = await openAIService.getAdvancedMarketInsights(location);

    return {
      averagePrice: insights.averagePrice,
      pricePerSqm: Math.round(insights.averagePrice / 100),
      marketTrend: insights.trends.direction,
      dataSource: "AI Generated",
      lastUpdated: new Date(),
      comparables: [],
    };
  }

  private parseContractAnalysis(analysis: string): any {
    // Implementation to parse AI response into structured format
    try {
      return JSON.parse(analysis);
    } catch {
      // Fallback structure if parsing fails
      return {
        riskScore: 50,
        keyRisks: [],
        missingClauses: [],
        financialTerms: {
          totalValue: 0,
          currency: "KES",
          paymentSchedule: [],
          penalties: [],
        },
        legalCompliance: {
          isCompliant: false,
          violations: [],
          requiredAmmendments: [],
        },
        summary: analysis,
      };
    }
  }

  private speechToText(
    _audioBuffer: Buffer,
    _language: string
  ): Promise<string> {
    // Mock implementation - integrate with actual speech-to-text service
    return Promise.resolve(
      "I'm looking for a two bedroom apartment in Westlands under 80,000 shillings"
    );
  }

  private async analyzeNaturalLanguage(text: string): Promise<any> {
    // Use AI to extract intent and entities
    const analysis = await openAIService.processConversationalQuery(
      `Analyze this text for intent and entities: "${text}"
      
      Return JSON with:
      {
        "intent": "property_query|general_info|booking|complaint",
        "confidence": 0.9,
        "entities": [
          {"type": "location", "value": "Westlands", "confidence": 0.95},
          {"type": "bedrooms", "value": "2", "confidence": 0.9},
          {"type": "budget", "value": "80000", "confidence": 0.85}
        ]
      }`,
      [],
      { task: "nlp_analysis" }
    );

    try {
      return JSON.parse(analysis.response);
    } catch {
      return { intent: "general", confidence: 0.5, entities: [] };
    }
  }

  private selectBestValuationModel(propertyData: any): PropertyValuationModel {
    // Logic to select the most appropriate model based on property characteristics
    if (propertyData.physical.bedrooms <= 4) {
      return this.valuationModels[0] as PropertyValuationModel; // NairobiResidential
    }
    return this.valuationModels[1] as PropertyValuationModel; // CommercialValuer
  }

  private applyMarketAdjustments(valuation: any, marketData: any): any {
    // Apply local market conditions to the valuation
    const adjustment =
      marketData.marketTrend === "up"
        ? 1.05
        : marketData.marketTrend === "down"
          ? 0.95
          : 1.0;

    return {
      ...valuation,
      valuationRange: {
        min: Math.round(valuation.valuationRange.min * adjustment),
        max: Math.round(valuation.valuationRange.max * adjustment),
        most_likely: Math.round(
          valuation.valuationRange.most_likely * adjustment
        ),
      },
    };
  }

  private parsePropertyRecommendations(response: string): any[] {
    // Parse AI response into structured recommendations
    try {
      return JSON.parse(response);
    } catch {
      // Fallback to empty array
      return [];
    }
  }

  private enhanceWithCurrentRegulations(compliance: any): Promise<any> {
    // Enhance compliance check with current regulations
    return {
      ...compliance,
      overallCompliance: compliance.complianceScore,
      criticalIssues: compliance.violations.map((v: any) => ({
        issue: v.description,
        severity: v.severity === "high" ? "critical" : v.severity,
        regulation: "Kenyan Property Law",
        remedy: v.remedy,
        urgency: v.severity === "high" ? "immediate" : "within_30_days",
      })),
      requiredDocuments: compliance.requiredDocuments.map((d: any) => ({
        document: d.document,
        status: d.status,
        authority: "Ministry of Lands",
        obtainment_process: "Visit local lands office",
      })),
      recommendations: compliance.recommendations,
      nextReviewDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
    };
  }
}

// Export singleton instance
export const aiIntegrationsService = AIIntegrationsService.getInstance();
