# AI Feature Enhancements Documentation

## Overview

This document describes the advanced enhancements implemented for the AI/ML feature, building upon the base TensorFlow.js integration.

## 1. Embedding Cache Service (`embedding-cache.service.ts`)

### Purpose

Avoid recomputing expensive text embeddings for frequently seen text values.

### Features

- **LRU Cache**: Configurable max size and TTL
- **Persistent Storage**: Save/load cache from disk
- **Cache Statistics**: Track hit rate, misses, evictions
- **Batch Operations**: Get/set multiple embeddings at once
- **Cache Warming**: Pre-populate cache with common texts

### Usage

```typescript
import { getEmbeddingCache } from './services/embedding-cache.service';

const cache = getEmbeddingCache();

// Check cache before generating embedding
let embedding = cache.get(text);
if (!embedding) {
  embedding = await tensorflowService.generateEmbeddingArray(text);
  cache.set(text, embedding);
}

// Get cache statistics
const stats = cache.getStats();
console.log(`Cache hit rate: ${stats.hitRate * 100}%`);
```

### Configuration

- `EMBEDDING_CACHE_SIZE`: Maximum number of embeddings (default: 10000)
- `EMBEDDING_CACHE_TTL`: Time to live in ms (default: 24 hours)
- `EMBEDDING_CACHE_PATH`: Persistent cache file path

## 2. Metrics Service (`metrics.service.ts`)

### Purpose

Compute real performance metrics from validation data instead of random values.

### Features

- **Classification Metrics**: Accuracy, precision, recall, F1 score, confusion matrix
- **Regression Metrics**: MSE, RMSE, MAE, R² score, MAPE
- **Per-Class Metrics**: Individual class performance for classification
- **Model Evaluation**: Direct model evaluation on test data

### Usage

```typescript
import { metricsService } from './services/metrics.service';

// During training
const metrics = await metricsService.evaluateModel(
  tfModel,
  xVal,
  yVal,
  'classification',
  ['Class A', 'Class B', 'Class C']
);

// Update model with real metrics
model.performance = {
  accuracy: metrics.accuracy,
  precision: metrics.precision,
  recall: metrics.recall,
  f1Score: metrics.f1Score
};
```

## 3. Incremental Learning Service (`incremental-learning.service.ts`)

### Purpose

Update models with new data without full retraining, enabling online learning.

### Features

- **Buffer Management**: Accumulate samples before updating
- **Automatic Updates**: Trigger updates based on buffer size
- **Mini-batch Training**: Efficient incremental updates
- **Update History**: Track all incremental updates
- **Validation Split**: Automatic train/validation splitting

### Usage

```typescript
import { incrementalLearningService } from './services/incremental-learning.service';

// Add new samples
await incrementalLearningService.addSamples(modelId, newSamples, {
  batchSize: 32,
  learningRate: 0.0001,
  epochs: 1,
  updateFrequency: 100,  // Update after 100 samples
  maxBufferSize: 1000
});

// Force update with current buffer
const update = await incrementalLearningService.forceUpdate(modelId);

// Get update history
const history = incrementalLearningService.getUpdateHistory(modelId);
```

## 4. Model Registry Service (`model-registry.service.ts`)

### Purpose

Comprehensive model lifecycle management with versioning, staging, and A/B testing.

### Features

- **Version Management**: Register and track model versions
- **Staging Pipeline**: development → staging → production → archived
- **Model Comparison**: Compare performance between versions
- **A/B Testing**: Built-in A/B testing framework
- **Best Version Selection**: Automatically find best performing version
- **Archival**: Automatic archival of old versions

### Usage

```typescript
import { modelRegistryService } from './services/model-registry.service';

// Register new version
await modelRegistryService.registerVersion(
  modelId,
  '2.0.0',
  performanceMetrics,
  { trainedBy: 'auto-retrain', dataSize: 10000 }
);

// Promote to production
await modelRegistryService.promoteModel(modelId, '2.0.0', 'production');

// Start A/B test
modelRegistryService.startABTest('test-001', {
  modelA: 'model1:1.0.0',
  modelB: 'model1:2.0.0',
  trafficSplit: 20,  // 20% to model B
  minSamples: 1000
});

// Route request based on A/B test
const model = modelRegistryService.routeABTest('test-001');  // Returns 'A' or 'B'

// Get A/B test results
const results = modelRegistryService.getABTestResults('test-001');
```

### Model Stages

1. **Development**: Initial training and testing
2. **Staging**: Pre-production validation
3. **Production**: Live serving
4. **Archived**: Retired versions

## 5. Feature Transformers Service (`feature-transformers.service.ts`)

### Purpose

Extensible plugin system for custom feature engineering and transformations.

### Built-in Transformers

#### Numeric Transformers

- `log`: Natural logarithm
- `sqrt`: Square root
- `square`: Square transformation
- `reciprocal`: 1/x transformation
- `minmax`: Min-max normalization
- `zscore`: Z-score normalization
- `polynomial`: Generate polynomial features
- `binning`: Discretize into bins

#### String Transformers

- `length`: String length
- `wordcount`: Word count
- `charcount`: Character type counts (letters, digits, spaces, special)
- `hash`: Hash to numeric value

#### Date Transformers

- `timestamp`: Convert to Unix timestamp
- `dayofweek`: Extract day of week (0-6)
- `dayofmonth`: Extract day (1-31)
- `month`: Extract month (0-11)
- `year`: Extract year
- `hourofday`: Extract hour (0-23)
- `cyclical_time`: Cyclical encoding (sin/cos)

