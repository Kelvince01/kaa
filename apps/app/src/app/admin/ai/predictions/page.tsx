"use client";

import { PredictionForm } from "@/modules/ml/components";

export default function AIPredictionsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-bold text-3xl text-gray-900">AI Predictions</h1>
        <p className="mt-1 text-gray-600">
          Make predictions using your trained models
        </p>
      </div>

      <PredictionForm />
    </div>
  );
}
