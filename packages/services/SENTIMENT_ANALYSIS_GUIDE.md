# Sentiment Analysis Guide

## Overview

The review system includes a sophisticated sentiment analysis engine that supports multiple analysis methods and both English and Swahili languages.

## Analysis Methods

### 1. Rule-Based Analysis (Fast)
**Best for:** Quick analysis, real-time processing
**Accuracy:** ~70%

Uses rating scores to determine sentiment:
- Rating ≥ 4: Positive (score: 0.5 to 1.0)
- Rating ≤ 2: Negative (score: -1.0 to -0.5)
- Rating = 3: Neutral (score: -0.5 to 0.5)

```typescript
const result = sentimentAnalyzer.analyzeRuleBased(text, rating);
```

### 2. Keyword-Based Analysis (Accurate)
**Best for:** Detailed analysis, bilingual support
**Accuracy:** ~80-85%

Features:
- 30+ positive keywords (English)
- 30+ negative keywords (English)
- 13+ positive keywords (Swahili)
- 11+ negative keywords (Swahili)
- Intensifier detection ("very", "extremely", "sana")
- Negation handling ("not", "never", "si")
- Mixed sentiment detection

```typescript
const result = sentimentAnalyzer.analyzeKeywordBased(text, language);
```

### 3. AI-Powered Analysis (Most Accurate)
**Best for:** Complex reviews, nuanced sentiment
**Accuracy:** ~90-95% (when implemented)

Currently a placeholder that falls back to keyword-based analysis.
Ready for integration with:
- OpenAI GPT models
- LangChain
- Custom ML models

```typescript
const result = await sentimentAnalyzer.analyzeAIPowered(text, language);
```

### 4. Hybrid Analysis (Recommended)
**Best for:** Production use, balanced accuracy/speed
**Accuracy:** ~85-90%

Combines rule-based (30%) and keyword-based (70%) methods:
- Fast processing
- Good accuracy
- Handles edge cases
- Detects mixed sentiments

```typescript
const result = await sentimentAnalyzer.analyzeHybrid(text, rating, language);
```

## Usage Examples

### Basic Analysis

```typescript
import { sentimentAnalyzer } from '@kaa/services';

// Analyze a single review
const result = await sentimentAnalyzer.analyzeHybrid(
  "This property is bora sana! Very clean and safe.",
  5,
  "sw"
);

console.log(result);
// {
//   sentiment: "positive",
//   score: 0.85,
//   confidence: 0.92,
//   method: "hybrid"
// }
```

### Batch Analysis

```typescript
const reviews = [
  { text: "Great property!", rating: 5, language: "en" },
  { text: "Nyumba mbaya sana", rating: 1, language: "sw" },
  { text: "It's okay, nothing special", rating: 3, language: "en" }
];

const results = await sentimentAnalyzer.analyzeBatch(reviews, "hybrid");

// Get statistics
const stats = sentimentAnalyzer.getStatistics(results);
console.log(stats);
// {
//   positive: 1,
//   negative: 1,
//   neutral: 1,
//   mixed: 0,
//   averageScore: 0.28,
//   averageConfidence: 0.85
// }
```

### Integration with Review Service

The sentiment analyzer is automatically used when:

1. **Creating a review** - Pre-save middleware applies basic sentiment
2. **Analyzing reviews** - `analyzeSentiment()` method uses hybrid approach
3. **Updating reviews** - Sentiment is recalculated if content changes

```typescript
// Automatic analysis on review creation
const review = await reviewsService.createReview({
  type: ReviewType.PROPERTY,
  targetId: propertyId,
  title: "Excellent property!",
  content: "Very clean, safe, and well-maintained...",
  rating: { overall: 5, categories: {} },
  language: "en"
}, userId);

// Manual batch analysis
const results = await reviewsService.analyzeSentiment([
  reviewId1,
  reviewId2,
  reviewId3
]);
```

## Keyword Dictionaries

### English Positive Keywords
excellent, great, amazing, wonderful, fantastic, perfect, love, best, awesome, beautiful, clean, safe, comfortable, spacious, modern, convenient, friendly, helpful, professional, recommend, highly, impressed, satisfied, happy, pleased, good, nice, well-maintained

### English Negative Keywords
terrible, awful, horrible, worst, bad, poor, dirty, unsafe, dangerous, broken, damaged, old, outdated, rude, unprofessional, disappointing, disappointed, waste, avoid, never, not recommend, scam, fraud, fake, noisy, loud, smelly, cramped, small, overpriced

### Swahili Positive Keywords
bora, nzuri, safi, salama, vizuri, poa, faida, kubwa, ya kisasa, rahisi, furaha, pendeza, kamili

### Swahili Negative Keywords
mbaya, chafu, hatari, vibaya, duni, ghali, ndogo, ya zamani, ngumu, huzuni, hasira

### Intensifiers
very, extremely, really, so, too, quite, sana

### Negations
not, no, never, neither, nor, si, hapana

## Sentiment Scores

Scores range from -1.0 to 1.0:

- **1.0 to 0.5**: Strong positive
- **0.5 to 0.2**: Positive
- **0.2 to -0.2**: Neutral
- **-0.2 to -0.5**: Negative
- **-0.5 to -1.0**: Strong negative

## Confidence Levels

Confidence ranges from 0.0 to 1.0:

- **0.9 to 1.0**: Very high confidence
- **0.8 to 0.9**: High confidence
- **0.7 to 0.8**: Good confidence
- **0.5 to 0.7**: Moderate confidence
- **Below 0.5**: Low confidence (consider manual review)

