import { logger } from "@kaa/utils/logger";
import * as tf from "@tensorflow/tfjs-node";

export type ClassificationMetrics = {
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  confusionMatrix?: number[][];
  perClassMetrics?: Array<{
    className: string;
    precision: number;
    recall: number;
    f1Score: number;
    support: number;
  }>;
};

export type RegressionMetrics = {
  mse: number; // Mean Squared Error
  rmse: number; // Root Mean Squared Error
  mae: number; // Mean Absolute Error
  r2Score: number; // R-squared
  mape?: number; // Mean Absolute Percentage Error
};

export class MetricsService {
  /**
   * Compute classification metrics from predictions and true labels
   */
  async computeClassificationMetrics(
    predictions: tf.Tensor,
    trueLabels: tf.Tensor,
    classNames?: string[]
  ): Promise<ClassificationMetrics> {
    try {
      // Get predicted class indices
      const predIndices = predictions.argMax(-1);
      const trueIndices = trueLabels.argMax(-1);

      // Convert to arrays for computation
      const predArray = (await predIndices.array()) as number[];
      const trueArray = (await trueIndices.array()) as number[];

      const numClasses = predictions.shape.at(-1);
      const confusionMatrix = this.computeConfusionMatrix(
        predArray,
        trueArray,
        numClasses ?? 0
      );

      // Compute overall metrics
      const accuracy = this.computeAccuracy(confusionMatrix);
      const { precision, recall, f1Score } = this.computePRF(confusionMatrix);

      // Compute per-class metrics
      const perClassMetrics = this.computePerClassMetrics(
        confusionMatrix,
        classNames
      );

      // Clean up tensors
      predIndices.dispose();
      trueIndices.dispose();

      return {
        accuracy,
        precision,
        recall,
        f1Score,
        confusionMatrix,
        perClassMetrics,
      };
    } catch (error) {
      logger.error("Failed to compute classification metrics", error);
      // Return default metrics on error
      return {
        accuracy: 0,
        precision: 0,
        recall: 0,
        f1Score: 0,
      };
    }
  }

  /**
   * Compute regression metrics from predictions and true values
   */
  async computeRegressionMetrics(
    predictions: tf.Tensor,
    trueValues: tf.Tensor
  ): Promise<RegressionMetrics> {
    try {
      // Flatten tensors if needed
      const pred = predictions.reshape([-1]);
      const true_ = trueValues.reshape([-1]);

      // Compute MSE
      const mse = (await tf.losses
        .meanSquaredError(true_, pred)
        .array()) as number;
      const rmse = Math.sqrt(mse);

      // Compute MAE
      const mae = (await tf.losses
        .absoluteDifference(true_, pred)
        .mean()
        .array()) as number;

      // Compute R-squared
      const trueMean = (await true_.mean().array()) as number;
      const ssTotal = (await true_
        .sub(trueMean)
        .square()
        .sum()
        .array()) as number;
      const ssResidual = (await true_
        .sub(pred)
        .square()
        .sum()
        .array()) as number;
      const r2ScoreVal = 1 - ssResidual / ssTotal;
      const r2Score = Number.isNaN(r2ScoreVal) ? 0 : r2ScoreVal;

      // Compute MAPE if no zeros in true values
      let mape: number | undefined;
      const trueArray = (await true_.array()) as number[];
      if (!trueArray.some((v) => v === 0)) {
        const mapeT = (await tf
          .abs(true_.sub(pred).div(true_))
          .mean()
          .array()) as number;
        mape = mapeT * 100;
      }

      // Clean up tensors
      pred.dispose();
      true_.dispose();

      return {
        mse,
        rmse,
        mae,
        r2Score,
        mape,
      };
    } catch (error) {
      logger.error("Failed to compute regression metrics", error);
      // Return default metrics on error
      return {
        mse: Number.POSITIVE_INFINITY,
        rmse: Number.POSITIVE_INFINITY,
        mae: Number.POSITIVE_INFINITY,
        r2Score: 0,
      };
    }
  }

  /**
   * Compute confusion matrix
   */
  private computeConfusionMatrix(
    predictions: number[],
    trueLabels: number[],
    numClasses: number
  ): number[][] {
    const matrix = new Array(numClasses)
      .fill(null)
      .map(() => new Array(numClasses).fill(0));

    for (let i = 0; i < predictions.length; i++) {
      const true_ = trueLabels[i];
      const pred = predictions[i];
      if (true_ >= 0 && true_ < numClasses && pred >= 0 && pred < numClasses) {
        matrix[true_][pred]++;
      }
    }

    return matrix;
  }

  /**
   * Compute accuracy from confusion matrix
   */
  private computeAccuracy(confusionMatrix: number[][]): number {
    let correct = 0;
    let total = 0;

    for (let i = 0; i < confusionMatrix.length; i++) {
      for (let j = 0; j < confusionMatrix[i].length; j++) {
        total += confusionMatrix[i][j];
        if (i === j) {
          correct += confusionMatrix[i][j];
        }
      }
    }

    return total > 0 ? correct / total : 0;
  }