#### Special Transformers

- `interaction`: Feature interaction (multiplication)
- `boolean`: Boolean to numeric

### Usage

```typescript
import { featureTransformersService } from './services/feature-transformers.service';

// Apply single transformer
const logValue = featureTransformersService.applyTransformer('log', 100);

// Create transformation pipeline
featureTransformersService.createPipeline(modelId, [
  { feature: 'price', transformers: ['log', 'zscore'] },
  { feature: 'date', transformers: ['cyclical_time'] },
  { feature: 'category', transformers: ['hash'] }
]);

// Apply pipeline to data
const transformed = featureTransformersService.applyPipeline(modelId, {
  price: 100,
  date: new Date(),
  category: 'electronics'
});

// Register custom transformer
featureTransformersService.registerTransformer({
  name: 'custom_scale',
  description: 'Custom scaling function',
  inputType: 'numeric',
  outputDimension: 1,
  transform: (value, params) => value * (params?.scale || 1)
});

// Calculate feature importance
const importance = await featureTransformersService.calculateFeatureImportance(
  modelId,
  async (features) => {
    // Evaluate model with features
    const pred = await predict(modelId, features);
    return pred.confidence;
  },
  testData,
  'higher'
);
```

## Integration Example

Here's how all the services work together:

```typescript
import { tensorflowService } from './services/tensorflow.service';
import { getEmbeddingCache } from './services/embedding-cache.service';
import { metricsService } from './services/metrics.service';
import { incrementalLearningService } from './services/incremental-learning.service';
import { modelRegistryService } from './services/model-registry.service';
import { featureTransformersService } from './services/feature-transformers.service';

// Training with enhancements
async function trainEnhancedModel(modelData: CreateAIModelData) {
  // 1. Apply feature transformers
  featureTransformersService.createPipeline(modelId, [
    { feature: 'revenue', transformers: ['log', 'zscore'] },
    { feature: 'date', transformers: ['cyclical_time'] }
  ]);

  // 2. Train model with real metrics
  const model = await aiService.createModel(modelData);
  
  // 3. Compute real metrics on validation set
  const metrics = await metricsService.evaluateModel(
    tfModel, xVal, yVal, modelData.type
  );
  
  // 4. Register in model registry
  await modelRegistryService.registerVersion(
    model._id,
    '1.0.0',
    metrics
  );

  // 5. Setup incremental learning
  // New data will automatically trigger updates
  
  return model;
}

// Prediction with caching
async function predictWithCache(modelId: string, input: any) {
  const cache = getEmbeddingCache();
  
  // Transform features
  const transformed = featureTransformersService.applyPipeline(modelId, input);
  
  // Check cache for text embeddings
  if (input.text) {
    let embedding = cache.get(input.text);
    if (!embedding) {
      embedding = await tensorflowService.generateEmbeddingArray(input.text);
      cache.set(input.text, embedding);
    }
    transformed.text_embedding = embedding;
  }
  
  // Route through A/B test if active
  const activeTest = modelRegistryService.getActiveTest(modelId);
  if (activeTest) {
    const route = modelRegistryService.routeABTest(activeTest.id);
    // Use appropriate model version based on route
  }
  
  return await tensorflowService.generateTensorFlowPrediction(model, transformed);
}

// Continuous learning
async function handleNewData(modelId: string, newData: any[]) {
  // Add to incremental learning buffer
  await incrementalLearningService.addSamples(modelId, newData, {
    updateFrequency: 100,
    learningRate: 0.0001
  });
  
  // Check if model performance degraded
  const currentMetrics = await evaluateCurrentModel(modelId);
  if (currentMetrics.accuracy < threshold) {
    // Trigger full retrain or rollback to previous version
    await modelRegistryService.promoteModel(modelId, previousVersion, 'production');
  }
}
```

## Testing

Run the integration tests to verify all enhancements:

```bash
bun test src/features/ai/ai-pipeline.test.ts
```

## Environment Variables

```bash
# Embedding Cache
EMBEDDING_CACHE_SIZE=10000
EMBEDDING_CACHE_TTL=86400000  # 24 hours
EMBEDDING_CACHE_PATH=.cache/embeddings.json

# Model Storage
MODEL_DIR=./models

# Training
AI_TRAIN_EPOCHS=10
AI_TRAIN_LIMIT=50000
AI_TRAIN_SEED=42

# TensorFlow Backend
USE_GPU=false
TF_BACKEND=cpu
```

## Performance Considerations

1. **Embedding Cache**: Significantly reduces computation for repeated text values
2. **Incremental Learning**: Allows model updates without full retraining
3. **Feature Transformers**: Pre-computed transformations can be cached
4. **Model Registry**: Enables quick rollback if new version underperforms
5. **A/B Testing**: Validate new models safely with partial traffic

## Security Notes

1. **Custom Transformers**: User-provided code should be sandboxed
2. **Model Versioning**: Keep audit trail of all model changes
3. **Cache Persistence**: Sensitive data in embeddings should be encrypted
4. **Incremental Learning**: Validate new data to prevent model poisoning

## Future Enhancements

1. **Distributed Training**: Support for multi-GPU/multi-node training
2. **AutoML**: Automatic hyperparameter tuning
3. **Model Explainability**: LIME/SHAP integration
4. **Drift Detection**: Monitor for data/concept drift
5. **Federated Learning**: Train on distributed data without centralizing
