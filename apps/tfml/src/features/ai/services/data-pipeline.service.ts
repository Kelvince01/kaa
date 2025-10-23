import * as tf from "@tensorflow/tfjs-node";
import { aiConfig } from "../ai.config";

export type ValidationResult = {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
};

export type ValidationError = {
  field: string;
  message: string;
  code: string;
};

export type ValidationWarning = {
  field: string;
  message: string;
  suggestion?: string;
};

export type TransformedData = {
  features: Record<string, any>;
  metadata: TransformationMetadata;
};

export type TransformationMetadata = {
  transformations: string[];
  originalShape: number[];
  transformedShape: number[];
  scalingParams?: Record<string, any>;
  encodingParams?: Record<string, any>;
};

export type ScaledData = {
  data: tf.Tensor;
  scalingParams: ScalingParams;
};

export type ScalingParams = {
  method: "standardization" | "minmax" | "robust" | "none";
  parameters: Record<string, any>;
};

export type EncodedData = {
  data: tf.Tensor;
  encodingParams: EncodingParams;
};

export type EncodingParams = {
  categoricalMappings: Record<string, Record<string, number>>;
  textEncodings: Record<string, any>;
  dateEncodings: Record<string, any>;
};

export type DataSchema = {
  features: FeatureSchema[];
  target?: TargetSchema;
  constraints?: DataConstraints;
};

export type FeatureSchema = {
  name: string;
  type:
    | "numeric"
    | "categorical"
    | "text"
    | "date"
    | "boolean"
    | "image"
    | "timeseries";
  required: boolean;
  constraints?: FeatureConstraints;
  preprocessing?: PreprocessingConfig;
};

export type TargetSchema = {
  name: string;
  type: "numeric" | "categorical" | "multilabel";
  classes?: string[];
};

export type FeatureConstraints = {
  min?: number;
  max?: number;
  allowedValues?: any[];
  pattern?: string;
  maxLength?: number;
  minLength?: number;
};

export type DataConstraints = {
  minSamples?: number;
  maxSamples?: number;
  requiredFeatures?: string[];
  forbiddenValues?: Record<string, any[]>;
};

export type PreprocessingConfig = {
  scaling?: "standardization" | "minmax" | "robust";
  encoding?: "onehot" | "label" | "target" | "embedding";
  imputation?: "mean" | "median" | "mode" | "zero" | "drop";
  outlierHandling?: "clip" | "remove" | "transform";
};

export class DataPipeline {
  private readonly schema: DataSchema;
  readonly scalingParams: Map<string, ScalingParams> = new Map();
  readonly encodingParams: Map<string, EncodingParams> = new Map();

  constructor(schema: DataSchema) {
    this.schema = schema;
  }

  /**
   * Validate input data against schema
   */
  validate(data: any): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Check if data is array or single object
    const samples = Array.isArray(data) ? data : [data];

    // Validate data constraints
    if (this.schema.constraints) {
      const constraints = this.schema.constraints;

      if (constraints.minSamples && samples.length < constraints.minSamples) {
        errors.push({
          field: "samples",
          message: `Minimum ${constraints.minSamples} samples required, got ${samples.length}`,
          code: "MIN_SAMPLES_VIOLATION",
        });
      }

      if (constraints.maxSamples && samples.length > constraints.maxSamples) {
        errors.push({
          field: "samples",
          message: `Maximum ${constraints.maxSamples} samples allowed, got ${samples.length}`,
          code: "MAX_SAMPLES_VIOLATION",
        });
      }
    }

