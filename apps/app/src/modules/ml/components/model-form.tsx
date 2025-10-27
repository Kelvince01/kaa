"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Alert, AlertDescription, AlertTitle } from "@kaa/ui/components/alert";
import { Badge } from "@kaa/ui/components/badge";
import { Button } from "@kaa/ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@kaa/ui/components/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@kaa/ui/components/collapsible";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@kaa/ui/components/form";
import { Input } from "@kaa/ui/components/input";
import { Label } from "@kaa/ui/components/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@kaa/ui/components/select";
import { Separator } from "@kaa/ui/components/separator";
import { Switch } from "@kaa/ui/components/switch";
import { Textarea } from "@kaa/ui/components/textarea";
import { Info, Loader2, Minus, Plus, Settings } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useCreateModel, useUpdateModel } from "../ai.queries";
import type { CreateModelRequest, IAIModel } from "../ai.type";
import { AI_CONFIG, MODEL_TYPE_LABELS } from "../ai.type";

const modelFormSchema = z.object({
  trainingDataSource: z.string(),
  name: z
    .string()
    .min(1, "Name is required")
    .max(100, "Name must be less than 100 characters"),
  type: z.enum([
    "classification",
    "regression",
    "clustering",
    "recommendation",
    "nlp",
    "custom",
  ]),
  description: z.string().optional(),
  algorithm: z.string().min(1, "Algorithm is required"),
  features: z.array(z.string()).min(1, "At least one feature is required"),
  target: z.string().optional(),
  textFeatures: z.array(z.string()).optional(),
  useEmbeddings: z.boolean(),
  incrementalLearning: z.boolean(),
  parameters: z.record(z.string(), z.any()).optional(),
});

type ModelFormData = z.infer<typeof modelFormSchema>;

type ModelFormProps = {
  model?: IAIModel;
  onSuccess?: (model: IAIModel) => void;
  onCancel?: () => void;
};

const ALGORITHM_OPTIONS = {
  classification: [
    { value: "dense_nn", label: "Dense Neural Network" },
    { value: "random_forest", label: "Random Forest" },
    { value: "svm", label: "Support Vector Machine" },
    { value: "logistic_regression", label: "Logistic Regression" },
  ],
  regression: [
    { value: "dense_nn", label: "Dense Neural Network" },
    { value: "linear_regression", label: "Linear Regression" },
    { value: "random_forest", label: "Random Forest Regression" },
    { value: "svr", label: "Support Vector Regression" },
  ],
  clustering: [
    { value: "kmeans", label: "K-Means" },
    { value: "dbscan", label: "DBSCAN" },
    { value: "hierarchical", label: "Hierarchical Clustering" },
  ],
  recommendation: [
    { value: "collaborative_filtering", label: "Collaborative Filtering" },
    { value: "content_based", label: "Content-Based" },
    { value: "hybrid", label: "Hybrid Approach" },
  ],
  nlp: [
    { value: "lstm", label: "LSTM" },
    { value: "transformer", label: "Transformer" },
    { value: "bert", label: "BERT" },
  ],
  custom: [{ value: "generic", label: "Generic" }],
};

