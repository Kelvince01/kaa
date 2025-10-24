"use client";

import type React from "react";
import { useEffect, useState } from "react";
import { useQueryPerformance } from "@/lib/performance/query-optimization";
import { PropertyContractorsList } from "./PropertyContractorsList";
import { PropertyInsurancePanel } from "./PropertyInsurancePanel";
import { PropertyScheduleCalendar } from "./PropertyScheduleCalendar";
import { PropertyValuationDashboard } from "./PropertyValuationDashboard";

type IntegratedPropertyDashboardProps = {
  propertyId: string;
  landlordId: string;
  userId: string;
};

export const IntegratedPropertyDashboard: React.FC<
  IntegratedPropertyDashboardProps
> = ({ propertyId, landlordId, userId }) => {
  const [activeSection, setActiveSection] = useState<
    "overview" | "contractors" | "insurance" | "schedule" | "valuation"
  >("overview");
  const [showPerformanceMetrics, setShowPerformanceMetrics] = useState(false);

  const { getMetrics, getSlowestQueries, getHighErrorRateQueries } =
    useQueryPerformance();

  // Performance monitoring
  useEffect(() => {
    const interval = setInterval(() => {
      const metrics = getMetrics();
      const slowQueries = getSlowestQueries(5);
      const errorQueries = getHighErrorRateQueries(5);

      if (slowQueries.length > 0 || errorQueries.length > 0) {
        console.group("Query Performance Report");
        console.log("Slow queries:", slowQueries);
        console.log("High error rate queries:", errorQueries);
        console.groupEnd();
      }
    }, 30_000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [getMetrics, getSlowestQueries, getHighErrorRateQueries]);

  const sections = [
    {
      id: "overview",
      name: "Overview",
      icon: "📊",
      description: "Property summary and key metrics",
    },
    {
      id: "contractors",
      name: "Contractors",
      icon: "👷",
      description: "Manage contractors and services",
    },
    {
      id: "insurance",
      name: "Insurance",
      icon: "🛡️",
      description: "Policies, claims, and coverage",
    },
    {
      id: "schedule",
      name: "Schedule",
      icon: "📅",
      description: "Appointments and maintenance",
    },
    {
      id: "valuation",
      name: "Valuation",
      icon: "💰",
      description: "Property value and market analysis",
    },
  ];

  const renderActiveSection = () => {
    switch (activeSection) {
      case "contractors":
        return (
          <PropertyContractorsList
            propertyId={propertyId}
            serviceArea={undefined}
            specialty={undefined}
          />
        );
      case "insurance":
        return (
          <PropertyInsurancePanel
            landlordId={landlordId}
            propertyId={propertyId}
          />
        );
      case "schedule":
        return (
          <PropertyScheduleCalendar propertyId={propertyId} userId={userId} />
        );
      case "valuation":
        return <PropertyValuationDashboard propertyId={propertyId} />;
      default:
        return (
          <div className="space-y-6">
            {/* Overview Dashboard */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
              {sections.slice(1).map((section) => (
                <div
                  className="cursor-pointer rounded-lg border-blue-500 border-l-4 bg-white p-6 shadow-md transition-shadow hover:shadow-lg"
                  key={section.id}
                  onClick={() => setActiveSection(section.id as any)}
                >
                  <div className="flex items-center">
                    <div className="shrink-0">
                      <span className="text-2xl">{section.icon}</span>
                    </div>
                    <div className="ml-4">
                      <h3 className="font-medium text-gray-900 text-lg">
                        {section.name}
                      </h3>
                      <p className="text-gray-600 text-sm">
                        {section.description}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4">
                    <button
                      className="font-medium text-blue-600 text-sm hover:text-blue-800"
                      type="button"
                    >
                      View Details →
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Stats */}
            <div className="rounded-lg bg-white p-6 shadow">
              <h3 className="mb-4 font-medium text-gray-900 text-lg">
                Quick Stats
              </h3>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                <div className="text-center">
                  <div className="font-bold text-2xl text-blue-600">12</div>
                  <div className="text-gray-600 text-sm">
                    Active Contractors
                  </div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-2xl text-green-600">3</div>
                  <div className="text-gray-600 text-sm">
                    Insurance Policies
                  </div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-2xl text-purple-600">8</div>
                  <div className="text-gray-600 text-sm">Scheduled Items</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-2xl text-orange-600">
                    $2.1M
                  </div>
                  <div className="text-gray-600 text-sm">Current Value</div>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="rounded-lg bg-white p-6 shadow">
              <h3 className="mb-4 font-medium text-gray-900 text-lg">
                Recent Activity
              </h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="shrink-0">
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
                      <span className="font-medium text-blue-600 text-sm">
                        V
                      </span>
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="text-gray-900 text-sm">
                      New valuation completed
                    </p>
                    <p className="text-gray-500 text-xs">2 hours ago</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="shrink-0">
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-green-100">
                      <span className="font-medium text-green-600 text-sm">
                        S
                      </span>
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="text-gray-900 text-sm">
                      Maintenance scheduled
                    </p>
                    <p className="text-gray-500 text-xs">1 day ago</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="shrink-0">
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-yellow-100">
                      <span className="font-medium text-sm text-yellow-600">
                        I
                      </span>
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="text-gray-900 text-sm">
                      Insurance claim filed
                    </p>
                    <p className="text-gray-500 text-xs">3 days ago</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center">
              <h1 className="font-semibold text-gray-900 text-xl">
                Property Management Dashboard
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              {/* Performance Metrics Toggle */}
              <button
                className="text-gray-600 text-sm hover:text-gray-900"
                onClick={() =>
                  setShowPerformanceMetrics(!showPerformanceMetrics)
                }
                type="button"
              >
                Performance
              </button>

              {/* Notifications */}
              <button
                className="relative p-2 text-gray-400 hover:text-gray-500"
                type="button"
              >
                <span className="sr-only">View notifications</span>
                <svg
                  className="h-6 w-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M15 17h5l-3.5-3.5a7.5 7.5 0 01-1.5-4.5V9a6 6 0 00-12 0v0c0 1.677-.573 3.209-1.5 4.5L5 17h5m5 0v1a3 3 0 11-6 0v-1m6 0H9"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                  />
                </svg>
                <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-400 ring-2 ring-white" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="border-b bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {sections.map((section) => (
              <button
                className={`flex items-center space-x-2 border-b-2 px-1 py-4 font-medium text-sm ${
                  activeSection === section.id
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                }`}
                key={section.id}
                onClick={() => setActiveSection(section.id as any)}
                type="button"
              >
                <span>{section.icon}</span>
                <span>{section.name}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Performance Metrics Modal */}
      {showPerformanceMetrics && (
        <div className="fixed inset-0 z-50 h-full w-full overflow-y-auto bg-gray-600 bg-opacity-50">
          <div className="relative top-20 mx-auto w-3/4 max-w-4xl rounded-md border bg-white p-5 shadow-lg">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-medium text-gray-900 text-lg">
                Performance Metrics
              </h3>
              <button
                className="text-gray-400 hover:text-gray-600"
                onClick={() => setShowPerformanceMetrics(false)}
                type="button"
              >
                <svg
                  className="h-6 w-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M6 18L18 6M6 6l12 12"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                  />
                </svg>
              </button>
            </div>

            <div className="space-y-6">
              {/* Slow Queries */}
              <div>
                <h4 className="mb-3 font-medium text-gray-900 text-md">
                  Slowest Queries
                </h4>
                <div className="rounded-lg bg-gray-50 p-4">
                  <div className="space-y-2">
                    {getSlowestQueries(5).map((query, index) => (
                      <div
                        className="flex items-center justify-between"
                        key={index.toString()}
                      >
                        <span className="truncate text-gray-700 text-sm">
                          {query.queryKey}
                        </span>
                        <div className="flex items-center space-x-4">
                          <span className="text-gray-500 text-sm">
                            {query.averageTime.toFixed(0)}ms
                          </span>
                          <span className="text-gray-500 text-sm">
                            {query.count} calls
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Error Rate Queries */}
              <div>
                <h4 className="mb-3 font-medium text-gray-900 text-md">
                  High Error Rate Queries
                </h4>
                <div className="rounded-lg bg-red-50 p-4">
                  <div className="space-y-2">
                    {getHighErrorRateQueries(5).map((query, index) => (
                      <div
                        className="flex items-center justify-between"
                        key={index.toString()}
                      >
                        <span className="truncate text-gray-700 text-sm">
                          {query.queryKey}
                        </span>
                        <div className="flex items-center space-x-4">
                          <span className="text-red-600 text-sm">
                            {query.errorRate.toFixed(1)}%
                          </span>
                          <span className="text-gray-500 text-sm">
                            {query.errors}/{query.count}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Overall Stats */}
              <div>
                <h4 className="mb-3 font-medium text-gray-900 text-md">
                  Overall Statistics
                </h4>
                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                  <div className="rounded-lg bg-blue-50 p-4 text-center">
                    <div className="font-bold text-2xl text-blue-600">
                      {Object.keys(getMetrics()).length}
                    </div>
                    <div className="text-blue-800 text-sm">Total Queries</div>
                  </div>
                  <div className="rounded-lg bg-green-50 p-4 text-center">
                    <div className="font-bold text-2xl text-green-600">
                      {Object.values(getMetrics()).reduce(
                        (sum, m) => sum + m.count,
                        0
                      )}
                    </div>
                    <div className="text-green-800 text-sm">Total Calls</div>
                  </div>
                  <div className="rounded-lg bg-yellow-50 p-4 text-center">
                    <div className="font-bold text-2xl text-yellow-600">
                      {Object.values(getMetrics()).reduce(
                        (sum, m) => sum + m.averageTime,
                        0
                      ) / Object.keys(getMetrics()).length || 0}
                      ms
                    </div>
                    <div className="text-sm text-yellow-800">Avg Response</div>
                  </div>
                  <div className="rounded-lg bg-red-50 p-4 text-center">
                    <div className="font-bold text-2xl text-red-600">
                      {Object.values(getMetrics()).reduce(
                        (sum, m) => sum + m.errors,
                        0
                      )}
                    </div>
                    <div className="text-red-800 text-sm">Total Errors</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {renderActiveSection()}
      </div>
    </div>
  );
};
