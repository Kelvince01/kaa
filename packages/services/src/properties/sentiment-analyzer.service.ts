/**
 * Sentiment Analyzer Service
 *
 * Provides multiple sentiment analysis strategies:
 * 1. Rule-based (fast, no external dependencies)
 * 2. Keyword-based with Swahili support
 * 3. AI-powered (OpenAI/LangChain integration)
 * 4. Hybrid approach
 */

import { KENYA_REVIEW_CONSTANTS, ReviewSentiment } from "@kaa/models/types";

// ==================== TYPES ====================

export type SentimentResult = {
  sentiment: ReviewSentiment;
  score: number; // -1 to 1
  confidence: number; // 0 to 1
  method: "rule-based" | "keyword" | "ai" | "hybrid";
};

// ==================== KEYWORD DICTIONARIES ====================

const POSITIVE_KEYWORDS_EN = [
  "excellent",
  "great",
  "amazing",
  "wonderful",
  "fantastic",
  "perfect",
  "love",
  "loved",
  "best",
  "awesome",
  "beautiful",
  "clean",
  "safe",
  "comfortable",
  "spacious",
  "modern",
  "convenient",
  "friendly",
  "helpful",
  "professional",
  "recommend",
  "highly",
  "impressed",
  "satisfied",
  "happy",
  "pleased",
  "good",
  "nice",
  "well-maintained",
];

const NEGATIVE_KEYWORDS_EN = [
  "terrible",
  "awful",
  "horrible",
  "worst",
  "bad",
  "poor",
  "dirty",
  "unsafe",
  "dangerous",
  "broken",
  "damaged",
  "old",
  "outdated",
  "rude",
  "unprofessional",
  "disappointing",
  "disappointed",
  "waste",
  "avoid",
  "never",
  "not recommend",
  "scam",
  "fraud",
  "fake",
  "noisy",
  "loud",
  "smelly",
  "cramped",
  "small",
  "overpriced",
];

const POSITIVE_KEYWORDS_SW = [
  "bora",
  "nzuri",
  "safi",
  "salama",
  "vizuri",
  "poa",
  "faida",
  "kubwa",
  "ya kisasa",
  "rahisi",
  "furaha",
  "pendeza",
  "kamili",
];

const NEGATIVE_KEYWORDS_SW = [
  "mbaya",
  "chafu",
  "hatari",
  "vibaya",
  "duni",
  "ghali",
  "ndogo",
  "ya zamani",
  "ngumu",
  "huzuni",
  "hasira",
];

const INTENSIFIERS = [
  "very",
  "extremely",
  "really",
  "so",
  "too",
  "quite",
  "sana",
];
const NEGATIONS = ["not", "no", "never", "neither", "nor", "si", "hapana"];

// ==================== SENTIMENT ANALYZER CLASS ====================

export class SentimentAnalyzer {
  /**
   * Analyze sentiment using rule-based approach (fast)
   */
  analyzeRuleBased(_text: string, rating: number): SentimentResult {
    // Simple rule-based on rating
    let sentiment: ReviewSentiment;
    let score: number;

    if (rating >= 4) {
      sentiment = ReviewSentiment.POSITIVE;
      score = 0.5 + (rating - 4) * 0.5; // 0.5 to 1.0
    } else if (rating <= 2) {
      sentiment = ReviewSentiment.NEGATIVE;
      score = -1 + (rating - 1) * 0.5; // -1.0 to -0.5
    } else {
      sentiment = ReviewSentiment.NEUTRAL;
      score = (rating - 3) * 0.5; // -0.5 to 0.5
    }

    return {
      sentiment,
      score,
      confidence: 0.7,
      method: "rule-based",
    };
  }

