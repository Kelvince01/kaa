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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@kaa/ui/components/tabs";
import { Activity, BarChart3, Brain, Plus, TrendingUp } from "lucide-react";
import { useState } from "react";
import { useHealthStatus, useModels } from "@/modules/ml/ai.queries";
import type { IAIModel } from "@/modules/ml/ai.type";
import { ModelForm, ModelList, PredictionForm } from "@/modules/ml/components";

export default function AIAdminPage() {
  const [activeTab, setActiveTab] = useState("overview");
  const [showCreateModel, setShowCreateModel] = useState(false);
  const [editingModel, setEditingModel] = useState<IAIModel | null>(null);
  const [viewingModel, setViewingModel] = useState<IAIModel | null>(null);

  const { data: modelsData } = useModels({ limit: 5 });
  const { data: healthData } = useHealthStatus();

  const handleCreateModel = () => {
    setEditingModel(null);
    setShowCreateModel(true);
    setActiveTab("models");
  };

  const handleEditModel = (model: IAIModel) => {
    setEditingModel(model);
    setShowCreateModel(true);
    setActiveTab("models");
  };

  const handleViewModel = (model: IAIModel) => {
    setViewingModel(model);
    setActiveTab("models");
  };

  const handleModelFormSuccess = () => {
    setShowCreateModel(false);
    setEditingModel(null);
  };

  const handleModelFormCancel = () => {
    setShowCreateModel(false);
    setEditingModel(null);
  };

  const getHealthStatusColor = (status?: string) => {
    switch (status) {
      case "healthy":
        return "text-green-600";
      case "degraded":
        return "text-yellow-600";
      case "unhealthy":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  const getHealthStatusBadge = (status?: string) => {
    switch (status) {
      case "healthy":
        return "default";
      case "degraded":
        return "secondary";
      case "unhealthy":
        return "destructive";
      default:
        return "outline";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-bold text-3xl text-gray-900">AI Management</h1>
          <p className="mt-1 text-gray-600">
            Manage AI models, predictions, and system health
          </p>
        </div>
        <Button className="flex items-center gap-2" onClick={handleCreateModel}>
          <Plus className="h-4 w-4" />
          Create Model
        </Button>
      </div>

      <Tabs
        className="space-y-6"
        onValueChange={setActiveTab}
        value={activeTab}
      >
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="models">Models</TabsTrigger>
          <TabsTrigger value="predictions">Predictions</TabsTrigger>
          <TabsTrigger value="health">System Health</TabsTrigger>
        </TabsList>

        <TabsContent className="space-y-6" value="overview">
          {/* System Health Card */}
          {healthData && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  System Health
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">Status</span>
                      <Badge variant={getHealthStatusBadge(healthData.status)}>
                        {healthData.status}
                      </Badge>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">Models Ready</span>
                      <span className="font-bold text-green-600 text-lg">
                        {healthData.models.ready}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">Avg Response</span>
                      <span className="font-bold text-lg">
                        {healthData.performance.avgResponseTime}ms
                      </span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">Error Rate</span>
                      <span
                        className={`font-bold text-lg ${healthData.performance.errorRate > 0.05 ? "text-red-600" : "text-green-600"}`}
                      >
                        {(healthData.performance.errorRate * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Quick Stats */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="font-medium text-sm">
                  Total Models
                </CardTitle>
                <Brain className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="font-bold text-2xl">
                  {healthData?.models.total ||
                    modelsData?.pagination.total ||
                    0}
                </div>
                <p className="text-muted-foreground text-xs">
                  {healthData?.models.training || 0} training
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="font-medium text-sm">
                  Total Predictions
                </CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="font-bold text-2xl">
                  {healthData?.performance.totalPredictions.toLocaleString() ||
                    0}
                </div>
                <p className="text-muted-foreground text-xs">All time</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="font-medium text-sm">
                  Avg Response Time
                </CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="font-bold text-2xl">
                  {healthData?.performance.avgResponseTime || 0}ms
                </div>
                <p className="text-muted-foreground text-xs">Last 24 hours</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="font-medium text-sm">
                  System Health
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div
                  className={`font-bold text-2xl ${getHealthStatusColor(healthData?.status)}`}
                >
                  {healthData?.status || "Unknown"}
                </div>
                <p className="text-muted-foreground text-xs">Current status</p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Models */}
          {modelsData?.items && modelsData.items.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Recent Models</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {modelsData.items.slice(0, 3).map((model) => (
                    <div
                      className="flex items-center justify-between rounded-lg border p-4"
                      key={model._id}
                    >
                      <div className="space-y-1">
                        <div className="font-medium">{model.name}</div>
                        <div className="flex items-center gap-2 text-gray-600 text-sm">
                          <Badge variant="outline">{model.type}</Badge>
                          <Badge
                            variant={
                              model.status === "ready" ? "default" : "secondary"
                            }
                          >
                            {model.status}
                          </Badge>
                          {model.performance.accuracy && (
                            <span className="text-green-600">
                              {(model.performance.accuracy * 100).toFixed(1)}%
                              accuracy
                            </span>
                          )}
                        </div>
                      </div>
                      <Button
                        onClick={() => handleViewModel(model)}
                        size="sm"
                        variant="outline"
                      >
                        View
                      </Button>
                    </div>
                  ))}
                </div>
                {modelsData.pagination.total > 3 && (
                  <div className="mt-4 text-center">
                    <Button
                      onClick={() => setActiveTab("models")}
                      variant="ghost"
                    >
                      View All Models ({modelsData.pagination.total})
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent className="space-y-6" value="models">
          {showCreateModel ? (
            <ModelForm
              model={editingModel || undefined}
              onCancel={handleModelFormCancel}
              onSuccess={handleModelFormSuccess}
            />
          ) : (
            <ModelList
              onCreateModel={handleCreateModel}
              onEditModel={handleEditModel}
              onViewModel={handleViewModel}
            />
          )}
        </TabsContent>

        <TabsContent className="space-y-6" value="predictions">
          <PredictionForm />
        </TabsContent>

        <TabsContent className="space-y-6" value="health">
          {healthData ? (
            <div className="space-y-6">
              {/* Overall Health */}
              <Card>
                <CardHeader>
                  <CardTitle>System Health Overview</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-lg">Overall Status</span>
                    <Badge
                      className="px-4 py-2 text-lg"
                      variant={getHealthStatusBadge(healthData.status)}
                    >
                      {healthData.status.toUpperCase()}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Service Health */}
              <Card>
                <CardHeader>
                  <CardTitle>Service Health</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2">
                    {Object.entries(healthData.services).map(
                      ([service, isHealthy]) => (
                        <div
                          className="flex items-center justify-between rounded-lg border p-3"
                          key={service}
                        >
                          <span className="font-medium capitalize">
                            {service}
                          </span>
                          <Badge
                            variant={isHealthy ? "default" : "destructive"}
                          >
                            {isHealthy ? "Healthy" : "Unhealthy"}
                          </Badge>
                        </div>
                      )
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Model Statistics */}
              <Card>
                <CardHeader>
                  <CardTitle>Model Statistics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-4">
                    <div className="rounded-lg border p-4 text-center">
                      <div className="font-bold text-2xl text-blue-600">
                        {healthData.models.total}
                      </div>
                      <div className="text-gray-600 text-sm">Total Models</div>
                    </div>
                    <div className="rounded-lg border p-4 text-center">
                      <div className="font-bold text-2xl text-green-600">
                        {healthData.models.ready}
                      </div>
                      <div className="text-gray-600 text-sm">Ready</div>
                    </div>
                    <div className="rounded-lg border p-4 text-center">
                      <div className="font-bold text-2xl text-yellow-600">
                        {healthData.models.training}
                      </div>
                      <div className="text-gray-600 text-sm">Training</div>
                    </div>
                    <div className="rounded-lg border p-4 text-center">
                      <div className="font-bold text-2xl text-red-600">
                        {healthData.models.error}
                      </div>
                      <div className="text-gray-600 text-sm">Error</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Performance Metrics */}
              <Card>
                <CardHeader>
                  <CardTitle>Performance Metrics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="rounded-lg border p-4 text-center">
                      <div className="font-bold text-2xl">
                        {healthData.performance.avgResponseTime}ms
                      </div>
                      <div className="text-gray-600 text-sm">
                        Avg Response Time
                      </div>
                    </div>
                    <div className="rounded-lg border p-4 text-center">
                      <div className="font-bold text-2xl">
                        {healthData.performance.totalPredictions.toLocaleString()}
                      </div>
                      <div className="text-gray-600 text-sm">
                        Total Predictions
                      </div>
                    </div>
                    <div className="rounded-lg border p-4 text-center">
                      <div
                        className={`font-bold text-2xl ${healthData.performance.errorRate > 0.05 ? "text-red-600" : "text-green-600"}`}
                      >
                        {(healthData.performance.errorRate * 100).toFixed(2)}%
                      </div>
                      <div className="text-gray-600 text-sm">Error Rate</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <Activity className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 font-medium text-gray-900 text-sm">
                    Health data unavailable
                  </h3>
                  <p className="mt-1 text-gray-500 text-sm">
                    Unable to fetch system health information.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
