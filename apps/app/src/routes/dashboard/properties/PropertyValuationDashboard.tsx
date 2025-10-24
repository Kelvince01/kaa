import type React from "react";
import { useState } from "react";
import {
  useCreateValuation,
  useGenerateAutomatedValuation,
  useMarketAnalysis,
  usePropertyValueTrends,
  useRentalEstimate,
  useValuationAlerts,
  useValuations,
} from "@/modules/properties/valuation";

type PropertyValuationDashboardProps = {
  propertyId: string;
};

export const PropertyValuationDashboard: React.FC<
  PropertyValuationDashboardProps
> = ({ propertyId }) => {
  const [activeTab, setActiveTab] = useState<
    "overview" | "trends" | "market" | "rental"
  >("overview");
  const [showCreateForm, setShowCreateForm] = useState(false);

  const {
    data: valuationsData,
    isLoading: loadingValuations,
    error: valuationsError,
    refetch: refetchValuations,
  } = useValuations({ property: propertyId });

  const { data: trendsData, isLoading: loadingTrends } = usePropertyValueTrends(
    propertyId,
    "1y"
  );

  const { data: marketData, isLoading: loadingMarket } =
    useMarketAnalysis(propertyId);

  const { data: rentalData, isLoading: loadingRental } =
    useRentalEstimate(propertyId);

  const { data: alertsData } = useValuationAlerts(propertyId);

  const { mutate: createValuation, isPending: creatingValuation } =
    useCreateValuation();

  const { mutate: generateAutomatedValuation, isPending: generatingValuation } =
    useGenerateAutomatedValuation();

  const handleCreateValuation = (valuationData: any) => {
    createValuation(
      {
        ...valuationData,
        property: propertyId,
      },
      {
        onSuccess: () => {
          setShowCreateForm(false);
          refetchValuations();
        },
      }
    );
  };

  const handleGenerateAutomatedValuation = () => {
    generateAutomatedValuation(
      {
        propertyId,
        requestedBy: "current-user-id", // This should come from auth context
      },
      {
        onSuccess: () => {
          refetchValuations();
        },
      }
    );
  };

  const latestValuation = valuationsData?.data?.valuations?.[0];
  const valuations = valuationsData?.data?.valuations || [];
  const alerts = alertsData?.alerts || [];

  const tabs = [
    { id: "overview", name: "Overview", icon: "📊" },
    { id: "trends", name: "Value Trends", icon: "📈" },
    { id: "market", name: "Market Analysis", icon: "🏘️" },
    { id: "rental", name: "Rental Estimate", icon: "💰" },
  ];

  if (loadingValuations) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="h-8 w-8 animate-spin rounded-full border-blue-600 border-b-2" />
        <span className="ml-2">Loading valuation data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-lg bg-white p-6 shadow">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-bold text-2xl text-gray-900">
              Property Valuation
            </h2>
            <p className="mt-1 text-gray-600 text-sm">
              Track property value, market trends, and rental potential
            </p>
          </div>
          <div className="flex space-x-3">
            <button
              className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 font-medium text-gray-700 text-sm shadow-sm hover:bg-gray-50 disabled:opacity-50"
              disabled={generatingValuation}
              onClick={handleGenerateAutomatedValuation}
              type="button"
            >
              {generatingValuation ? "Generating..." : "Auto Valuation"}
            </button>
            <button
              className="inline-flex items-center rounded-md border border-transparent bg-blue-600 px-4 py-2 font-medium text-sm text-white shadow-sm hover:bg-blue-700"
              onClick={() => setShowCreateForm(true)}
              type="button"
            >
              Request Valuation
            </button>
          </div>
        </div>

        {/* Current Value Summary */}
        {latestValuation && (
          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-4">
            <div className="rounded-lg bg-blue-50 p-4">
              <div className="flex items-center">
                <div className="shrink-0">
                  <div className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-500">
                    <span className="font-medium text-sm text-white">$</span>
                  </div>
                </div>
                <div className="ml-3">
                  <p className="font-medium text-blue-900 text-sm">
                    Current Value
                  </p>
                  <p className="font-bold text-2xl text-blue-900">
                    ${latestValuation.estimatedValue?.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-lg bg-green-50 p-4">
              <div className="flex items-center">
                <div className="shrink-0">
                  <div className="flex h-8 w-8 items-center justify-center rounded-md bg-green-500">
                    <span className="font-medium text-sm text-white">%</span>
                  </div>
                </div>
                <div className="ml-3">
                  <p className="font-medium text-green-900 text-sm">
                    Confidence
                  </p>
                  <p className="font-bold text-2xl text-green-900">
                    {latestValuation.accuracy}%
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-lg bg-purple-50 p-4">
              <div className="flex items-center">
                <div className="shrink-0">
                  <div className="flex h-8 w-8 items-center justify-center rounded-md bg-purple-500">
                    <span className="font-medium text-sm text-white">📅</span>
                  </div>
                </div>
                <div className="ml-3">
                  <p className="font-medium text-purple-900 text-sm">
                    Last Updated
                  </p>
                  <p className="font-bold text-purple-900 text-sm">
                    {new Date(latestValuation.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-lg bg-orange-50 p-4">
              <div className="flex items-center">
                <div className="shrink-0">
                  <div className="flex h-8 w-8 items-center justify-center rounded-md bg-orange-500">
                    <span className="font-medium text-sm text-white">🔔</span>
                  </div>
                </div>
                <div className="ml-3">
                  <p className="font-medium text-orange-900 text-sm">Alerts</p>
                  <p className="font-bold text-2xl text-orange-900">
                    {alerts.length}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
          <div className="flex">
            <div className="shrink-0">
              <svg
                className="h-5 w-5 text-yellow-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  clipRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  fillRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="font-medium text-sm text-yellow-800">
                Valuation Alerts
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <ul className="list-disc space-y-1 pl-5">
                  {alerts.slice(0, 3).map((alert) => (
                    <li key={alert._id}>
                      {alert.property ||
                        `${alert.alertType} alert for this property`}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="rounded-lg bg-white shadow">
        <div className="border-gray-200 border-b">
          <nav className="-mb-px flex space-x-8 px-6">
            {tabs.map((tab) => (
              <button
                className={`flex items-center space-x-2 border-b-2 px-1 py-4 font-medium text-sm ${
                  activeTab === tab.id
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                }`}
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                type="button"
              >
                <span>{tab.icon}</span>
                <span>{tab.name}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              <h3 className="font-medium text-gray-900 text-lg">
                Valuation History
              </h3>
              <div className="space-y-4">
                {valuations.map((valuation) => (
                  <div
                    className="rounded-lg border p-4 transition-shadow hover:shadow-md"
                    key={valuation._id}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-4">
                          <h4 className="font-medium text-gray-900">
                            ${valuation.estimatedValue?.toLocaleString()}
                          </h4>
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 font-medium text-xs ${
                              valuation.type === "automated"
                                ? "bg-blue-100 text-blue-800"
                                : valuation.type === "professional"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {valuation.type}
                          </span>
                          <span className="text-gray-500 text-sm">
                            Confidence: {valuation.accuracy}%
                          </span>
                        </div>
                        <p className="mt-1 text-gray-600 text-sm">
                          {valuation.methodology}
                        </p>
                        <p className="mt-2 text-gray-500 text-xs">
                          {new Date(valuation.createdAt).toLocaleDateString()}{" "}
                          by {valuation.requestedBy || "System"}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-gray-500 text-sm">Valid until</p>
                        <p className="font-medium text-gray-900 text-sm">
                          {new Date(
                            valuation.expiryDate as string
                          ).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Trends Tab */}
          {activeTab === "trends" && (
            <div className="space-y-6">
              <h3 className="font-medium text-gray-900 text-lg">
                Value Trends (12 Months)
              </h3>
              {loadingTrends ? (
                <div className="animate-pulse">
                  <div className="h-64 rounded bg-gray-200" />
                </div>
              ) : trendsData ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                    <div className="text-center">
                      <p className="text-gray-500 text-sm">Total Change</p>
                      <p
                        className={`font-bold text-lg ${
                          trendsData.summary.totalChange >= 0
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        ${trendsData.summary.totalChange?.toLocaleString()}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-gray-500 text-sm">Percentage Change</p>
                      <p
                        className={`font-bold text-lg ${
                          trendsData.summary.totalChangePercentage >= 0
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {trendsData.summary.totalChangePercentage?.toFixed(1)}%
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-gray-500 text-sm">
                        Avg Monthly Change
                      </p>
                      <p className="font-bold text-gray-900 text-lg">
                        $
                        {trendsData.summary.averageMonthlyChange?.toLocaleString()}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-gray-500 text-sm">Volatility</p>
                      <p className="font-bold text-gray-900 text-lg">
                        {trendsData.summary.volatility?.toFixed(1)}%
                      </p>
                    </div>
                  </div>

                  <div className="mt-6">
                    <div className="space-y-2">
                      {trendsData.trends?.slice(0, 6).map((trend, index) => (
                        <div
                          className="flex items-center justify-between border-gray-100 border-b py-2"
                          key={index.toString()}
                        >
                          <span className="text-gray-600 text-sm">
                            {new Date(trend.date).toLocaleDateString()}
                          </span>
                          <div className="flex items-center space-x-4">
                            <span className="font-medium">
                              ${trend.value?.toLocaleString()}
                            </span>
                            {trend.changePercentage && (
                              <span
                                className={`text-sm ${
                                  trend.changePercentage >= 0
                                    ? "text-green-600"
                                    : "text-red-600"
                                }`}
                              >
                                {trend.changePercentage > 0 ? "+" : ""}
                                {trend.changePercentage.toFixed(1)}%
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500">No trend data available</p>
              )}
            </div>
          )}

          {/* Market Analysis Tab */}
          {activeTab === "market" && (
            <div className="space-y-6">
              <h3 className="font-medium text-gray-900 text-lg">
                Market Analysis
              </h3>
              {loadingMarket ? (
                <div className="animate-pulse space-y-4">
                  <div className="h-4 w-1/4 rounded bg-gray-200" />
                  <div className="h-20 rounded bg-gray-200" />
                </div>
              ) : marketData ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                    <div className="rounded-lg bg-gray-50 p-4">
                      <h4 className="mb-2 font-medium text-gray-900">
                        Average Price
                      </h4>
                      <p className="font-bold text-2xl text-gray-900">
                        ${marketData.analysis.averagePrice?.toLocaleString()}
                      </p>
                    </div>
                    <div className="rounded-lg bg-gray-50 p-4">
                      <h4 className="mb-2 font-medium text-gray-900">
                        Price per Sq Ft
                      </h4>
                      <p className="font-bold text-2xl text-gray-900">
                        $
                        {marketData.analysis.pricePerSquareFoot?.toLocaleString()}
                      </p>
                    </div>
                    <div className="rounded-lg bg-gray-50 p-4">
                      <h4 className="mb-2 font-medium text-gray-900">
                        Market Trend
                      </h4>
                      <p
                        className={`font-bold text-2xl ${
                          marketData.analysis.trend === "rising"
                            ? "text-green-600"
                            : marketData.analysis.trend === "declining"
                              ? "text-red-600"
                              : "text-gray-600"
                        }`}
                      >
                        {marketData.analysis.trend === "rising"
                          ? "↗️ Rising"
                          : marketData.analysis.trend === "declining"
                            ? "↘️ Falling"
                            : "➡️ Stable"}
                      </p>
                    </div>
                  </div>

                  {marketData.analysis.insights && (
                    <div>
                      <h4 className="mb-3 font-medium text-gray-900">
                        Market Insights
                      </h4>
                      <ul className="space-y-2">
                        {marketData.analysis.insights.map((insight, index) => (
                          <li
                            className="flex items-start"
                            key={index.toString()}
                          >
                            <span className="mr-2 text-blue-500">•</span>
                            <span className="text-gray-700 text-sm">
                              {insight}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-gray-500">No market analysis available</p>
              )}
            </div>
          )}

          {/* Rental Estimate Tab */}
          {activeTab === "rental" && (
            <div className="space-y-6">
              <h3 className="font-medium text-gray-900 text-lg">
                Rental Estimate
              </h3>
              {loadingRental ? (
                <div className="animate-pulse space-y-4">
                  <div className="h-4 w-1/4 rounded bg-gray-200" />
                  <div className="h-32 rounded bg-gray-200" />
                </div>
              ) : rentalData ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                    <div className="rounded-lg bg-green-50 p-6">
                      <h4 className="mb-2 font-medium text-green-900">
                        Monthly Rent
                      </h4>
                      <p className="font-bold text-3xl text-green-900">
                        ${rentalData.estimate.monthlyRent?.toLocaleString()}
                      </p>
                      <p className="mt-1 text-green-700 text-sm">
                        Range: $
                        {rentalData.estimate.rentRange?.low?.toLocaleString()} -
                        ${rentalData.estimate.rentRange?.high?.toLocaleString()}
                      </p>
                    </div>
                    <div className="rounded-lg bg-blue-50 p-6">
                      <h4 className="mb-2 font-medium text-blue-900">
                        Gross Yield
                      </h4>
                      <p className="font-bold text-3xl text-blue-900">
                        {rentalData.estimate.grossYield?.toFixed(1)}%
                      </p>
                    </div>
                    <div className="rounded-lg bg-purple-50 p-6">
                      <h4 className="mb-2 font-medium text-purple-900">
                        Net Yield
                      </h4>
                      <p className="font-bold text-3xl text-purple-900">
                        {rentalData.estimate.netYield?.toFixed(1) || "N/A"}%
                      </p>
                    </div>
                  </div>

                  {rentalData.estimate.comparables &&
                    rentalData.estimate.comparables.length > 0 && (
                      <div>
                        <h4 className="mb-3 font-medium text-gray-900">
                          Rental Comparables
                        </h4>
                        <div className="space-y-3">
                          {rentalData.estimate.comparables
                            .slice(0, 5)
                            .map((comp, index) => (
                              <div
                                className="flex items-center justify-between rounded bg-gray-50 p-3"
                                key={index.toString()}
                              >
                                <div>
                                  <p className="font-medium text-gray-900">
                                    {comp.address}
                                  </p>
                                  <p className="text-gray-600 text-sm">
                                    {comp.bedrooms} bed, {comp.bathrooms} bath •{" "}
                                    {comp.squareFootage} sq ft
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="font-bold text-gray-900">
                                    ${comp.monthlyRent?.toLocaleString()}/mo
                                  </p>
                                  <p className="text-gray-600 text-sm">
                                    $
                                    {(
                                      comp.monthlyRent / comp.squareFootage
                                    ).toFixed(2)}
                                    /sq ft
                                  </p>
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}
                </div>
              ) : (
                <p className="text-gray-500">No rental estimate available</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Create Valuation Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 z-50 h-full w-full overflow-y-auto bg-gray-600 bg-opacity-50">
          <div className="relative top-20 mx-auto w-96 rounded-md border bg-white p-5 shadow-lg">
            <h3 className="mb-4 font-medium text-gray-900 text-lg">
              Request Property Valuation
            </h3>
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                handleCreateValuation({
                  valuationType: formData.get("valuationType"),
                  purpose: formData.get("purpose"),
                  urgency: formData.get("urgency"),
                  notes: formData.get("notes"),
                });
              }}
            >
              <div>
                <label
                  className="block font-medium text-gray-700 text-sm"
                  htmlFor="valuation-type"
                >
                  Valuation Type
                </label>
                <select
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  name="valuationType"
                  required
                >
                  <option value="">Select type</option>
                  <option value="professional">Professional Appraisal</option>
                  <option value="automated">Automated Valuation</option>
                  <option value="comparative">
                    Comparative Market Analysis
                  </option>
                </select>
              </div>
              <div>
                <label
                  className="block font-medium text-gray-700 text-sm"
                  htmlFor="purpose"
                >
                  Purpose
                </label>
                <select
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  name="purpose"
                  required
                >
                  <option value="">Select purpose</option>
                  <option value="sale">Sale</option>
                  <option value="refinance">Refinance</option>
                  <option value="insurance">Insurance</option>
                  <option value="investment">Investment Analysis</option>
                </select>
              </div>
              <div>
                <label
                  className="block font-medium text-gray-700 text-sm"
                  htmlFor="urgency"
                >
                  Urgency
                </label>
                <select
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  name="urgency"
                >
                  <option value="standard">Standard (5-7 days)</option>
                  <option value="rush">Rush (2-3 days)</option>
                  <option value="urgent">Urgent (24 hours)</option>
                </select>
              </div>
              <div>
                <label
                  className="block font-medium text-gray-700 text-sm"
                  htmlFor="additional-notes"
                >
                  Additional Notes
                </label>
                <textarea
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  name="notes"
                  placeholder="Any specific requirements or information..."
                  rows={3}
                />
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  className="rounded-md border border-gray-300 bg-white px-4 py-2 font-medium text-gray-700 text-sm hover:bg-gray-50"
                  onClick={() => setShowCreateForm(false)}
                  type="button"
                >
                  Cancel
                </button>
                <button
                  className="rounded-md border border-transparent bg-blue-600 px-4 py-2 font-medium text-sm text-white hover:bg-blue-700 disabled:opacity-50"
                  disabled={creatingValuation}
                  type="submit"
                >
                  {creatingValuation ? "Requesting..." : "Request Valuation"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
