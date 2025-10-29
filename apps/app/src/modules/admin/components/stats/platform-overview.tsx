import { PieChart } from "lucide-react";

type PlatformOverviewProps = {
  stats: {
    tenantPercent: number;
    landlordPercent: number;
    avgBookingRate: number;
    avgResponseTime: number;
    verifiedPropertyPercent: number;
  };
};

export const PlatformOverview = ({ stats }: PlatformOverviewProps) => (
  <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm md:col-span-2">
    <h3 className="mb-4 flex items-center font-medium text-gray-900 text-lg">
      <PieChart className="mr-2 text-blue-600" />
      Platform Overview
    </h3>

    <div className="grid grid-cols-2 gap-4">
      <div className="rounded-lg bg-blue-50 p-4">
        <p className="mb-1 text-gray-600 text-sm">Tenant/Landlord Ratio</p>
        <p className="font-semibold text-gray-900">
          {stats.tenantPercent || 0}% / {stats.landlordPercent || 0}%
        </p>
      </div>

      <div className="rounded-lg bg-green-50 p-4">
        <p className="mb-1 text-gray-600 text-sm">Avg. Booking Rate</p>
        <p className="font-semibold text-gray-900">
          {stats.avgBookingRate || 0}%
        </p>
      </div>

      <div className="rounded-lg bg-yellow-50 p-4">
        <p className="mb-1 text-gray-600 text-sm">Avg. Response Time</p>
        <p className="font-semibold text-gray-900">
          {stats.avgResponseTime || 0} hours
        </p>
      </div>

      <div className="rounded-lg bg-purple-50 p-4">
        <p className="mb-1 text-gray-600 text-sm">Verified Properties</p>
        <p className="font-semibold text-gray-900">
          {stats.verifiedPropertyPercent || 0}%
        </p>
      </div>
    </div>
  </div>
);