  /**
   * Analyze sentiment using keyword matching (supports English and Swahili)
   */
  analyzeKeywordBased(
    text: string,
    language: "en" | "sw" = "en"
  ): SentimentResult {
    const lowerText = text.toLowerCase();
    // biome-ignore lint/performance/useTopLevelRegex: ignore
    const words = lowerText.split(/\s+/);

    // Detect language if not specified
    const isSwahili = language === "sw" || this.detectSwahili(text);

    const positiveKeywords = isSwahili
      ? [...POSITIVE_KEYWORDS_EN, ...POSITIVE_KEYWORDS_SW]
      : POSITIVE_KEYWORDS_EN;

    const negativeKeywords = isSwahili
      ? [...NEGATIVE_KEYWORDS_EN, ...NEGATIVE_KEYWORDS_SW]
      : NEGATIVE_KEYWORDS_EN;

    let positiveScore = 0;
    let negativeScore = 0;
    let intensifierMultiplier = 1;
    let negationActive = false;

    for (const word of words) {
      // Check for intensifiers
      if (INTENSIFIERS.includes(word)) {
        intensifierMultiplier = 1.5;
        continue;
      }

      // Check for negations
      if (NEGATIONS.includes(word)) {
        negationActive = true;
        continue;
      }

      // Check for positive keywords
      if (positiveKeywords.some((kw) => word?.includes(kw))) {
        if (negationActive) {
          negativeScore += 1 * intensifierMultiplier;
        } else {
          positiveScore += 1 * intensifierMultiplier;
        }
      }

      // Check for negative keywords
      if (negativeKeywords.some((kw) => word.includes(kw))) {
        if (negationActive) {
          positiveScore += 1 * intensifierMultiplier;
        } else {
          negativeScore += 1 * intensifierMultiplier;
        }
      }

      // Reset modifiers after processing word
      intensifierMultiplier = 1;
      negationActive = false;
    }

    // Calculate sentiment
    const totalScore = positiveScore + negativeScore;
    const score =
      totalScore > 0 ? (positiveScore - negativeScore) / totalScore : 0;

    let sentiment: ReviewSentiment;
    if (score > 0.2) {
      sentiment = ReviewSentiment.POSITIVE;
    } else if (score < -0.2) {
      sentiment = ReviewSentiment.NEGATIVE;
    } else if (
      Math.abs(score) < 0.1 &&
      positiveScore > 0 &&
      negativeScore > 0
    ) {
      sentiment = ReviewSentiment.MIXED;
    } else {
      sentiment = ReviewSentiment.NEUTRAL;
    }

    // Calculate confidence based on keyword count
    const keywordCount = positiveScore + negativeScore;
    const confidence = Math.min(0.5 + keywordCount * 0.1, 0.95);

    return {
      sentiment,
      score,
      confidence,
      method: "keyword",
    };
  }

  /**
   * Analyze sentiment using AI (OpenAI)
   * Provides the most accurate sentiment analysis with nuanced understanding
   */
  async analyzeAIPowered(
    text: string,
    language: "en" | "sw" = "en"
  ): Promise<SentimentResult> {
    try {
      // Dynamic import to avoid circular dependencies
      const OpenAI = (await import("openai")).default;
      const config = await import("@kaa/config/api");

      // Check if OpenAI is configured
      const apiKey = config.default.openai?.apiKey;
      if (!apiKey || apiKey === "sk-your-openai-api-key-here") {
        console.warn(
          "OpenAI not configured, falling back to keyword-based analysis"
        );
        return this.analyzeKeywordBased(text, language);
      }

      const client = new OpenAI({
        apiKey,
        timeout: 15_000, // 15 seconds
        maxRetries: 2,
      });

      const languageName = language === "sw" ? "Swahili" : "English";

      const systemPrompt = `You are an expert sentiment analyzer specializing in property reviews. 
Analyze reviews in both English and Swahili, understanding cultural context and nuances.
Always respond with valid JSON only, no additional text.`;

      const userPrompt = `Analyze the sentiment of this ${languageName} property review:

"${text}"

Respond with ONLY this JSON format:
{
  "sentiment": "positive" | "negative" | "neutral" | "mixed",
  "score": -1.0 to 1.0,
  "confidence": 0.0 to 1.0
}

Guidelines:
- positive: Overall favorable (score: 0.2 to 1.0)
- negative: Overall unfavorable (score: -1.0 to -0.2)
- neutral: Balanced/no strong opinion (score: -0.2 to 0.2)
- mixed: Both positive and negative aspects
- Consider context, sarcasm, cultural nuances
${language === "sw" ? "- Understand Swahili expressions and idioms" : ""}`;

      const completion = await client.chat.completions.create({
        model: "gpt-4o-mini", // Fast and cost-effective
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        max_tokens: 150,
        temperature: 0.3, // Lower for consistency
        response_format: { type: "json_object" }, // Ensure JSON response
      });

      const responseText = completion.choices[0]?.message?.content || "{}";
      const analysis = JSON.parse(responseText);

      // Validate the response
      if (
        !analysis.sentiment ||
        typeof analysis.score !== "number" ||
        typeof analysis.confidence !== "number"
      ) {
        throw new Error("Invalid AI response format");
      }

      // Ensure values are within bounds
      const score = Math.max(-1, Math.min(1, analysis.score));
      const confidence = Math.max(0, Math.min(1, analysis.confidence));

      return {
        sentiment: analysis.sentiment as ReviewSentiment,
        score,
        confidence,
        method: "ai",
      };
    } catch (error) {
      console.error(
        "AI sentiment analysis failed, falling back to keyword-based:",
        error
      );

      // Fallback to keyword-based analysis
      const fallbackResult = this.analyzeKeywordBased(text, language);
      return {
        ...fallbackResult,
        confidence: fallbackResult.confidence * 0.8, // Reduce confidence since we fell back
      };
    }
  }

