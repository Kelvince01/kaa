import * as fs from "node:fs";
import * as path from "node:path";
import * as tf from "@tensorflow/tfjs-node";
import type { Row, Split } from "../providers/training-data.provider";
import type { EmbeddingCacheService } from "./embedding-cache.service";

export type PreparedDataset = {
  xsTrain: tf.Tensor;
  ysTrain: tf.Tensor;
  xsVal: tf.Tensor;
  ysVal: tf.Tensor;
  labelDim?: number;
  normalization: { feature: string; mean: number; std: number }[];
  categoryMaps?: Record<string, string[]>;
  featureTypes?: Record<string, "numeric" | "boolean" | "categorical" | "text">;
  textEmbeddings?: Record<string, number[]>; // Store text embeddings
  embeddingDim?: number; // Dimension of text embeddings
  datasetHash: string;
  counts: { train: number; val: number; test: number };
};

export type PreprocessingMetadata = {
  normalization: { feature: string; mean: number; std: number }[];
  categoryMaps: Record<string, string[]>;
  featureTypes: Record<string, "numeric" | "boolean" | "categorical" | "text">;
  textEmbeddings?: Record<string, number[]>;
  embeddingDim?: number;
  labelDim?: number;
  targetCategories?: string[];
  modelType: string;
  features: string[];
  target?: string;
};

export class DataPrepService {
  constructor(readonly embeddingCache?: EmbeddingCacheService) {}

  /**
   * Inject TensorFlow service for generating embeddings
   * This is done separately to avoid circular dependencies
   */
  private tensorflowService?: any;

  setTensorflowService(service: any): void {
    this.tensorflowService = service;
  }