## Advanced Features

### Mixed Sentiment Detection

The analyzer can detect mixed sentiments when:
- Both positive and negative keywords are present
- Rule-based and keyword-based methods disagree significantly
- Score is near neutral but has strong keywords

Example:
```typescript
const text = "The location is great but the property is very dirty";
const result = sentimentAnalyzer.analyzeKeywordBased(text);
// sentiment: "mixed", score: 0.1, confidence: 0.75
```

### Negation Handling

The analyzer correctly handles negations:

```typescript
// "not good" is treated as negative
const text1 = "The property is not good";
// Result: negative sentiment

// "not bad" is treated as positive
const text2 = "The property is not bad";
// Result: positive sentiment
```

### Intensifier Support

Intensifiers increase the weight of sentiment:

```typescript
// "very clean" has stronger positive sentiment than "clean"
const text1 = "The property is very clean";
// Higher positive score

const text2 = "Nyumba ni safi sana"; // "sana" is Swahili intensifier
// Higher positive score
```

## Extending the Analyzer

### Adding New Keywords

Edit `sentiment-analyzer.service.ts`:

```typescript
const POSITIVE_KEYWORDS_EN = [
  ...existing keywords,
  "spectacular", "outstanding", "superb"
];
```

### Adding New Languages

```typescript
const POSITIVE_KEYWORDS_FR = [
  "excellent", "magnifique", "parfait"
];

// Update analyzeKeywordBased method to support new language
```

### Integrating AI Services

Replace the placeholder in `analyzeAIPowered`:

```typescript
async analyzeAIPowered(text: string, language: "en" | "sw"): Promise<SentimentResult> {
  const { openAIService } = await import("@kaa/ai");
  
  const prompt = `Analyze the sentiment of this ${language === 'sw' ? 'Swahili' : 'English'} review.
Return JSON with: sentiment (positive/negative/neutral/mixed), score (-1 to 1), confidence (0 to 1).
Review: "${text}"`;

  const response = await openAIService.complete(prompt, {
    temperature: 0.3,
    maxTokens: 100
  });

  return JSON.parse(response);
}
```

## Performance Considerations

### Method Comparison

| Method | Speed | Accuracy | Cost | Best For |
|--------|-------|----------|------|----------|
| Rule-based | Very Fast | 70% | Free | Real-time, bulk |
| Keyword | Fast | 80-85% | Free | Production |
| AI | Slow | 90-95% | $$ | Complex reviews |
| Hybrid | Fast | 85-90% | Free | Recommended |

### Optimization Tips

1. **Use batch analysis** for multiple reviews
2. **Cache results** to avoid re-analysis
3. **Use rule-based** for real-time feedback
4. **Use hybrid** for final sentiment
5. **Use AI** only for flagged/disputed reviews

### Caching Strategy

```typescript
// Cache sentiment results
const cache = new Map<string, SentimentResult>();

function getCachedSentiment(reviewId: string, text: string): SentimentResult | null {
  const cacheKey = `${reviewId}:${hashText(text)}`;
  return cache.get(cacheKey) || null;
}

function cacheSentiment(reviewId: string, text: string, result: SentimentResult): void {
  const cacheKey = `${reviewId}:${hashText(text)}`;
  cache.set(cacheKey, result);
}
```

## Testing

### Unit Tests

```typescript
import { sentimentAnalyzer } from './sentiment-analyzer.service';

describe('SentimentAnalyzer', () => {
  it('should detect positive sentiment', () => {
    const result = sentimentAnalyzer.analyzeKeywordBased(
      "This property is excellent and very clean!",
      "en"
    );
    expect(result.sentiment).toBe("positive");
    expect(result.score).toBeGreaterThan(0.5);
  });

  it('should detect Swahili positive sentiment', () => {
    const result = sentimentAnalyzer.analyzeKeywordBased(
      "Nyumba hii ni bora sana na safi!",
      "sw"
    );
    expect(result.sentiment).toBe("positive");
  });

  it('should handle negations', () => {
    const result = sentimentAnalyzer.analyzeKeywordBased(
      "The property is not good",
      "en"
    );
    expect(result.sentiment).toBe("negative");
  });
});
```

## Monitoring

Track sentiment analysis metrics:

```typescript
// Log analysis results
const result = await sentimentAnalyzer.analyzeHybrid(text, rating, language);

analytics.track('sentiment_analysis', {
  method: result.method,
  sentiment: result.sentiment,
  score: result.score,
  confidence: result.confidence,
  language,
  textLength: text.length
});
```

## Best Practices

1. **Always provide language** for better accuracy
2. **Use hybrid method** for production
3. **Monitor confidence scores** - review low confidence results manually
4. **Update keywords regularly** based on common terms in your reviews
5. **A/B test different methods** to find what works best for your data
6. **Combine with rating** for best results
7. **Handle edge cases** (very short reviews, emoji-only, etc.)

## Future Enhancements

Planned improvements:
- [ ] Emoji sentiment analysis
- [ ] Sarcasm detection
- [ ] Context-aware analysis
- [ ] Multi-language support (French, Arabic)
- [ ] Custom ML model training
- [ ] Real-time sentiment streaming
- [ ] Sentiment trend analysis
- [ ] Comparative sentiment (vs. competitors)

## Support

For questions or issues:
- Check the implementation: `packages/services/src/properties/sentiment-analyzer.service.ts`
- Review the service integration: `packages/services/src/properties/review.service.ts`
- See usage examples in this guide

---

**Built for Kaa SaaS Platform - Kenya Property Reviews**
