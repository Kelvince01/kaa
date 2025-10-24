import { createHash } from "node:crypto";
import config from "@kaa/config/api";
import type {
  AIAnalysis,
  AIGenerationOptions,
  DocumentAnalysis,
  LegalComplianceCheck,
  MarketInsight,
  PricingSuggestion,
  PropertyData,
  PropertyImageAnalysis,
  PropertyImageAnalysisResult,
  PropertyValuation,
  SEOOptimization,
} from "@kaa/models/types";
import { logger, processImage } from "@kaa/utils";
import OpenAI from "openai";

// Initialize OpenAI client with proper error handling
const initializeOpenAI = () => {
  const apiKey = config.openai.apiKey;

  if (!apiKey || apiKey === "sk-your-openai-api-key-here") {
    logger.warn(
      "OpenAI API key is not configured. AI features will be limited."
    );
    return null;
  }

  return new OpenAI({
    apiKey,
    timeout: 30_000, // 30 seconds
    maxRetries: 3,
  });
};

let openai: OpenAI | null = null;

// Lazy initialization of OpenAI client
const getOpenAI = () => {
  if (!openai) {
    openai = initializeOpenAI();
  }
  return openai;
};

// Check if OpenAI is available
const isOpenAIAvailable = () => getOpenAI() !== null;

/**
 * OpenAI service for property-specific AI operations
 */
export class OpenAIService {
  private static instance: OpenAIService;
  private readonly cache = new Map<string, { data: any; timestamp: number }>();
  private readonly CACHE_TTL = 30 * 60 * 1000; // 30 minutes

  private constructor() {}

  static getInstance(): OpenAIService {
    if (!OpenAIService.instance) {
      OpenAIService.instance = new OpenAIService();
    }
    return OpenAIService.instance;
  }

  /**
   * Generate property description using OpenAI
   */
  async generateDescription(
    propertyData: PropertyData,
    options: AIGenerationOptions = {}
  ): Promise<string> {
    const client = getOpenAI();
    if (!client) {
      throw new Error(
        "OpenAI service is not available. Please configure OPENAI_API_KEY."
      );
    }

    try {
      const {
        tone = "professional",
        length = "medium",
        targetAudience = "general",
        includeKeywords = [],
      } = options;

      /*const propertyData = {
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
      };*/

      const prompt = this.buildDescriptionPrompt(
        propertyData,
        tone,
        length,
        targetAudience,
        includeKeywords
      );

      const completion = await client.chat.completions.create({
        model: "gpt-4o-mini", // "gpt-5",
        messages: [
          {
            role: "system",
            content:
              "You are an expert real estate copywriter specializing in Kenyan property listings. Create compelling, accurate property descriptions that attract potential tenants.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        max_tokens: this.getMaxTokensForLength(length),
        temperature: 0.7,
      });

      const description = completion.choices[0]?.message?.content || "";

      logger.info("Property description generated successfully", {
        extra: {
          propertyType: propertyData.type,
          tone,
          length,
          descriptionLength: description.length,
        },
      });

      return description.trim();
    } catch (error) {
      logger.error("Error generating property description:", error);
      throw new Error("Failed to generate property description");
    }
  }

  /**
   * Analyze content quality and provide suggestions
   */
  async analyzeContent(content: string): Promise<AIAnalysis> {
    const client = getOpenAI();
    if (!client) {
      throw new Error(
        "OpenAI service is not available. Please configure OPENAI_API_KEY."
      );
    }

    try {
      const prompt = `
        Analyze the following property description and provide a detailed analysis:
        
        "${content}"
        
        Provide your analysis in the following JSON format:
        {
          "score": 0-100,
          "suggestions": ["suggestion1", "suggestion2"],
          "keywords": ["keyword1", "keyword2"],
          "sentiment": "positive|neutral|negative",
          "readabilityScore": 0-100,
          "seoScore": 0-100
        }
        
        Consider:
        - Overall quality and clarity
        - Use of descriptive language
        - Property-specific keywords
        - Appeal to target audience
        - SEO optimization potential
        - Readability and flow
      `;

      const completion = await client.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content:
              "You are an expert content analyst specializing in real estate copy. Provide detailed analysis in the exact JSON format requested.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        max_tokens: 1000,
        temperature: 0.3,
      });

      const analysisText = completion.choices[0]?.message?.content || "{}";
      const analysis = JSON.parse(analysisText);

      logger.info("Content analysis completed", {
        contentLength: content.length,
        score: analysis.score,
      });

      return analysis;
    } catch (error) {
      logger.error("Error analyzing content:", error);
      throw new Error("Failed to analyze content");
    }
  }

