"use client";

import { useState } from "react";
import type { IAIModel } from "@/modules/ml/ai.type";
import { ModelForm, ModelList } from "@/modules/ml/components";

export default function AIModelsPage() {
  const [showCreateModel, setShowCreateModel] = useState(false);
  const [editingModel, setEditingModel] = useState<IAIModel | null>(null);

  const handleCreateModel = () => {
    setEditingModel(null);
    setShowCreateModel(true);
  };

  const handleEditModel = (model: IAIModel) => {
    setEditingModel(model);
    setShowCreateModel(true);
  };

  const handleModelFormSuccess = () => {
    setShowCreateModel(false);
    setEditingModel(null);
  };

  const handleModelFormCancel = () => {
    setShowCreateModel(false);
    setEditingModel(null);
  };

  if (showCreateModel) {
    return (
      <ModelForm
        model={editingModel || undefined}
        onCancel={handleModelFormCancel}
        onSuccess={handleModelFormSuccess}
      />
    );
  }

  return (
    <ModelList
      onCreateModel={handleCreateModel}
      onEditModel={handleEditModel}
    />
  );
}
