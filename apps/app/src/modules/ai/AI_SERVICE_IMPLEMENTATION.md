# AI Service Implementation Guide

This document describes the implementation of real AI services for the property creation module, replacing the previous mock implementation.

## Overview

The AI service integration provides intelligent property management capabilities including:

- **Description Generation**: AI-powered property descriptions
- **Content Analysis**: Quality analysis and suggestions
- **Pricing Recommendations**: Market-based pricing suggestions
- **SEO Optimization**: Content optimization for search engines
- **Market Analysis**: Location-based market insights
- **Property Recommendations**: Personalized property suggestions
- **General AI Queries**: Conversational AI assistance

## Architecture

### Service Layer (`services/ai.service.ts`)

The `AIService` class provides a clean interface to interact with backend AI endpoints:

```typescript
// Singleton pattern ensures consistent instance
import * as aiService from "./ai.service.ts"

// Core functionalities
await aiService.generateDescription(propertyData, options);
await aiService.analyzeContent(content);
await aiService.suggestPricing(propertyData);
await aiService.optimizeForSEO(content, propertyType);
```

### Hook Layer (`use-ai-assistant.ts`)

The `useAIAssistant` hook provides React integration with:

- **Mutations**: Using React Query for state management
- **Loading States**: Real-time status tracking
- **Error Handling**: Comprehensive error management
- **Retry Logic**: Automatic retries for network failures
- **Caching**: Built-in response caching

## Features

### 1. Description Generation

Generate compelling property descriptions using AI:

```typescript
const { generateDescription, isGenerating, generatedDescription } = useAIAssistant();

const description = await generateDescription(propertyData, {
  tone: "professional", // "professional" | "friendly" | "luxury" | "casual"
  length: "medium",     // "short" | "medium" | "long"
  targetAudience: "families",
  includeKeywords: ["modern", "spacious"]
});
```

### 2. Content Analysis

Analyze content quality and get improvement suggestions:

```typescript
const { analyzeContent, isAnalyzing, analysis } = useAIAssistant();

const analysisResult = await analyzeContent(description);
// Returns: score, suggestions, keywords, sentiment, readabilityScore, seoScore
```

### 3. Pricing Suggestions

Get AI-powered pricing recommendations:

```typescript
const { suggestPricing, isSuggestingPrice, pricingSuggestion } = useAIAssistant();

const pricing = await suggestPricing(propertyData);
// Returns: recommendedPrice, range, confidence, reasoning, marketComparisons
```

### 4. SEO Optimization

Optimize content for search engines:

```typescript
const { optimizeForSEO, isOptimizing, seoOptimization } = useAIAssistant();

const seoResult = await optimizeForSEO(content, propertyType);
// Returns: optimizedContent, improvements, keywordDensity
```

### 5. Market Analysis

Get comprehensive market insights:

```typescript
const { getMarketAnalysis, isAnalyzingMarket, marketAnalysis } = useAIAssistant();

const analysis = await getMarketAnalysis("Nairobi");
```

### 6. Property Recommendations

Get personalized property recommendations:

```typescript
const { getPropertyRecommendations, isGettingRecommendations, propertyRecommendations } = useAIAssistant();

const recommendations = await getPropertyRecommendations({
  budget: 100000,
  location: "Nairobi",
  bedrooms: 3,
  amenities: ["parking", "gym", "pool"]
});
```

### 7. AI Query Processing

Process general AI queries:

```typescript
const { processAIQuery, isProcessingQuery, aiQueryResponse } = useAIAssistant();

const response = await processAIQuery(
  "What are the best property investment areas in Nairobi?",
  "property" // domain
);
```

## Error Handling

The implementation includes comprehensive error handling:

### Retry Logic

- Automatic retries for network failures
- Exponential backoff with configurable delays
- Maximum retry attempts: 2
- Maximum delay: 30 seconds

### Error States

Each operation provides error information:

```typescript
const {
  generationError,
  analysisError,
  pricingError,
  seoError,
  marketAnalysisError,
  recommendationsError,
  queryError
} = useAIAssistant();
```

### Reset Functions

Clear errors and reset states:

```typescript
const {
  resetGeneration,
  resetAnalysis,
  resetPricing,
  resetSEO,
  resetMarketAnalysis,
  resetRecommendations,
  resetQuery,
  clearAnalysis
} = useAIAssistant();
```

## Backend Integration

The service integrates with backend AI endpoints:

### Endpoints

- `POST /ai/property/generate-description`
- `POST /ai/property/analyze-content`  
- `POST /ai/property/suggest-pricing`
- `POST /ai/property/optimize-seo`
- `POST /ai/property/market-analysis`
- `POST /ai/property/recommendations`
- `POST /ai/query`

### Authentication

Automatic authentication via HTTP client interceptors using Bearer tokens.

### Request/Response Format

Standard API response format:

```json
{
  "status": "success",
  "data": { /* response data */ }
}
```

