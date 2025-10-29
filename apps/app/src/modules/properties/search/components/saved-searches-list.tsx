/**
 * Saved searches list component
 */
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@kaa/ui/components/dialog";
import { Input } from "@kaa/ui/components/input";
import { Label } from "@kaa/ui/components/label";
import { Skeleton } from "@kaa/ui/components/skeleton";
import { Switch } from "@kaa/ui/components/switch";
import {
  AlertCircle,
  Bell,
  BellOff,
  Clock,
  Loader2,
  Play,
  Save,
  Search,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  useCreateSavedSearch,
  useDeleteSavedSearch,
  useSavedSearches,
  useUpdateSavedSearch,
} from "../search.queries";
import type { PropertySearchParams, SavedSearch } from "../search.types";

type SavedSearchesListProps = {
  onExecuteSearch?: (filters: PropertySearchParams) => void;
  className?: string;
};

export default function SavedSearchesList({
  onExecuteSearch,
  className,
}: SavedSearchesListProps) {
  const [editingSearch, setEditingSearch] = useState<SavedSearch | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  // Fetch saved searches
  const { data: savedSearchesData, isLoading, error } = useSavedSearches();

  // Mutations
  const createMutation = useCreateSavedSearch();
  const updateMutation = useUpdateSavedSearch();
  const deleteMutation = useDeleteSavedSearch();

  const savedSearches = savedSearchesData?.data || [];

  const handleExecuteSearch = (search: SavedSearch) => {
    if (onExecuteSearch) {
      onExecuteSearch(search.searchParams);
    }
  };

  const handleToggleAlerts = async (search: SavedSearch) => {
    try {
      await updateMutation.mutateAsync({
        id: search._id,
        payload: { alertsEnabled: !search.alertsEnabled },
      });
      toast.success("Alerts updated", {
        description: search.alertsEnabled
          ? "Alerts disabled for this search"
          : "Alerts enabled for this search",
      });
    } catch (error) {
      toast.error("Failed to update alerts");
    }
  };

  const handleDeleteSearch = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id);
      toast.success("Search deleted", {
        description: "Your saved search has been deleted",
      });
    } catch (error) {
      toast.error("Failed to delete search");
    }
  };

  const formatSearchSummary = (params: PropertySearchParams) => {
    const parts: string[] = [];
    if (params.query) parts.push(params.query);
    if (params.propertyType) parts.push(params.propertyType.toString());
    if (params.location) parts.push(params.location);
    if (params.minPrice || params.maxPrice) {
      const priceStr = `${params.minPrice || 0} - ${params.maxPrice || "∞"}`;
      parts.push(`KES ${priceStr}`);
    }
    if (params.bedrooms) parts.push(`${params.bedrooms} beds`);
    if (params.bathrooms) parts.push(`${params.bathrooms} baths`);
    return parts.join(" • ") || "All properties";
  };

  const getFrequencyLabel = (frequency?: string) => {
    switch (frequency) {
      case "instant":
        return "Instant";
      case "daily":
        return "Daily";
      case "weekly":
        return "Weekly";
      default:
        return "Never";
    }
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Saved Searches</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 3 }, (_, i) => (
            <Skeleton className="h-24 w-full" key={`skeleton-${i + 1}`} />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Saved Searches</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8">
            <AlertCircle className="mb-4 h-12 w-12 text-muted-foreground" />
            <p className="text-center text-muted-foreground">
              Failed to load saved searches
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Save className="h-5 w-5" />
            Saved Searches
          </CardTitle>
          <Dialog
            onOpenChange={setIsCreateDialogOpen}
            open={isCreateDialogOpen}
          >
            <DialogTrigger asChild>
              <Button size="sm" variant="outline">
                <Save className="mr-2 h-4 w-4" />
                Save Current Search
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Save Search</DialogTitle>
                <DialogDescription>
                  Save your current search criteria to quickly find properties
                  later
                </DialogDescription>
              </DialogHeader>
              <SaveSearchForm
                onCancel={() => setIsCreateDialogOpen(false)}
                onSave={() => setIsCreateDialogOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {savedSearches.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Search className="mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="mb-2 font-semibold text-gray-900">
              No saved searches
            </h3>
            <p className="mb-4 text-center text-muted-foreground text-sm">
              Save your search criteria to quickly find properties later
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {savedSearches.map((search) => (
              <div
                className="rounded-lg border bg-card p-4 transition-colors hover:bg-accent/50"
                key={search._id}
              >
                <div className="mb-2 flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium">{search.name}</h4>
                    <p className="mt-1 text-muted-foreground text-sm">
                      {formatSearchSummary(search.searchParams)}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      onClick={() => handleExecuteSearch(search)}
                      size="icon"
                      title="Run search"
                      variant="ghost"
                    >
                      <Play className="h-4 w-4" />
                    </Button>
                    <Button
                      onClick={() => handleToggleAlerts(search)}
                      size="icon"
                      title={
                        search.alertsEnabled
                          ? "Disable alerts"
                          : "Enable alerts"
                      }
                      variant="ghost"
                    >
                      {search.alertsEnabled ? (
                        <Bell className="h-4 w-4 text-primary" />
                      ) : (
                        <BellOff className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      onClick={() => handleDeleteSearch(search._id)}
                      size="icon"
                      title="Delete search"
                      variant="ghost"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="text-xs" variant="secondary">
                    <Clock className="mr-1 h-3 w-3" />
                    {getFrequencyLabel(search.frequency)}
                  </Badge>
                  {search.alertsEnabled && (
                    <Badge className="text-xs" variant="default">
                      <Bell className="mr-1 h-3 w-3" />
                      Alerts On
                    </Badge>
                  )}
                  <span className="ml-auto text-muted-foreground text-xs">
                    Saved {new Date(search.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Save search form component
function SaveSearchForm({
  onSave,
  onCancel,
}: {
  onSave: () => void;
  onCancel: () => void;
}) {
  const createMutation = useCreateSavedSearch();

  const [name, setName] = useState("");
  const [alertsEnabled, setAlertsEnabled] = useState(false);
  const [frequency, setFrequency] = useState<"daily" | "weekly" | "instant">(
    "daily"
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Please enter a name for this search");
      return;
    }

    try {
      await createMutation.mutateAsync({
        name: name.trim(),
        searchParams: {}, // Will be filled from current filters
        alertsEnabled,
        frequency: alertsEnabled ? frequency : undefined,
      });

      toast.success("Search saved", {
        description: "Your search has been saved successfully",
      });
      onSave();
    } catch (error) {
      toast.error("Failed to save search");
    }
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div>
        <Label htmlFor="name">Search Name</Label>
        <Input
          autoFocus
          id="name"
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., 2BR Apartments in Westlands"
          value={name}
        />
      </div>

      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label htmlFor="alerts">Enable Alerts</Label>
          <p className="text-muted-foreground text-sm">
            Get notified of new properties
          </p>
        </div>
        <Switch
          checked={alertsEnabled}
          id="alerts"
          onCheckedChange={setAlertsEnabled}
        />
      </div>

      {alertsEnabled && (
        <div>
          <Label htmlFor="frequency">Alert Frequency</Label>
          <select
            className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2"
            id="frequency"
            onChange={(e) => setFrequency(e.target.value as any)}
            value={frequency}
          >
            <option value="instant">Instant</option>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
          </select>
        </div>
      )}

      <DialogFooter>
        <Button onClick={onCancel} type="button" variant="outline">
          Cancel
        </Button>
        <Button disabled={createMutation.isPending} type="submit">
          {createMutation.isPending && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          Save Search
        </Button>
      </DialogFooter>
    </form>
  );
}
