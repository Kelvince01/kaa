import { Icon } from "@iconify/react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@kaa/ui/components/card";

export function RecentActivities() {
  return (
    <Card className="border-emerald-200">
      <CardHeader>
        <CardTitle className="font-heading text-emerald-900">
          Recent Activities
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100">
            <Icon
              className="h-4 w-4 text-emerald-600"
              icon="material-symbols:payment"
            />
          </div>
          <div className="flex-1">
            <p className="font-medium text-emerald-900 text-sm">Rent Payment</p>
            <p className="text-emerald-600 text-xs">
              Paid KES 45,000 • 2 days ago
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
            <Icon
              className="h-4 w-4 text-blue-600"
              icon="material-symbols:build"
            />
          </div>
          <div className="flex-1">
            <p className="font-medium text-emerald-900 text-sm">
              Maintenance Request
            </p>
            <p className="text-emerald-600 text-xs">
              AC repair completed • 1 week ago
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-100">
            <Icon
              className="h-4 w-4 text-purple-600"
              icon="material-symbols:smart-toy"
            />
          </div>
          <div className="flex-1">
            <p className="font-medium text-emerald-900 text-sm">
              AI Recommendation
            </p>
            <p className="text-emerald-600 text-xs">
              Energy saving tip • 3 days ago
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
