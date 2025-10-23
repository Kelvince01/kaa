import { useMutation } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import type { PropertyFormData } from "../schema";

type AIGenerationOptions = {
  tone?: "professional" | "friendly" | "luxury" | "casual";
  length?: "short" | "medium" | "long";
  includeKeywords?: string[];
  targetAudience?: "families" | "professionals" | "students" | "general";
};

type AIAnalysis = {
  score: number;
  suggestions: string[];
  keywords: string[];
  sentiment: "positive" | "neutral" | "negative";
  readabilityScore: number;
  seoScore: number;
};

type PricingSuggestion = {
  recommendedPrice: number;
  range: { min: number; max: number };
  confidence: number;
  reasoning: string[];
  marketComparisons: Array<{
    address: string;
    price: number;
    similarity: number;
  }>;
};

// Mock AI service - replace with actual implementation
const mockAIService = {
  async generateDescription(
    propertyData: Partial<PropertyFormData>,
    options: AIGenerationOptions = {}
  ): Promise<string> {
    // Simulate AI processing delay
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const { basic, details, location, pricing } = propertyData;
    const {
      tone = "professional",
      length = "medium",
      targetAudience = "general",
    } = options;

    // Mock AI-generated descriptions based on input
    const descriptions = {
      professional: {
        short: `Elegant ${details?.bedrooms || 1}-bedroom property in ${location?.county || "prime location"}. Modern amenities and excellent connectivity. Perfect for ${targetAudience}.`,
        medium: `Discover this exceptional ${details?.bedrooms || 1}-bedroom property located in the sought-after ${location?.county || "area"}. Featuring ${details?.bathrooms || 1} bathroom${(details?.bathrooms || 1) > 1 ? "s" : ""} and thoughtfully designed living spaces. The property offers modern amenities, excellent transport links, and access to local facilities. Ideal for ${targetAudience} seeking quality accommodation.`,
        long: `Experience luxury living in this stunning ${details?.bedrooms || 1}-bedroom property situated in the prestigious ${location?.county || "neighborhood"}. This exceptional residence features ${details?.bathrooms || 1} well-appointed bathroom${(details?.bathrooms || 1) > 1 ? "s" : ""}, spacious living areas, and premium finishes throughout. The property boasts modern conveniences, excellent natural light, and easy access to shopping, dining, and transportation. With its prime location and superior amenities, this property represents an outstanding opportunity for ${targetAudience} who value quality and convenience.`,
      },
      friendly: {
        short: `Lovely ${details?.bedrooms || 1}-bed home in ${location?.county || "great area"}! Perfect for ${targetAudience} looking for comfort and convenience.`,
        medium: `Welcome to your new home! This charming ${details?.bedrooms || 1}-bedroom property in ${location?.county || "beautiful location"} has everything you need. With ${details?.bathrooms || 1} bathroom${(details?.bathrooms || 1) > 1 ? "s" : ""} and a warm, inviting atmosphere, it's perfect for ${targetAudience}. You'll love the convenient location and friendly neighborhood!`,
        long: `Get ready to fall in love with this amazing ${details?.bedrooms || 1}-bedroom home! Located in the wonderful ${location?.county || "community"}, this property offers the perfect blend of comfort and convenience. The ${details?.bathrooms || 1} bathroom${(details?.bathrooms || 1) > 1 ? "s" : ""} and thoughtfully designed spaces create a welcoming atmosphere that feels like home from day one. Whether you're commuting to work or exploring the local area, everything you need is right at your doorstep. This is more than just a place to live – it's your perfect sanctuary for ${targetAudience}!`,
      },
      luxury: {
        short: `Exquisite ${details?.bedrooms || 1}-bedroom residence in prestigious ${location?.county || "location"}. Uncompromising quality and sophistication.`,
        medium: `Indulge in sophisticated living with this magnificent ${details?.bedrooms || 1}-bedroom residence. Located in the exclusive ${location?.county || "district"}, this property exemplifies luxury with its ${details?.bathrooms || 1} opulent bathroom${(details?.bathrooms || 1) > 1 ? "s" : ""} and meticulously crafted interiors. Every detail has been carefully considered to provide an unparalleled living experience for the most discerning ${targetAudience}.`,
        long: `Step into a world of unparalleled luxury with this extraordinary ${details?.bedrooms || 1}-bedroom masterpiece. Nestled in the most coveted ${location?.county || "enclave"}, this exceptional residence redefines sophisticated living. The property features ${details?.bathrooms || 1} lavishly appointed bathroom${(details?.bathrooms || 1) > 1 ? "s" : ""}, premium finishes, and architectural excellence that speaks to the most refined tastes. From the moment you enter, you'll be captivated by the seamless integration of luxury and functionality. This is not merely a residence – it's a statement of distinction for ${targetAudience} who demand nothing but the finest.`,
      },
    };

    return descriptions[tone as keyof typeof descriptions][length];
  },

  async analyzeContent(content: string): Promise<AIAnalysis> {
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const wordCount = content.split(" ").length;
    const hasKeywords = [
      "bedroom",
      "bathroom",
      "modern",
      "location",
      "amenities",
    ].some((keyword) => content.toLowerCase().includes(keyword));

    // Mock analysis
    const score = Math.min(
      100,
      (wordCount >= 20 ? 30 : wordCount * 1.5) +
        (hasKeywords ? 40 : 0) +
        (content.length > 50 ? 30 : content.length * 0.6)
    );

    return {
      score,
      suggestions: [
        ...(wordCount < 20
          ? ["Add more details about the property features"]
          : []),
        ...(wordCount > 200
          ? ["Consider making the description more concise"]
          : []),
        ...(hasKeywords
          ? []
          : [
              "Include relevant keywords like 'modern', 'spacious', or 'convenient'",
            ]),
        ...(score < 70
          ? ["Highlight unique selling points of the property"]
          : []),
      ],
      keywords: [
        "modern",
        "spacious",
        "convenient",
        "accessible",
        "prime location",
      ],
      sentiment: score > 70 ? "positive" : score > 40 ? "neutral" : "negative",
      readabilityScore: Math.min(100, wordCount * 2),
      seoScore: hasKeywords ? 85 : 45,
    };
  },

  async suggestPricing(
    propertyData: Partial<PropertyFormData>
  ): Promise<PricingSuggestion> {
    await new Promise((resolve) => setTimeout(resolve, 2500));

    const { details, location } = propertyData;
    const bedrooms = details?.bedrooms || 1;
    const bathrooms = details?.bathrooms || 1;

    // Mock pricing algorithm based on location and property details
    const basePrice = location?.county === "Nairobi" ? 80_000 : 45_000;
    const bedroomMultiplier = bedrooms * 15_000;
    const bathroomMultiplier = bathrooms * 8000;

    const recommendedPrice = basePrice + bedroomMultiplier + bathroomMultiplier;
    const variance = recommendedPrice * 0.2;

    return {
      recommendedPrice,
      range: {
        min: recommendedPrice - variance,
        max: recommendedPrice + variance,
      },
      confidence: 0.85,
      reasoning: [
        `Base price for ${location?.county || "the area"}: KES ${basePrice.toLocaleString()}`,
        `${bedrooms} bedroom${bedrooms > 1 ? "s" : ""}: +KES ${bedroomMultiplier.toLocaleString()}`,
        `${bathrooms} bathroom${bathrooms > 1 ? "s" : ""}: +KES ${bathroomMultiplier.toLocaleString()}`,
        "Adjusted for current market conditions and demand",
      ],
      marketComparisons: [
        {
          address: `Similar property in ${location?.county || "area"}`,
          price: recommendedPrice - 5000,
          similarity: 0.92,
        },
        {
          address: "Comparable unit nearby",
          price: recommendedPrice + 8000,
          similarity: 0.88,
        },
        {
          address: "Market reference point",
          price: recommendedPrice - 2000,
          similarity: 0.85,
        },
      ],
    };
  },

  async optimizeForSEO(
    content: string,
    propertyType: string
  ): Promise<{
    optimizedContent: string;
    improvements: string[];
    keywordDensity: Record<string, number>;
  }> {
    await new Promise((resolve) => setTimeout(resolve, 1800));

    const keywords = {
      apartment: ["apartment", "flat", "unit", "rental"],
      house: ["house", "home", "residence", "property"],
      studio: ["studio", "compact", "efficient", "modern"],
    };

    const relevantKeywords =
      keywords[propertyType as keyof typeof keywords] || keywords.apartment;

    return {
      optimizedContent: `${content} This ${propertyType} offers excellent value and convenient location.`,
      improvements: [
        "Added location-specific keywords",
        "Improved search visibility",
        "Enhanced property type relevance",
      ],
      keywordDensity: relevantKeywords.reduce(
        (acc, keyword) => {
          acc[keyword] = (
            content.toLowerCase().match(new RegExp(keyword, "g")) || []
          ).length;
          return acc;
        },
        {} as Record<string, number>
      ),
    };
  },
};