export function ModelForm({ model, onSuccess, onCancel }: ModelFormProps) {
  const [features, setFeatures] = useState<string[]>(
    model?.configuration.features || [""]
  );
  const [textFeatures, setTextFeatures] = useState<string[]>(
    model?.configuration.textFeatures || []
  );
  const [currentFeature, setCurrentFeature] = useState("");
  const [currentTextFeature, setCurrentTextFeature] = useState("");
  const [parametersJson, setParametersJson] = useState<string>(
    JSON.stringify(model?.configuration.parameters || {}, null, 2)
  );
  const [parametersError, setParametersError] = useState<string>("");
  const [isParametersOpen, setIsParametersOpen] = useState(false);

  const createModelMutation = useCreateModel();
  const updateModelMutation = useUpdateModel();

  const form = useForm<ModelFormData>({
    resolver: zodResolver(modelFormSchema),
    defaultValues: {
      trainingDataSource: model?.trainingDataSource || "",
      name: model?.name || "",
      type: model?.type || "classification",
      description: model?.description || "",
      algorithm: model?.configuration.algorithm || "",
      features: model?.configuration.features || [],
      target: model?.configuration.target || "",
      textFeatures: model?.configuration.textFeatures || [],
      useEmbeddings: model?.configuration.useEmbeddings,
      incrementalLearning: model?.configuration.incrementalLearning,
      parameters: model?.configuration.parameters || {},
    },
  });

  const watchedType = form.watch("type");
  const watchedUseEmbeddings = form.watch("useEmbeddings");
  const watchedAlgorithm = form.watch("algorithm");

  useEffect(() => {
    // Update features in form when local state changes
    form.setValue(
      "features",
      features.filter((f) => f.trim() !== "")
    );
  }, [features, form]);

  useEffect(() => {
    // Update text features in form when local state changes
    form.setValue(
      "textFeatures",
      textFeatures.filter((f) => f.trim() !== "")
    );
  }, [textFeatures, form]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: ignore
  useEffect(() => {
    // Load default parameters based on algorithm selection
    if (watchedAlgorithm && !model) {
      const defaultParams = getDefaultParameters(watchedAlgorithm, watchedType);
      setParametersJson(JSON.stringify(defaultParams, null, 2));
      form.setValue("parameters", defaultParams);
    }
  }, [watchedAlgorithm, watchedType, model, form]);

  const getDefaultParameters = (algorithm: string, modelType: string) => {
    const defaults: Record<string, any> = {
      dense_nn: {
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
            units: modelType === "regression" ? 1 : 10,
            activation: modelType === "regression" ? "linear" : "softmax",
          },
        ],
        optimizer: {
          type: "adam",
          learningRate: 0.001,
          beta1: 0.9,
          beta2: 0.999,
        },
        loss:
          modelType === "regression"
            ? "meanSquaredError"
            : "categoricalCrossentropy",
        metrics:
          modelType === "regression"
            ? ["meanAbsoluteError", "meanSquaredError"]
            : ["accuracy"],
        epochs: 150,
        batchSize: 32,
        validationSplit: 0.2,
        earlyStoppingPatience: 15,
      },
      random_forest: {
        nEstimators: 100,
        maxDepth: null,
        minSamplesSplit: 2,
        minSamplesLeaf: 1,
        randomState: 42,
      },
      svm: {
        C: 1.0,
        kernel: "rbf",
        gamma: "scale",
        randomState: 42,
      },
      logistic_regression: {
        C: 1.0,
        maxIter: 1000,
        randomState: 42,
      },
      linear_regression: {
        fitIntercept: true,
        normalize: false,
      },
      kmeans: {
        nClusters: 3,
        randomState: 42,
        maxIter: 300,
      },
    };

    return defaults[algorithm] || {};
  };

  const validateParameters = (jsonString: string) => {
    try {
      const parsed = JSON.parse(jsonString);
      setParametersError("");
      return parsed;
    } catch (error) {
      setParametersError("Invalid JSON format");
      return null;
    }
  };

  const handleParametersChange = (value: string) => {
    setParametersJson(value);
    const parsed = validateParameters(value);
    if (parsed !== null) {
      form.setValue("parameters", parsed);
    }
  };

  const addFeature = () => {
    if (currentFeature.trim() && !features.includes(currentFeature.trim())) {
      setFeatures([...features, currentFeature.trim()]);
      setCurrentFeature("");
    }
  };

  const removeFeature = (index: number) => {
    setFeatures(features.filter((_, i) => i !== index));
  };

  const addTextFeature = () => {
    if (
      currentTextFeature.trim() &&
      !textFeatures.includes(currentTextFeature.trim())
    ) {
      setTextFeatures([...textFeatures, currentTextFeature.trim()]);
      setCurrentTextFeature("");
    }
  };

  const removeTextFeature = (index: number) => {
    setTextFeatures(textFeatures.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: ModelFormData) => {
    const requestData: CreateModelRequest = {
      trainingDataSource: data.trainingDataSource,
      name: data.name,
      type: data.type,
      description: data.description,
      configuration: {
        algorithm: data.algorithm,
        parameters: data.parameters || {},
        features: data.features,
        target: data.target,
        textFeatures: data.textFeatures,
        useEmbeddings: data.useEmbeddings,
        incrementalLearning: data.incrementalLearning,
      },
    };

    try {
      let result: IAIModel;
      if (model) {
        result = await updateModelMutation.mutateAsync({
          modelId: model._id,
          data: requestData,
        });
      } else {
        result = await createModelMutation.mutateAsync(requestData);
      }

      onSuccess?.(result);
    } catch (error) {
      console.error("Failed to save model:", error);
    }
  };

  const isLoading =
    createModelMutation.isPending || updateModelMutation.isPending;

  return (
    <Card className="mx-auto w-full max-w-4xl">
      <CardHeader>
        <CardTitle>{model ? "Edit Model" : "Create New Model"}</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="font-medium text-lg">Basic Information</h3>

              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="trainingDataSource"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Training Data Source *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter training data source"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Model Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter model name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Model Type *</FormLabel>
                      <Select
                        defaultValue={field.value}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select model type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {AI_CONFIG.SUPPORTED_MODEL_TYPES.map((type) => (
                            <SelectItem key={type} value={type}>
                              {MODEL_TYPE_LABELS[type]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe what this model does..."
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Separator />

            {/* Configuration */}
            <div className="space-y-4">
              <h3 className="font-medium text-lg">Configuration</h3>

              <FormField
                control={form.control}
                name="algorithm"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Algorithm *</FormLabel>
                    <Select
                      defaultValue={field.value}
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select algorithm" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {ALGORITHM_OPTIONS[watchedType]?.map((algorithm) => (
                          <SelectItem
                            key={algorithm.value}
                            value={algorithm.value}
                          >
                            {algorithm.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Features */}
              <div className="space-y-3">
                <Label>Input Features *</Label>
                <div className="flex gap-2">
                  <Input
                    onChange={(e) => setCurrentFeature(e.target.value)}
                    onKeyPress={(e) =>
                      // biome-ignore lint/complexity/noCommaOperator: ignore
                      e.key === "Enter" && (e.preventDefault(), addFeature())
                    }
                    placeholder="Feature name (e.g., age, price, rating)"
                    value={currentFeature}
                  />
                  <Button onClick={addFeature} type="button" variant="outline">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {features.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {features.map(
                      (feature, index) =>
                        feature.trim() && (
                          <Badge
                            className="flex items-center gap-1"
                            key={feature}
                            variant="secondary"
                          >
                            {feature}
                            <button
                              className="ml-1 rounded-full p-0.5 hover:bg-red-100"
                              onClick={() => removeFeature(index)}
                              type="button"
                            >
                              <Minus className="h-3 w-3" />
                            </button>
                          </Badge>
                        )
                    )}
                  </div>
                )}
              </div>

              {/* Target (for supervised learning) */}
              {(watchedType === "classification" ||
                watchedType === "regression") && (
                <FormField
                  control={form.control}
                  name="target"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Target Variable *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="The variable to predict (e.g., price, category)"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        The output variable that the model will learn to predict
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {/* Algorithm Parameters */}
              <Collapsible
                onOpenChange={setIsParametersOpen}
                open={isParametersOpen}
              >
                <CollapsibleTrigger asChild>
                  <Button className="w-full" type="button" variant="outline">
                    <Settings className="mr-2 h-4 w-4" />
                    Algorithm Parameters
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-2">
                  <div className="rounded-lg border p-4">
                    <Label htmlFor="parameters">Parameters (JSON)</Label>
                    <Textarea
                      className="font-mono text-sm"
                      id="parameters"
                      onChange={(e) => handleParametersChange(e.target.value)}
                      placeholder="Enter algorithm parameters in JSON format..."
                      rows={12}
                      value={parametersJson}
                    />
                    {parametersError && (
                      <p className="mt-1 text-red-500 text-sm">
                        {parametersError}
                      </p>
                    )}
                    <FormDescription className="mt-2">
                      Configure algorithm-specific parameters. Default values
                      will be loaded based on the selected algorithm.
                    </FormDescription>
                  </div>
                </CollapsibleContent>
              </Collapsible>

              {/* Advanced Options */}
              <div className="space-y-4">
                <h4 className="font-medium">Advanced Options</h4>

                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="useEmbeddings"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">
                            Use Embeddings
                          </FormLabel>
                          <FormDescription>
                            Enable text embeddings for better feature
                            representation
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="incrementalLearning"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">
                            Incremental Learning
                          </FormLabel>
                          <FormDescription>
                            Allow the model to learn from new data continuously
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                {/* Text Features (if embeddings enabled) */}
                {watchedUseEmbeddings && (
                  <div className="space-y-3">
                    <Label>Text Features</Label>
                    <div className="flex gap-2">
                      <Input
                        onChange={(e) => setCurrentTextFeature(e.target.value)}
                        onKeyPress={(e) =>
                          e.key === "Enter" &&
                          // biome-ignore lint/complexity/noCommaOperator: ignore
                          (e.preventDefault(), addTextFeature())
                        }
                        placeholder="Text feature name (e.g., description, title)"
                        value={currentTextFeature}
                      />
                      <Button
                        onClick={addTextFeature}
                        type="button"
                        variant="outline"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    {textFeatures.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {textFeatures.map(
                          (feature, index) =>
                            feature.trim() && (
                              <Badge
                                className="flex items-center gap-1"
                                key={feature}
                                variant="outline"
                              >
                                {feature}
                                <button
                                  className="ml-1 rounded-full p-0.5 hover:bg-red-100"
                                  onClick={() => removeTextFeature(index)}
                                  type="button"
                                >
                                  <Minus className="h-3 w-3" />
                                </button>
                              </Badge>
                            )
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Information Alert */}
            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>Training Information</AlertTitle>
              <AlertDescription>
                After creating the model, you'll need to provide training data
                and initiate the training process. The model will not be
                available for predictions until training is completed
                successfully.
              </AlertDescription>
            </Alert>

            {/* Actions */}
            <div className="flex justify-end space-x-4">
              {onCancel && (
                <Button onClick={onCancel} type="button" variant="outline">
                  Cancel
                </Button>
              )}
              <Button disabled={isLoading} type="submit">
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {model ? "Update Model" : "Create Model"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
