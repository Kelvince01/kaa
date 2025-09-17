"use client";

import { Button } from "@kaa/ui/components/button";
import { RefreshCw } from "lucide-react";
import { useState } from "react";

export default function AdminDashboardContainer() {
  const [period, setPeriod] = useState<"daily" | "monthly" | "yearly">(
    "monthly"
  );
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [month, setMonth] = useState<number>(new Date().getMonth() + 1);

  const handleRefresh = () => {
    // TODO: Implement refresh
  };

  const handlePeriodChange = (newPeriod: "daily" | "monthly" | "yearly") => {
    setPeriod(newPeriod);
  };

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setYear(Number.parseInt(e.target.value, 10));
  };

  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setMonth(Number.parseInt(e.target.value, 10));
  };

  const isLoading = !!period;

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-green-500 border-t-2 border-b-2" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-bold text-3xl tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of system performance and recent activity.
        </p>
      </div>

      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Button
              className={`rounded-md px-3 py-1 font-medium text-sm ${
                period === "daily"
                  ? "bg-green-500 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
              onClick={() => handlePeriodChange("daily")}
            >
              Daily
            </Button>

            <Button
              className={`rounded-md px-3 py-1 font-medium text-sm ${
                period === "monthly"
                  ? "bg-green-500 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
              onClick={() => handlePeriodChange("monthly")}
            >
              Monthly
            </Button>

            <Button
              className={`rounded-md px-3 py-1 font-medium text-sm ${
                period === "yearly"
                  ? "bg-green-500 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
              onClick={() => handlePeriodChange("yearly")}
            >
              Yearly
            </Button>
          </div>

          {period === "monthly" && (
            <select
              className="rounded-md border border-gray-300 px-3 py-1 text-sm"
              onChange={handleYearChange}
              value={year}
            >
              {Array.from(
                { length: 5 },
                (_, i) => new Date().getFullYear() - i
              ).map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          )}

          {period === "daily" && (
            <>
              <select
                className="rounded-md border border-gray-300 px-3 py-1 text-sm"
                onChange={handleYearChange}
                value={year}
              >
                {Array.from(
                  { length: 5 },
                  (_, i) => new Date().getFullYear() - i
                ).map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>

              <select
                className="rounded-md border border-gray-300 px-3 py-1 text-sm"
                onChange={handleMonthChange}
                value={month}
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                  <option key={m} value={m}>
                    {new Date(2000, m - 1, 1).toLocaleString("default", {
                      month: "long",
                    })}
                  </option>
                ))}
              </select>
            </>
          )}

          <Button
            className="flex items-center rounded-md bg-gray-200 px-3 py-1 font-medium text-gray-700 text-sm hover:bg-gray-300"
            disabled={isLoading}
            onClick={handleRefresh}
          >
            <RefreshCw className={`mr-1 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>
    </div>
  );
}