export function useAIAssistant() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(null);

  const generateDescriptionMutation = useMutation({
    mutationFn: ({
      propertyData,
      options,
    }: {
      propertyData: Partial<PropertyFormData>;
      options?: AIGenerationOptions;
    }) => mockAIService.generateDescription(propertyData, options),
    onMutate: () => setIsGenerating(true),
    onSettled: () => setIsGenerating(false),
  });

  const analyzeContentMutation = useMutation({
    mutationFn: mockAIService.analyzeContent,
    onSuccess: setAnalysis,
  });

  const suggestPricingMutation = useMutation({
    mutationFn: mockAIService.suggestPricing,
  });

  const optimizeSEOMutation = useMutation({
    mutationFn: ({
      content,
      propertyType,
    }: {
      content: string;
      propertyType: string;
    }) => mockAIService.optimizeForSEO(content, propertyType),
  });

  const generateDescription = useCallback(
    (propertyData: Partial<PropertyFormData>, options?: AIGenerationOptions) =>
      generateDescriptionMutation.mutateAsync({ propertyData, options }),
    [generateDescriptionMutation]
  );

  const analyzeContent = useCallback(
    (content: string) => analyzeContentMutation.mutateAsync(content),
    [analyzeContentMutation]
  );

  const suggestPricing = useCallback(
    (propertyData: Partial<PropertyFormData>) =>
      suggestPricingMutation.mutateAsync(propertyData),
    [suggestPricingMutation]
  );

  const optimizeForSEO = useCallback(
    (content: string, propertyType: string) =>
      optimizeSEOMutation.mutateAsync({ content, propertyType }),
    [optimizeSEOMutation]
  );

  return {
    generateDescription,
    analyzeContent,
    suggestPricing,
    optimizeForSEO,
    analysis,
    isGenerating,
    isAnalyzing: analyzeContentMutation.isPending,
    isSuggestingPrice: suggestPricingMutation.isPending,
    isOptimizing: optimizeSEOMutation.isPending,
    generatedDescription: generateDescriptionMutation.data,
    pricingSuggestion: suggestPricingMutation.data,
    seoOptimization: optimizeSEOMutation.data,
  };
}
