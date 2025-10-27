"use client";

import { Badge } from "@kaa/ui/components/badge";
import { Button } from "@kaa/ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@kaa/ui/components/card";
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
import { Textarea } from "@kaa/ui/components/textarea";
import { Brain, Download, Loader2, Upload } from "lucide-react";
import { useState } from "react";
import { useBatchPredict, useModels, usePredict } from "../ai.queries";
import type { PredictionResponse } from "../ai.type";

type PredictionFormProps = {
  modelId?: string;
  onPredictionComplete?: (
    result: PredictionResponse | PredictionResponse[]
  ) => void;
};

export function PredictionForm({
  modelId,
  onPredictionComplete,
}: PredictionFormProps) {
  const [selectedModelId, setSelectedModelId] = useState<string>(modelId || "");
  const [inputData, setInputData] = useState<Record<string, any>>({});
  const [batchMode, setBatchMode] = useState(false);
  const [batchInputs, setBatchInputs] = useState<Record<string, any>[]>([]);
  const [batchJsonInput, setBatchJsonInput] = useState("");
  const [lastPrediction, setLastPrediction] = useState<
    PredictionResponse | PredictionResponse[] | null
  >(null);

  const { data: modelsData } = useModels({ status: "ready" });
  const predictMutation = usePredict();
  const batchPredictMutation = useBatchPredict();

  const selectedModel = modelsData?.items.find(
    (model) => model._id === selectedModelId
  );

  const handleInputChange = (field: string, value: any) => {
    console.log("handleInputChange called with:", field, value); // Debug log
    setInputData((prev) => {
      const newData = {
        ...prev,
        [field]: value,
      };
      console.log("Updated inputData:", newData); // Debug log
      return newData;
    });
  };

  const handlePredict = async () => {
    if (!selectedModelId) return;

    console.log(inputData);

    try {
      const result = await predictMutation.mutateAsync({
        id: selectedModelId,
        data: {
          input: inputData,
        },
      });

      setLastPrediction(result);
      onPredictionComplete?.(result);
    } catch (error) {
      console.error("Prediction failed:", error);
    }
  };

  const handleBatchPredict = async () => {
    if (!selectedModelId) return;

    try {
      let inputs: Record<string, any>[] = [];

      if (batchJsonInput) {
        inputs = JSON.parse(batchJsonInput);
      } else {
        inputs = batchInputs;
      }

      const result = await batchPredictMutation.mutateAsync({
        modelId: selectedModelId,
        inputs,
      });

      setLastPrediction(result.predictions);
      onPredictionComplete?.(result.predictions);
    } catch (error) {
      console.error("Batch prediction failed:", error);
    }
  };

  const addBatchInput = () => {
    setBatchInputs((prev) => [...prev, {}]);
  };

  const updateBatchInput = (index: number, field: string, value: any) => {
    setBatchInputs((prev) =>
      prev.map((input, i) =>
        i === index ? { ...input, [field]: value } : input
      )
    );
  };

  const removeBatchInput = (index: number) => {
    setBatchInputs((prev) => prev.filter((_, i) => i !== index));
  };

  const exportResults = () => {
    if (!lastPrediction) return;

    const dataStr = JSON.stringify(lastPrediction, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `predictions-${new Date().toISOString()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const renderInputFields = (
    inputs: Record<string, any>,
    onChange: (field: string, value: any) => void
  ) => {
    if (!selectedModel) return null;

    console.log("Features:", selectedModel.configuration.features); // Debug log
    console.log("Current inputs:", inputs); // Debug log

    return selectedModel.configuration.features.map((feature) => (
      <div className="space-y-2" key={feature}>
        <Label htmlFor={feature}>
          {feature.charAt(0).toUpperCase() + feature.slice(1)}
        </Label>
        <Input
          id={feature}
          onChange={(e) => {
            const value = e.target.value;
            console.log(`Input change for ${feature}:`, value); // Debug log
            // Try to parse as number if it's numeric
            const numericValue =
              !Number.isNaN(Number(value)) && value !== ""
                ? Number(value)
                : value;
            console.log(`Processed value for ${feature}:`, numericValue); // Debug log
            onChange(feature, numericValue);
          }}
          placeholder={`Enter ${feature}`}
          type="text"
          value={inputs[feature] || ""}
        />
      </div>
    ));
  };

  const renderPredictionResult = (
    result: PredictionResponse,
    index?: number
  ) => (
    <div className="space-y-3 rounded-lg bg-gray-50 p-4" key={index}>
      {index !== undefined && (
        <div className="font-medium text-gray-600 text-sm">
          Prediction {index + 1}
        </div>
      )}

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="font-medium text-sm">Prediction:</span>
          <Badge className="font-mono" variant="outline">
            {result.data.prediction}
          </Badge>
        </div>

        {result.confidence && (
          <div className="flex items-center justify-between">
            <span className="font-medium text-sm">Confidence:</span>
            <Badge
              variant={
                result.confidence > 0.8
                  ? "default"
                  : result.confidence > 0.6
                    ? "secondary"
                    : "outline"
              }
            >
              {(result.confidence * 100).toFixed(1)}%
            </Badge>
          </div>
        )}

        {result.probabilities && (
          <div className="space-y-1">
            <span className="font-medium text-sm">Probabilities:</span>
            <div className="space-y-1">
              {Object.entries(result.probabilities).map(([label, prob]) => (
                <div className="flex justify-between text-sm" key={label}>
                  <span className="text-gray-600">{label}:</span>
                  <span className="font-mono">{(prob * 100).toFixed(1)}%</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between text-gray-500 text-xs">
          <span>Processing time:</span>
          <span>{result.processingTime}ms</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Make Predictions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Model Selection */}
          <div className="space-y-2">
            <Label htmlFor="model">Select Model</Label>
            <Select onValueChange={setSelectedModelId} value={selectedModelId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a model for predictions" />
              </SelectTrigger>
              <SelectContent>
                {modelsData?.items.map((model) => (
                  <SelectItem key={model._id} value={model._id}>
                    <div className="flex items-center gap-2">
                      <span>{model.name}</span>
                      <Badge className="text-xs" variant="outline">
                        {model.type}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedModel && (
            <>
              {/* Model Info */}
              <div className="space-y-2 rounded-lg bg-blue-50 p-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm">Model Type:</span>
                  <Badge>{selectedModel.type}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm">Features:</span>
                  <span className="text-gray-600 text-sm">
                    {selectedModel.configuration.features.length} inputs
                    required
                  </span>
                </div>
                {selectedModel.performance.accuracy && (
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">Accuracy:</span>
                    <span className="font-semibold text-green-600 text-sm">
                      {(selectedModel.performance.accuracy * 100).toFixed(1)}%
                    </span>
                  </div>
                )}
              </div>

              {/* Batch Mode Toggle */}
              <div className="flex items-center space-x-2">
                <input
                  checked={batchMode}
                  className="rounded border-gray-300"
                  id="batchMode"
                  onChange={(e) => setBatchMode(e.target.checked)}
                  type="checkbox"
                />
                <Label htmlFor="batchMode">Batch predictions</Label>
              </div>

              <Separator />

              {batchMode ? (
                /* Batch Predictions */
                <div className="space-y-4">
                  <h4 className="font-medium">Batch Input</h4>

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="batchJson">JSON Input (Optional)</Label>
                      <Textarea
                        className="font-mono text-sm"
                        id="batchJson"
                        onChange={(e) => setBatchJsonInput(e.target.value)}
                        placeholder="Paste JSON array of input objects here..."
                        rows={6}
                        value={batchJsonInput}
                      />
                    </div>

                    <div className="text-center">
                      <span className="text-gray-500 text-sm">OR</span>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label>Manual Input</Label>
                        <Button
                          onClick={addBatchInput}
                          size="sm"
                          variant="outline"
                        >
                          Add Input
                        </Button>
                      </div>

                      {batchInputs.map((input, index) => (
                        <Card className="p-4" key={input._id}>
                          <div className="mb-3 flex items-start justify-between">
                            <span className="font-medium text-sm">
                              Input {index + 1}
                            </span>
                            <Button
                              onClick={() => removeBatchInput(index)}
                              size="sm"
                              variant="ghost"
                            >
                              Remove
                            </Button>
                          </div>
                          <div className="grid gap-3 md:grid-cols-2">
                            {renderInputFields(input, (field, value) =>
                              updateBatchInput(index, field, value)
                            )}
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>

                  <Button
                    className="w-full"
                    disabled={
                      !(
                        selectedModelId &&
                        (batchJsonInput || batchInputs.length)
                      ) || batchPredictMutation.isPending
                    }
                    onClick={handleBatchPredict}
                  >
                    {batchPredictMutation.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="mr-2 h-4 w-4" />
                    )}
                    Run Batch Predictions
                  </Button>
                </div>
              ) : (
                /* Single Prediction */
                <div className="space-y-4">
                  <h4 className="font-medium">Input Features</h4>
                  <div className="grid gap-4 md:grid-cols-2">
                    {renderInputFields(inputData, handleInputChange)}
                  </div>

                  <Button
                    className="w-full"
                    disabled={
                      !selectedModelId ||
                      Object.keys(inputData).length === 0 ||
                      !selectedModel?.configuration.features.every(
                        (feature) =>
                          inputData[feature] !== undefined &&
                          inputData[feature] !== ""
                      ) ||
                      predictMutation.isPending
                    }
                    onClick={handlePredict}
                  >
                    {predictMutation.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Brain className="mr-2 h-4 w-4" />
                    )}
                    Make Prediction
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Results */}
      {lastPrediction && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Prediction Results</CardTitle>
              <Button onClick={exportResults} size="sm" variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {Array.isArray(lastPrediction) ? (
              <div className="space-y-4">
                {lastPrediction.map((result, index) =>
                  renderPredictionResult(result, index)
                )}
              </div>
            ) : (
              renderPredictionResult(lastPrediction)
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
