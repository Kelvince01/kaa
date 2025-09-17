import { Icon } from "@iconify/react";
import { Card, CardContent } from "@kaa/ui/components/card";

export function DashboardStats() {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
      <Card className="border-0 bg-gradient-to-br from-emerald-500 to-emerald-600 text-white">
        <CardContent className="px-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-emerald-100 text-sm">
                Next Rent Due
              </p>
              <p className="font-bold text-2xl">KES 45,000</p>
              <p className="text-emerald-200 text-sm">Due in 12 days</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20">
              <Icon
                className="h-6 w-6"
                icon="material-symbols:calendar-month"
              />
            </div>
          </div>
        </CardContent>
      </Card>
      <Card className="border-0 bg-gradient-to-br from-amber-500 to-orange-500 text-white">
        <CardContent className="px-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-amber-100 text-sm">Utilities</p>
              <p className="font-bold text-2xl">KES 3,200</p>
              <p className="text-amber-200 text-sm">This month</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20">
              <Icon className="h-6 w-6" icon="material-symbols:bolt" />
            </div>
          </div>
        </CardContent>
      </Card>
      <Card className="border-0 bg-gradient-to-br from-blue-500 to-cyan-500 text-white">
        <CardContent className="px-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-blue-100 text-sm">Maintenance</p>
              <p className="font-bold text-2xl">2 Active</p>
              <p className="text-blue-200 text-sm">1 in progress</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20">
              <Icon className="h-6 w-6" icon="material-symbols:build" />
            </div>
          </div>
        </CardContent>
      </Card>
      <Card className="border-0 bg-gradient-to-br from-purple-500 to-pink-500 text-white">
        <CardContent className="px-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-purple-100 text-sm">AI Score</p>
              <p className="font-bold text-2xl">98%</p>
              <p className="text-purple-200 text-sm">Excellent tenant</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20">
              <Icon className="h-6 w-6" icon="material-symbols:stars" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