  /**
   * Hybrid approach: Combines multiple methods for best accuracy
   */
  async analyzeHybrid(
    text: string,
    rating: number,
    language: "en" | "sw" = "en"
  ): Promise<SentimentResult> {
    // Get results from multiple methods
    const ruleResult = this.analyzeRuleBased(text, rating);
    const keywordResult = await this.analyzeKeywordBased(text, language);

    // Weight the results (rule-based: 30%, keyword: 70%)
    const combinedScore = ruleResult.score * 0.3 + keywordResult.score * 0.7;
    const combinedConfidence =
      ruleResult.confidence * 0.3 + keywordResult.confidence * 0.7;

    // Determine final sentiment
    let sentiment: ReviewSentiment;
    if (combinedScore > 0.2) {
      sentiment = ReviewSentiment.POSITIVE;
    } else if (combinedScore < -0.2) {
      sentiment = ReviewSentiment.NEGATIVE;
    } else if (
      keywordResult.sentiment === ReviewSentiment.MIXED ||
      Math.abs(ruleResult.score - keywordResult.score) > 0.5
    ) {
      sentiment = ReviewSentiment.MIXED;
    } else {
      sentiment = ReviewSentiment.NEUTRAL;
    }

    return {
      sentiment,
      score: combinedScore,
      confidence: combinedConfidence,
      method: "hybrid",
    };
  }

  /**
   * Detect if text contains Swahili
   */
  private detectSwahili(text: string): boolean {
    const swahiliTerms = Object.values(KENYA_REVIEW_CONSTANTS.SWAHILI_TERMS);
    const lowerText = text.toLowerCase();
    return swahiliTerms.some((term) => lowerText.includes(term.toLowerCase()));
  }

  /**
   * Batch analyze multiple texts
   */
  async analyzeBatch(
    reviews: Array<{ text: string; rating: number; language?: "en" | "sw" }>,
    method: "rule-based" | "keyword" | "ai" | "hybrid" = "hybrid"
  ): Promise<SentimentResult[]> {
    const results: SentimentResult[] = [];

    for (const review of reviews) {
      let result: SentimentResult;

      switch (method) {
        case "rule-based":
          result = this.analyzeRuleBased(review.text, review.rating);
          break;
        case "keyword":
          result = this.analyzeKeywordBased(review.text, review.language);
          break;
        case "ai":
          result = await this.analyzeAIPowered(review.text, review.language);
          break;
        default: // case "hybrid":
          result = await this.analyzeHybrid(
            review.text,
            review.rating,
            review.language
          );
          break;
      }

      results.push(result);
    }

    return results;
  }

  /**
   * Get sentiment statistics for a collection of results
   */
  getStatistics(results: SentimentResult[]): {
    positive: number;
    negative: number;
    neutral: number;
    mixed: number;
    averageScore: number;
    averageConfidence: number;
  } {
    const stats = {
      positive: 0,
      negative: 0,
      neutral: 0,
      mixed: 0,
      averageScore: 0,
      averageConfidence: 0,
    };

    if (results.length === 0) return stats;

    let totalScore = 0;
    let totalConfidence = 0;

    for (const result of results) {
      stats[result.sentiment]++;
      totalScore += result.score;
      totalConfidence += result.confidence;
    }

    stats.averageScore = totalScore / results.length;
    stats.averageConfidence = totalConfidence / results.length;

    return stats;
  }
}

// Export singleton instance
export const sentimentAnalyzer = new SentimentAnalyzer();

// Export for testing
export {
  POSITIVE_KEYWORDS_EN,
  NEGATIVE_KEYWORDS_EN,
  POSITIVE_KEYWORDS_SW,
  NEGATIVE_KEYWORDS_SW,
};
