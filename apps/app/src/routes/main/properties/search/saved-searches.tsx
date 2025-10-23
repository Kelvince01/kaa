"use client";

import { Alert, AlertDescription } from "@kaa/ui/components/alert";
import { Badge } from "@kaa/ui/components/badge";
// shadcn/ui components
import { Button } from "@kaa/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "@kaa/ui/components/card";
import { Checkbox } from "@kaa/ui/components/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@kaa/ui/components/dialog";
import { Input } from "@kaa/ui/components/input";
import { Label } from "@kaa/ui/components/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@kaa/ui/components/select";
import { Skeleton } from "@kaa/ui/components/skeleton";
import {
  AlertCircle,
  Bell,
  BellOff,
  Edit2,
  Info,
  MapPin,
  PlusCircle,
  Search,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type React from "react";
import { useEffect, useState } from "react";
import type { PropertyType } from "@/modules/properties/property.type";
import type { SavedSearch } from "../hooks/use-saved-search";

// Define our local interface that matches the structure we're using
type SavedSearchLocal = {
  id: string;
  name: string;
  criteria: {
    location: string;
    minBedrooms: number;
    maxBedrooms: number;
    minPrice: number;
    maxPrice: number;
    propertyType: string;
    furnished: string;
  };
  notificationsEnabled: boolean;
  notificationFrequency: string;
  createdAt: string;
  matchCount: number;
  newMatchesSinceLastView: number;
};

// Function to convert from local format to API format
const _toApiFormat = (local: SavedSearchLocal): SavedSearch => {
  return {
    id: local.id,
    userId: "current-user", // Placeholder
    name: local.name,
    searchParams: {
      location: local.criteria.location,
      minRent: local.criteria.minPrice,
      maxRent: local.criteria.maxPrice,
      minBedrooms: local.criteria.minBedrooms,
      maxBedrooms: local.criteria.maxBedrooms,
      type: [local.criteria.propertyType] as PropertyType[],
    },
    notificationsEnabled: local.notificationsEnabled,
    createdAt: local.createdAt,
    updatedAt: local.createdAt, // Use same as createdAt for mock
  };
};

// Function to convert from API format to local format
const _toLocalFormat = (api: SavedSearch): SavedSearchLocal => {
  return {
    id: api.id,
    name: api.name,
    criteria: {
      location: api.searchParams.location || "",
      minBedrooms: api.searchParams.minBedrooms || 0,
      maxBedrooms: api.searchParams.maxBedrooms || 0,
      minPrice: api.searchParams.minRent || 0,
      maxPrice: api.searchParams.maxRent || 0,
      propertyType: (api.searchParams.type as PropertyType) || "",
      furnished: "any", // Default value since this isn't in the API format
    },
    notificationsEnabled: api.notificationsEnabled,
    notificationFrequency: api.notificationsEnabled ? "daily" : "never",
    createdAt: api.createdAt,
    matchCount: 0, // Default value
    newMatchesSinceLastView: 0, // Default value
  };
};

const SavedSearches = () => {
  const router = useRouter();
  const [savedSearches, setSavedSearches] = useState<SavedSearchLocal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedSearchId, setSelectedSearchId] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editSearch, setEditSearch] = useState<SavedSearchLocal | null>(null);
  const [notificationFrequency, setNotificationFrequency] = useState("daily");

  // Mock saved searches data
  const mockSavedSearches: SavedSearchLocal[] = [
    {
      id: "search-1",
      name: "2 bed in Camden",
      criteria: {
        location: "Camden, London",
        minBedrooms: 2,
        maxBedrooms: 2,
        minPrice: 1500,
        maxPrice: 2000,
        propertyType: "flat",
        furnished: "furnished",
      },
      notificationsEnabled: true,
      notificationFrequency: "daily",
      createdAt: "2025-03-15T14:30:00",
      matchCount: 12,
      newMatchesSinceLastView: 3,
    },
    {
      id: "search-2",
      name: "Affordable studio",
      criteria: {
        location: "Hackney, London",
        minBedrooms: 0,
        maxBedrooms: 0,
        minPrice: 800,
        maxPrice: 1200,
        propertyType: "studio",
        furnished: "any",
      },
      notificationsEnabled: false,
      notificationFrequency: "never",
      createdAt: "2025-03-20T09:45:00",
      matchCount: 5,
      newMatchesSinceLastView: 0,
    },
    {
      id: "search-3",
      name: "Houses in Greenwich",
      criteria: {
        location: "Greenwich, London",
        minBedrooms: 3,
        maxBedrooms: 4,
        minPrice: 2000,
        maxPrice: 3000,
        propertyType: "house",
        furnished: "any",
      },
      notificationsEnabled: true,
      notificationFrequency: "weekly",
      createdAt: "2025-03-25T16:20:00",
      matchCount: 8,
      newMatchesSinceLastView: 2,
    },
  ];

  // Fetch saved searches from API
  useEffect(() => {
    const fetchSavedSearches = async () => {
      try {
        setIsLoading(true);

        // In a real app, fetch from API
        // const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/saved-searches`);
        // setSavedSearches(response.data.map(toLocalFormat));

        // For demo, use mock data
        await new Promise((resolve) => setTimeout(resolve, 1000));
        setSavedSearches(mockSavedSearches);
      } catch (error) {
        console.error("Error fetching saved searches:", error);
        setError("Failed to load your saved searches. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchSavedSearches();
  }, []);

  // Open delete confirmation modal
  const openDeleteModal = (searchId: string) => {
    setSelectedSearchId(searchId);
    setShowDeleteModal(true);
  };

  // Delete saved search
  const deleteSavedSearch = () => {
    try {
      // In a real app, delete via API
      // await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/saved-searches/${selectedSearchId}`);

      // For demo, update local state
      setSavedSearches(
        savedSearches.filter((search) => search.id !== selectedSearchId)
      );

      setShowDeleteModal(false);
      setSelectedSearchId(null);
    } catch (error) {
      console.error("Error deleting saved search:", error);
      setError("Failed to delete saved search. Please try again later.");
    }
  };

  // Open edit modal
  const openEditModal = (search: SavedSearchLocal) => {
    setEditSearch({
      ...search,
      name: search.name,
      notificationsEnabled: search.notificationsEnabled,
      notificationFrequency: search.notificationFrequency,
    });
    setNotificationFrequency(search.notificationFrequency);
    setShowEditModal(true);
  };

  // Update saved search
  const updateSavedSearch = (e: React.FormEvent) => {
    e.preventDefault();

    if (!editSearch) return;

    try {
      // In a real app, update via API
      // await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/saved-searches/${editSearch.id}`, {
      //   name: editSearch.name,
      //   notificationsEnabled: editSearch.notificationsEnabled,
      //   notificationFrequency: editSearch.notificationsEnabled ? notificationFrequency : 'never'
      // });

      // For demo, update local state
      setSavedSearches(
        savedSearches.map((search) => {
          if (search.id === editSearch.id) {
            return {
              ...search,
              name: editSearch.name,
              notificationsEnabled: editSearch.notificationsEnabled,
              notificationFrequency: editSearch.notificationsEnabled
                ? notificationFrequency
                : "never",
            };
          }
          return search;
        })
      );

      setShowEditModal(false);
      setEditSearch(null);
    } catch (error) {
      console.error("Error updating saved search:", error);
      setError("Failed to update saved search. Please try again later.");
    }
  };

  // Run saved search
  const runSavedSearch = (search: SavedSearchLocal) => {
    const { criteria } = search;

    // Build query params using URLSearchParams
    const searchParams = new URLSearchParams();

    if (criteria.location) searchParams.append("location", criteria.location);
    if (criteria.minBedrooms !== undefined)
      searchParams.append("minBedrooms", criteria.minBedrooms.toString());
    if (criteria.maxBedrooms !== undefined)
      searchParams.append("maxBedrooms", criteria.maxBedrooms.toString());
    if (criteria.minPrice !== undefined)
      searchParams.append("minPrice", criteria.minPrice.toString());
    if (criteria.maxPrice !== undefined)
      searchParams.append("maxPrice", criteria.maxPrice.toString());
    if (criteria.propertyType)
      searchParams.append("propertyType", criteria.propertyType);
    if (criteria.furnished && criteria.furnished !== "any")
      searchParams.append("furnished", criteria.furnished);

    // Navigate to properties page with search criteria
    router.push(`/properties?${searchParams.toString()}`);
  };

  // Format search criteria for display
  const formatSearchCriteria = (criteria: SavedSearchLocal["criteria"]) => {
    const parts: string[] = [];

    if (criteria.minBedrooms === criteria.maxBedrooms) {
      parts.push(`${criteria.minBedrooms} bed`);
    } else if (criteria.minBedrooms === 0 && criteria.maxBedrooms === 0) {
      parts.push("Studio");
    } else {
      parts.push(`${criteria.minBedrooms}-${criteria.maxBedrooms} bed`);
    }

    if (criteria.propertyType) {
      parts.push(criteria.propertyType);
    }

    if (criteria.furnished && criteria.furnished !== "any") {
      parts.push(criteria.furnished);
    }

    if (criteria.minPrice && criteria.maxPrice) {
      parts.push(`£${criteria.minPrice}-£${criteria.maxPrice} pcm`);
    } else if (criteria.minPrice) {
      parts.push(`£${criteria.minPrice}+ pcm`);
    } else if (criteria.maxPrice) {
      parts.push(`Up to £${criteria.maxPrice} pcm`);
    }

    return parts.join(" • ");
  };

  if (isLoading) {
    return (
      <Card className="p-6">
        <Skeleton className="mb-4 h-6 w-1/4" />
        <Skeleton className="mb-6 h-4 w-3/4" />
        <div className="space-y-4">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-6">
        <div className="mb-6 sm:flex sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-xl">Saved Searches</CardTitle>
            <CardDescription className="mt-1">
              Get notified when new properties matching your criteria become
              available.
            </CardDescription>
          </div>
          <div className="mt-3 sm:mt-0 sm:ml-4">
            <Button asChild>
              <Link href="/properties">
                <PlusCircle className="mr-2 h-4 w-4" />
                New Search
              </Link>
            </Button>
          </div>
        </div>

        {savedSearches.length === 0 ? (
          <div className="py-12 text-center">
            <Search className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 font-medium text-gray-900 text-sm">
              No saved searches
            </h3>
            <p className="mt-1 text-gray-500 text-sm">
              Save your property searches to get notified when new matching
              properties become available.
            </p>
            <div className="mt-6">
              <Button asChild>
                <Link href="/properties">Start Searching</Link>
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {savedSearches.map((search) => (
              <div
                className="rounded-lg border border-gray-200 p-4 transition-shadow hover:shadow-md"
                key={search.id}
              >
                <div className="sm:flex sm:items-center sm:justify-between">
                  <div>
                    <div className="flex items-center">
                      <h3 className="mr-3 font-medium text-gray-900 text-lg">
                        {search.name}
                      </h3>
                      {search.newMatchesSinceLastView > 0 && (
                        <Badge
                          className="bg-green-100 text-green-800 hover:bg-green-200"
                          variant="secondary"
                        >
                          {search.newMatchesSinceLastView} new
                        </Badge>
                      )}
                    </div>
                    <div className="mt-1 flex items-center">
                      <MapPin className="mr-1 h-4 w-4 text-gray-400" />
                      <span className="text-gray-500 text-sm">
                        {search.criteria.location}
                      </span>
                    </div>
                    <p className="mt-1 text-gray-700 text-sm">
                      {formatSearchCriteria(search.criteria)}
                    </p>
                  </div>

                  <div className="mt-4 sm:mt-0 sm:ml-6">
                    <div className="flex justify-end space-x-2">
                      <Button onClick={() => runSavedSearch(search)} size="sm">
                        <Search className="mr-1 h-3 w-3" />
                        Search ({search.matchCount})
                      </Button>
                      <Button
                        onClick={() => openEditModal(search)}
                        size="sm"
                        variant="outline"
                      >
                        <Edit2 className="mr-1 h-3 w-3" />
                        Edit
                      </Button>
                      <Button
                        onClick={() => openDeleteModal(search.id)}
                        size="sm"
                        variant="outline"
                      >
                        <Trash2 className="mr-1 h-3 w-3" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap items-center justify-between border-gray-100 border-t pt-3">
                  <div className="flex items-center">
                    {search.notificationsEnabled ? (
                      <>
                        <Bell className="mr-1 h-4 w-4 text-primary-500" />
                        <span className="text-gray-600 text-xs">
                          {search.notificationFrequency === "daily"
                            ? "Daily"
                            : "Weekly"}{" "}
                          alerts enabled
                        </span>
                      </>
                    ) : (
                      <>
                        <BellOff className="mr-1 h-4 w-4 text-gray-400" />
                        <span className="text-gray-500 text-xs">
                          Alerts disabled
                        </span>
                      </>
                    )}
                  </div>
                  <div className="text-gray-500 text-xs">
                    Created {new Date(search.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Info banner */}
        <div className="mt-6 rounded-md bg-blue-50 p-4">
          <div className="flex">
            <div className="shrink-0">
              <Info className="h-5 w-5 text-blue-400" />
            </div>
            <div className="ml-3">
              <h3 className="font-medium text-blue-800 text-sm">
                How saved searches work
              </h3>
              <div className="mt-2 text-blue-700 text-sm">
                <p>
                  When you save a search, we'll watch for new properties that
                  match your criteria. You can choose to receive notifications
                  daily or weekly.
                </p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
      {/* Delete confirmation modal */}
      <Dialog onOpenChange={setShowDeleteModal} open={showDeleteModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              Delete Saved Search
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this saved search? This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setShowDeleteModal(false)} variant="outline">
              Cancel
            </Button>
            <Button onClick={deleteSavedSearch} variant="destructive">
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Edit search modal */}
      <Dialog onOpenChange={setShowEditModal} open={showEditModal}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={updateSavedSearch}>
            <DialogHeader>
              <DialogTitle>Edit Saved Search</DialogTitle>
              <DialogDescription>
                Update the name and notification settings for your saved search.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="search-name">Search Name</Label>
                <Input
                  id="search-name"
                  onChange={(e) =>
                    editSearch &&
                    setEditSearch({ ...editSearch, name: e.target.value })
                  }
                  placeholder="e.g., '2 bed in Camden'"
                  required
                  value={editSearch?.name || ""}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  checked={editSearch?.notificationsEnabled}
                  id="notifications-enabled"
                  onCheckedChange={(checked) =>
                    editSearch &&
                    setEditSearch({
                      ...editSearch,
                      notificationsEnabled: checked as boolean,
                    })
                  }
                />
                <Label htmlFor="notifications-enabled">
                  Enable notifications for new matching properties
                </Label>
              </div>

              {editSearch?.notificationsEnabled && (
                <div className="space-y-2">
                  <Label htmlFor="notification-frequency">
                    Notification Frequency
                  </Label>
                  <Select
                    onValueChange={setNotificationFrequency}
                    value={notificationFrequency}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select frequency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {editSearch && (
                <div className="rounded-md bg-muted p-3">
                  <div className="space-y-1 text-sm">
                    <div className="font-medium">Search criteria:</div>
                    <div className="flex items-center text-muted-foreground">
                      <MapPin className="mr-1 h-4 w-4" />
                      <span>{editSearch.criteria.location}</span>
                    </div>
                    <div className="text-muted-foreground">
                      {formatSearchCriteria(editSearch.criteria)}
                    </div>
                  </div>
                  <p className="mt-2 text-muted-foreground text-xs">
                    To change search criteria, please create a new saved search.
                  </p>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button
                onClick={() => setShowEditModal(false)}
                type="button"
                variant="outline"
              >
                Cancel
              </Button>
              <Button type="submit">Save Changes</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default SavedSearches;
