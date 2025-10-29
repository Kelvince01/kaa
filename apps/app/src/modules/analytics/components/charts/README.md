# Analytics Charts with shadcn Integration

This directory contains chart components that have been updated to use the shadcn chart system with recharts, providing a modern, accessible, and themeable chart library.

## Features

- 🎨 **Full Theme Support**: Charts automatically adapt to light/dark themes
- 🎯 **Type Safe**: Full TypeScript support with proper chart configurations
- 📱 **Responsive**: Charts scale beautifully across all device sizes
- ♿ **Accessible**: Built with accessibility in mind following shadcn standards
- 🔧 **Configurable**: Easy to customize colors, styling, and behavior

## Chart Components

### Core Components

- **`AreaChartComponent`** - Area charts for trend visualization
- **`BarChartComponent`** - Bar charts with horizontal/vertical support
- **`LineChartComponent`** - Line charts for time series data
- **`PieChartComponent`** - Pie/donut charts for distribution data
- **`MixedChartComponent`** - Combined chart types in one visualization

### Example Usage

```tsx
import { 
  AreaChartComponent, 
  generateChartConfig,
  SAMPLE_REVENUE_DATA 
} from "@/modules/analytics";

const config = generateChartConfig([
  { label: "revenue" },
  { label: "expenses" }
]);

export function RevenueChart() {
  return (
    <AreaChartComponent
      title="Monthly Revenue"
      data={SAMPLE_REVENUE_DATA}
      config={config}
      trend={{ value: "+12.5%", isPositive: true }}
      showLegend={true}
      showGrid={true}
    />
  );
}
```

## Chart Configuration

### ChartConfig Type

```tsx
import type { ChartConfig } from "@kaa/ui/components/chart";

const config: ChartConfig = {
  revenue: {
    label: "Revenue",
    color: "hsl(var(--chart-1))",
  },
  expenses: {
    label: "Expenses",
    color: "hsl(var(--chart-2))",
  },
};
```

### Color System

The charts use CSS variables for theming:

```css
:root {
  --chart-1: 220 70% 50%;
  --chart-2: 160 60% 45%;
  --chart-3: 30 80% 55%;
  --chart-4: 280 65% 60%;
  --chart-5: 340 75% 55%;
}
```

## Data Format

Charts expect data in the `ChartData` format:

```tsx
interface ChartData {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string;
    borderWidth?: number;
    fill?: boolean;
  }>;
}
```

## Utility Functions

### `generateChartConfig(datasets, customColors?)`

Automatically generates chart configuration from dataset labels.

### `generatePieChartConfig(labels, customColors?)`

Generates configuration for pie charts from labels.

### `formatChartValue(value, type)`

Formats chart values as currency, percentage, or number.

### `generateTrendData(values)`

Calculates trend data from an array of values.

## Example Components

The module includes several example components showcasing different chart types:

- `RevenueAreaChart` - Revenue vs expenses area chart
- `PropertyTypesChart` - Property distribution pie chart  
- `MonthlyViewsChart` - Monthly views line chart
- `QuarterlyPerformanceChart` - Performance bar chart
- `MixedPerformanceChart` - Combined chart with multiple types
- `ChartExamplesGrid` - Dashboard layout with multiple charts

## Migration from Legacy Charts

If you're upgrading from the legacy chart system:

1. **Colors**: Use `CHART_COLORS` instead of `LEGACY_CHART_COLORS`
2. **Configuration**: Add `ChartConfig` objects for proper theming
3. **Container**: Charts now use `ChartContainer` automatically
4. **Tooltips**: Use `ChartTooltip` with `ChartTooltipContent`
5. **Legends**: Use `ChartLegend` with `ChartLegendContent`

### Before (Legacy)
```tsx
<AreaChart data={data}>
  <Tooltip contentStyle={{ backgroundColor: "..." }} />
  <Legend />
</AreaChart>
```

### After (shadcn)
```tsx
<ChartContainer config={chartConfig}>
  <AreaChart data={data}>
    <ChartTooltip content={<ChartTooltipContent />} />
    <ChartLegend content={<ChartLegendContent />} />
  </AreaChart>
</ChartContainer>
```

## Best Practices

1. **Always provide ChartConfig** for proper theming and accessibility
2. **Use semantic color variables** (`--chart-1`, `--chart-2`, etc.)
3. **Include trend indicators** when showing performance data
4. **Responsive design** - charts automatically adapt to container size
5. **Consistent data formatting** using the provided utility functions

## Performance Considerations

- Charts are optimized for performance with React.memo where appropriate
- Large datasets are handled efficiently by recharts
- Theme switching is instantaneous using CSS variables
- Charts rerender only when data or configuration changes

## Accessibility

All charts include:
- Proper ARIA labels and descriptions
- Keyboard navigation support
- High contrast mode compatibility
- Screen reader friendly tooltips and legends
- Focus indicators for interactive elements