  async prepare(
    split: Split,
    cfg: {
      modelType: string;
      features: string[];
      target?: string;
      textFeatures?: string[]; // features to treat as text for embeddings
      useEmbeddings?: boolean; // whether to use USE for text features
    }
  ): Promise<PreparedDataset> {
    const {
      features,
      target,
      modelType,
      textFeatures = [],
      useEmbeddings = false,
    } = cfg;

    // Analyze feature types and build category maps
    const featureTypes: Record<
      string,
      "numeric" | "boolean" | "categorical" | "text"
    > = {};
    const categoryMaps: Record<string, string[]> = {};
    const normStats = features.map((f) => ({ feature: f, mean: 0, std: 1 }));

    // Analyze features from training data
    for (const feature of features) {
      if (textFeatures.includes(feature)) {
        featureTypes[feature] = "text";
        continue;
      }

      const values = split.train
        .map((row) => row[feature])
        .filter((v) => v !== null && v !== undefined);
      if (values.length === 0) {
        featureTypes[feature] = "numeric";
        continue;
      }

      const firstValue = values[0];
      if (typeof firstValue === "number") {
        featureTypes[feature] = "numeric";
      } else if (typeof firstValue === "boolean") {
        featureTypes[feature] = "boolean";
      } else if (typeof firstValue === "string") {
        // Check if it should be categorical
        const uniqueValues = Array.from(new Set(values));
        if (uniqueValues.length <= 100) {
          // Treat as categorical if cardinality is low
          featureTypes[feature] = "categorical";
          categoryMaps[feature] = uniqueValues.sort();
        } else {
          featureTypes[feature] = "text";
        }
      }
    }

    // Build target categories for classification
    let targetCategories: string[] | undefined;
    if (target && modelType === "classification") {
      const targetValues = split.train
        .map((row) => row[target])
        .filter((v) => v !== null && v !== undefined);
      if (targetValues.some((v) => typeof v === "string")) {
        targetCategories = Array.from(
          new Set(targetValues.map((v) => String(v)))
        ).sort();
      }
    }

    // Prepare text embeddings if needed
    const textEmbeddings: Record<string, number[]> = {};
    let embeddingDim = 0;

    if (useEmbeddings && this.tensorflowService) {
      const textFeaturesToEmbed = features.filter(
        (f) => featureTypes[f] === "text"
      );

      for (const feature of textFeaturesToEmbed) {
        const uniqueTexts = new Set<string>();
        for (const row of [...split.train, ...split.val, ...split.test]) {
          const v = row[feature];
          if (typeof v === "string" && v.trim()) {
            uniqueTexts.add(v);
          }
        }

        if (uniqueTexts.size > 0 && uniqueTexts.size <= 1000) {
          // Limit to prevent memory issues
          try {
            const texts = Array.from(uniqueTexts);
            const embeddings =
              await this.tensorflowService.generateEmbeddings(texts);
            const embeddingArrays = (await embeddings.array()) as number[][];
            embeddingDim = embeddingArrays[0].length; // USE embeddings are 512-dimensional
            embeddings.dispose();

            // Store embeddings keyed by feature_value
            texts.forEach((text, i) => {
              textEmbeddings[`${feature}_${text}`] = embeddingArrays[i];
            });
          } catch (error) {
            // Fallback to simple encoding if USE fails
            console.warn(
              `Failed to generate embeddings for feature ${feature}:`,
              error
            );
          }
        }
      }
    }

    const toVec = (row: Row) => {
      const vec: number[] = [];
      for (const f of features) {
        const v = row[f];
        const fType = featureTypes[f];

        if (fType === "numeric") {
          vec.push(typeof v === "number" && Number.isFinite(v) ? v : 0);
        } else if (fType === "boolean") {
          vec.push(typeof v === "boolean" ? (v ? 1 : 0) : 0);
        } else if (fType === "categorical" && categoryMaps[f]) {
          // One-hot encoding for categorical features
          const categories = categoryMaps[f];
          const idx = categories.indexOf(String(v));
          for (let i = 0; i < categories.length; i++) {
            vec.push(i === idx ? 1 : 0);
          }
        } else if (fType === "text") {
          // Use embeddings if available
          const embeddingKey = `${f}_${v}`;
          if (textEmbeddings[embeddingKey]) {
            vec.push(...textEmbeddings[embeddingKey]);
          } else if (embeddingDim > 0) {
            // Push zeros if we expect embeddings but don't have them for this value
            vec.push(...new Array(embeddingDim).fill(0));
          } else {
            // Fallback: use simple text features
            const strVal = typeof v === "string" ? v : "";
            vec.push(strVal.length); // length
            vec.push(strVal.split(" ").length); // word count
            vec.push(strVal.match(/[A-Z]/g)?.length || 0); // uppercase count
            vec.push(strVal.match(/\d/g)?.length || 0); // digit count
          }
        } else {
          vec.push(0);
        }
      }
      return vec;
    };

    const yVal = (row: Row) => {
      if (!target) return 0;
      const v = row[target];
      if (modelType === "classification") {
        if (targetCategories) {
          const idx = targetCategories.indexOf(String(v));
          return idx >= 0 ? idx : 0;
        }
        if (typeof v === "number") return v;
        if (typeof v === "boolean") return v ? 1 : 0;
        return 0;
      }
      if (typeof v === "number") return v;
      return 0;
    };

    // Compute mean/std on train only for numeric features
    const trainVecs = split.train.map(toVec);
    const vecLength = trainVecs[0]?.length || 0;

    // Calculate normalization stats for the expanded feature vector
    const expandedNormStats: { feature: string; mean: number; std: number }[] =
      [];
    for (let j = 0; j < vecLength; j++) {
      const col = trainVecs.map((r) => r[j]);
      const mean = col.reduce((a, b) => a + b, 0) / (col.length || 1);
      const variance =
        col.reduce((a, b) => a + (b - mean) * (b - mean), 0) /
        (col.length || 1);
      const std = Math.sqrt(variance) || 1;
      expandedNormStats.push({ feature: `dim_${j}`, mean, std });
    }

    const normalize = (vec: number[]) =>
      vec.map(
        (v, j) => (v - expandedNormStats[j].mean) / expandedNormStats[j].std
      );

    const makeXY = (rows: Row[]) => {
      const xs = rows.map((r) => normalize(toVec(r)));
      const ysRaw = rows.map((r) => yVal(r));
      if (modelType === "classification") {
        const numClasses = targetCategories
          ? targetCategories.length
          : Math.max(1, Math.max(...ysRaw) + 1);
        const ys = tf.oneHot(tf.tensor1d(ysRaw, "int32"), numClasses);
        return { xs: tf.tensor2d(xs), ys } as any;
      }
      return { xs: tf.tensor2d(xs), ys: tf.tensor1d(ysRaw) };
    };

    const { xs: xsTrain, ys: ysTrain } = makeXY(split.train);
    const { xs: xsVal, ys: ysVal } = makeXY(split.val);
    const labelDim =
      modelType === "classification" ? (ysTrain.shape[1] as number) : undefined;

    const datasetHash = this.simpleHash(
      JSON.stringify({
        features,
        target,
        counts: {
          train: split.train.length,
          val: split.val.length,
          test: split.test.length,
        },
      })
    );

    return {
      xsTrain,
      ysTrain,
      xsVal,
      ysVal,
      labelDim,
      normalization: expandedNormStats,
      categoryMaps,
      featureTypes,
      textEmbeddings:
        Object.keys(textEmbeddings).length > 0 ? textEmbeddings : undefined,
      embeddingDim: embeddingDim > 0 ? embeddingDim : undefined,
      datasetHash,
      counts: {
        train: split.train.length,
        val: split.val.length,
        test: split.test.length,
      },
    };
  }

