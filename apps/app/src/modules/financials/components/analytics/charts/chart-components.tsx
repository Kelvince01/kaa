import { Badge } from "@kaa/ui/components/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@kaa/ui/components/card";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@kaa/ui/components/chart";
import { Minus, TrendingDown, TrendingUp } from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatCurrency } from "@/shared/utils/format.util";

type ChartData = {
  [key: string]: any;
};

type BaseChartProps = {
  title?: string;
  data: ChartData[];
  height?: number;
  className?: string;
  loading?: boolean;
};

interface LineChartProps extends BaseChartProps {
  xDataKey: string;
  lines: Array<{
    dataKey: string;
    stroke: string;
    name: string;
  }>;
}

interface BarChartProps extends BaseChartProps {
  xDataKey: string;
  bars: Array<{
    dataKey: string;
    fill: string;
    name: string;
  }>;
}

interface PieChartProps extends BaseChartProps {
  dataKey: string;
  nameKey: string;
  colors?: string[];
}

interface AreaChartProps extends BaseChartProps {
  xDataKey: string;
  areas: Array<{
    dataKey: string;
    stroke: string;
    fill: string;
    name: string;
  }>;
}

// Custom tooltip for currency formatting
const CurrencyTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border bg-background p-3 shadow-md">
        <p className="font-medium">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={`${entry.name}-${index}`} style={{ color: entry.color }}>
            {`${entry.name}: ${formatCurrency(entry.value)}`}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// Loading skeleton
const ChartSkeleton = ({ height = 300 }: { height?: number }) => (
  <div className="animate-pulse">
    <div className={"rounded-md bg-muted"} style={{ height }} />
  </div>
);

