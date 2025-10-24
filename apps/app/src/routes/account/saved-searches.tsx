"use client";

import { Alert, AlertDescription } from "@kaa/ui/components/alert";
import { Badge } from "@kaa/ui/components/badge";
// shadcn/ui components
import { Button } from "@kaa/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@kaa/ui/components/card";
import { Skeleton } from "@kaa/ui/components/skeleton";
import { useQuery } from "@tanstack/react-query";
import {
  Bell,
  ChevronRight,
  Edit2,
  Eye,
  MapPin,
  Search,
  Trash2,
  X,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

type SavedSearch = {
  _id: string;
  name: string;
  location: string;
  criteria: {
    minPrice?: number;
    maxPrice?: number;
    bedrooms?: number;
    propertyType?: string;
    furnished?: boolean;
    petsAllowed?: boolean;
  };
  emailAlerts: boolean;
  createdAt: string;
  lastSearchedAt?: string;
  matchCount?: number;
};

const SavedSearchesClient = () => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(
    null
  );

  // Mock data for saved searches
  const mockSavedSearches: SavedSearch[] = [
    {
      _id: "1",
      name: "London Apartments",
      location: "London",
      criteria: {
        minPrice: 800,
        maxPrice: 1500,
        bedrooms: 2,
        propertyType: "apartment",
        furnished: true,
      },
      emailAlerts: true,
      createdAt: "2025-03-15T10:00:00.000Z",
      lastSearchedAt: "2025-04-10T14:30:00.000Z",
      matchCount: 12,
    },
    {
      _id: "2",
      name: "Manchester Houses",
      location: "Manchester",
      criteria: {
        minPrice: 1000,
        maxPrice: 2000,
        bedrooms: 3,
        propertyType: "house",
        petsAllowed: true,
      },
      emailAlerts: false,
      createdAt: "2025-03-20T14:30:00.000Z",
      lastSearchedAt: "2025-04-05T09:45:00.000Z",
      matchCount: 8,
    },
    {
      _id: "3",
      name: "Birmingham Studio",
      location: "Birmingham",
      criteria: {
        maxPrice: 800,
        bedrooms: 0,
        propertyType: "studio",
        furnished: true,
      },
      emailAlerts: true,
      createdAt: "2025-04-01T09:15:00.000Z",
      matchCount: 3,
    },
  ];

  // Query to fetch saved searches (using mock data for now)
  const {
    data: savedSearches = mockSavedSearches,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["savedSearches"],
    queryFn: () => {
      // In a real app, this would be an API call
      return mockSavedSearches;
    },
  });

  const handleToggleAlert = (searchId: string) => {
    // In a real app, this would call an API to update the alert status
    console.log("Toggle alert for search:", searchId);
  };

  const handleDeleteSearch = (searchId: string) => {
    // In a real app, this would call an API to delete the search
    console.log("Delete search:", searchId);
    setShowDeleteConfirm(null);
  };

  // Format date for display
  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  // Format search criteria to a readable format
  const formatSearchCriteria = (criteria: SavedSearch["criteria"]) => {
    const parts: string[] = [];

    if (criteria.bedrooms !== undefined) {
      parts.push(
        `${criteria.bedrooms} ${criteria.bedrooms === 1 ? "bedroom" : "bedrooms"}`
      );
    }

    if (criteria.propertyType) {
      parts.push(criteria.propertyType);
    }

    const priceRange: string[] = [];
    if (criteria.minPrice) priceRange.push(`£${criteria.minPrice}`);
    if (criteria.maxPrice) priceRange.push(`£${criteria.maxPrice}`);

    if (priceRange.length > 0) {
      parts.push(priceRange.join(" - "));
    }

    if (criteria.furnished) parts.push("furnished");
    if (criteria.petsAllowed) parts.push("pets allowed");

    return parts.join(", ");
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="space-y-6">
          <div className="space-y-2">
            <Skeleton className="h-8 w-1/3" />
            <Skeleton className="h-4 w-2/3" />
          </div>

          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <Skeleton className="h-6 w-48" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                    <div className="flex space-x-2">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <Skeleton className="h-10 w-10 rounded-full" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Skeleton className="h-4 w-full" />
                    <div className="grid grid-cols-2 gap-4">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <Alert variant="destructive">
          <AlertDescription>
            Error loading saved searches. Please try again.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="font-bold text-2xl text-gray-900">Saved Searches</h1>
        <p className="mt-1 text-gray-500 text-sm">
          View and manage your saved property searches and email alerts.
        </p>
      </div>
      {savedSearches.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Search className="mx-auto h-12 w-12 text-gray-400" />
            <CardTitle className="mt-4 text-sm">No saved searches</CardTitle>
            <CardDescription className="mt-2">
              You haven't saved any property searches yet.
            </CardDescription>
            <div className="mt-6">
              <Button asChild>
                <Link href="/properties">
                  <Search className="mr-2 h-4 w-4" />
                  Start searching
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {savedSearches.map((search) => (
            <Card key={search._id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{search.name}</CardTitle>
                    <CardDescription className="mt-1 flex items-center">
                      <MapPin className="mr-1 h-4 w-4" />
                      {search.location}
                    </CardDescription>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      className={`h-10 w-10 rounded-full p-0 ${
                        search.emailAlerts
                          ? "bg-primary-50 text-primary-600 hover:bg-primary-100"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      }`}
                      onClick={() => handleToggleAlert(search._id)}
                      size="sm"
                      title={
                        search.emailAlerts ? "Disable alerts" : "Enable alerts"
                      }
                      variant="ghost"
                    >
                      <Bell className="h-4 w-4" />
                    </Button>
                    <Button
                      asChild
                      className="h-10 w-10 rounded-full bg-primary-50 p-0 text-primary-600 hover:bg-primary-100"
                      size="sm"
                      variant="ghost"
                    >
                      <Link
                        href={`/properties?location=${encodeURIComponent(search.location)}&minPrice=${search.criteria.minPrice || ""}&maxPrice=${search.criteria.maxPrice || ""}&bedrooms=${search.criteria.bedrooms || ""}&propertyType=${search.criteria.propertyType || ""}&furnished=${search.criteria.furnished ? "true" : ""}&petsAllowed=${search.criteria.petsAllowed ? "true" : ""}`}
                        title="Run search"
                      >
                        <Eye className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button
                      asChild
                      className="h-10 w-10 rounded-full bg-blue-50 p-0 text-blue-600 hover:bg-blue-100"
                      size="sm"
                      variant="ghost"
                    >
                      <Link
                        href={`/account/saved-searches/${search._id}/edit`}
                        title="Edit search"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button
                      className="h-10 w-10 rounded-full bg-red-50 p-0 text-red-600 hover:bg-red-100"
                      onClick={() => setShowDeleteConfirm(search._id)}
                      size="sm"
                      title="Delete search"
                      variant="ghost"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <dt className="font-medium text-muted-foreground text-sm">
                      Search criteria
                    </dt>
                    <dd className="mt-1 text-sm">
                      {formatSearchCriteria(search.criteria)}
                    </dd>
                  </div>

                  <div>
                    <dt className="font-medium text-muted-foreground text-sm">
                      Created
                    </dt>
                    <dd className="mt-1 text-sm">
                      {formatDate(search.createdAt)}
                    </dd>
                  </div>

                  <div>
                    <dt className="font-medium text-muted-foreground text-sm">
                      Last searched
                    </dt>
                    <dd className="mt-1 text-sm">
                      {search.lastSearchedAt
                        ? formatDate(search.lastSearchedAt)
                        : "Never"}
                    </dd>
                  </div>

                  <div className="sm:col-span-2">
                    <dt className="font-medium text-muted-foreground text-sm">
                      Email alerts
                    </dt>
                    <dd className="mt-1">
                      {search.emailAlerts ? (
                        <Badge
                          className="bg-green-100 text-green-800 hover:bg-green-100"
                          variant="default"
                        >
                          Enabled
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Disabled</Badge>
                      )}
                    </dd>
                  </div>
                </div>

                {search.matchCount !== undefined && (
                  <Button
                    asChild
                    className="h-auto justify-start p-0 text-left"
                    variant="link"
                  >
                    <Link
                      className="inline-flex items-center text-sm"
                      href={`/properties?location=${encodeURIComponent(search.location)}&minPrice=${search.criteria.minPrice || ""}&maxPrice=${search.criteria.maxPrice || ""}&bedrooms=${search.criteria.bedrooms || ""}&propertyType=${search.criteria.propertyType || ""}&furnished=${search.criteria.furnished ? "true" : ""}&petsAllowed=${search.criteria.petsAllowed ? "true" : ""}`}
                    >
                      View {search.matchCount} matching{" "}
                      {search.matchCount === 1 ? "property" : "properties"}
                      <ChevronRight className="ml-1 h-4 w-4" />
                    </Link>
                  </Button>
                )}
              </CardContent>

              {/* Delete confirmation */}
              {showDeleteConfirm === search._id && (
                <div className="border-t pt-4">
                  <Alert variant="destructive">
                    <AlertDescription className="flex items-center justify-between">
                      <span>
                        Are you sure you want to delete this saved search?
                      </span>
                      <div className="ml-4 flex space-x-2">
                        <Button
                          onClick={() => setShowDeleteConfirm(null)}
                          size="sm"
                          variant="outline"
                        >
                          <X className="mr-2 h-4 w-4" />
                          Cancel
                        </Button>
                        <Button
                          onClick={() => handleDeleteSearch(search._id)}
                          size="sm"
                          variant="destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </Button>
                      </div>
                    </AlertDescription>
                  </Alert>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default SavedSearchesClient;
