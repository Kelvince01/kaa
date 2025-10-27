"use client";

import { Badge } from "@kaa/ui/components/badge";
import { Button } from "@kaa/ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@kaa/ui/components/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@kaa/ui/components/dropdown-menu";
import { Input } from "@kaa/ui/components/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@kaa/ui/components/select";
import { formatDistanceToNow } from "date-fns";
import {
  Loader2,
  MoreHorizontal,
  Play,
  Plus,
  Search,
  Settings,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import {
  useDeleteModel,
  useDeployModel,
  useModels,
  useTrainModel,
} from "../ai.queries";
import type { IAIModel, ListOptions } from "../ai.type";
import {
  MODEL_STAGE_LABELS,
  MODEL_STATUS_LABELS,
  MODEL_TYPE_LABELS,
} from "../ai.type";

type ModelListProps = {
  onCreateModel?: () => void;
  onEditModel?: (model: IAIModel) => void;
  onViewModel?: (model: IAIModel) => void;
};

export function ModelList({
  onCreateModel,
  onEditModel,
  onViewModel,
}: ModelListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<IAIModel["status"] | "all">(
    "all"
  );
  const [typeFilter, setTypeFilter] = useState<IAIModel["type"] | "all">("all");
  const [page, setPage] = useState(1);

  const queryOptions: ListOptions = {
    page,
    limit: 10,
    search: searchTerm || undefined,
    status: statusFilter === "all" ? undefined : statusFilter,
    type: typeFilter === "all" ? undefined : typeFilter,
  };

  const { data, isLoading, error } = useModels(queryOptions);
  const deleteModelMutation = useDeleteModel();
  const trainModelMutation = useTrainModel();
  const deployModelMutation = useDeployModel();

  const handleDeleteModel = (modelId: string) => {
    if (
      // biome-ignore lint/suspicious/noAlert: ignore
      confirm(
        "Are you sure you want to delete this model? This action cannot be undone."
      )
    ) {
      deleteModelMutation.mutate(modelId);
    }
  };

  const handleTrainModel = (modelId: string) => {
    trainModelMutation.mutate({ modelId });
  };

  const handleDeployModel = (modelId: string) => {
    deployModelMutation.mutate({ modelId });
  };

  const getStatusBadgeVariant = (status: IAIModel["status"]) => {
    switch (status) {
      case "ready":
        return "default";
      case "training":
        return "secondary";
      case "error":
        return "destructive";
      case "deprecated":
        return "outline";
      default:
        return "secondary";
    }
  };

  const getAccuracyColor = (accuracy?: number) => {
    if (!accuracy) return "text-gray-500";
    if (accuracy >= 0.9) return "text-green-600";
    if (accuracy >= 0.7) return "text-yellow-600";
    return "text-red-600";
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-gray-600 text-sm">Loading models...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-12 text-center">
        <p className="text-red-600">Failed to load models. Please try again.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-bold text-2xl text-gray-900">AI Models</h2>
          <p className="mt-1 text-gray-600">
            Manage your machine learning models
          </p>
        </div>
        <Button className="flex items-center gap-2" onClick={onCreateModel}>
          <Plus className="h-4 w-4" />
          Create Model
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-gray-500" />
          <Input
            className="pl-10"
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search models..."
            value={searchTerm}
          />
        </div>
        <Select
          onValueChange={(value) => setStatusFilter(value as any)}
          value={statusFilter}
        >
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="ready">Ready</SelectItem>
            <SelectItem value="training">Training</SelectItem>
            <SelectItem value="error">Error</SelectItem>
            <SelectItem value="deprecated">Deprecated</SelectItem>
          </SelectContent>
        </Select>
        <Select
          onValueChange={(value) => setTypeFilter(value as any)}
          value={typeFilter}
        >
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="classification">Classification</SelectItem>
            <SelectItem value="regression">Regression</SelectItem>
            <SelectItem value="clustering">Clustering</SelectItem>
            <SelectItem value="recommendation">Recommendation</SelectItem>
            <SelectItem value="nlp">NLP</SelectItem>
            <SelectItem value="custom">Custom</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Models Grid */}
      {data?.items && data.items.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {data.items.map((model) => (
            <Card
              className="cursor-pointer transition-shadow hover:shadow-lg"
              key={model._id}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="line-clamp-1 font-semibold text-lg">
                      {model.name}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge variant={getStatusBadgeVariant(model.status)}>
                        {MODEL_STATUS_LABELS[model.status]}
                      </Badge>
                      <Badge variant="outline">
                        {MODEL_TYPE_LABELS[model.type]}
                      </Badge>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="sm" variant="ghost">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onViewModel?.(model)}>
                        <Settings className="mr-2 h-4 w-4" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onEditModel?.(model)}>
                        <Settings className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      {model.status === "ready" && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleTrainModel(model._id)}
                          >
                            <Play className="mr-2 h-4 w-4" />
                            Retrain
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDeployModel(model._id)}
                          >
                            <Play className="mr-2 h-4 w-4" />
                            Deploy
                          </DropdownMenuItem>
                        </>
                      )}
                      {model.status === "error" && (
                        <DropdownMenuItem
                          onClick={() => handleTrainModel(model._id)}
                        >
                          <Play className="mr-2 h-4 w-4" />
                          Retry Training
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-red-600"
                        onClick={() => handleDeleteModel(model._id)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {model.description && (
                  <p className="line-clamp-2 text-gray-600 text-sm">
                    {model.description}
                  </p>
                )}

                {/* Performance Metrics */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Accuracy:</span>
                    <span
                      className={getAccuracyColor(model.performance?.accuracy)}
                    >
                      {model.performance?.accuracy
                        ? `${(model.performance?.accuracy * 100).toFixed(1)}%`
                        : "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Predictions:</span>
                    <span className="font-medium">
                      {model.usage.totalPredictions.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Stage:</span>
                    <span className="font-medium">
                      {model.lifecycle.stage
                        ? MODEL_STAGE_LABELS[model.lifecycle.stage]
                        : "Development"}
                    </span>
                  </div>
                </div>

                {/* Training Info */}
                <div className="border-t pt-3 text-gray-500 text-xs">
                  <div className="flex justify-between">
                    <span>Version:</span>
                    <span>{model.version}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Last trained:</span>
                    <span>
                      {formatDistanceToNow(
                        new Date(model.trainingData.lastTrained),
                        {
                          addSuffix: true,
                        }
                      )}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="py-12 text-center">
          <div className="mx-auto max-w-md">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
              <Settings className="h-6 w-6 text-gray-600" />
            </div>
            <h3 className="mt-4 font-medium text-gray-900 text-lg">
              No models found
            </h3>
            <p className="mt-2 text-gray-600">
              {searchTerm || statusFilter !== "all" || typeFilter !== "all"
                ? "Try adjusting your filters or search terms."
                : "Get started by creating your first AI model."}
            </p>
            {!searchTerm && statusFilter === "all" && typeFilter === "all" && (
              <Button className="mt-4" onClick={onCreateModel}>
                <Plus className="mr-2 h-4 w-4" />
                Create Model
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Pagination */}
      {data && data.pagination.pages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-gray-600 text-sm">
            Showing {(page - 1) * 10 + 1} to{" "}
            {Math.min(page * 10, data.pagination.total)} of{" "}
            {data.pagination.total} models
          </p>
          <div className="flex gap-2">
            <Button
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
              size="sm"
              variant="outline"
            >
              Previous
            </Button>
            <Button
              disabled={page >= data.pagination.pages}
              onClick={() => setPage(page + 1)}
              size="sm"
              variant="outline"
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
