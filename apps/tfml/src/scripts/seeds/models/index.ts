import type { CreateAIModelData } from "@kaa/models/types";

export const defaultModels: CreateAIModelData[] = [
  {
    name: "Rental Price Prediction",
    description:
      "AI model that predicts rental prices for properties based on key features including bedrooms, bathrooms, size, and location. Trained on historical rental data to provide accurate price estimates for property managers and landlords.",
    type: "regression",
    configuration: {
      algorithm: "dense_nn",
      parameters: {
        layers: [
          {
            type: "dense",
            units: 128,
            activation: "relu",
            inputShape: [4],
          },
          {
            type: "dropout",
            rate: 0.2,
          },
          {
            type: "dense",
            units: 64,
            activation: "relu",
          },
          {
            type: "dropout",
            rate: 0.15,
          },
          {
            type: "dense",
            units: 32,
            activation: "relu",
          },
          {
            type: "dense",
            units: 1,
            activation: "linear",
          },
        ],
        optimizer: {
          type: "adam",
          learningRate: 0.001,
          beta1: 0.9,
          beta2: 0.999,
        },
        loss: "meanSquaredError",
        metrics: ["meanAbsoluteError", "meanSquaredError"],
        epochs: 150,
        batchSize: 32,
        validationSplit: 0.2,
        earlyStoppingPatience: 15,
        featureScaling: {
          method: "standardization",
          bedrooms: {
            mean: 2.8,
            std: 1.2,
          },
          bathrooms: {
            mean: 2.1,
            std: 0.8,
          },
          size: {
            mean: 1250,
            std: 450,
          },
          townEncoded: {
            mean: 0.5,
            std: 0.3,
          },
        },
        targetScaling: {
          method: "minmax",
          min: 800,
          max: 4500,
        },
      },
      features: [
        "specifications.bedrooms",
        "specifications.bathrooms",
        "specifications.size",
        "specifications.yearBuilt",
      ],
      target: "pricing.rent",
      useEmbeddings: true,
      incrementalLearning: true,
      textFeatures: ["location.address.town"],
    },
    trainingDataSource: "properties",
  },
];