  /**
   * Suggest pricing based on property data and market analysis
   */
  async suggestPricing(propertyData: PropertyData): Promise<PricingSuggestion> {
    const client = getOpenAI();
    if (!client) {
      throw new Error(
        "OpenAI service is not available. Please configure OPENAI_API_KEY."
      );
    }

    try {
      const prompt = `
        As a real estate pricing expert in Kenya, analyze this property and suggest appropriate rental pricing:
        
        Property Details:
        - Bedrooms: ${propertyData.details?.bedrooms || "Not specified"}
        - Bathrooms: ${propertyData.details?.bathrooms || "Not specified"}
        - Size: ${propertyData.details?.size ? `${propertyData.details.size} sqm` : "Not specified"}
        - Location: ${propertyData.location?.county || ""} ${propertyData.location?.city || ""} ${propertyData.location?.neighborhood || ""}
        - Type: ${propertyData.type || "Not specified"}
        - Amenities: ${propertyData.amenities?.join(", ") || "None specified"}
        
        Provide pricing suggestion in the following JSON format:
        {
          "recommendedPrice": 50000,
          "range": { "min": 45000, "max": 55000 },
          "confidence": 0.85,
          "reasoning": ["reason1", "reason2", "reason3"],
          "marketComparisons": [
            {"address": "Similar property in area", "price": 48000, "similarity": 0.92},
            {"address": "Comparable unit nearby", "price": 52000, "similarity": 0.88},
            {"address": "Market reference point", "price": 49000, "similarity": 0.85}
          ]
        }
        
        Base your analysis on current Kenyan rental market conditions, location premiums, and property features.
      `;

      const completion = await client.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content:
              "You are an expert real estate pricing analyst with deep knowledge of the Kenyan rental market. Provide accurate pricing suggestions in the exact JSON format requested.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        max_tokens: 1500,
        temperature: 0.3,
      });

      const pricingText = completion.choices[0]?.message?.content || "{}";
      const pricingSuggestion = JSON.parse(pricingText);

      logger.info("Pricing suggestion generated", {
        location: propertyData.location?.county,
        recommendedPrice: pricingSuggestion.recommendedPrice,
        confidence: pricingSuggestion.confidence,
      });