  private simpleHash(input: string): string {
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      // biome-ignore lint/suspicious/noBitwiseOperators: ignore
      hash = (hash << 5) - hash + input.charCodeAt(i);
      // biome-ignore lint/suspicious/noBitwiseOperators: ignore
      hash |= 0;
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Save preprocessing metadata to a JSON file
   */
  async saveMetadata(
    modelDir: string,
    dataset: PreparedDataset,
    cfg: {
      modelType: string;
      features: string[];
      target?: string;
      targetCategories?: string[];
    }
  ): Promise<void> {
    const metadata: PreprocessingMetadata = {
      normalization: dataset.normalization,
      categoryMaps: dataset.categoryMaps || {},
      featureTypes: dataset.featureTypes || {},
      textEmbeddings: dataset.textEmbeddings,
      embeddingDim: dataset.embeddingDim,
      labelDim: dataset.labelDim,
      targetCategories: cfg.targetCategories,
      modelType: cfg.modelType,
      features: cfg.features,
      target: cfg.target,
    };

    const metadataPath = path.join(modelDir, "prep.json");
    await fs.promises.writeFile(
      metadataPath,
      JSON.stringify(metadata, null, 2)
    );
  }

  /**
   * Load preprocessing metadata from a JSON file
   */
  async loadMetadata(modelDir: string): Promise<PreprocessingMetadata | null> {
    const metadataPath = path.join(modelDir, "prep.json");
    try {
      const content = await fs.promises.readFile(metadataPath, "utf-8");
      return JSON.parse(content) as PreprocessingMetadata;
    } catch (error) {
      return null;
    }
  }

  /**
   * Apply preprocessing transformations to input data using saved metadata
   */
  async transformInput(
    input: Record<string, any>,
    metadata: PreprocessingMetadata
  ): Promise<number[]> {
    const {
      features,
      featureTypes,
      categoryMaps,
      normalization,
      textEmbeddings,
      embeddingDim,
    } = metadata;
    const vec: number[] = [];

    for (const f of features) {
      const v = input[f];
      const fType = featureTypes[f];

      if (fType === "numeric") {
        vec.push(typeof v === "number" && Number.isFinite(v) ? v : 0);
      } else if (fType === "boolean") {
        vec.push(typeof v === "boolean" ? (v ? 1 : 0) : 0);
      } else if (fType === "categorical" && categoryMaps[f]) {
        // One-hot encoding for categorical features
        const categories = categoryMaps[f];
        const idx = categories.indexOf(String(v));
        for (let i = 0; i < categories.length; i++) {
          vec.push(i === idx ? 1 : 0);
        }
      } else if (fType === "text") {
        // Use saved embeddings or generate new ones
        const embeddingKey = `${f}_${v}`;
        if (textEmbeddings?.[embeddingKey]) {
          vec.push(...textEmbeddings[embeddingKey]);
        } else if (embeddingDim && this.tensorflowService) {
          // Generate embedding for new text
          try {
            const strVal = typeof v === "string" ? v : "";
            if (strVal.trim()) {
              const embedding =
                await this.tensorflowService.generateEmbeddingArray(strVal);
              vec.push(...embedding);
            } else {
              vec.push(...new Array(embeddingDim).fill(0));
            }
          } catch {
            vec.push(...new Array(embeddingDim).fill(0));
          }
        } else {
          // Fallback to simple features
          const strVal = typeof v === "string" ? v : "";
          vec.push(strVal.length);
          vec.push(strVal.split(" ").length);
          vec.push(strVal.match(/[A-Z]/g)?.length || 0);
          vec.push(strVal.match(/\d/g)?.length || 0);
        }
      } else {
        vec.push(0);
      }
    }

    // Apply normalization
    return vec.map((v, j) => {
      const stats = normalization[j];
      return stats ? (v - stats.mean) / stats.std : v;
    });
  }

  /**
   * Backward compatibility: synchronous version of transformInput for simple cases
   */
  transformInputSync(
    input: Record<string, any>,
    metadata: PreprocessingMetadata
  ): number[] {
    const { features, featureTypes, categoryMaps, normalization } = metadata;
    const vec: number[] = [];

    for (const f of features) {
      const v = input[f];
      const fType = featureTypes[f];

      if (fType === "numeric") {
        vec.push(typeof v === "number" && Number.isFinite(v) ? v : 0);
      } else if (fType === "boolean") {
        vec.push(typeof v === "boolean" ? (v ? 1 : 0) : 0);
      } else if (fType === "categorical" && categoryMaps[f]) {
        // One-hot encoding for categorical features
        const categories = categoryMaps[f];
        const idx = categories.indexOf(String(v));
        for (let i = 0; i < categories.length; i++) {
          vec.push(i === idx ? 1 : 0);
        }
      } else if (fType === "text") {
        // Fallback to simple features for sync version
        const strVal = typeof v === "string" ? v : "";
        vec.push(strVal.length);
        vec.push(strVal.split(" ").length);
        vec.push(strVal.match(/[A-Z]/g)?.length || 0);
        vec.push(strVal.match(/\d/g)?.length || 0);
      } else {
        vec.push(0);
      }
    }

    // Apply normalization
    return vec.map((v, j) => {
      const stats = normalization[j];
      return stats ? (v - stats.mean) / stats.std : v;
    });
  }
}
