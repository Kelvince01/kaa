"use client";

import { Button } from "@kaa/ui/components/button";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@kaa/ui/components/tabs";
import { Grid, List, Plus } from "lucide-react";
import { useState } from "react";
import { MaintenanceCard } from "@/modules/maintenance/components/cards/maintenance-card";
import { MaintenanceOverview } from "@/modules/maintenance/components/dashboard/maintenance-overview";
import {
  type MaintenanceFilters,
  MaintenanceFiltersComponent,
} from "@/modules/maintenance/components/filters/maintenance-filters";
import { CreateMaintenanceModal } from "@/modules/maintenance/components/modals/create-maintenance-modal";
import { DeleteMaintenanceModal } from "@/modules/maintenance/components/modals/delete-maintenance-modal";
import { MaintenanceDetailsModal } from "@/modules/maintenance/components/modals/maintenance-details-modal";
import { MaintenanceTable } from "@/modules/maintenance/components/table/maintenance-table";
import { useMaintenancesByUser } from "@/modules/maintenance/maintenance.queries";
import { useMaintenanceStore } from "@/modules/maintenance/maintenance.store";
import type { Maintenance } from "@/modules/maintenance/maintenance.type";
import { useProperties } from "@/modules/properties/property.queries";

export default function MaintenancePage() {
  const [view, setView] = useState<"overview" | "table" | "grid">("overview");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedMaintenance, setSelectedMaintenance] =
    useState<Maintenance | null>(null);
  const [maintenanceToDelete, setMaintenanceToDelete] = useState<string | null>(
    null
  );
  const [filters, setFilters] = useState<MaintenanceFilters>({
    status: [],
    priority: [],
    type: [],
    property: [],
    dateRange: {},
    costRange: {},
  });

  const { data: maintenancesData, isLoading } = useMaintenancesByUser();
  const { data: propertiesData } = useProperties();
  const {
    selectedMaintenances,
    clearSelectedMaintenances,
    setMaintenanceModalOpen,
  } = useMaintenanceStore();

  const maintenances = maintenancesData?.data || [];
  const properties = propertiesData?.properties || [];

  // Filter maintenances based on filters
  const filteredMaintenances = maintenances.filter((maintenance) => {
    // Status filter
    if (
      filters.status.length > 0 &&
      !filters.status.includes(maintenance.status)
    ) {
      return false;
    }

    // Priority filter
    if (
      filters.priority.length > 0 &&
      !filters.priority.includes(maintenance.priority)
    ) {
      return false;
    }

    // Type filter
    if (
      filters.type.length > 0 &&
      !filters.type.includes(maintenance.maintenanceType)
    ) {
      return false;
    }

    // Property filter
    const propertyId =
      typeof maintenance.property === "string"
        ? maintenance.property
        : maintenance.property?._id;
    if (
      filters.property.length > 0 &&
      !filters.property.includes(propertyId || "")
    ) {
      return false;
    }

    // Date range filter
    if (filters.dateRange.from || filters.dateRange.to) {
      const maintenanceDate = new Date(maintenance.statusUpdatedAt);
      if (filters.dateRange.from && maintenanceDate < filters.dateRange.from) {
        return false;
      }
      if (filters.dateRange.to && maintenanceDate > filters.dateRange.to) {
        return false;
      }
    }

    // Cost range filter
    const cost = maintenance.cost || maintenance.estimatedCost || 0;
    if (filters.costRange.min !== undefined && cost < filters.costRange.min) {
      return false;
    }
    if (filters.costRange.max !== undefined && cost > filters.costRange.max) {
      return false;
    }

    // Contractor filter
    if (filters.hasContractor !== undefined) {
      const hasContractor = !!maintenance.assignedContractor;
      if (filters.hasContractor !== hasContractor) {
        return false;
      }
    }

    // Overdue filter
    if (filters.isOverdue !== undefined) {
      // Implementation would depend on isMaintenanceOverdue utility
    }

    return true;
  });

  const handleViewMaintenance = (maintenance: Maintenance) => {
    setSelectedMaintenance(maintenance);
    setIsDetailsModalOpen(true);
  };

  const handleEditMaintenance = (maintenance: Maintenance) => {
    setSelectedMaintenance(maintenance);
    // TODO: Open edit modal when implemented
    console.log("Edit maintenance:", maintenance);
  };

  const handleDeleteMaintenance = (maintenanceId: string) => {
    setMaintenanceToDelete(maintenanceId);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteSelected = (maintenanceIds: string[]) => {
    // TODO: Implement bulk delete
    console.log("Delete selected:", maintenanceIds);
  };

  const confirmDelete = async () => {
    if (maintenanceToDelete) {
      // TODO: Implement delete functionality
      console.log("Deleting maintenance:", maintenanceToDelete);
      setMaintenanceToDelete(null);
      return await Promise.resolve();
    }
    return await Promise.reject(new Error("No maintenance to delete"));
  };

  return (
    <div className="container mx-auto space-y-6 py-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-bold text-3xl tracking-tight">Maintenance</h1>
          <p className="text-muted-foreground">
            Manage property maintenance requests and track their progress
          </p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Request
        </Button>
      </div>

      {/* Filters */}
      <MaintenanceFiltersComponent
        filters={filters}
        onFiltersChange={setFilters}
        properties={properties}
      />

      {/* View Tabs */}
      <Tabs onValueChange={(value) => setView(value as any)} value={view}>
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="table">
              <List className="mr-2 h-4 w-4" />
              Table View
            </TabsTrigger>
            <TabsTrigger value="grid">
              <Grid className="mr-2 h-4 w-4" />
              Grid View
            </TabsTrigger>
          </TabsList>

          <div className="text-muted-foreground text-sm">
            {filteredMaintenances.length} of {maintenances.length} requests
          </div>
        </div>

        {/* Overview Tab */}
        <TabsContent className="space-y-6" value="overview">
          <MaintenanceOverview
            isLoading={isLoading}
            maintenances={filteredMaintenances}
            onCreateMaintenance={() => setIsCreateModalOpen(true)}
            onDeleteMaintenance={handleDeleteMaintenance}
            onEditMaintenance={handleEditMaintenance}
            onViewMaintenance={handleViewMaintenance}
          />
        </TabsContent>

        {/* Table Tab */}
        <TabsContent className="space-y-6" value="table">
          <MaintenanceTable
            isLoading={isLoading}
            maintenances={filteredMaintenances}
            onCreateMaintenance={() => setIsCreateModalOpen(true)}
            onDeleteMaintenance={handleDeleteMaintenance}
            onDeleteSelected={handleDeleteSelected}
            onEditMaintenance={handleEditMaintenance}
            onViewMaintenance={handleViewMaintenance}
          />
        </TabsContent>

        {/* Grid Tab */}
        <TabsContent className="space-y-6" value="grid">
          {isLoading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  className="h-48 animate-pulse rounded-lg bg-muted"
                  key={i.toString()}
                />
              ))}
            </div>
          ) : filteredMaintenances.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredMaintenances.map((maintenance) => (
                <MaintenanceCard
                  isSelected={selectedMaintenances.includes(maintenance._id)}
                  key={maintenance._id}
                  maintenance={maintenance}
                  onDelete={handleDeleteMaintenance}
                  onEdit={handleEditMaintenance}
                  onSelect={() => {
                    // Toggle selection
                  }}
                  onView={handleViewMaintenance}
                />
              ))}
            </div>
          ) : (
            <div className="py-12 text-center">
              <p className="text-muted-foreground">
                No maintenance requests found
              </p>
              <Button
                className="mt-4"
                onClick={() => setIsCreateModalOpen(true)}
                variant="outline"
              >
                Create your first request
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <CreateMaintenanceModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />

      <MaintenanceDetailsModal
        isOpen={isDetailsModalOpen}
        maintenance={selectedMaintenance}
        onClose={() => {
          setIsDetailsModalOpen(false);
          setSelectedMaintenance(null);
        }}
        onEdit={handleEditMaintenance}
      />

      <DeleteMaintenanceModal
        isOpen={isDeleteModalOpen}
        maintenanceTitle={
          maintenanceToDelete
            ? maintenances.find((m) => m._id === maintenanceToDelete)?.title
            : undefined
        }
        onClose={() => {
          setIsDeleteModalOpen(false);
          setMaintenanceToDelete(null);
        }}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
