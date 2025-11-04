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
  ArrowLeft,
  Calendar,
  DollarSign,
  Droplets,
  Edit,
  Home,
  Settings,
  TrendingUp,
  UserMinus,
  UserPlus,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { StatusBadge } from "@/modules/units/components/status/status-badge";
import type { Unit } from "@/modules/units/unit.type";
import {
  formatCurrency,
  formatDate,
  generateUnitSummary,
  getAmenitiesSummary,
  getDaysUntilRentDue,
  getUnitDisplayTitle,
  getUnitTypeDisplayName,
  getUtilitiesSummary,
} from "@/modules/units/utils/unit-utils";

type UnitDetailsProps = {
  unit: Unit;
  onBack?: () => void;
  onEdit?: (unit: Unit) => void;
  onAssignTenant?: (unit: Unit) => void;
  onVacateTenant?: (unit: Unit) => void;
  onUpdateMeterReadings?: (unit: Unit) => void;
};

export function UnitDetails({
  unit,
  onBack,
  onEdit,
  onAssignTenant,
  onVacateTenant,
  onUpdateMeterReadings,
}: UnitDetailsProps) {
  const [activeTab, setActiveTab] = useState("overview");

  const daysUntilRentDue = getDaysUntilRentDue(unit);
  const property =
    typeof unit.property === "string"
      ? { title: unit.property }
      : unit.property;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        {onBack && (
          <Button onClick={onBack} size="icon" variant="ghost">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        )}
        <div className="flex-1">
          <h1 className="font-bold text-3xl tracking-tight">
            {getUnitDisplayTitle(unit)}
          </h1>
          <p className="text-muted-foreground">{generateUnitSummary(unit)}</p>
        </div>
        <div className="flex gap-2">
          {unit.status === "vacant" && onAssignTenant && (
            <Button className="gap-2" onClick={() => onAssignTenant(unit)}>
              <UserPlus className="h-4 w-4" />
              Assign Tenant
            </Button>
          )}
          {unit.status === "occupied" && onVacateTenant && (
            <Button
              className="gap-2"
              onClick={() => onVacateTenant(unit)}
              variant="outline"
            >
              <UserMinus className="h-4 w-4" />
              Vacate Unit
            </Button>
          )}
          {onEdit && (
            <Button
              className="gap-2"
              onClick={() => onEdit(unit)}
              variant="outline"
            >
              <Edit className="h-4 w-4" />
              Edit
            </Button>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">Monthly Rent</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">
              {formatCurrency(unit.rent)}
            </div>
            <p className="text-muted-foreground text-xs">
              Due day: {unit.rentDueDay}
              {unit.rentDueDay === 1 && "st"}
              {unit.rentDueDay === 2 && "nd"}
              {unit.rentDueDay === 3 && "rd"}
              {unit.rentDueDay > 3 && "th"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">
              Security Deposit
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">
              {formatCurrency(unit.depositAmount)}
            </div>
            <p className="text-muted-foreground text-xs">One-time payment</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">Unit Type</CardTitle>
            <Home className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">{unit.bedrooms}</div>
            <p className="text-muted-foreground text-xs">
              {getUnitTypeDisplayName(unit.type)} • {unit.bathrooms} bath
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">Next Rent Due</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">
              {daysUntilRentDue !== null ? `${daysUntilRentDue}` : "N/A"}
            </div>
            <p className="text-muted-foreground text-xs">
              {daysUntilRentDue !== null
                ? daysUntilRentDue > 0
                  ? "days remaining"
                  : daysUntilRentDue === 0
                    ? "due today"
                    : "days overdue"
                : "Not applicable"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Details Tabs */}
      <Tabs onValueChange={setActiveTab} value={activeTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="tenant">Tenant Info</TabsTrigger>
          <TabsTrigger value="utilities">Utilities</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent className="space-y-6" value="overview">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Unit Number:</span>
                  <span className="font-medium">{unit.unitNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Property:</span>
                  <span className="font-medium">{property?.title}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Floor:</span>
                  <span className="font-medium">{unit.floor || "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Size:</span>
                  <span className="font-medium">
                    {unit.size ? `${unit.size} sqm` : "N/A"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status:</span>
                  <StatusBadge status={unit.status} />
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Active:</span>
                  <Badge variant={unit.isActive ? "default" : "secondary"}>
                    {unit.isActive ? "Yes" : "No"}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Financial Information */}
            <Card>
              <CardHeader>
                <CardTitle>Financial Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Monthly Rent:</span>
                  <span className="font-medium">
                    {formatCurrency(unit.rent)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Security Deposit:
                  </span>
                  <span className="font-medium">
                    {formatCurrency(unit.depositAmount)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Rent Due Day:</span>
                  <span className="font-medium">{unit.rentDueDay}</span>
                </div>
                {unit.nextRentDueDate && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Next Due Date:
                    </span>
                    <span className="font-medium">
                      {formatDate(unit.nextRentDueDate)}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Amenities and Utilities */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Amenities</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{getAmenitiesSummary(unit)}</p>
                {unit.amenities && unit.amenities.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {unit.amenities.map((amenity, index) => (
                      <Badge key={index.toString()} variant="outline">
                        {amenity.name}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Utilities</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{getUtilitiesSummary(unit)}</p>
                {unit.utilities && unit.utilities.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {unit.utilities.map((utility, index) => (
                      <div
                        className="flex items-center justify-between text-sm"
                        key={index.toString()}
                      >
                        <span>{utility.name}</span>
                        <Badge
                          variant={utility.included ? "default" : "outline"}
                        >
                          {utility.included ? "Included" : "Separate"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Description and Notes */}
          {(unit.description || unit.notes) && (
            <Card>
              <CardHeader>
                <CardTitle>Additional Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {unit.description && (
                  <div>
                    <h4 className="mb-2 font-medium">Description</h4>
                    <p className="text-muted-foreground text-sm">
                      {unit.description}
                    </p>
                  </div>
                )}
                {unit.notes && (
                  <div>
                    <h4 className="mb-2 font-medium">Notes</h4>
                    <p className="text-muted-foreground text-sm">
                      {unit.notes}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="tenant">
          <Card>
            <CardHeader>
              <CardTitle>Tenant Information</CardTitle>
            </CardHeader>
            <CardContent>
              {unit.status === "occupied" && unit.currentTenant ? (
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium">Current Tenant</h4>
                    <p className="text-muted-foreground text-sm">
                      {typeof unit.currentTenant === "string"
                        ? unit.currentTenant
                        : `${unit.currentTenant.personalInfo.firstName} ${unit.currentTenant.personalInfo.lastName}`}
                    </p>
                  </div>
                  {unit.leaseStartDate && (
                    <div>
                      <h4 className="font-medium">Lease Start Date</h4>
                      <p className="text-muted-foreground text-sm">
                        {formatDate(unit.leaseStartDate)}
                      </p>
                    </div>
                  )}
                  {unit.leaseEndDate && (
                    <div>
                      <h4 className="font-medium">Lease End Date</h4>
                      <p className="text-muted-foreground text-sm">
                        {formatDate(unit.leaseEndDate)}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-8 text-center">
                  <p className="mb-4 text-muted-foreground">
                    No tenant currently assigned
                  </p>
                  {onAssignTenant && (
                    <Button
                      className="gap-2"
                      onClick={() => onAssignTenant(unit)}
                    >
                      <UserPlus className="h-4 w-4" />
                      Assign Tenant
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="utilities">
          <div className="space-y-6">
            {/* Meter Readings */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Meter Readings</CardTitle>
                {onUpdateMeterReadings && (
                  <Button
                    className="gap-2"
                    onClick={() => onUpdateMeterReadings(unit)}
                    size="sm"
                    variant="outline"
                  >
                    <Settings className="h-4 w-4" />
                    Update Readings
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="flex items-center gap-3">
                    <Droplets className="h-5 w-5 text-blue-500" />
                    <div>
                      <div className="font-medium">Water Meter</div>
                      <div className="text-muted-foreground text-sm">
                        {unit.waterMeterReading || "No reading"}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Zap className="h-5 w-5 text-yellow-500" />
                    <div>
                      <div className="font-medium">Electricity Meter</div>
                      <div className="text-muted-foreground text-sm">
                        {unit.electricityMeterReading || "No reading"}
                      </div>
                    </div>
                  </div>
                </div>
                {unit.lastMeterReadingDate && (
                  <div className="mt-4 border-t pt-4">
                    <p className="text-muted-foreground text-xs">
                      Last reading: {formatDate(unit.lastMeterReadingDate)}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Utility Details */}
            {unit.utilities && unit.utilities.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Utility Services</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {unit.utilities.map((utility, index) => (
                      <div
                        className="flex items-center justify-between rounded-lg border p-3"
                        key={index.toString()}
                      >
                        <div>
                          <div className="font-medium">{utility.name}</div>
                          <div className="text-muted-foreground text-sm">
                            {utility.provider || "No provider specified"}
                          </div>
                          {utility.meterNumber && (
                            <div className="text-muted-foreground text-xs">
                              Meter: {utility.meterNumber}
                            </div>
                          )}
                        </div>
                        <div className="text-right">
                          <Badge
                            variant={utility.included ? "default" : "outline"}
                          >
                            {utility.included ? "Included" : "Separate"}
                          </Badge>
                          {!utility.included && utility.amount && (
                            <div className="mt-1 font-medium text-sm">
                              {formatCurrency(utility.amount)}
                              {utility.paymentFrequency &&
                                `/${utility.paymentFrequency}`}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="maintenance">
          <Card>
            <CardHeader>
              <CardTitle>Maintenance Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {unit.lastMaintenanceDate && (
                  <div>
                    <h4 className="font-medium">Last Maintenance</h4>
                    <p className="text-muted-foreground text-sm">
                      {formatDate(unit.lastMaintenanceDate)}
                    </p>
                  </div>
                )}
                {unit.nextInspectionDate && (
                  <div>
                    <h4 className="font-medium">Next Inspection</h4>
                    <p className="text-muted-foreground text-sm">
                      {formatDate(unit.nextInspectionDate)}
                    </p>
                  </div>
                )}
                {!(unit.lastMaintenanceDate || unit.nextInspectionDate) && (
                  <p className="py-8 text-center text-muted-foreground">
                    No maintenance information available
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Unit History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="py-8 text-center text-muted-foreground">
                History tracking feature will be implemented here
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