// Expense Trend Line Chart
export function ExpenseTrendChart({
  title,
  data,
  xDataKey,
  lines,
  height = 300,
  className,
  loading,
}: LineChartProps) {
  if (loading) {
    return (
      <Card className={className}>
        {title && (
          <CardHeader>
            <CardTitle>{title}</CardTitle>
          </CardHeader>
        )}
        <CardContent>
          <ChartSkeleton height={height} />
        </CardContent>
      </Card>
    );
  }

  const chartConfig: ChartConfig = lines.reduce(
    (config, line) => ({
      // biome-ignore lint/performance/noAccumulatingSpread: ignore
      ...config,
      [line.dataKey]: {
        label: line.name,
        color: line.stroke,
      },
    }),
    {}
  );

  return (
    <Card className={className}>
      {title && (
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
      )}
      <CardContent>
        <ChartContainer config={chartConfig}>
          <ResponsiveContainer height={height} width="100%">
            <LineChart
              data={data}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={xDataKey} />
              <YAxis tickFormatter={(value) => formatCurrency(value)} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Legend />
              {lines.map((line, index) => (
                <Line
                  activeDot={{ r: 6 }}
                  dataKey={line.dataKey}
                  dot={{ r: 4 }}
                  key={`${line.dataKey}-${index}`}
                  name={line.name}
                  stroke={line.stroke}
                  strokeWidth={2}
                  type="monotone"
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

// Category Bar Chart
export function CategoryBarChart({
  title,
  data,
  xDataKey,
  bars,
  height = 300,
  className,
  loading,
}: BarChartProps) {
  if (loading) {
    return (
      <Card className={className}>
        {title && (
          <CardHeader>
            <CardTitle>{title}</CardTitle>
          </CardHeader>
        )}
        <CardContent>
          <ChartSkeleton height={height} />
        </CardContent>
      </Card>
    );
  }

  const chartConfig: ChartConfig = bars.reduce(
    (config, bar) => ({
      // biome-ignore lint/performance/noAccumulatingSpread: ignore
      ...config,
      [bar.dataKey]: {
        label: bar.name,
        color: bar.fill,
      },
    }),
    {}
  );

  return (
    <Card className={className}>
      {title && (
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
      )}
      <CardContent>
        <ChartContainer config={chartConfig}>
          <ResponsiveContainer height={height} width="100%">
            <BarChart
              data={data}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={xDataKey} />
              <YAxis tickFormatter={(value) => formatCurrency(value)} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Legend />
              {bars.map((bar, index) => (
                <Bar
                  dataKey={bar.dataKey}
                  fill={bar.fill}
                  key={`${bar.dataKey}-${index}`}
                  name={bar.name}
                  radius={[4, 4, 0, 0]}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

// Expense Distribution Pie Chart
export function ExpenseDistributionChart({
  title,
  data,
  dataKey,
  nameKey,
  height = 300,
  className,
  loading,
  colors = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8", "#82CA9D"],
}: PieChartProps) {
  if (loading) {
    return (
      <Card className={className}>
        {title && (
          <CardHeader>
            <CardTitle>{title}</CardTitle>
          </CardHeader>
        )}
        <CardContent>
          <ChartSkeleton height={height} />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      {title && (
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
      )}
      <CardContent>
        <ResponsiveContainer height={height} width="100%">
          <PieChart>
            <Pie
              cx="50%"
              cy="50%"
              data={data}
              dataKey={dataKey}
              fill="#8884d8"
              label={({ name, percent }) =>
                `${name}: ${((percent as number) || 0 * 100).toFixed(0)}%`
              }
              labelLine={false}
              nameKey={nameKey}
              outerRadius={80}
            >
              {data.map((_: any, index: number) => (
                <Cell
                  fill={colors[index % colors.length]}
                  key={`cell-${index.toString()}`}
                />
              ))}
            </Pie>
            <Tooltip formatter={(value) => formatCurrency(Number(value))} />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

// Cash Flow Area Chart
export function CashFlowAreaChart({
  title,
  data,
  xDataKey,
  areas,
  height = 300,
  className,
  loading,
}: AreaChartProps) {
  if (loading) {
    return (
      <Card className={className}>
        {title && (
          <CardHeader>
            <CardTitle>{title}</CardTitle>
          </CardHeader>
        )}
        <CardContent>
          <ChartSkeleton height={height} />
        </CardContent>
      </Card>
    );
  }

  const chartConfig: ChartConfig = areas.reduce(
    (config, area) => ({
      // biome-ignore lint/performance/noAccumulatingSpread: ignore
      ...config,
      [area.dataKey]: {
        label: area.name,
        color: area.stroke,
      },
    }),
    {}
  );

  return (
    <Card className={className}>
      {title && (
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
      )}
      <CardContent>
        <ChartContainer config={chartConfig}>
          <ResponsiveContainer height={height} width="100%">
            <AreaChart
              data={data}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={xDataKey} />
              <YAxis tickFormatter={(value) => formatCurrency(value)} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Legend />
              {areas.map((area, index) => (
                <Area
                  dataKey={area.dataKey}
                  fill={area.fill}
                  key={`${area.dataKey}-${index}`}
                  name={area.name}
                  stackId="1"
                  stroke={area.stroke}
                  type="monotone"
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

// KPI Metric Card with trend indicator
export function KPICard({
  title,
  value,
  change,
  changeType = "currency",
  icon: Icon,
  className,
  loading,
}: {
  title: string;
  value: number;
  change?: number;
  changeType?: "currency" | "percentage" | "number";
  icon?: React.ComponentType<{ className?: string }>;
  className?: string;
  loading?: boolean;
}) {
  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="animate-pulse">
            <div className="mb-2 h-4 w-1/2 rounded bg-muted" />
            <div className="mb-2 h-8 w-3/4 rounded bg-muted" />
            <div className="h-3 w-1/3 rounded bg-muted" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const formatValue = (val: number) => {
    switch (changeType) {
      case "currency":
        return formatCurrency(val);
      case "percentage":
        return `${val.toFixed(1)}%`;
      default:
        return val.toLocaleString();
    }
  };

  const formatChange = (val: number) => {
    const prefix = val > 0 ? "+" : "";
    switch (changeType) {
      case "currency":
        return `${prefix}${formatCurrency(val)}`;
      case "percentage":
        return `${prefix}${val.toFixed(1)}%`;
      default:
        return `${prefix}${val}`;
    }
  };

  const getTrendIcon = () => {
    if (change === undefined || change === 0)
      return <Minus className="h-3 w-3" />;
    return change > 0 ? (
      <TrendingUp className="h-3 w-3" />
    ) : (
      <TrendingDown className="h-3 w-3" />
    );
  };

  const getTrendColor = () => {
    if (change === undefined || change === 0) return "text-muted-foreground";
    return change > 0 ? "text-green-600" : "text-red-600";
  };

  return (
    <Card className={className}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="font-medium text-muted-foreground text-sm">{title}</p>
            <div className="font-bold text-2xl">{formatValue(value)}</div>
            {change !== undefined && (
              <div className={`flex items-center text-xs ${getTrendColor()}`}>
                {getTrendIcon()}
                <span className="ml-1">
                  {formatChange(change)} from last period
                </span>
              </div>
            )}
          </div>
          {Icon && <Icon className="h-8 w-8 text-muted-foreground" />}
        </div>
      </CardContent>
    </Card>
  );
}

// Budget vs Actual Comparison Chart
export function BudgetComparisonChart({
  title,
  data,
  xDataKey,
  height = 300,
  className,
  loading,
}: {
  title?: string;
  data: ChartData[];
  xDataKey: string;
  height?: number;
  className?: string;
  loading?: boolean;
}) {
  if (loading) {
    return (
      <Card className={className}>
        {title && (
          <CardHeader>
            <CardTitle>{title}</CardTitle>
          </CardHeader>
        )}
        <CardContent>
          <ChartSkeleton height={height} />
        </CardContent>
      </Card>
    );
  }

  const chartConfig: ChartConfig = {
    budgeted: {
      label: "Budgeted",
      color: "hsl(var(--chart-1))",
    },
    actual: {
      label: "Actual",
      color: "hsl(var(--chart-2))",
    },
  };

  return (
    <Card className={className}>
      {title && (
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
      )}
      <CardContent>
        <ChartContainer config={chartConfig}>
          <ResponsiveContainer height={height} width="100%">
            <BarChart
              data={data}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={xDataKey} />
              <YAxis tickFormatter={(value) => formatCurrency(value)} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Legend />
              <Bar
                dataKey="budgeted"
                fill="var(--color-budgeted)"
                name="Budgeted"
                radius={[2, 2, 0, 0]}
              />
              <Bar
                dataKey="actual"
                fill="var(--color-actual)"
                name="Actual"
                radius={[2, 2, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

// Financial Health Score Card
export function FinancialHealthCard({
  score,
  factors,
  className,
  loading,
}: {
  score: number;
  factors: Array<{
    name: string;
    score: number;
    impact: "positive" | "negative" | "neutral";
  }>;
  className?: string;
  loading?: boolean;
}) {
  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Financial Health Score</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-8 w-1/4 rounded bg-muted" />
            {[1, 2, 3].map((i) => (
              <div className="h-4 rounded bg-muted" key={i} />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const getScoreColor = () => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreLabel = () => {
    if (score >= 80) return "Excellent";
    if (score >= 60) return "Good";
    if (score >= 40) return "Fair";
    return "Poor";
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Financial Health Score</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className={`font-bold text-3xl ${getScoreColor()}`}>{score}</div>
          <Badge variant={score >= 60 ? "default" : "destructive"}>
            {getScoreLabel()}
          </Badge>
        </div>

        <div className="space-y-2">
          {factors.map((factor, index) => {
            const getFactorColor = () => {
              if (factor.impact === "positive") return "text-green-600";
              if (factor.impact === "negative") return "text-red-600";
              return "text-muted-foreground";
            };

            return (
              <div
                className="flex items-center justify-between text-sm"
                key={`${factor.name}-${index}`}
              >
                <span>{factor.name}</span>
                <span className={getFactorColor()}>{factor.score}</span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
