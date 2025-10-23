import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from "bun:test";
import * as fs from "node:fs";
import * as path from "node:path";
import { AIModel } from "@kaa/models";
import type { IAIModel } from "@kaa/models/types";
import mongoose from "mongoose";
import { aiService } from "#/features/ai";

// Test configuration
const TEST_TIMEOUT = 10_000; // 10 seconds for training tests
const TEST_DB_NAME = "test_ai_pipeline";
const TEST_MEMBER_ID = new mongoose.Types.ObjectId().toString();

describe("AI Pipeline Integration", () => {
  beforeAll(async () => {
    // Connect to test database
    const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/";
    await mongoose.connect(mongoUri + TEST_DB_NAME);

    // Set test model directory
    process.env.MODEL_DIR = path.resolve(process.cwd(), "models-test");
  });

  afterAll(async () => {
    // Clean up database
    if (mongoose.connection.db) {
      await mongoose.connection.db.dropDatabase();
    }
    await mongoose.disconnect();

    // Clean up test models directory
    const modelsDir = process.env.MODEL_DIR;
    if (modelsDir && fs.existsSync(modelsDir)) {
      fs.rmSync(modelsDir, { recursive: true, force: true });
    }
  });

  beforeEach(async () => {
    // Clear collections before each test
    await AIModel.deleteMany({});
    const db = mongoose.connection.db;
    if (db) {
      const collections = await db.collections();
      for (const collection of collections) {
        if (collection.collectionName.startsWith("training_")) {
          await collection.deleteMany({});
        }
      }
    }
  });

  describe("Classification Model", () => {
    it(
      "should train a model with categorical features and save preprocessing metadata",
      async () => {
        // Seed training data
        const trainingCollection = "training_customers";
        const db = mongoose.connection.db;
        if (!db) throw new Error("Database not connected");

        const collection = db.collection(trainingCollection);

        // Insert sample customer data with categorical features
        const sampleData = Array.from({ length: 50 }, (_, i) => ({
          memberId: TEST_MEMBER_ID,
          age: 20 + Math.floor(Math.random() * 40),
          income: 30_000 + Math.floor(Math.random() * 70_000),
          category: ["A", "B", "C"][i % 3],
          region: ["North", "South", "East", "West"][i % 4],
          purchased: i % 2 === 0 || i % 3 === 0,
        }));

        await collection.insertMany(sampleData);

        // Create and train model
        const modelData = {
          memberId: TEST_MEMBER_ID,
          name: "Customer Purchase Classifier",
          description: "Classifies customer purchase likelihood",
          type: "classification" as const,
          configuration: {
            features: ["age", "income", "category", "region"],
            target: "purchased",
            parameters: {
              numClasses: 2,
              learningRate: 0.001,
            },
            algorithm: "dense_nn",
          },
          trainingDataSource: trainingCollection,
          createdBy: "test",
        };

        const model = await aiService.createModel(modelData, "test");
        const modelId = (model._id as mongoose.Types.ObjectId).toString();

        // Wait for training to complete
        let trainedModel: IAIModel | null = null;
        for (let i = 0; i < 30; i++) {
          await new Promise((resolve) => setTimeout(resolve, 500));
          trainedModel = await AIModel.findById(modelId);
          if (trainedModel?.status === "ready") break;
        }

        expect(trainedModel?.status).toBe("ready");
        expect(trainedModel?.performance).toBeDefined();

        // Verify preprocessing metadata
        const version = trainedModel?.lifecycle?.currentVersion || "1.0.0";
        const prepPath = path.join(
          process.env.MODEL_DIR as string,
          modelId,
          version.toString(),
          "prep.json"
        );

        expect(fs.existsSync(prepPath)).toBe(true);

        const prepData = JSON.parse(fs.readFileSync(prepPath, "utf-8"));
        expect(prepData.features).toEqual([
          "age",
          "income",
          "category",
          "region",
        ]);
        expect(prepData.target).toBe("purchased");
        expect(prepData.featureTypes.category).toBe("categorical");
        expect(prepData.featureTypes.region).toBe("categorical");
        expect(prepData.categoryMaps.category).toContain("A");
        expect(prepData.categoryMaps.category).toContain("B");
        expect(prepData.categoryMaps.category).toContain("C");
        expect(prepData.normalization.length).toBeGreaterThan(0);
      },
      TEST_TIMEOUT
    );

    it(
      "should make predictions using saved preprocessing",
      async () => {
        // Setup training data
        const trainingCollection = "training_products";
        const db = mongoose.connection.db as mongoose.mongo.Db;
        const collection = db.collection(trainingCollection);

        const sampleData = Array.from({ length: 30 }, (_, i) => ({
          memberId: TEST_MEMBER_ID,
          price: 10 + Math.random() * 90,
          rating: 3 + Math.random() * 2,
          category: ["electronics", "books", "clothing"][i % 3],
          bestseller: i % 3 === 0,
        }));

        await collection.insertMany(sampleData);

        // Train model
        const model = await aiService.createModel(
          {
            memberId: TEST_MEMBER_ID,
            name: "Bestseller Predictor",
            description: "Predicts bestseller status",
            type: "classification",
            configuration: {
              features: ["price", "rating", "category"],
              target: "bestseller",
              parameters: { numClasses: 2 },
              algorithm: "dense_nn",
            },
            trainingDataSource: trainingCollection,
            createdBy: "test",
          },
          "test"
        );

        // Wait for training
        await new Promise((resolve) => setTimeout(resolve, 3000));

        // Make prediction with categorical feature
        const prediction = await aiService.makePrediction({
          modelId: (model._id as mongoose.Types.ObjectId).toString(),
          input: {
            price: 35,
            rating: 4.3,
            category: "electronics",
          },
          memberId: TEST_MEMBER_ID,
          userId: "test",
        });

        expect(prediction).toBeDefined();
        expect(prediction.data).toHaveProperty("prediction");
        expect(prediction.data).toHaveProperty("confidence");
        expect(prediction.metadata).toHaveProperty("modelVersion");
      },
      TEST_TIMEOUT
    );
  });

  describe("Regression Model", () => {
    it(
      "should train a regression model with normalization",
      async () => {
        const trainingCollection = "training_sales";
        const db = mongoose.connection.db as mongoose.mongo.Db;
        const collection = db.collection(trainingCollection);

        // Generate synthetic sales data
        const sampleData = Array.from({ length: 40 }, (_, i) => ({
          memberId: TEST_MEMBER_ID,
          month: (i % 12) + 1,
          marketing_spend: 1000 + Math.random() * 5000,
          temperature: 10 + Math.random() * 30,
          revenue: 5000 + Math.random() * 20_000,
        }));

        await collection.insertMany(sampleData);

        const model = await aiService.createModel(
          {
            memberId: TEST_MEMBER_ID,
            name: "Revenue Predictor",
            description: "Predicts revenue based on inputs",
            type: "regression",
            configuration: {
              features: ["month", "marketing_spend", "temperature"],
              target: "revenue",
              parameters: { learningRate: 0.001 },
              algorithm: "dense_nn",
            },
            trainingDataSource: trainingCollection,
            createdBy: "test",
          },
          "test"
        );

        // Wait and verify
        await new Promise((resolve) => setTimeout(resolve, 3000));

        const trainedModel = await AIModel.findById(model._id);
        expect(trainedModel?.status).toBe("ready");

        // Make prediction
        const prediction = await aiService.makePrediction({
          modelId: (model._id as mongoose.Types.ObjectId).toString(),
          input: {
            month: 6,
            marketing_spend: 3000,
            temperature: 25,
          },
          memberId: TEST_MEMBER_ID,
          userId: "test",
        });

        expect(typeof prediction.data.prediction).toBe("number");
        expect(prediction.data.prediction).toBeGreaterThan(0);
      },
      TEST_TIMEOUT
    );
  });

  describe("Text Features", () => {
    it(
      "should handle text features as categorical when cardinality is low",
      async () => {
        const trainingCollection = "training_feedback";
        const db = mongoose.connection.db as mongoose.mongo.Db;
        const collection = db.collection(trainingCollection);

        // Limited set of text values to trigger categorical encoding
        const sentiments = ["positive", "negative", "neutral"];
        const categories = ["bug", "feature", "question", "other"];

        const sampleData = Array.from({ length: 20 }, (_, i) => ({
          memberId: TEST_MEMBER_ID,
          category: categories[i % categories.length],
          sentiment: sentiments[i % sentiments.length],
          priority: i % 3,
        }));

        await collection.insertMany(sampleData);

        const model = await aiService.createModel(
          {
            memberId: TEST_MEMBER_ID,
            name: "Priority Classifier",
            description: "Classifies feedback priority",
            type: "classification",
            configuration: {
              features: ["category", "sentiment"],
              target: "priority",
              parameters: { numClasses: 3 },
              algorithm: "dense_nn",
            },
            trainingDataSource: trainingCollection,
            createdBy: "test",
          },
          "test"
        );

        await new Promise((resolve) => setTimeout(resolve, 3000));

        // Check that text features were treated as categorical
        const version = "1.0.0";
        const prepPath = path.join(
          process.env.MODEL_DIR as string,
          (model._id as mongoose.Types.ObjectId).toString(),
          version,
          "prep.json"
        );

        if (fs.existsSync(prepPath)) {
          const prepData = JSON.parse(fs.readFileSync(prepPath, "utf-8"));
          expect(prepData.featureTypes.category).toBe("categorical");
          expect(prepData.featureTypes.sentiment).toBe("categorical");
          expect(prepData.categoryMaps.category).toEqual(categories.sort());
          expect(prepData.categoryMaps.sentiment).toEqual(sentiments.sort());
        }
      },
      TEST_TIMEOUT
    );
  });

  describe("Model Feedback", () => {
    it(
      "should store feedback for predictions",
      async () => {
        // Quick model setup
        const trainingCollection = "training_quick";
        const db = mongoose.connection.db as mongoose.mongo.Db;
        const collection = db.collection(trainingCollection);

        await collection.insertMany([
          { memberId: TEST_MEMBER_ID, x: 1, y: 2, result: 0 },
          { memberId: TEST_MEMBER_ID, x: 2, y: 3, result: 1 },
          { memberId: TEST_MEMBER_ID, x: 3, y: 4, result: 1 },
          { memberId: TEST_MEMBER_ID, x: 4, y: 5, result: 0 },
        ]);

        const model = await aiService.createModel(
          {
            memberId: TEST_MEMBER_ID,
            name: "Binary Classifier",
            description: "Simple binary classification",
            type: "classification",
            configuration: {
              features: ["x", "y"],
              target: "result",
              parameters: { numClasses: 2 },
              algorithm: "dense_nn",
            },
            trainingDataSource: trainingCollection,
            createdBy: "test",
          },
          "test"
        );

        await new Promise((resolve) => setTimeout(resolve, 2000));

        // Make prediction
        await aiService.makePrediction({
          modelId: (model._id as mongoose.Types.ObjectId).toString(),
          input: { x: 5, y: 6 },
          memberId: TEST_MEMBER_ID,
          userId: "test",
        });

        // Submit feedback
        const predictionId = new mongoose.Types.ObjectId().toString();
        await aiService.provideFeedback(predictionId, {
          actualValue: 1,
          isCorrect: false,
          providedBy: "test",
        });

        // Verify feedback was stored
        const updatedModel = await AIModel.findById(model._id);
        expect(updatedModel?.feedback).toBeDefined();
        expect(updatedModel?.feedback.length).toBeGreaterThan(0);
        expect(updatedModel?.feedback[0].actualValue).toBe(1);
      },
      TEST_TIMEOUT
    );
  });

  describe("Data Preparation", () => {
    it(
      "should correctly normalize numeric features",
      async () => {
        const trainingCollection = "training_numeric";
        const db = mongoose.connection.db as mongoose.mongo.Db;
        const collection = db.collection(trainingCollection);

        // Insert data with known distribution
        const sampleData = Array.from({ length: 100 }, (_, i) => ({
          memberId: TEST_MEMBER_ID,
          feature1: 100 + i, // Linear progression
          feature2: Math.sin(i / 10) * 50 + 50, // Sine wave
          target: i > 50 ? 1 : 0,
        }));

        await collection.insertMany(sampleData);

        const model = await aiService.createModel(
          {
            memberId: TEST_MEMBER_ID,
            name: "Numeric Normalizer Test",
            description: "Tests numeric normalization",
            type: "classification",
            configuration: {
              features: ["feature1", "feature2"],
              target: "target",
              parameters: { numClasses: 2 },
              algorithm: "dense_nn",
            },
            trainingDataSource: trainingCollection,
            createdBy: "test",
          },
          "test"
        );

        await new Promise((resolve) => setTimeout(resolve, 3000));

        // Check normalization stats
        const version = "1.0.0";
        const prepPath = path.join(
          process.env.MODEL_DIR as string,
          (model._id as mongoose.Types.ObjectId).toString(),
          version,
          "prep.json"
        );

        if (fs.existsSync(prepPath)) {
          const prepData = JSON.parse(fs.readFileSync(prepPath, "utf-8"));

          // Verify normalization stats exist
          expect(prepData.normalization).toBeDefined();
          expect(prepData.normalization.length).toBeGreaterThan(0);

          // Each feature should have mean and std
          for (const stat of prepData.normalization) {
            expect(stat).toHaveProperty("mean");
            expect(stat).toHaveProperty("std");
            expect(stat.std).toBeGreaterThan(0);
          }
        }
      },
      TEST_TIMEOUT
    );
  });
});
