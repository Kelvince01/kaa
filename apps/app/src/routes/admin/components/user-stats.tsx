import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@kaa/ui/components/chart";
import { Home, UserCheck, UserPlus, Users } from "lucide-react";
import type React from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";

type UserGrowthData = {
  month: string;
  tenants: number;
  landlords: number;
  total: number;
};

type UserStatsProps = {
  totalUsers: number;
  newUsersThisMonth: number;
  activeUsers: number;
  landlordCount: number;
  tenantCount: number;
  userGrowthData: UserGrowthData[];
};

const UserStats: React.FC<UserStatsProps> = ({
  totalUsers,
  newUsersThisMonth,
  activeUsers,
  landlordCount,
  tenantCount,
  userGrowthData,
}) => {
  const statCards = [
    {
      title: "Total Users",
      value: totalUsers,
      icon: <Users className="h-6 w-6 text-blue-500" />,
      color: "bg-blue-50 text-blue-500",
    },
    {
      title: "New This Month",
      value: newUsersThisMonth,
      icon: <UserPlus className="h-6 w-6 text-green-500" />,
      color: "bg-green-50 text-green-500",
    },
    {
      title: "Active Users",
      value: activeUsers,
      icon: <UserCheck className="h-6 w-6 text-purple-500" />,
      color: "bg-purple-50 text-purple-500",
    },
    {
      title: "Landlords",
      value: landlordCount,
      icon: <Home className="h-6 w-6 text-orange-500" />,
      color: "bg-orange-50 text-orange-500",
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
        <h3 className="mb-1 font-semibold text-gray-800 text-lg">
          User Growth
        </h3>
        <p className="mb-4 text-gray-500 text-sm">
          Monthly user registration trends
        </p>

        <ChartContainer
          className="h-[300px]"
          config={{
            tenants: {
              label: "Tenants",
              color: "hsl(var(--chart-1))",
            },
            landlords: {
              label: "Landlords",
              color: "hsl(var(--chart-2))",
            },
            total: {
              label: "Total",
              color: "hsl(var(--chart-3))",
            },
          }}
        >
          <ResponsiveContainer height="100%" width="100%">
            <LineChart
              data={userGrowthData}
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
              <Line
                activeDot={{ r: 8 }}
                dataKey="tenants"
                name="Tenants"
                stroke="var(--chart-1)"
                type="monotone"
              />
              <Line
                dataKey="landlords"
                name="Landlords"
                stroke="var(--chart-2)"
                type="monotone"
              />
              <Line
                dataKey="total"
                name="Total"
                stroke="var(--chart-3)"
                strokeWidth={2}
                type="monotone"
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>

      <div className="rounded-lg bg-white p-6 shadow-md">
        <h3 className="mb-4 font-semibold text-gray-800 text-lg">
          User Distribution
        </h3>
        <div className="flex items-center justify-center">
          <div className="w-full max-w-md">
            <div className="relative pt-1">
              <div className="mb-2 flex items-center justify-between">
                <div>
                  <span className="inline-block rounded-full bg-blue-200 px-2 py-1 font-semibold text-blue-600 text-xs uppercase">
                    Tenants
                  </span>
                </div>
                <div className="text-right">
                  <span className="inline-block font-semibold text-blue-600 text-xs">
                    {Math.round((tenantCount / totalUsers) * 100)}%
                  </span>
                </div>
              </div>
              <div className="mb-4 flex h-2 overflow-hidden rounded bg-blue-200 text-xs">
                <div
                  className="flex flex-col justify-center whitespace-nowrap bg-blue-500 text-center text-white shadow-none"
                  style={{ width: `${(tenantCount / totalUsers) * 100}%` }}
                />
              </div>
            </div>
            <div className="relative pt-1">
              <div className="mb-2 flex items-center justify-between">
                <div>
                  <span className="inline-block rounded-full bg-orange-200 px-2 py-1 font-semibold text-orange-600 text-xs uppercase">
                    Landlords
                  </span>
                </div>
                <div className="text-right">
                  <span className="inline-block font-semibold text-orange-600 text-xs">
                    {Math.round((landlordCount / totalUsers) * 100)}%
                  </span>
                </div>
              </div>
              <div className="mb-4 flex h-2 overflow-hidden rounded bg-orange-200 text-xs">
                <div
                  className="flex flex-col justify-center whitespace-nowrap bg-orange-500 text-center text-white shadow-none"
                  style={{ width: `${(landlordCount / totalUsers) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserStats;