## Configuration

### Environment Variables

The AI service uses the existing HTTP client configuration. Ensure these are set:

```env
# API Configuration
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000
NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1

# HTTP Client Configuration
NEXT_PUBLIC_API_TIMEOUT=30000
NEXT_PUBLIC_RETRY_MAX_ATTEMPTS=3

# Security Configuration
NEXT_PUBLIC_REQUEST_SIGNING_KEY=your-signing-key
```

### Backend Requirements

Ensure the backend has:

1. OpenAI API integration configured
2. AI endpoints implemented
3. Proper authentication middleware
4. Rate limiting configured

## Usage Examples

### Basic Property Description Generation

```typescript
import { useAIAssistant } from "./hooks/use-ai-assistant";

function PropertyForm() {
  const { generateDescription, isGenerating } = useAIAssistant();
  
  const handleGenerateDescription = async () => {
    try {
      const description = await generateDescription(
        {
          basic: { title: "Modern Apartment" },
          details: { bedrooms: 2, bathrooms: 1 },
          location: { county: "Nairobi" }
        },
        { tone: "professional", length: "medium" }
      );
      
      // Use the generated description
      setFormDescription(description);
    } catch (error) {
      console.error("Failed to generate description:", error);
    }
  };

  return (
    <div>
      <button 
        onClick={handleGenerateDescription}
        disabled={isGenerating}
      >
        {isGenerating ? "Generating..." : "Generate Description"}
      </button>
    </div>
  );
}
```

### Advanced Usage with Analysis

```typescript
function AdvancedPropertyForm() {
  const {
    generateDescription,
    analyzeContent,
    suggestPricing,
    isGenerating,
    isAnalyzing,
    isSuggestingPrice,
    analysis,
    pricingSuggestion
  } = useAIAssistant();

  const handleCompleteAIAssistance = async () => {
    // 1. Generate description
    const description = await generateDescription(propertyData);
    
    // 2. Analyze the generated content
    await analyzeContent(description);
    
    // 3. Get pricing suggestions
    await suggestPricing(propertyData);
  };

  return (
    <div>
      <button onClick={handleCompleteAIAssistance}>
        Get Complete AI Assistance
      </button>
      
      {analysis && (
        <div>
          <h3>Content Analysis</h3>
          <p>Score: {analysis.score}/100</p>
          <p>Sentiment: {analysis.sentiment}</p>
          <ul>
            {analysis.suggestions.map((suggestion, index) => (
              <li key={index}>{suggestion}</li>
            ))}
          </ul>
        </div>
      )}
      
      {pricingSuggestion && (
        <div>
          <h3>Pricing Suggestion</h3>
          <p>Recommended: KES {pricingSuggestion.recommendedPrice.toLocaleString()}</p>
          <p>Range: KES {pricingSuggestion.range.min.toLocaleString()} - KES {pricingSuggestion.range.max.toLocaleString()}</p>
          <p>Confidence: {(pricingSuggestion.confidence * 100).toFixed(1)}%</p>
        </div>
      )}
    </div>
  );
}
```

## Performance Considerations

### Caching

- HTTP client automatically caches responses
- Analysis results are stored in component state
- Mutations are cached by React Query

### Rate Limiting

- Backend implements rate limiting
- Client respects rate limit responses
- Automatic retry with backoff

### Loading States

- Granular loading states for each operation
- Prevents multiple simultaneous requests
- User feedback during processing

## Security

### Data Validation

- Input sanitization at service layer
- Type-safe interfaces
- Error boundary protection

### API Security

- Bearer token authentication
- Request signing (configurable)
- CSRF protection
- Rate limiting

## Migration from Mock

The new implementation maintains the same interface as the mock service, ensuring compatibility with existing components. The only changes are:

1. **Real API calls** instead of mock delays
2. **Enhanced error handling** with retry logic
3. **Additional capabilities** like market analysis
4. **Proper loading states** for better UX

## Troubleshooting

### Common Issues

1. **Network Errors**: Check API_BASE_URL configuration
2. **Authentication Errors**: Verify token is valid
3. **Rate Limiting**: Implement proper retry logic
4. **Timeout Errors**: Increase API_TIMEOUT value

### Debug Mode

Enable debug logging:

```typescript
// Add to service calls for debugging
console.log("AI Service Request:", { propertyData, options });
```

## Future Enhancements

1. **Streaming Responses**: Real-time generation updates
2. **Offline Mode**: Cache responses for offline use  
3. **Batch Operations**: Process multiple properties
4. **Custom Models**: User-specific AI models
5. **A/B Testing**: Test different AI approaches
6. **Analytics**: Track AI service usage and effectiveness

## Support

For issues related to the AI service implementation:

1. Check backend AI service status
2. Verify environment configuration
3. Review network connectivity
4. Check authentication tokens
5. Monitor rate limiting

The AI service is now ready for production use with real OpenAI integration through the backend API.
