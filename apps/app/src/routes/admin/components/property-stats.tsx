import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@kaa/ui/components/chart";
import { Eye, Home, Star, TrendingUp } from "lucide-react";
import type React from "react";
import { Cell, Legend, Pie, PieChart, ResponsiveContainer } from "recharts";

type PropertyStatsProps = {
  totalProperties: number;
  activeListings: number;
  viewsThisMonth: number;
  averageRating: number;
  propertyTypeDistribution: Array<{
    name: string;
    value: number;
  }>;
};

const PropertyStats: React.FC<PropertyStatsProps> = ({
  totalProperties,
  activeListings,
  viewsThisMonth,
  averageRating,
  propertyTypeDistribution,
}) => {
  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"];

  const statCards = [
    {
      title: "Total Properties",
      value: totalProperties,
      icon: <Home className="h-6 w-6 text-blue-500" />,
      color: "bg-blue-50 text-blue-500",
    },
    {
      title: "Active Listings",
      value: activeListings,
      icon: <TrendingUp className="h-6 w-6 text-green-500" />,
      color: "bg-green-50 text-green-500",
    },
    {
      title: "Views This Month",
      value: viewsThisMonth,
      icon: <Eye className="h-6 w-6 text-purple-500" />,
      color: "bg-purple-50 text-purple-500",
    },
    {
      title: "Average Rating",
      value: `${averageRating.toFixed(1)}/5`,
      icon: <Star className="h-6 w-6 text-yellow-500" />,
      color: "bg-yellow-50 text-yellow-500",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, index) => (
          <div
            className="rounded-lg bg-white p-4 shadow-md"
            key={index.toString()}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">{stat.title}</p>
                <p className="mt-1 font-semibold text-2xl">{stat.value}</p>
              </div>
              <div className={`rounded-full p-3 ${stat.color}`}>
                {stat.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-lg bg-white p-6 shadow-md">
        <h3 className="mb-4 font-semibold text-gray-800 text-lg">
          Property Type Distribution
        </h3>
        <ChartContainer
          className="h-[300px]"
          config={propertyTypeDistribution.reduce(
            (acc, item, index) => {
              acc[item.name] = {
                label: item.name,
                color: COLORS[index % COLORS.length] as string,
              };
              return acc;
            },
            {} as Record<string, { label: string; color: string }>
          )}
        >
          <ResponsiveContainer height="100%" width="100%">
            <PieChart>
              <Pie
                cx="50%"
                cy="50%"
                data={propertyTypeDistribution}
                dataKey="value"
                fill="#8884d8"
                label={({ name, percent }) =>
                  `${name}: ${((percent as number) * 100).toFixed(0)}%`
                }
                labelLine={false}
                nameKey="name"
                outerRadius={80}
              >
                {propertyTypeDistribution.map((_, index) => (
                  <Cell
                    fill={COLORS[index % COLORS.length]}
                    key={`cell-${index.toString()}`}
                  />
                ))}
              </Pie>
              <ChartTooltip content={<ChartTooltipContent />} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>
    </div>
  );
};

export default PropertyStats;
