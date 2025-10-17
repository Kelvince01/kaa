"use client";

import { Badge } from "@kaa/ui/components/badge";
import { Button } from "@kaa/ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@kaa/ui/components/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@kaa/ui/components/tabs";
import {
  AlertTriangle,
  Building,
  DollarSign,
  Filter,
  Plus,
  Users,
} from "lucide-react";
import { useState } from "react";
import { StatusBadge } from "@/modules/units/components/status/status-badge";
import { UnitList } from "@/modules/units/components/unit-list";
import { useUnits } from "@/modules/units/unit.queries";
import type { Unit } from "@/modules/units/unit.type";
import {
  formatCurrency,
  getRentCollectionSummary,
  getUnitDisplayTitle,
  getUnitStats,
  getUnitTypeDisplayName,
  isRentDueSoon,
  isRentOverdue,
} from "@/modules/units/utils/unit-utils";

type UnitsOverviewProps = {
  onCreateUnit?: () => void;
  onViewUnit?: (unit: Unit) => void;
};

export function UnitsOverview({
  onCreateUnit,
  onViewUnit,
}: UnitsOverviewProps) {
  const [view, setView] = useState<"overview" | "table" | "grid">("overview");
  const { data: unitsData, isLoading } = useUnits();

  const units = unitsData?.items || [];
  const stats = getUnitStats(units);

  const urgentUnits = units.filter(
    (unit) => isRentOverdue(unit) || isRentDueSoon(unit)
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="mb-4 h-8 w-64 rounded bg-muted" />
          <div className="mb-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div className="h-32 rounded bg-muted" key={i.toString()} />
            ))}
          </div>
          <div className="h-96 rounded bg-muted" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="font-bold text-3xl tracking-tight">Units</h1>
          <p className="text-muted-foreground">
            Manage your property units and track occupancy
          </p>
        </div>
        <div className="flex gap-2">
          <Button className="gap-2" onClick={onCreateUnit}>
            <Plus className="h-4 w-4" />
            Add Unit
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">Total Units</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">{stats.total}</div>
            <p className="text-muted-foreground text-xs">
              {stats.occupied} occupied, {stats.vacant} vacant
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">
              Occupancy Rate
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">{stats.occupancyRate}%</div>
            <p className="text-muted-foreground text-xs">
              {stats.occupied} of {stats.total} units occupied
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">
              Monthly Revenue
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">
              {formatCurrency(stats.totalRentRevenue)}
            </div>
            <p className="text-muted-foreground text-xs">
              +{formatCurrency(stats.potentialRevenue)} potential
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">
              Urgent Attention
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">{urgentUnits.length}</div>
            <p className="text-muted-foreground text-xs">
              {stats.rentOverdue} overdue, {stats.rentDueSoon} due soon
            </p>
          </CardContent>
        </Card>
      </div>

      {/* View Tabs */}
      <Tabs onValueChange={(value: any) => setView(value)} value={view}>
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="table">Table</TabsTrigger>
            <TabsTrigger value="grid">Grid</TabsTrigger>
          </TabsList>
          <Button className="gap-2" size="sm" variant="outline">
            <Filter className="h-4 w-4" />
            Filters
          </Button>
        </div>

        <TabsContent className="space-y-6" value="overview">
          {/* Urgent Units */}
          {urgentUnits.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-500" />
                  Units Requiring Attention
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {urgentUnits.slice(0, 5).map((unit) => (
                    // biome-ignore lint/a11y/noStaticElementInteractions: ignore
                    // biome-ignore lint/a11y/noNoninteractiveElementInteractions: ignore
                    // biome-ignore lint/a11y/useKeyWithClickEvents: ignore
                    <div
                      className="flex cursor-pointer items-center justify-between rounded-lg border p-3 hover:bg-muted/50"
                      key={unit._id}
                      onClick={() => onViewUnit?.(unit)}
                    >
                      <div>
                        <div className="font-medium">
                          {getUnitDisplayTitle(unit)}
                        </div>
                        <div className="text-muted-foreground text-sm">
                          {getRentCollectionSummary(unit)}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusBadge status={unit.status} />
                        {isRentOverdue(unit) && (
                          <Badge variant="destructive">Overdue</Badge>
                        )}
                        {isRentDueSoon(unit) && (
                          <Badge variant="secondary">Due Soon</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recent Units */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Units</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {units.slice(0, 10).map((unit) => (
                  // biome-ignore lint/a11y/noStaticElementInteractions: ignore
                  // biome-ignore lint/a11y/noNoninteractiveElementInteractions: ignore
                  // biome-ignore lint/a11y/useKeyWithClickEvents: ignore
                  <div
                    className="flex cursor-pointer items-center justify-between rounded-lg border p-3 hover:bg-muted/50"
                    key={unit._id}
                    onClick={() => onViewUnit?.(unit)}
                  >
                    <div>
                      <div className="font-medium">
                        {getUnitDisplayTitle(unit)}
                      </div>
                      <div className="text-muted-foreground text-sm">
                        {getUnitTypeDisplayName(unit.unitType)} •{" "}
                        {formatCurrency(unit.rent)}/month
                      </div>
                    </div>
                    <StatusBadge status={unit.status} />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="table">
          <Card>
            <CardHeader>
              <CardTitle>All Units</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <UnitList
                  onViewUnit={onViewUnit}
                  showActions={false}
                  units={units}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="grid">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {units.map((unit) => (
              <Card
                className="cursor-pointer transition-shadow hover:shadow-md"
                key={unit._id}
                onClick={() => onViewUnit?.(unit)}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{unit.unitNumber}</CardTitle>
                    <StatusBadge status={unit.status} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="text-muted-foreground text-sm">
                      {getUnitTypeDisplayName(unit.unitType)}
                    </div>
                    <div className="font-semibold">
                      {formatCurrency(unit.rent)}/month
                    </div>
                    <div className="text-sm">
                      {unit.bedrooms} bed • {unit.bathrooms} bath
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
