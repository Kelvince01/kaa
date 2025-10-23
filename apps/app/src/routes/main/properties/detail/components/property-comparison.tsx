/**
 * Property Comparison Component for comparing multiple properties
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@kaa/ui/components/dialog";
import { ScrollArea } from "@kaa/ui/components/scroll-area";
import { Separator } from "@kaa/ui/components/separator";
import { cn } from "@kaa/ui/lib/utils";
import {
  BarChart3,
  Bath,
  Bed,
  DollarSign,
  Equal,
  MapPin,
  Maximize,
  Plus,
  TrendingDown,
  TrendingUp,
  X,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { Property } from "@/modules/properties/property.type";
import { UserRole, UserStatus } from "@/modules/users/user.type";
import { formatCurrency } from "@/shared/utils/format.util";

type PropertyComparisonProps = {
  currentProperty: Property;
  className?: string;
};

interface ComparisonProperty extends Property {
  isSelected: boolean;
}

// Mock similar properties for comparison
const mockSimilarProperties: ComparisonProperty[] | any[] = [
  {
    _id: "prop1",
    title: "Modern Downtown Apartment",
    type: "apartment" as any,
    details: {
      rooms: 3,
      furnishedStatus: "Furnished",
      garden: true,
      security: true,
      bedrooms: 2,
      bathrooms: 2,
      size: 1200,
      furnished: true,
      parking: true,
      generator: true,
      internetReady: true,
      petFriendly: true,
      smokingAllowed: true,
      sublettingAllowed: true,
    },
    pricing: {
      rent: 85_000,
      currency: "KES",
      paymentFrequency: "monthly",
      deposit: 170_000,
      utilitiesIncluded: {
        water: true,
        electricity: true,
        internet: false,
        garbage: false,
        security: false,
      },
      negotiable: false,
    },
    location: {
      address: {
        line1: "456 Urban Street",
        town: "Nairobi",
        postalCode: "00100",
      },
      county: "Nairobi",
      constituency: "Nairobi West",
      country: "Kenya",
    },
    status: "available",
    features: ["wifi", "gym", "parking", "security"],
    isSelected: false,
    description: "A modern apartment in the heart of Nairobi",
    memberId: "member1",
    media: {
      images: [
        {
          url: "https://via.placeholder.com/150",
          caption: "A modern apartment in the heart of Nairobi",
          isPrimary: true,
        },
      ],
    },
    available: true,
    amenities: [
      {
        name: "wifi",
        description: "High-speed internet",
      },
      {
        name: "gym",
        description: "Gym with modern equipment",
      },
    ],
    availableFrom: "2025-01-01",
    geolocation: {
      type: "Point",
      coordinates: [36.817_223, -1.286_389],
    },
    landlord: {
      id: "landlord1",
      memberId: "member1",
      username: "landlord1",
      firstName: "John",
      lastName: "Doe",
      email: "john.doe@example.com",
      phone: "1234567890",
      role: UserRole.LANDLORD,
      status: UserStatus.ACTIVE,
      isActive: true,
      isVerified: true,
      createdAt: "2025-01-01",
      updatedAt: "2025-01-01",
    },
    createdAt: "2025-01-01",
    updatedAt: "2025-01-01",
  },
  {
    _id: "prop2",
    title: "Cozy Garden Apartment",
    type: "apartment",
    details: {
      bedrooms: 1,
      bathrooms: 1,
      size: 800,
      furnished: false,
      parking: false,
      rooms: 2,
      furnishedStatus: "Unfurnished",
      garden: false,
      security: false,
      generator: false,
      internetReady: false,
      petFriendly: false,
      smokingAllowed: false,
      sublettingAllowed: false,
      tags: ["garden", "pets", "wifi"],
    },
    pricing: {
      rent: 55_000,
      currency: "KES",
      paymentFrequency: "monthly",
      deposit: 110_000,
      waterBill: "Included",
      electricityBill: "Included",
      utilitiesIncluded: ["wifi", "gym"],
      negotiable: false,
    },
    location: {
      address: {
        line1: "789 Garden Road",
        town: "Nairobi",
        postalCode: "00200",
      },
      county: "Nairobi",
      constituency: "Nairobi West",
      country: "Kenya",
    },
    status: "available",
    features: ["garden", "pets", "wifi"],
    isSelected: false,
    description: "A cozy garden apartment with a garden",
    memberId: "member2",
    media: {
      photos: [
        {
          url: "https://via.placeholder.com/150",
          caption: "A cozy garden apartment with a garden",
          isPrimary: true,
        },
      ],
    },
    available: true,
    amenities: [
      {
        name: "wifi",
        description: "High-speed internet",
      },
    ],
    availableFrom: "2025-01-01",
    geolocation: {
      type: "Point",
      coordinates: [36.817_223, -1.286_389],
    },
    landlord: {
      id: "landlord2",
      memberId: "member2",
      username: "landlord2",
      firstName: "Jane",
      lastName: "Doe",
      email: "jane.doe@example.com",
      phone: "1234567890",
      role: UserRole.LANDLORD,
      status: UserStatus.ACTIVE,
      isActive: true,
      isVerified: true,
      createdAt: "2025-01-01",
      updatedAt: "2025-01-01",
    },
    createdAt: "2025-01-01",
    updatedAt: "2025-01-01",
  },
  {
    _id: "prop3",
    title: "Luxury Penthouse Suite",
    type: "apartment",
    details: {
      bedrooms: 3,
      bathrooms: 3,
      size: 1800,
      furnished: true,
      parking: true,
      rooms: 4,
      furnishedStatus: "Semi-furnished",
      garden: true,
      security: true,
      generator: true,
      internetReady: true,
      petFriendly: true,
      smokingAllowed: true,
      sublettingAllowed: true,
      tags: ["pool", "gym", "concierge", "parking", "balcony"],
    },
    pricing: {
      rent: 150_000,
      currency: "KES",
      paymentFrequency: "monthly",
      deposit: 300_000,
      waterBill: "Included",
      electricityBill: "Included",
      utilitiesIncluded: ["wifi", "gym"],
      negotiable: false,
    },
    location: {
      address: {
        line1: "321 Elite Avenue",
        town: "Nairobi",
        postalCode: "00300",
      },
      county: "Nairobi",
      constituency: "Nairobi West",
      country: "Kenya",
    },
    status: "available",
    features: ["pool", "gym", "concierge", "parking", "balcony"],
    isSelected: false,
    description: "A luxury penthouse suite with a pool, gym, and concierge",
    memberId: "member3",
    media: {
      photos: [
        {
          url: "https://via.placeholder.com/150",
          caption: "A luxury penthouse suite with a pool, gym, and concierge",
          isPrimary: true,
        },
      ],
    },
    available: true,
    amenities: [
      {
        name: "wifi",
        description: "High-speed internet",
      },
    ],
    availableFrom: "2025-01-01",
    geolocation: {
      type: "Point",
      coordinates: [36.817_223, -1.286_389],
    },
    landlord: {
      id: "landlord3",
      memberId: "member3",
      username: "landlord3",
      firstName: "John",
      lastName: "Doe",
      email: "john.doe@example.com",
      phone: "1234567890",
      role: UserRole.LANDLORD,
      status: UserStatus.ACTIVE,
      isActive: true,
      isVerified: true,
      createdAt: "2025-01-01",
      updatedAt: "2025-01-01",
    },
    createdAt: "2025-01-01",
    updatedAt: "2025-01-01",
  },
];

export function PropertyComparison({
  currentProperty,
  className,
}: PropertyComparisonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [comparisonProperties, setComparisonProperties] = useState<
    ComparisonProperty[]
  >([]);
  const [availableProperties] = useState<ComparisonProperty[]>(
    mockSimilarProperties
  );

  const addToComparison = (property: ComparisonProperty) => {
    if (comparisonProperties.length >= 3) {
      toast.error("You can compare up to 3 properties at once");
      return;
    }

    setComparisonProperties((prev) => [
      ...prev,
      { ...property, isSelected: true },
    ]);
    toast.success(`${property.title} added to comparison`);
  };

  const removeFromComparison = (propertyId: string) => {
    setComparisonProperties((prev) => prev.filter((p) => p._id !== propertyId));
    toast.info("Property removed from comparison");
  };

  const clearComparison = () => {
    setComparisonProperties([]);
    toast.info("Comparison cleared");
  };

  const getComparisonValue = (value1: number, value2: number) => {
    if (value1 > value2) return "higher";
    if (value1 < value2) return "lower";
    return "equal";
  };

  const getComparisonIcon = (comparison: "higher" | "lower" | "equal") => {
    switch (comparison) {
      case "higher":
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case "lower":
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      default:
        return <Equal className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <div className={cn("", className)}>
      <Dialog onOpenChange={setIsOpen} open={isOpen}>
        <DialogTrigger asChild>
          <Button className="w-full" variant="outline">
            <BarChart3 className="mr-2 h-4 w-4" />
            Compare Properties
            {comparisonProperties.length > 0 && (
              <Badge className="ml-2" variant="secondary">
                {comparisonProperties.length + 1}
              </Badge>
            )}
          </Button>
        </DialogTrigger>
        <DialogContent className="max-h-[90vh] max-w-6xl overflow-hidden">
          <DialogHeader>
            <DialogTitle>Property Comparison</DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-[70vh]">
            <div className="space-y-6 pr-4">
              <ComparisonTable
                clearComparison={clearComparison}
                comparisonProperties={comparisonProperties}
                currentProperty={currentProperty}
                getComparisonIcon={getComparisonIcon}
                getComparisonValue={getComparisonValue}
                removeFromComparison={removeFromComparison}
              />
              <Separator />
              <AvailableProperties
                addToComparison={addToComparison}
                availableProperties={availableProperties}
                comparisonProperties={comparisonProperties}
              />
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}

type ComparisonTableProps = {
  comparisonProperties: ComparisonProperty[];
  currentProperty: Property;
  clearComparison: () => void;
  removeFromComparison: (propertyId: string) => void;
  getComparisonValue: (
    value1: number,
    value2: number
  ) => "higher" | "lower" | "equal";
  getComparisonIcon: (
    comparison: "higher" | "lower" | "equal"
  ) => React.ReactNode;
};

const ComparisonTable = ({
  comparisonProperties,
  currentProperty,
  clearComparison,
  removeFromComparison,
  getComparisonValue,
  getComparisonIcon,
}: ComparisonTableProps) => {
  if (comparisonProperties.length === 0) {
    return (
      <div className="py-8 text-center">
        <BarChart3 className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
        <h3 className="mb-2 font-semibold">No Properties to Compare</h3>
        <p className="mb-4 text-muted-foreground text-sm">
          Add properties from the list below to start comparing
        </p>
      </div>
    );
  }

  const allProperties = [currentProperty, ...comparisonProperties];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Property Comparison</h3>
        <Button onClick={clearComparison} size="sm" variant="outline">
          Clear All
        </Button>
      </div>

      <ScrollArea className="w-full">
        <div className="min-w-full">
          {/* Property Headers */}
          <div
            className="mb-6 grid grid-cols-1 gap-4"
            style={{
              gridTemplateColumns: `repeat(${allProperties.length + 1}, minmax(200px, 1fr))`,
            }}
          >
            <div className="font-medium text-muted-foreground text-sm">
              Feature
            </div>
            {allProperties.map((property, index) => (
              <Card className="relative" key={property._id}>
                <CardHeader className="pb-2">
                  {index > 0 && (
                    <Button
                      className="absolute top-1 right-1 h-6 w-6 p-0"
                      onClick={() => removeFromComparison(property._id)}
                      size="sm"
                      variant="ghost"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                  <CardTitle className="truncate text-sm">
                    {property.title}
                    {index === 0 && (
                      <Badge className="ml-2" variant="secondary">
                        Current
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-1 text-muted-foreground text-xs">
                    <p>{property.location?.address.town}</p>
                    <p className="font-medium text-primary">
                      {formatCurrency(property.pricing?.rent || 0, "KES")}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Comparison Rows */}
          <div className="space-y-3">
            {/* Price Comparison */}
            <div
              className="grid grid-cols-1 gap-4 rounded-lg bg-muted/30 p-3"
              style={{
                gridTemplateColumns: `repeat(${allProperties.length + 1}, minmax(200px, 1fr))`,
              }}
            >
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-primary" />
                <span className="font-medium text-sm">Monthly Rent</span>
              </div>
              {allProperties.map((property, index) => {
                const rentAmount = property.pricing?.rent || 0;
                const comparison =
                  index > 0
                    ? getComparisonValue(
                        rentAmount,
                        currentProperty.pricing?.rent || 0
                      )
                    : "equal";

                return (
                  <div
                    className="flex items-center justify-between"
                    key={property._id}
                  >
                    <span className="font-medium">
                      {formatCurrency(rentAmount, "KES")}
                    </span>
                    {index > 0 && getComparisonIcon(comparison)}
                  </div>
                );
              })}
            </div>

            {/* Bedrooms */}
            <div
              className="grid grid-cols-1 gap-4 rounded-lg p-3"
              style={{
                gridTemplateColumns: `repeat(${allProperties.length + 1}, minmax(200px, 1fr))`,
              }}
            >
              <div className="flex items-center gap-2">
                <Bed className="h-4 w-4 text-primary" />
                <span className="font-medium text-sm">Bedrooms</span>
              </div>
              {allProperties.map((property, index) => {
                const bedrooms = property.specifications.bedrooms || 0;
                const comparison =
                  index > 0
                    ? getComparisonValue(
                        bedrooms,
                        currentProperty.specifications.bedrooms || 0
                      )
                    : "equal";

                return (
                  <div
                    className="flex items-center justify-between"
                    key={property._id}
                  >
                    <span>{bedrooms}</span>
                    {index > 0 && getComparisonIcon(comparison)}
                  </div>
                );
              })}
            </div>

            {/* Bathrooms */}
            <div
              className="grid grid-cols-1 gap-4 rounded-lg bg-muted/30 p-3"
              style={{
                gridTemplateColumns: `repeat(${allProperties.length + 1}, minmax(200px, 1fr))`,
              }}
            >
              <div className="flex items-center gap-2">
                <Bath className="h-4 w-4 text-primary" />
                <span className="font-medium text-sm">Bathrooms</span>
              </div>
              {allProperties.map((property, index) => {
                const bathrooms = property.specifications.bathrooms || 0;
                const comparison =
                  index > 0
                    ? getComparisonValue(
                        bathrooms,
                        currentProperty.specifications.bathrooms || 0
                      )
                    : "equal";

                return (
                  <div
                    className="flex items-center justify-between"
                    key={property._id}
                  >
                    <span>{bathrooms}</span>
                    {index > 0 && getComparisonIcon(comparison)}
                  </div>
                );
              })}
            </div>

            {/* Size */}
            <div
              className="grid grid-cols-1 gap-4 rounded-lg p-3"
              style={{
                gridTemplateColumns: `repeat(${allProperties.length + 1}, minmax(200px, 1fr))`,
              }}
            >
              <div className="flex items-center gap-2">
                <Maximize className="h-4 w-4 text-primary" />
                <span className="font-medium text-sm">Size (sqft)</span>
              </div>
              {allProperties.map((property, index) => {
                const size = property.specifications.totalArea || 0;
                const comparison =
                  index > 0
                    ? getComparisonValue(
                        size,
                        currentProperty.specifications.totalArea || 0
                      )
                    : "equal";

                return (
                  <div
                    className="flex items-center justify-between"
                    key={property._id}
                  >
                    <span>{size || "N/A"}</span>
                    {index > 0 && size > 0 && getComparisonIcon(comparison)}
                  </div>
                );
              })}
            </div>

            {/* Furnished */}
            <div
              className="grid grid-cols-1 gap-4 rounded-lg bg-muted/30 p-3"
              style={{
                gridTemplateColumns: `repeat(${allProperties.length + 1}, minmax(200px, 1fr))`,
              }}
            >
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">Furnished</span>
              </div>
              {allProperties.map((property) => (
                <div key={property._id}>
                  <Badge
                    variant={
                      property.specifications.furnished
                        ? "default"
                        : "secondary"
                    }
                  >
                    {property.specifications.furnished ? "Yes" : "No"}
                  </Badge>
                </div>
              ))}
            </div>

            {/* Features Count */}
            <div
              className="grid grid-cols-1 gap-4 rounded-lg p-3"
              style={{
                gridTemplateColumns: `repeat(${allProperties.length + 1}, minmax(200px, 1fr))`,
              }}
            >
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">Features</span>
              </div>
              {allProperties.map((property) => (
                <div key={property._id}>
                  <span className="text-sm">
                    {Object.values(property.amenities)?.length || 0} features
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
};

type AvailablePropertiesProps = {
  availableProperties: ComparisonProperty[];
  comparisonProperties: ComparisonProperty[];
  addToComparison: (property: ComparisonProperty) => void;
  removeFromComparison?: (propertyId: string) => void;
  clearComparison?: () => void;
};

const AvailableProperties = ({
  availableProperties,
  comparisonProperties,
  addToComparison,
}: AvailablePropertiesProps) => (
  <div className="space-y-4">
    <h3 className="font-semibold">Add Properties to Compare</h3>
    <div className="grid gap-4">
      {availableProperties
        .filter(
          (prop) => !comparisonProperties.find((cp) => cp._id === prop._id)
        )
        .map((property) => (
          <Card
            className="cursor-pointer transition-colors hover:bg-muted/50"
            key={property._id}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="mb-1 font-medium text-sm">{property.title}</h4>
                  <div className="mb-2 flex items-center gap-4 text-muted-foreground text-xs">
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {property.location?.address.town}
                    </div>
                    <div className="flex items-center gap-1">
                      <Bed className="h-3 w-3" />
                      {property.specifications.bedrooms}
                    </div>
                    <div className="flex items-center gap-1">
                      <Bath className="h-3 w-3" />
                      {property.specifications.bathrooms}
                    </div>
                  </div>
                  <p className="font-medium text-primary text-sm">
                    {formatCurrency(property.pricing?.rent || 0, "KES")}
                    /month
                  </p>
                </div>
                <Button
                  disabled={comparisonProperties.length >= 3}
                  onClick={() => addToComparison(property)}
                  size="sm"
                >
                  <Plus className="mr-1 h-4 w-4" />
                  Add
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
    </div>
  </div>
);
