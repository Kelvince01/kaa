import { Icon } from "@iconify/react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@kaa/ui/components/card";

export function DashboardAiInsightsAndRecommendations() {
  return (
    <Card className="border-emerald-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-heading text-emerald-900">
          <Icon
            className="h-5 w-5 text-emerald-600"
            icon="material-symbols:smart-toy"
          />
          AI Insights & Recommendations
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 px-6">
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500">
              <Icon
                className="h-4 w-4 text-white"
                icon="material-symbols:lightbulb"
              />
            </div>
            <div>
              <h4 className="font-medium text-emerald-900">
                Energy Savings Opportunity
              </h4>
              <p className="mt-1 text-emerald-700 text-sm">
                You can save up to KES 800 monthly by adjusting your AC usage
                during peak hours. Would you like me to create an automated
                schedule?
              </p>
            </div>
          </div>
        </div>
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-500">
              <Icon
                className="h-4 w-4 text-white"
                icon="material-symbols:water-drop"
              />
            </div>
            <div>
              <h4 className="font-medium text-blue-900">Water Usage Alert</h4>
              <p className="mt-1 text-blue-700 text-sm">
                Your water consumption is 15% higher than similar units. I've
                detected a possible leak in the bathroom tap.
              </p>
            </div>
          </div>
        </div>
        <div className="rounded-lg border border-purple-200 bg-purple-50 p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-purple-500">
              <Icon
                className="h-4 w-4 text-white"
                icon="material-symbols:event"
              />
            </div>
            <div>
              <h4 className="font-medium text-purple-900">Community Event</h4>
              <p className="mt-1 text-purple-700 text-sm">
                There's a building meeting this Saturday at 2 PM. Based on your
                schedule, you're likely available.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