    // Validate each sample
    for (let i = 0; i < samples.length; i++) {
      const sample = samples[i];
      this.validateSample(sample, i, errors, warnings);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Transform raw data according to schema
   */
  async transform(data: any): Promise<TransformedData> {
    const samples = Array.isArray(data) ? data : [data];
    const transformations: string[] = [];

    const transformedFeatures: Record<string, any[]> = {};

    // Initialize feature arrays
    for (const feature of this.schema.features) {
      transformedFeatures[feature.name] = [];
    }

    // Process each sample
    for (const sample of samples) {
      for (const feature of this.schema.features) {
        const value = sample[feature.name];
        const transformedValue = await this.transformFeature(value, feature);
        transformedFeatures[feature.name].push(transformedValue);
      }
    }

    // Apply feature-specific transformations
    for (const feature of this.schema.features) {
      if (feature.preprocessing) {
        const transformed = await this.applyPreprocessing(
          transformedFeatures[feature.name],
          feature
        );
        transformedFeatures[feature.name] = transformed.values;
        transformations.push(`${feature.name}: ${transformed.transformation}`);
      }
    }

    return {
      features: transformedFeatures,
      metadata: {
        transformations,
        originalShape: [samples.length, this.schema.features.length],
        transformedShape: [
          samples.length,
          Object.keys(transformedFeatures).length,
        ],
      },
    };
  }

  /**
   * Scale numerical features
   */
  async scale(
    data: TransformedData,
    method: "standardization" | "minmax" | "robust" = "standardization"
  ): Promise<ScaledData> {
    const scaledFeatures: Record<string, number[]> = {};
    const scalingParams: Record<string, any> = {};

    for (const [featureName, values] of Object.entries(data.features)) {
      const feature = this.schema.features.find((f) => f.name === featureName);

      if (feature?.type === "numeric") {
        const { scaledValues, params } = this.scaleNumericFeature(
          values as number[],
          method
        );
        scaledFeatures[featureName] = scaledValues;
        scalingParams[featureName] = params;
      } else {
        scaledFeatures[featureName] = values as number[];
      }
    }

    // Convert to tensor
    const featureNames = Object.keys(scaledFeatures);
    const tensorData = scaledFeatures[featureNames[0]].map((_, i) =>
      featureNames.map((name) => scaledFeatures[name][i])
    );

    const tensor = tf.tensor2d(tensorData);

    return await Promise.resolve({
      data: tensor,
      scalingParams: {
        method,
        parameters: scalingParams,
      },
    });
  }

  /**
   * Encode categorical and text features
   */
  async encode(data: TransformedData): Promise<EncodedData> {
    const encodedFeatures: Record<string, number[]> = {};
    const categoricalMappings: Record<string, Record<string, number>> = {};
    const textEncodings: Record<string, any> = {};
    const dateEncodings: Record<string, any> = {};

    for (const [featureName, values] of Object.entries(data.features)) {
      const feature = this.schema.features.find((f) => f.name === featureName);

      if (!feature) continue;

      switch (feature.type) {
        case "categorical": {
          const { encoded, mapping } = this.encodeCategorical(
            values as string[],
            feature
          );
          encodedFeatures[featureName] = encoded;
          categoricalMappings[featureName] = mapping;
          break;
        }

        case "text": {
          const textEncoded = await this.encodeText(
            values as string[],
            feature
          );
          encodedFeatures[featureName] = textEncoded.values;
          textEncodings[featureName] = textEncoded.params;
          break;
        }

        case "date": {
          const dateEncoded = this.encodeDate(values as string[], feature);
          encodedFeatures[featureName] = dateEncoded.values;
          dateEncodings[featureName] = dateEncoded.params;
          break;
        }

        case "boolean":
          encodedFeatures[featureName] = (values as boolean[]).map((v) =>
            v ? 1 : 0
          );
          break;

        default:
          encodedFeatures[featureName] = values as number[];
      }
    }

    // Convert to tensor
    const featureNames = Object.keys(encodedFeatures);
    const tensorData = encodedFeatures[featureNames[0]].map((_, i) =>
      featureNames.map((name) => encodedFeatures[name][i])
    );

    const tensor = tf.tensor2d(tensorData);

    return {
      data: tensor,
      encodingParams: {
        categoricalMappings,
        textEncodings,
        dateEncodings,
      },
    };
  }

  private validateSample(
    sample: any,
    index: number,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    // Check required features
    for (const feature of this.schema.features) {
      if (
        feature.required &&
        (sample[feature.name] === undefined || sample[feature.name] === null)
      ) {
        errors.push({
          field: `sample[${index}].${feature.name}`,
          message: "Required field missing",
          code: "REQUIRED_FIELD_MISSING",
        });
        continue;
      }

      const value = sample[feature.name];
      if (value === undefined || value === null) continue;

      // Validate feature constraints
      if (feature.constraints) {
        this.validateFeatureConstraints(
          value,
          feature,
          index,
          errors,
          warnings
        );
      }

      // Type-specific validation
      this.validateFeatureType(value, feature, index, errors, warnings);
    }
  }

  private validateFeatureConstraints(
    value: any,
    feature: FeatureSchema,
    index: number,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    // biome-ignore lint/style/noNonNullAssertion: ignore
    const constraints = feature.constraints!;
    const fieldPath = `sample[${index}].${feature.name}`;

    if (
      constraints.min !== undefined &&
      typeof value === "number" &&
      value < constraints.min
    ) {
      errors.push({
        field: fieldPath,
        message: `Value ${value} is below minimum ${constraints.min}`,
        code: "MIN_VALUE_VIOLATION",
      });
    }

    if (
      constraints.max !== undefined &&
      typeof value === "number" &&
      value > constraints.max
    ) {
      errors.push({
        field: fieldPath,
        message: `Value ${value} is above maximum ${constraints.max}`,
        code: "MAX_VALUE_VIOLATION",
      });
    }

    if (
      constraints.allowedValues &&
      !constraints.allowedValues.includes(value)
    ) {
      errors.push({
        field: fieldPath,
        message: `Value '${value}' is not in allowed values: ${constraints.allowedValues.join(", ")}`,
        code: "INVALID_VALUE",
      });
    }

    if (
      constraints.pattern &&
      typeof value === "string" &&
      !new RegExp(constraints.pattern).test(value)
    ) {
      errors.push({
        field: fieldPath,
        message: `Value '${value}' does not match required pattern`,
        code: "PATTERN_MISMATCH",
      });
    }

    if (
      constraints.maxLength &&
      typeof value === "string" &&
      value.length > constraints.maxLength
    ) {
      errors.push({
        field: fieldPath,
        message: `Value length ${value.length} exceeds maximum ${constraints.maxLength}`,
        code: "MAX_LENGTH_VIOLATION",
      });
    }

    if (
      constraints.minLength &&
      typeof value === "string" &&
      value.length < constraints.minLength
    ) {
      warnings.push({
        field: fieldPath,
        message: `Value length ${value.length} is below recommended minimum ${constraints.minLength}`,
        suggestion: "Consider providing more detailed input",
      });
    }
  }

  private validateFeatureType(
    value: any,
    feature: FeatureSchema,
    index: number,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    const fieldPath = `sample[${index}].${feature.name}`;

    switch (feature.type) {
      case "numeric":
        if (typeof value !== "number" || Number.isNaN(value)) {
          errors.push({
            field: fieldPath,
            message: `Expected numeric value, got ${typeof value}`,
            code: "INVALID_TYPE",
          });
        }
        break;

      case "categorical":
        if (typeof value !== "string") {
          errors.push({
            field: fieldPath,
            message: `Expected string value for categorical feature, got ${typeof value}`,
            code: "INVALID_TYPE",
          });
        }
        break;

      case "boolean":
        if (typeof value !== "boolean") {
          errors.push({
            field: fieldPath,
            message: `Expected boolean value, got ${typeof value}`,
            code: "INVALID_TYPE",
          });
        }
        break;

      case "text":
        if (typeof value !== "string") {
          errors.push({
            field: fieldPath,
            message: `Expected string value for text feature, got ${typeof value}`,
            code: "INVALID_TYPE",
          });
        } else if (value.length < aiConfig.dataPrep.minTextLength) {
          warnings.push({
            field: fieldPath,
            message: `Text length ${value.length} is below recommended minimum ${aiConfig.dataPrep.minTextLength}`,
            suggestion:
              "Provide more descriptive text for better model performance",
          });
        }
        break;

      case "date": {
        const dateValue = new Date(value);
        if (Number.isNaN(dateValue.getTime())) {
          errors.push({
            field: fieldPath,
            message: `Invalid date format: ${value}`,
            code: "INVALID_DATE",
          });
        }
        break;
      }

      default:
        break;
    }
  }

  private transformFeature(value: any, feature: FeatureSchema): any {
    if (value === undefined || value === null) {
      return this.getDefaultValue(feature);
    }

    switch (feature.type) {
      case "numeric":
        return typeof value === "number"
          ? value
          : Number.parseFloat(value) || 0;

      case "categorical":
      case "text":
        return String(value);

      case "boolean":
        return typeof value === "boolean" ? value : Boolean(value);

      case "date":
        return new Date(value).toISOString();

      default:
        return value;
    }
  }

  private applyPreprocessing(
    values: any[],
    feature: FeatureSchema
  ): { values: any[]; transformation: string } {
    if (!feature.preprocessing) {
      return { values, transformation: "none" };
    }

    let processedValues = [...values];
    const transformations: string[] = [];

    // Handle missing values
    if (feature.preprocessing.imputation) {
      const { imputed, method } = this.imputeMissingValues(
        processedValues,
        feature.preprocessing.imputation
      );
      processedValues = imputed;
      transformations.push(`imputation:${method}`);
    }

    // Handle outliers
    if (feature.preprocessing.outlierHandling && feature.type === "numeric") {
      const { processed, method } = this.handleOutliers(
        processedValues as number[],
        feature.preprocessing.outlierHandling
      );
      processedValues = processed;
      transformations.push(`outliers:${method}`);
    }

    return {
      values: processedValues,
      transformation: transformations.join(","),
    };
  }

  private scaleNumericFeature(
    values: number[],
    method: "standardization" | "minmax" | "robust"
  ): { scaledValues: number[]; params: any } {
    switch (method) {
      case "standardization": {
        const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
        const std = Math.sqrt(
          values.reduce((sum, val) => sum + (val - mean) ** 2, 0) /
            values.length
        );
        return {
          scaledValues: values.map((val) =>
            std === 0 ? 0 : (val - mean) / std
          ),
          params: { mean, std },
        };
      }

      case "minmax": {
        const min = Math.min(...values);
        const max = Math.max(...values);
        const range = max - min;
        return {
          scaledValues: values.map((val) =>
            range === 0 ? 0 : (val - min) / range
          ),
          params: { min, max },
        };
      }

      case "robust": {
        const sorted = [...values].sort((a, b) => a - b);
        const q1 = sorted[Math.floor(sorted.length * 0.25)];
        const q3 = sorted[Math.floor(sorted.length * 0.75)];
        const iqr = q3 - q1;
        const median = sorted[Math.floor(sorted.length * 0.5)];
        return {
          scaledValues: values.map((val) =>
            iqr === 0 ? 0 : (val - median) / iqr
          ),
          params: { q1, q3, median, iqr },
        };
      }

      default:
        return { scaledValues: values, params: {} };
    }
  }

  private encodeCategorical(
    values: string[],
    _feature: FeatureSchema
  ): { encoded: number[]; mapping: Record<string, number> } {
    const uniqueValues = [...new Set(values)];
    const mapping: Record<string, number> = {};

    uniqueValues.forEach((value, index) => {
      mapping[value] = index;
    });

    const encoded = values.map((value) => mapping[value] || 0);

    return { encoded, mapping };
  }

  private encodeText(
    values: string[],
    _feature: FeatureSchema
  ): { values: number[]; params: any } {
    // Simple bag-of-words encoding for now
    // In production, you'd use more sophisticated methods like TF-IDF or embeddings
    // biome-ignore lint/performance/useTopLevelRegex: ignore
    const allWords = values.flatMap((text) => text.toLowerCase().split(/\s+/));
    const vocabulary = [...new Set(allWords)];
    const vocabMap: Record<string, number> = {};

    vocabulary.forEach((word, index) => {
      vocabMap[word] = index;
    });

    // For simplicity, return text length as encoded value
    // In production, implement proper text vectorization
    const encoded = values.map((text) => text.length);

    return {
      values: encoded,
      params: { vocabulary: vocabMap, method: "length" },
    };
  }

  private encodeDate(
    values: string[],
    _feature: FeatureSchema
  ): { values: number[]; params: any } {
    const timestamps = values.map((dateStr) => new Date(dateStr).getTime());
    const minTimestamp = Math.min(...timestamps);

    // Normalize to days since earliest date
    const encoded = timestamps.map((ts) =>
      Math.floor((ts - minTimestamp) / (1000 * 60 * 60 * 24))
    );

    return {
      values: encoded,
      params: { minTimestamp, unit: "days" },
    };
  }

  private getDefaultValue(feature: FeatureSchema): any {
    switch (feature.type) {
      case "numeric":
        return 0;
      case "categorical":
        return "";
      case "text":
        return "";
      case "boolean":
        return false;
      case "date":
        return new Date().toISOString();
      default:
        return null;
    }
  }

  private imputeMissingValues(
    values: any[],
    method: "mean" | "median" | "mode" | "zero" | "drop"
  ): { imputed: any[]; method: string } {
    const nonNullValues = values.filter((v) => v !== null && v !== undefined);

    if (nonNullValues.length === 0) {
      return { imputed: values, method };
    }

    let fillValue: any;

    switch (method) {
      case "mean":
        fillValue =
          nonNullValues.reduce((sum, val) => sum + val, 0) /
          nonNullValues.length;
        break;
      case "median": {
        const sorted = [...nonNullValues].sort((a, b) => a - b);
        fillValue = sorted[Math.floor(sorted.length / 2)];
        break;
      }
      case "mode": {
        const counts: Record<string, number> = {};
        for (const val of nonNullValues) {
          const key = String(val);
          counts[key] = (counts[key] || 0) + 1;
        }
        fillValue = Object.keys(counts).reduce((a, b) =>
          counts[a] > counts[b] ? a : b
        );
        break;
      }
      case "zero":
        fillValue = 0;
        break;
      case "drop":
        return { imputed: nonNullValues, method };
      default:
        fillValue = 0;
    }

    const imputed = values.map((val) =>
      val === null || val === undefined ? fillValue : val
    );
    return { imputed, method };
  }

  private handleOutliers(
    values: number[],
    method: "clip" | "remove" | "transform"
  ): { processed: number[]; method: string } {
    const sorted = [...values].sort((a, b) => a - b);
    const q1 = sorted[Math.floor(sorted.length * 0.25)];
    const q3 = sorted[Math.floor(sorted.length * 0.75)];
    const iqr = q3 - q1;
    const lowerBound = q1 - 1.5 * iqr;
    const upperBound = q3 + 1.5 * iqr;

    switch (method) {
      case "clip":
        return {
          processed: values.map((val) =>
            Math.max(lowerBound, Math.min(upperBound, val))
          ),
          method,
        };

      case "remove":
        return {
          processed: values.filter(
            (val) => val >= lowerBound && val <= upperBound
          ),
          method,
        };

      case "transform":
        // Log transform for positive values
        return {
          processed: values.map((val) => (val > 0 ? Math.log(val + 1) : val)),
          method,
        };

      default:
        return { processed: values, method };
    }
  }
}