      return pricingSuggestion;
    } catch (error) {
      logger.error("Error suggesting pricing:", error);
      throw new Error("Failed to suggest pricing");
    }
  }

  /**
   * Optimize content for SEO
   */
  async optimizeForSEO(
    content: string,
    propertyType: string
  ): Promise<SEOOptimization> {
    const client = getOpenAI();
    if (!client) {
      throw new Error(
        "OpenAI service is not available. Please configure OPENAI_API_KEY."
      );
    }

    try {
      const prompt = `
        Optimize the following ${propertyType} property description for SEO:
        
        "${content}"
        
        Provide your optimization in the following JSON format:
        {
          "optimizedContent": "The SEO-optimized version of the content",
          "improvements": ["improvement1", "improvement2"],
          "keywordDensity": {"keyword1": 2, "keyword2": 1}
        }
        
        Focus on:
        - Include relevant property and location keywords
        - Maintain natural readability
        - Optimize for local search terms
        - Include property type-specific keywords
        - Improve search engine visibility
      `;

      const completion = await client.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content:
              "You are an SEO expert specializing in real estate content optimization. Provide optimizations in the exact JSON format requested.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        max_tokens: 1500,
        temperature: 0.4,
      });

      const seoText = completion.choices[0]?.message?.content || "{}";
      const seoOptimization = JSON.parse(seoText);

      logger.info("SEO optimization completed", {
        propertyType,
        originalLength: content.length,
        optimizedLength: seoOptimization.optimizedContent?.length,
      });

      return seoOptimization;
    } catch (error) {
      logger.error("Error optimizing for SEO:", error);
      throw new Error("Failed to optimize for SEO");
    }
  }

  /**
   * Get market analysis for a location
   */
  async getMarketAnalysis(location: string): Promise<any> {
    const client = getOpenAI();
    if (!client) {
      throw new Error(
        "OpenAI service is not available. Please configure OPENAI_API_KEY."
      );
    }

    try {
      const prompt = `
        Provide a comprehensive rental market analysis for ${location} in Kenya.
        
        Include:
        1. Current average rental prices by property type
        2. Market trends and growth patterns
        3. Demand and supply factors
        4. Popular neighborhoods and their characteristics
        5. Future outlook and investment potential
        6. Key factors driving the market
        
        Format your response as a structured analysis suitable for real estate investors and property owners.
      `;

      const completion = await client.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content:
              "You are a real estate market analyst with expertise in the Kenyan property market. Provide comprehensive, accurate market analysis.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        max_tokens: 2000,
        temperature: 0.3,
      });

      const analysis = completion.choices[0]?.message?.content || "";

      logger.info("Market analysis generated", {
        location,
        analysisLength: analysis.length,
      });

      return { analysis };
    } catch (error) {
      logger.error("Error generating market analysis:", error);
      throw new Error("Failed to generate market analysis");
    }
  }

  /**
   * Get property recommendations based on preferences
   */
  async getPropertyRecommendations(preferences: {
    budget: number;
    location: string;
    bedrooms: number;
    amenities: string[];
  }): Promise<any> {
    const client = getOpenAI();
    if (!client) {
      throw new Error(
        "OpenAI service is not available. Please configure OPENAI_API_KEY."
      );
    }

    try {
      const prompt = `
        As a real estate expert in Kenya, provide property recommendations based on these preferences:
        
        - Budget: KES ${preferences.budget.toLocaleString()}
        - Preferred location: ${preferences.location}
        - Bedrooms: ${preferences.bedrooms}
        - Desired amenities: ${preferences.amenities.join(", ")}
        
        Provide 3-5 specific property recommendations with:
        - Property type and description
        - Estimated rental range
        - Location details and neighborhood benefits
        - Why it matches their preferences
        - Additional considerations
        
        Format as a helpful consultation response.
      `;

      const completion = await client.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content:
              "You are a knowledgeable real estate consultant specializing in the Kenyan rental market. Provide personalized, helpful recommendations.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        max_tokens: 2000,
        temperature: 0.6,
      });

      const recommendations = completion.choices[0]?.message?.content || "";

      logger.info("Property recommendations generated", {
        budget: preferences.budget,
        location: preferences.location,
        bedrooms: preferences.bedrooms,
      });

      return { recommendations };
    } catch (error) {
      logger.error("Error generating property recommendations:", error);
      throw new Error("Failed to generate property recommendations");
    }
  }

  /**
   * Process general AI query
   */
  async processQuery(
    query: string,
    domain = "property",
    threadId?: string
  ): Promise<{
    response: string;
    threadId: string;
  }> {
    const client = getOpenAI();
    if (!client) {
      throw new Error(
        "OpenAI service is not available. Please configure OPENAI_API_KEY."
      );
    }

    try {
      const systemPrompt = this.getSystemPromptForDomain(domain);

      const completion = await client.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: systemPrompt,
          },
          {
            role: "user",
            content: query,
          },
        ],
        max_tokens: 1500,
        temperature: 0.7,
      });

      const response = completion.choices[0]?.message?.content || "";
      const generatedThreadId =
        threadId ||
        `thread_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;

      logger.info("AI query processed", {
        domain,
        queryLength: query.length,
        responseLength: response.length,
        threadId: generatedThreadId,
      });

      return {
        response,
        threadId: generatedThreadId,
      };
    } catch (error) {
      logger.error("Error processing AI query:", error);
      throw new Error("Failed to process AI query");
    }
  }

  /**
   * Build description prompt based on property data and options
   */
  private buildDescriptionPrompt(
    propertyData: PropertyData,
    tone: string,
    length: string,
    targetAudience: string,
    keywords: string[]
  ): string {
    const toneInstructions = {
      professional:
        "Use professional, formal language suitable for business contexts",
      friendly: "Use warm, welcoming, and conversational language",
      luxury:
        "Use sophisticated, elegant language emphasizing premium features",
      casual: "Use relaxed, informal language that feels approachable",
    };

    const lengthInstructions = {
      short: "Keep it concise, 2-3 sentences maximum",
      medium: "Write a moderate length description, 4-6 sentences",
      long: "Create a detailed, comprehensive description with 8-10 sentences",
    };

    let prompt = `Write a ${tone} property description for a ${propertyData.type || "property"} listing.\n\n`;
    prompt += "Property details:\n";

    if (propertyData.basic?.title)
      prompt += `- Title: ${propertyData.basic.title}\n`;
    if (propertyData.details?.bedrooms)
      prompt += `- Bedrooms: ${propertyData.details.bedrooms}\n`;
    if (propertyData.details?.bathrooms)
      prompt += `- Bathrooms: ${propertyData.details.bathrooms}\n`;
    if (propertyData.details?.size)
      prompt += `- Size: ${propertyData.details.size} square meters\n`;
    if (propertyData.location?.county)
      prompt += `- Location: ${propertyData.location.county}`;
    if (propertyData.location?.city)
      prompt += `, ${propertyData.location.city}`;
    if (propertyData.location?.neighborhood)
      prompt += `, ${propertyData.location.neighborhood}`;
    prompt += "\n";

    if (propertyData.pricing?.rent)
      prompt += `- Rent: KES ${propertyData.pricing.rent.toLocaleString()}\n`;
    if (propertyData.amenities?.length)
      prompt += `- Amenities: ${propertyData.amenities.join(", ")}\n`;

    prompt += "\nInstructions:\n";
    prompt += `- ${toneInstructions[tone as keyof typeof toneInstructions]}\n`;
    prompt += `- ${lengthInstructions[length as keyof typeof lengthInstructions]}\n`;
    prompt += `- Target audience: ${targetAudience}\n`;

    if (keywords.length > 0) {
      prompt += `- Include these keywords naturally: ${keywords.join(", ")}\n`;
    }

    prompt += "- Focus on benefits and lifestyle appeal\n";
    prompt += "- Highlight unique selling points\n";

    return prompt;
  }

  /**
   * Get max tokens based on description length
   */
  private getMaxTokensForLength(length: string): number {
    switch (length) {
      case "short":
        return 150;
      case "long":
        return 600;
      default:
        return 350; // medium
    }
  }

  /**
   * Get system prompt for different domains
   */
  private getSystemPromptForDomain(domain: string): string {
    const prompts = {
      property:
        "You are an expert real estate consultant with deep knowledge of the Kenyan property market. Provide helpful, accurate information about properties, rentals, market trends, and real estate investment.",
      document:
        "You are a document analysis expert. Help users understand, analyze, and extract information from various documents.",
      maintenance:
        "You are a property maintenance specialist. Provide guidance on property upkeep, repairs, and maintenance best practices.",
      communication:
        "You are a communication specialist. Help with drafting professional messages, emails, and correspondence.",
      payment:
        "You are a financial consultant specializing in property transactions and payment processes.",
      tenant:
        "You are a tenant relations specialist. Help with tenant management, lease agreements, and rental processes.",
    };

    return prompts[domain as keyof typeof prompts] || prompts.property;
  }

  /**
   * Analyze property images using GPT-4 Vision
   */
  async analyzePropertyImage(
    imageBuffer: Buffer,
    propertyContext?: any
  ): Promise<PropertyImageAnalysis> {
    const client = getOpenAI();
    if (!client) {
      throw new Error(
        "OpenAI service is not available. Please configure OPENAI_API_KEY."
      );
    }

    try {
      // Process image for optimal analysis
      const processedImage = await processImage(imageBuffer);

      const base64Image = processedImage.toString("base64");

      const prompt = `
        Analyze this property image in detail. Consider:
        
        ${propertyContext ? `Property Context: ${JSON.stringify(propertyContext)}` : ""}
        
        Please analyze:
        1. Physical condition and maintenance state
        2. Architectural features and design elements  
        3. Potential issues or repairs needed
        4. Market appeal and value indicators
        5. Improvement recommendations
        
        Provide analysis in this JSON format:
        {
          "description": "Detailed description of what you see",
          "features": ["feature1", "feature2"],
          "condition": "excellent|good|fair|poor", 
          "estimatedValue": 50000,
          "recommendations": ["recommendation1", "recommendation2"],
          "detectedIssues": ["issue1", "issue2"],
          "aiConfidence": 0.85
        }
      `;

      const response = await client.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content:
              "You are an expert property appraiser and real estate analyst. Analyze images with precision and provide actionable insights.",
          },
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${base64Image}`,
                  detail: "high",
                },
              },
            ],
          },
        ],
        max_tokens: 1500,
        temperature: 0.3,
      });

      const analysisText = response.choices[0]?.message?.content || "{}";
      const analysis = JSON.parse(analysisText);

      logger.info("Property image analyzed successfully", {
        imageSize: imageBuffer.length,
        confidence: analysis.aiConfidence,
      });

      return analysis;
    } catch (error) {
      logger.error("Error analyzing property image:", error);
      throw new Error("Failed to analyze property image");
    }
  }

  /**
   * Analyze property images for quality and features
   */
  analyzePropertyImages = (
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
        aestheticScore:
          imageUrls.length >= 5 ? 8 : imageUrls.length >= 3 ? 6 : 4,
        technicalScore: 7,
      };
    } catch (error) {
      console.error("Error analyzing property images:", error);
      throw new Error("Failed to analyze property images");
    }
  };

  /**
   * Process and analyze documents (leases, contracts, etc.)
   */
  async processDocument(
    documentBuffer: Buffer,
    documentType?: string
  ): Promise<DocumentAnalysis> {
    const client = getOpenAI();
    if (!client) {
      throw new Error(
        "OpenAI service is not available. Please configure OPENAI_API_KEY."
      );
    }

    try {
      // For now, we'll handle text extraction (in production, use OCR for images/PDFs)
      const documentText = documentBuffer.toString("utf-8");

      const prompt = `
        Analyze this ${documentType || "property-related"} document and extract key information:
        
        Document Content:
        "${documentText.substring(0, 4000)}" // Truncate for token limits
        
        Please provide analysis in this JSON format:
        {
          "documentType": "lease|contract|title_deed|certificate|other",
          "extractedInfo": {
            "parties": ["party1", "party2"],
            "dates": {"start": "date", "end": "date"},
            "financial_terms": {"amount": 0, "currency": "KES"},
            "key_clauses": ["clause1", "clause2"]
          },
          "legalCompliance": {
            "isCompliant": true,
            "issues": ["issue1", "issue2"],
            "recommendations": ["rec1", "rec2"]
          },
          "keyTerms": ["term1", "term2"],
          "summary": "Brief summary of the document"
        }
      `;

      const response = await client.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content:
              "You are a legal expert specializing in Kenyan property law. Analyze documents for compliance and extract key information.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        max_tokens: 2000,
        temperature: 0.2,
      });

      const analysisText = response.choices[0]?.message?.content || "{}";
      const analysis = JSON.parse(analysisText);

      logger.info("Document processed successfully", {
        documentType: analysis.documentType,
        isCompliant: analysis.legalCompliance.isCompliant,
      });

      return analysis;
    } catch (error) {
      logger.error("Error processing document:", error);
      throw new Error("Failed to process document");
    }
  }

  /**
   * Get advanced market insights with real-time data simulation
   */
  async getAdvancedMarketInsights(location: string): Promise<MarketInsight> {
    const client = getOpenAI();
    if (!client) {
      throw new Error(
        "OpenAI service is not available. Please configure OPENAI_API_KEY."
      );
    }

    // Check cache first
    const cacheKey = `market_insights_${createHash("md5").update(location).digest("hex")}`;
    const cached = this.cache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data;
    }

    try {
      const prompt = `
        Provide comprehensive market insights for ${location} in Kenya. Include:
        
        1. Current average rental prices
        2. Market trends and growth patterns
        3. Demand-supply dynamics
        4. Investment attractiveness score (0-100)
        5. Most sought-after property features
        
        Format as JSON:
        {
          "location": "${location}",
          "averagePrice": 50000,
          "priceRange": {"min": 35000, "max": 80000},
          "trends": {
            "direction": "up|down|stable",
            "percentage": 12.5,
            "period": "last_6_months"
          },
          "demandSupplyRatio": 1.2,
          "investment_score": 75,
          "popularFeatures": ["parking", "security", "gym", "pool"]
        }
        
        Base your analysis on current Kenyan market conditions and economic factors.
      `;

      const response = await client.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content:
              "You are a senior real estate market analyst with deep expertise in Kenyan property markets. Provide accurate, data-driven insights.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        max_tokens: 1000,
        temperature: 0.3,
      });

      const insightText = response.choices[0]?.message?.content || "{}";
      const insight = JSON.parse(insightText);

      // Cache the result
      this.cache.set(cacheKey, { data: insight, timestamp: Date.now() });

      logger.info("Market insights generated", {
        location: insight.location,
        investmentScore: insight.investment_score,
      });

      return insight;
    } catch (error) {
      logger.error("Error generating market insights:", error);
      throw new Error("Failed to generate market insights");
    }
  }

  /**
   * AI-powered property valuation using comparable analysis
   */
  async performPropertyValuation(
    propertyData: any,
    marketData?: any
  ): Promise<PropertyValuation> {
    const client = getOpenAI();
    if (!client) {
      throw new Error(
        "OpenAI service is not available. Please configure OPENAI_API_KEY."
      );
    }

    try {
      const prompt = `
        Perform a comprehensive property valuation for:
        
        Property Details:
        ${JSON.stringify(propertyData, null, 2)}
        
        ${marketData ? `Market Context: ${JSON.stringify(marketData, null, 2)}` : ""}
        
        Use comparable analysis methodology and provide:
        
        {
          "estimatedValue": 2500000,
          "confidenceScore": 0.85,
          "valuationRange": {"min": 2200000, "max": 2800000},
          "methodology": "Comparative Market Analysis with adjustments",
          "comparables": [
            {
              "address": "Similar property nearby",
              "price": 2400000,
              "similarity": 0.9,
              "adjustments": {"size": 50000, "condition": -30000, "location": 20000}
            }
          ],
          "marketFactors": {
            "location_premium": 0.15,
            "property_condition": 0.1,
            "market_trend": 0.08,
            "amenities_factor": 0.12
          }
        }
        
        Consider Kenyan market conditions, location factors, and property characteristics.
      `;

      const response = await client.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content:
              "You are a certified property valuer with expertise in Kenyan real estate. Provide accurate valuations using standard methodologies.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        max_tokens: 2000,
        temperature: 0.2,
      });

      const valuationText = response.choices[0]?.message?.content || "{}";
      const valuation = JSON.parse(valuationText);

      logger.info("Property valuation completed", {
        estimatedValue: valuation.estimatedValue,
        confidenceScore: valuation.confidenceScore,
      });

      return valuation;
    } catch (error) {
      logger.error("Error performing property valuation:", error);
      throw new Error("Failed to perform property valuation");
    }
  }

  /**
   * Check legal compliance for property transactions
   */
  async checkLegalCompliance(
    propertyData: any,
    documents: string[] = []
  ): Promise<LegalComplianceCheck> {
    const client = getOpenAI();
    if (!client) {
      throw new Error(
        "OpenAI service is not available. Please configure OPENAI_API_KEY."
      );
    }

    try {
      const prompt = `
        Analyze legal compliance for this property transaction in Kenya:
        
        Property: ${JSON.stringify(propertyData, null, 2)}
        Available Documents: ${documents.join(", ") || "None provided"}
        
        Check against Kenyan property law requirements and provide:
        
        {
          "isCompliant": true,
          "complianceScore": 85,
          "requiredDocuments": [
            {
              "document": "Title Deed",
              "status": "present|missing|invalid",
              "importance": "critical|important|optional"
            },
            {
              "document": "Occupancy Certificate",
              "status": "missing",
              "importance": "critical"
            }
          ],
          "violations": [
            {
              "type": "Missing Documentation",
              "severity": "high|medium|low",
              "description": "Description of the issue",
              "remedy": "How to fix this issue"
            }
          ],
          "recommendations": [
            "Obtain missing title deed",
            "Verify property boundaries"
          ]
        }
        
        Consider current Kenyan property regulations and requirements.
      `;

      const response = await client.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content:
              "You are a Kenyan property law expert. Analyze transactions for legal compliance and identify potential issues.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        max_tokens: 2000,
        temperature: 0.1,
      });

      const complianceText = response.choices[0]?.message?.content || "{}";
      const compliance = JSON.parse(complianceText);

      logger.info("Legal compliance check completed", {
        isCompliant: compliance.isCompliant,
        complianceScore: compliance.complianceScore,
      });

      return compliance;
    } catch (error) {
      logger.error("Error checking legal compliance:", error);
      throw new Error("Failed to check legal compliance");
    }
  }

  /**
   * Generate contextual suggestions based on user activity
   */
  async getContextualSuggestions(context: {
    currentAction?: string;
    propertyData?: any;
    userHistory?: string[];
    preferences?: any;
  }): Promise<
    Array<{ suggestion: string; priority: number; category: string }>
  > {
    const client = getOpenAI();
    if (!client) {
      throw new Error(
        "OpenAI service is not available. Please configure OPENAI_API_KEY."
      );
    }

    try {
      const prompt = `
        Based on this context, suggest helpful next actions:
        
        Current Context: ${JSON.stringify(context, null, 2)}
        
        Provide 5-7 contextual suggestions as JSON array:
        [
          {
            "suggestion": "Analyze property market trends in this area",
            "priority": 8,
            "category": "market_analysis"
          },
          {
            "suggestion": "Get pricing recommendations for similar properties", 
            "priority": 9,
            "category": "pricing"
          }
        ]
        
        Categories: market_analysis, pricing, documentation, legal, maintenance, marketing
        Priority: 1-10 (10 being most relevant)
      `;

      const response = await client.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content:
              "You are an intelligent assistant that provides contextual suggestions for property management tasks.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        max_tokens: 1000,
        temperature: 0.5,
      });

      const suggestionsText = response.choices[0]?.message?.content || "[]";
      const suggestions = JSON.parse(suggestionsText);

      logger.info("Contextual suggestions generated", {
        count: suggestions.length,
        context: context.currentAction,
      });

      return suggestions.sort((a: any, b: any) => b.priority - a.priority);
    } catch (error) {
      logger.error("Error generating contextual suggestions:", error);
      throw new Error("Failed to generate contextual suggestions");
    }
  }

  /**
   * Conversation memory management for continuous context
   */
  async processConversationalQuery(
    query: string,
    conversationHistory: Array<{
      role: "user" | "assistant";
      content: string;
    }> = [],
    context?: any
  ): Promise<{ response: string; context: any; suggestedActions: string[] }> {
    const client = getOpenAI();
    if (!client) {
      throw new Error(
        "OpenAI service is not available. Please configure OPENAI_API_KEY."
      );
    }

    try {
      const messages = [
        {
          role: "system" as const,
          content: `You are Keja AI, a specialized property assistant for the Kenyan market. 
          
          Maintain conversation context and provide:
          1. Helpful, accurate responses
          2. Suggested follow-up actions
          3. Context updates for future queries
          
          Current Context: ${context ? JSON.stringify(context) : "None"}
          
          Always respond in JSON format:
          {
            "response": "Your helpful response here",
            "context": {"updated": "context", "info": "for next query"},
            "suggestedActions": ["action1", "action2"]
          }`,
        },
        ...conversationHistory.slice(-10), // Keep last 10 messages for context
        {
          role: "user" as const,
          content: query,
        },
      ];

      const response = await client.chat.completions.create({
        model: "gpt-4",
        messages,
        max_tokens: 1500,
        temperature: 0.7,
      });

      const responseText = response.choices[0]?.message?.content || "{}";
      const parsedResponse = JSON.parse(responseText);

      logger.info("Conversational query processed", {
        queryLength: query.length,
        responseLength: parsedResponse.response?.length || 0,
        hasContext: !!context,
      });

      return {
        response:
          parsedResponse.response ||
          "I'm here to help with your property needs!",
        context: { ...context, ...parsedResponse.context },
        suggestedActions: parsedResponse.suggestedActions || [],
      };
    } catch (error) {
      logger.error("Error processing conversational query:", error);
      throw new Error("Failed to process conversational query");
    }
  }

  /**
   * Clear cache (useful for testing or memory management)
   */
  clearCache(): void {
    this.cache.clear();
    logger.info("AI service cache cleared");
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}

// Export singleton instance
export const openAIService = OpenAIService.getInstance();
