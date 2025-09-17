import { Icon } from "@iconify/react";
import { Button } from "@kaa/ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@kaa/ui/components/card";

export function QuickActions() {
  return (
    <Card className="border-emerald-200">
      <CardHeader>
        <CardTitle className="font-heading text-emerald-900">
          Quick Actions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 px-6">
        <Button className="w-full bg-emerald-500 text-white hover:bg-emerald-600">
          <Icon className="mr-2 h-4 w-4" icon="material-symbols:payment" />
          Pay Rent
        </Button>
        <Button
          className="w-full border-emerald-200 text-emerald-700 hover:bg-emerald-50"
          variant="outline"
        >
          <Icon className="mr-2 h-4 w-4" icon="material-symbols:build" />
          Request Maintenance
        </Button>
        <Button
          className="w-full border-emerald-200 text-emerald-700 hover:bg-emerald-50"
          variant="outline"
        >
          <Icon className="mr-2 h-4 w-4" icon="material-symbols:receipt-long" />
          View Bills
        </Button>
        <Button
          className="w-full border-emerald-200 text-emerald-700 hover:bg-emerald-50"
          variant="outline"
        >
          <Icon className="mr-2 h-4 w-4" icon="material-symbols:smart-toy" />
          Chat with AI
        </Button>
      </CardContent>
    </Card>
  );
}