  /**
   * Compute precision, recall, and F1 score
   */
  private computePRF(confusionMatrix: number[][]): {
    precision: number;
    recall: number;
    f1Score: number;
  } {
    const numClasses = confusionMatrix.length;
    let totalPrecision = 0;
    let totalRecall = 0;
    let validClasses = 0;

    for (let i = 0; i < numClasses; i++) {
      // True positives for class i
      const tp = confusionMatrix[i][i];

      // False positives for class i (predicted as i but not actually i)
      let fp = 0;
      for (let j = 0; j < numClasses; j++) {
        if (j !== i) {
          fp += confusionMatrix[j][i];
        }
      }

      // False negatives for class i (actually i but not predicted as i)
      let fn = 0;
      for (let j = 0; j < numClasses; j++) {
        if (j !== i) {
          fn += confusionMatrix[i][j];
        }
      }

      // Compute precision and recall for this class
      const precision = tp + fp > 0 ? tp / (tp + fp) : 0;
      const recall = tp + fn > 0 ? tp / (tp + fn) : 0;

      if (tp + fp + fn > 0) {
        totalPrecision += precision;
        totalRecall += recall;
        validClasses++;
      }
    }

    // Macro-averaged metrics
    const avgPrecision = validClasses > 0 ? totalPrecision / validClasses : 0;
    const avgRecall = validClasses > 0 ? totalRecall / validClasses : 0;
    const f1Score =
      avgPrecision + avgRecall > 0
        ? (2 * (avgPrecision * avgRecall)) / (avgPrecision + avgRecall)
        : 0;

    return {
      precision: avgPrecision,
      recall: avgRecall,
      f1Score,
    };
  }

  /**
   * Compute per-class metrics
   */
  private computePerClassMetrics(
    confusionMatrix: number[][],
    classNames?: string[]
  ): Array<{
    className: string;
    precision: number;
    recall: number;
    f1Score: number;
    support: number;
  }> {
    const numClasses = confusionMatrix.length;
    const metrics: Array<{
      className: string;
      precision: number;
      recall: number;
      f1Score: number;
      support: number;
    }> = [];

    for (let i = 0; i < numClasses; i++) {
      const tp = confusionMatrix[i][i];

      let fp = 0;
      for (let j = 0; j < numClasses; j++) {
        if (j !== i) fp += confusionMatrix[j][i];
      }

      let fn = 0;
      let support = 0;
      for (let j = 0; j < numClasses; j++) {
        support += confusionMatrix[i][j];
        if (j !== i) fn += confusionMatrix[i][j];
      }

      const precision = tp + fp > 0 ? tp / (tp + fp) : 0;
      const recall = tp + fn > 0 ? tp / (tp + fn) : 0;
      const f1Score =
        precision + recall > 0
          ? (2 * (precision * recall)) / (precision + recall)
          : 0;

      metrics.push({
        className: classNames?.[i] || `Class ${i}`,
        precision,
        recall,
        f1Score,
        support,
      });
    }

    return metrics;
  }

  /**
   * Evaluate model on validation data
   */
  async evaluateModel(
    model: tf.LayersModel,
    xVal: tf.Tensor,
    yVal: tf.Tensor,
    modelType: "classification" | "regression",
    classNames?: string[]
  ): Promise<ClassificationMetrics | RegressionMetrics> {
    const predictions = model.predict(xVal) as tf.Tensor;

    if (modelType === "classification") {
      const metrics = await this.computeClassificationMetrics(
        predictions,
        yVal,
        classNames
      );
      predictions.dispose();
      return metrics;
    }
    const metrics = await this.computeRegressionMetrics(predictions, yVal);
    predictions.dispose();
    return metrics;
  }

  /**
   * Format metrics for display
   */
  formatMetrics(metrics: ClassificationMetrics | RegressionMetrics): string {
    if ("accuracy" in metrics) {
      // Classification metrics
      const m = metrics as ClassificationMetrics;
      let output = "Overall Metrics:\n";
      output += `  Accuracy:  ${(m.accuracy * 100).toFixed(2)}%\n`;
      output += `  Precision: ${(m.precision * 100).toFixed(2)}%\n`;
      output += `  Recall:    ${(m.recall * 100).toFixed(2)}%\n`;
      output += `  F1 Score:  ${(m.f1Score * 100).toFixed(2)}%\n`;

      if (m.perClassMetrics) {
        output += "\nPer-Class Metrics:\n";
        for (const cm of m.perClassMetrics) {
          output += `  ${cm.className}:\n`;
          output += `    Precision: ${(cm.precision * 100).toFixed(2)}%\n`;
          output += `    Recall:    ${(cm.recall * 100).toFixed(2)}%\n`;
          output += `    F1 Score:  ${(cm.f1Score * 100).toFixed(2)}%\n`;
          output += `    Support:   ${cm.support}\n`;
        }
      }

      return output;
    }
    // Regression metrics
    const m = metrics as RegressionMetrics;
    let output = "Regression Metrics:\n";
    output += `  MSE:       ${m.mse.toFixed(4)}\n`;
    output += `  RMSE:      ${m.rmse.toFixed(4)}\n`;
    output += `  MAE:       ${m.mae.toFixed(4)}\n`;
    output += `  R² Score:  ${m.r2Score.toFixed(4)}\n`;
    if (m.mape !== undefined) {
      output += `  MAPE:      ${m.mape.toFixed(2)}%\n`;
    }

    return output;
  }
}

export const metricsService = new MetricsService();
