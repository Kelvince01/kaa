import crypto from "node:crypto";
import { logger } from "@kaa/utils";

export type TransformerFunction = (
  value: any,
  params?: any
) => number | number[];

export type FeatureTransformer = {
  name: string;
  description: string;
  inputType: "numeric" | "string" | "boolean" | "date" | "any";
  outputDimension: number | "variable"; // Number of output features
  transform: TransformerFunction;
  params?: any; // Optional parameters for the transformer
};

export type TransformerPipeline = {
  feature: string;
  transformers: string[]; // List of transformer names to apply in sequence
};

export class FeatureTransformersService {
  private readonly transformers: Map<string, FeatureTransformer> = new Map();
  private readonly pipelines: Map<string, TransformerPipeline[]> = new Map();

  constructor() {
    // Register built-in transformers
    this.registerBuiltInTransformers();
  }

  /**
   * Register a custom feature transformer
   */
  registerTransformer(transformer: FeatureTransformer): void {
    if (this.transformers.has(transformer.name)) {
      logger.warn(
        `Transformer ${transformer.name} already exists, overwriting`
      );
    }

    this.transformers.set(transformer.name, transformer);
    logger.info(`Registered transformer: ${transformer.name}`);
  }

  /**
   * Apply transformer to a value
   */
  applyTransformer(
    transformerName: string,
    value: any,
    params?: any
  ): number | number[] {
    const transformer = this.transformers.get(transformerName);
    if (!transformer) {
      throw new Error(`Transformer ${transformerName} not found`);
    }

    try {
      return transformer.transform(value, params || transformer.params);
    } catch (error) {
      logger.error(`Failed to apply transformer ${transformerName}`, {
        value,
        error,
      });
      // Return default value based on output dimension
      return transformer.outputDimension === 1 ? 0 : [0];
    }
  }

  /**
   * Create a transformation pipeline for a set of features
   */
  createPipeline(modelId: string, pipelines: TransformerPipeline[]): void {
    this.pipelines.set(modelId, pipelines);
    logger.info(`Created transformation pipeline for model ${modelId}`);
  }

  /**
   * Apply pipeline to transform features
   */
  applyPipeline(
    modelId: string,
    data: Record<string, any>
  ): Record<string, number | number[]> {
    const pipeline = this.pipelines.get(modelId);
    if (!pipeline) {
      throw new Error(`Pipeline for model ${modelId} not found`);
    }

    const transformed: Record<string, number | number[]> = {};

    for (const step of pipeline) {
      const { feature, transformers } = step;
      let value = data[feature];

      // Apply transformers in sequence
      for (const transformerName of transformers) {
        value = this.applyTransformer(transformerName, value);
      }

      transformed[feature] = value;
    }

    return transformed;
  }

  /**
   * Get transformer by name
   */
  getTransformer(name: string): FeatureTransformer | undefined {
    return this.transformers.get(name);
  }

  /**
   * List all available transformers
   */
  listTransformers(): FeatureTransformer[] {
    return Array.from(this.transformers.values());
  }

