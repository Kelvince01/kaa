import { Badge } from "@kaa/ui/components/badge";
import { Button } from "@kaa/ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@kaa/ui/components/card";
import {
  Calendar,
  DollarSign,
  FileText,
  PieChart,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { formatCurrency } from "@/shared/utils/format.util";
import { useFinancialDashboard } from "../../financials.queries";
import { useFinancialsStore } from "../../financials.store";
import type { FinancialDashboardData } from "../../financials.type";

type FinancialOverviewProps = {
  period?: "monthly" | "quarterly" | "yearly";
};

export function FinancialOverview({
  period = "monthly",
}: FinancialOverviewProps) {
  const { dashboardData, dashboardLoading } = useFinancialsStore();
  const { data: dashData, isLoading, error } = useFinancialDashboard(period);

  if (isLoading || dashboardLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 })
          .fill(0)
          .map((_, i) => (
            <Card className="animate-pulse" key={i.toString()}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-4 w-24 rounded bg-muted" />
                <div className="h-4 w-4 rounded bg-muted" />
              </CardHeader>
              <CardContent>
                <div className="mb-2 h-8 w-32 rounded bg-muted" />
                <div className="h-3 w-20 rounded bg-muted" />
              </CardContent>
            </Card>
          ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">
            <p className="text-muted-foreground">
              Failed to load dashboard data
            </p>
            <Button className="mt-2" onClick={() => window.location.reload()}>
              Retry
            </Button>
          </div>{" "}
        </CardContent>
      </Card>
    );
  }

  const data = dashData || (dashboardData as FinancialDashboardData);

  const summary = data?.summary;
  const income = data?.income;
  const expenses = data?.expenses;
  const recentExpenses = data?.recentExpenses || [];
  const pendingExpenses = data?.pendingExpenses || [];

  const stats = [
    {
      title: "Total Income",
      value: formatCurrency(summary?.grossIncome || 0),
      icon: TrendingUp,
      trend: summary?.grossIncome > 0 ? "positive" : "neutral",
      description: `${income.rental.count} rental payments`,
    },
    {
      title: "Total Expenses",
      value: formatCurrency(summary?.totalExpenses || 0),
      icon: TrendingDown,
      trend: "negative",
      description: `${pendingExpenses} pending approval`,
    },
    {
      title: "Net Income",
      value: formatCurrency(summary?.netIncome || 0),
      icon: DollarSign,
      trend:
        summary?.netIncome > 0
          ? "positive"
          : summary?.netIncome < 0
            ? "negative"
            : "neutral",
      description: `${summary.profitMargin?.toFixed(1) || 0}% margin`,
    },
    {
      title: "Cash Flow",
      value: formatCurrency(summary?.cashFlow || 0),
      icon: PieChart,
      trend:
        summary?.cashFlow > 0
          ? "positive"
          : summary?.cashFlow < 0
            ? "negative"
            : "neutral",
      description: `ROI: ${summary?.roi?.toFixed(1) || 0}%`,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index.toString()}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="font-medium text-sm">
                  {stat.title}
                </CardTitle>
                <Icon
                  className={`h-4 w-4 ${
                    stat.trend === "positive"
                      ? "text-green-600"
                      : stat.trend === "negative"
                        ? "text-red-600"
                        : "text-muted-foreground"
                  }`}
                />
              </CardHeader>
              <CardContent>
                <div className="font-bold text-2xl">{stat.value}</div>
                <p className="text-muted-foreground text-xs">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Recent Activity */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Recent Expenses */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Recent Expenses</CardTitle>
            <Button size="sm" variant="ghost">
              <FileText className="mr-2 h-4 w-4" />
              View All
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentExpenses?.length > 0 ? (
              recentExpenses.map((expense) => (
                <div
                  className="flex items-center justify-between"
                  key={expense._id}
                >
                  <div className="flex flex-col">
                    <span className="font-medium">{expense.description}</span>
                    <span className="text-muted-foreground text-sm">
                      {expense.category} •{" "}
                      {new Date(expense.date).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">
                      {formatCurrency(expense.amount)}
                    </span>
                    <Badge
                      variant={
                        expense.status === "approved"
                          ? "default"
                          : expense.status === "pending"
                            ? "secondary"
                            : "destructive"
                      }
                    >
                      {expense.status}
                    </Badge>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-4 text-center text-muted-foreground">
                No recent expenses
              </div>
            )}
          </CardContent>
        </Card>

        {/* Income Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Income Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Rental Income</span>
                <span className="font-medium">
                  {formatCurrency(income.rental.amount || 0)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Deposits</span>
                <span className="font-medium">
                  {formatCurrency(income.deposits.amount || 0)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Fees</span>
                <span className="font-medium">
                  {formatCurrency(income.fees.amount || 0)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Other Income</span>
                <span className="font-medium">
                  {formatCurrency(income.other.amount || 0)}
                </span>
              </div>
              <div className="flex items-center justify-between border-t pt-2 font-semibold">
                <span>Total</span>
                <span>{formatCurrency(income.total || 0)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tax Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-lg">
            <Calendar className="mr-2 h-5 w-5" />
            Tax Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <div className="font-bold text-2xl">
                {formatCurrency(summary.taxableIncome || 0)}
              </div>
              <p className="text-muted-foreground text-xs">Taxable Income</p>
            </div>
            <div>
              <div className="font-bold text-2xl">
                {formatCurrency(summary.estimatedTax || 0)}
              </div>
              <p className="text-muted-foreground text-xs">Estimated Tax</p>
            </div>
            <div>
              <div className="font-bold text-2xl text-green-600">
                {formatCurrency(summary.netIncome - summary.estimatedTax || 0)}
              </div>
              <p className="text-muted-foreground text-xs">After Tax Income</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
