import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@kaa/ui/components/card";
import { ChartContainer } from "@kaa/ui/components/chart";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

export function MonthlyRevenueChart() {
  return (
    <Card className="border-emerald-200">
      <CardHeader>
        <CardTitle className="font-heading text-emerald-900">
          Monthly Expenses
        </CardTitle>
      </CardHeader>
      <CardContent className="px-6 pl-0">
        <ChartContainer
          className="h-[300px] w-full"
          config={{
            rent: { color: "var(--chart-1)", label: "Rent" },
            internet: { color: "var(--chart-3)", label: "Internet" },
            utilities: { color: "var(--chart-2)", label: "Utilities" },
          }}
        >
          <BarChart
            data={[
              {
                rent: 45_000,
                month: "Jan",
                internet: 2500,
                utilities: 3200,
              },
              {
                rent: 45_000,
                month: "Feb",
                internet: 2500,
                utilities: 2800,
              },
              {
                rent: 45_000,
                month: "Mar",
                internet: 2500,
                utilities: 3500,
              },
              {
                rent: 45_000,
                month: "Apr",
                internet: 2500,
                utilities: 3100,
              },
              {
                rent: 45_000,
                month: "May",
                internet: 2500,
                utilities: 3400,
              },
              {
                rent: 45_000,
                month: "Jun",
                internet: 2500,
                utilities: 3200,
              },
            ]}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Bar dataKey="rent" fill="var(--chart-1)" />
            <Bar dataKey="utilities" fill="var(--chart-2)" />
            <Bar dataKey="internet" fill="var(--chart-3)" />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