  /**
   * Register built-in transformers
   */
  private registerBuiltInTransformers(): void {
    // Numeric transformers
    this.registerTransformer({
      name: "log",
      description: "Natural logarithm transformation",
      inputType: "numeric",
      outputDimension: 1,
      transform: (value: number) => {
        const v = Number(value);
        return v > 0 ? Math.log(v) : 0;
      },
    });

    this.registerTransformer({
      name: "sqrt",
      description: "Square root transformation",
      inputType: "numeric",
      outputDimension: 1,
      transform: (value: number) => {
        const v = Number(value);
        return v >= 0 ? Math.sqrt(v) : 0;
      },
    });

    this.registerTransformer({
      name: "square",
      description: "Square transformation",
      inputType: "numeric",
      outputDimension: 1,
      transform: (value: number) => Number(value) ** 2,
    });

    this.registerTransformer({
      name: "reciprocal",
      description: "Reciprocal transformation (1/x)",
      inputType: "numeric",
      outputDimension: 1,
      transform: (value: number) => {
        const v = Number(value);
        return v !== 0 ? 1 / v : 0;
      },
    });

    this.registerTransformer({
      name: "minmax",
      description: "Min-max normalization",
      inputType: "numeric",
      outputDimension: 1,
      transform: (value: number, params?: { min: number; max: number }) => {
        const v = Number(value);
        const min = params?.min || 0;
        const max = params?.max || 1;
        if (max === min) return 0;
        return (v - min) / (max - min);
      },
    });

    this.registerTransformer({
      name: "zscore",
      description: "Z-score normalization",
      inputType: "numeric",
      outputDimension: 1,
      transform: (value: number, params?: { mean: number; std: number }) => {
        const v = Number(value);
        const mean = params?.mean || 0;
        const std = params?.std || 1;
        return std !== 0 ? (v - mean) / std : 0;
      },
    });

    // String transformers
    this.registerTransformer({
      name: "length",
      description: "String length",
      inputType: "string",
      outputDimension: 1,
      transform: (value: string) => String(value).length,
    });

    this.registerTransformer({
      name: "wordcount",
      description: "Word count in string",
      inputType: "string",
      outputDimension: 1,
      transform: (value: string) => {
        const str = String(value).trim();
        // biome-ignore lint/performance/useTopLevelRegex: ignore
        return str ? str.split(/\s+/).length : 0;
      },
    });

    this.registerTransformer({
      name: "charcount",
      description: "Character type counts",
      inputType: "string",
      outputDimension: 4,
      transform: (value: string) => {
        const str = String(value);
        return [
          (str.match(/[a-z]/gi) || []).length, // Letters
          (str.match(/\d/g) || []).length, // Digits
          (str.match(/\s/g) || []).length, // Spaces
          (str.match(/[^a-z0-9\s]/gi) || []).length, // Special chars
        ];
      },
    });

    this.registerTransformer({
      name: "hash",
      description: "Hash string to numeric value",
      inputType: "string",
      outputDimension: 1,
      transform: (value: string, params?: { buckets: number }) => {
        const buckets = params?.buckets || 1000;
        const hash = crypto
          .createHash("md5")
          .update(String(value))
          .digest("hex");
        const num = Number.parseInt(hash.substring(0, 8), 16);
        return num % buckets;
      },
    });

    // Date transformers
    this.registerTransformer({
      name: "timestamp",
      description: "Convert date to timestamp",
      inputType: "date",
      outputDimension: 1,
      transform: (value: Date | string) => {
        const date = value instanceof Date ? value : new Date(value);
        return Number.isNaN(date.getTime()) ? 0 : date.getTime();
      },
    });

    this.registerTransformer({
      name: "dayofweek",
      description: "Extract day of week (0-6)",
      inputType: "date",
      outputDimension: 1,
      transform: (value: Date | string) => {
        const date = value instanceof Date ? value : new Date(value);
        return Number.isNaN(date.getTime()) ? 0 : date.getDay();
      },
    });

    this.registerTransformer({
      name: "dayofmonth",
      description: "Extract day of month (1-31)",
      inputType: "date",
      outputDimension: 1,
      transform: (value: Date | string) => {
        const date = value instanceof Date ? value : new Date(value);
        return Number.isNaN(date.getTime()) ? 0 : date.getDate();
      },
    });

    this.registerTransformer({
      name: "month",
      description: "Extract month (0-11)",
      inputType: "date",
      outputDimension: 1,
      transform: (value: Date | string) => {
        const date = value instanceof Date ? value : new Date(value);
        return Number.isNaN(date.getTime()) ? 0 : date.getMonth();
      },
    });

    this.registerTransformer({
      name: "year",
      description: "Extract year",
      inputType: "date",
      outputDimension: 1,
      transform: (value: Date | string) => {
        const date = value instanceof Date ? value : new Date(value);
        return Number.isNaN(date.getTime()) ? 0 : date.getFullYear();
      },
    });

    this.registerTransformer({
      name: "hourofday",
      description: "Extract hour of day (0-23)",
      inputType: "date",
      outputDimension: 1,
      transform: (value: Date | string) => {
        const date = value instanceof Date ? value : new Date(value);
        return Number.isNaN(date.getTime()) ? 0 : date.getHours();
      },
    });

    this.registerTransformer({
      name: "cyclical_time",
      description: "Cyclical encoding for time features",
      inputType: "date",
      outputDimension: 2,
      transform: (
        value: Date | string,
        params?: { period: "day" | "week" | "month" | "year" }
      ) => {
        const date = value instanceof Date ? value : new Date(value);
        if (Number.isNaN(date.getTime())) return [0, 0];

        const period = params?.period || "day";
        let angle: number;

        switch (period) {
          case "day":
            angle =
              ((date.getHours() * 60 + date.getMinutes()) / (24 * 60)) *
              2 *
              Math.PI;
            break;
          case "week":
            angle = (date.getDay() / 7) * 2 * Math.PI;
            break;
          case "month":
            angle = (date.getDate() / 31) * 2 * Math.PI;
            break;
          case "year":
            angle = (date.getMonth() / 12) * 2 * Math.PI;
            break;
          default:
            angle = 0;
        }

        return [Math.sin(angle), Math.cos(angle)];
      },
    });

    // Boolean transformers
    this.registerTransformer({
      name: "boolean",
      description: "Convert boolean to numeric (0 or 1)",
      inputType: "boolean",
      outputDimension: 1,
      transform: (value: boolean) => (value ? 1 : 0),
    });

    // Special transformers
    this.registerTransformer({
      name: "polynomial",
      description: "Polynomial features",
      inputType: "numeric",
      outputDimension: "variable",
      transform: (value: number, params?: { degree: number }) => {
        const v = Number(value);
        const degree = params?.degree || 2;
        const features: number[] = [];
        for (let i = 1; i <= degree; i++) {
          features.push(v ** i);
        }
        return features;
      },
    });

    this.registerTransformer({
      name: "binning",
      description: "Discretize continuous values into bins",
      inputType: "numeric",
      outputDimension: "variable",
      transform: (
        value: number,
        params?: { bins: number[]; onehot: boolean }
      ) => {
        const v = Number(value);
        const bins = params?.bins || [0, 10, 20, 30, 40, 50];
        const onehot = params?.onehot !== false;

        let binIndex = 0;
        for (let i = 0; i < bins.length - 1; i++) {
          if (v >= bins[i] && v < bins[i + 1]) {
            binIndex = i;
            break;
          }
        }
        if (v >= (bins?.at(-1) as unknown as number)) {
          binIndex = bins.length - 1;
        }

        if (onehot) {
          const encoded = new Array(bins.length).fill(0);
          encoded[binIndex] = 1;
          return encoded;
        }
        return binIndex;
      },
    });

    this.registerTransformer({
      name: "interaction",
      description: "Interaction between two numeric features",
      inputType: "any",
      outputDimension: 1,
      transform: (value: [number, number]) => {
        if (Array.isArray(value) && value.length >= 2) {
          return Number(value[0]) * Number(value[1]);
        }
        return 0;
      },
    });

    logger.info(`Registered ${this.transformers.size} built-in transformers`);
  }

