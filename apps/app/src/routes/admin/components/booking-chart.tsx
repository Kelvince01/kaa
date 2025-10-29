import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@kaa/ui/components/chart";
import type React from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";

type BookingData = {
  month: string;
  bookings: number;
  completed: number;
  cancelled: number;
};

type BookingChartProps = {
  data?: BookingData[];
  title?: string;
  description?: string;
};

const BookingChart: React.FC<BookingChartProps> = ({
  data,
  title = "Booking Trends",
  description = "Monthly booking statistics",
}) => (
  <div className="rounded-lg bg-white p-6 shadow-md">
    <h3 className="mb-1 font-semibold text-gray-800 text-lg">{title}</h3>
    <p className="mb-4 text-gray-500 text-sm">{description}</p>

    <ChartContainer
      className="h-[300px]"
      config={{
        bookings: {
          label: "Total Bookings",
          color: "hsl(var(--chart-1))",
        },
        completed: {
          label: "Completed",
          color: "hsl(var(--chart-2))",
        },
        cancelled: {
          label: "Cancelled",
          color: "hsl(var(--chart-3))",
        },
      }}
    >
      <ResponsiveContainer height="100%" width="100%">
        <BarChart
          data={data}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Legend />
          <Bar dataKey="bookings" fill="var(--chart-1)" name="Total Bookings" />
          <Bar dataKey="completed" fill="var(--chart-2)" name="Completed" />
          <Bar dataKey="cancelled" fill="var(--chart-3)" name="Cancelled" />
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  </div>
);

export default BookingChart;