  /**
   * Create custom transformer from user-defined function
   */
  createCustomTransformer(
    name: string,
    description: string,
    transformCode: string,
    inputType: FeatureTransformer["inputType"] = "any",
    outputDimension: number | "variable" = 1
  ): void {
    try {
      // Create function from code string (be careful with security!)
      // In production, use a sandboxed environment
      const transform = new Function(
        "value",
        "params",
        transformCode
      ) as TransformerFunction;

      this.registerTransformer({
        name,
        description,
        inputType,
        outputDimension,
        transform,
      });

      logger.info(`Created custom transformer: ${name}`);
    } catch (error) {
      logger.error(`Failed to create custom transformer ${name}`, error);
      throw new Error(`Invalid transformer code: ${error}`);
    }
  }

  /**
   * Export transformer configuration
   */
  exportTransformer(name: string): string {
    const transformer = this.transformers.get(name);
    if (!transformer) {
      throw new Error(`Transformer ${name} not found`);
    }

    return JSON.stringify(
      {
        name: transformer.name,
        description: transformer.description,
        inputType: transformer.inputType,
        outputDimension: transformer.outputDimension,
        params: transformer.params,
        // Note: Function cannot be serialized, would need special handling
      },
      null,
      2
    );
  }

  /**
   * Calculate feature importance using permutation
   */
  async calculateFeatureImportance(
    _modelId: string,
    evaluate: (features: Record<string, any>) => Promise<number>,
    baselineData: Record<string, any>[],
    metric: "higher" | "lower" = "higher"
  ): Promise<Record<string, number>> {
    const importance: Record<string, number> = {};

    // Calculate baseline score
    let baselineScore = 0;
    for (const data of baselineData) {
      baselineScore += await evaluate(data);
    }
    baselineScore /= baselineData.length;

    // Permute each feature and measure impact
    const features = Object.keys(baselineData[0]);

    for (const feature of features) {
      let permutedScore = 0;

      for (const data of baselineData) {
        // Shuffle this feature's values
        const permutedData = { ...data };
        const randomIndex = Math.floor(Math.random() * baselineData.length);
        permutedData[feature] = baselineData[randomIndex][feature];

        permutedScore += await evaluate(permutedData);
      }
      permutedScore /= baselineData.length;

      // Calculate importance as change from baseline
      const change =
        metric === "higher"
          ? baselineScore - permutedScore // Higher is better, so drop is importance
          : permutedScore - baselineScore; // Lower is better, so increase is importance

      importance[feature] = Math.abs(change);
    }

    // Normalize importance scores
    const maxImportance = Math.max(...Object.values(importance));
    if (maxImportance > 0) {
      for (const feature of Object.keys(importance)) {
        importance[feature] /= maxImportance;
      }
    }

    return importance;
  }
}

export const featureTransformersService = new FeatureTransformersService();
