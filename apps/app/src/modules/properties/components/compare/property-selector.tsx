import { Badge } from "@kaa/ui/components/badge";
import { Button } from "@kaa/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@kaa/ui/components/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@kaa/ui/components/dialog";
import { Input } from "@kaa/ui/components/input";
import { ScrollArea } from "@kaa/ui/components/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@kaa/ui/components/select";
import { Separator } from "@kaa/ui/components/separator";
import {
  Bath,
  Bed,
  Building,
  Clock,
  Filter,
  Home,
  MapPin,
  Plus,
  Search,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Image from "next/image";
import type React from "react";
import { useMemo, useState } from "react";
import type { Property } from "../../property.type";
import { useRecentlyViewedStore } from "../../recently-viewed.store";

type PropertySelectorProps = {
  availableProperties: Property[];
  selectedProperties: Property[];
  onSelect: (property: Property) => void;
  maxProperties: number;
};

export const PropertySelector: React.FC<PropertySelectorProps> = ({
  availableProperties,
  selectedProperties,
  onSelect,
  maxProperties,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    type: "",
    minPrice: "",
    maxPrice: "",
    minBedrooms: "",
    county: "",
    listingType: "",
  });
  const [showFilters, setShowFilters] = useState(false);

  // Recently viewed store
  const { recentlyViewed } = useRecentlyViewedStore();

  const selectedIds = new Set(selectedProperties.map((p) => p._id));

  // Get recently viewed properties that are available and not already selected
  const availableRecentlyViewed = useMemo(() => {
    const availableIds = new Set(availableProperties.map((p) => p._id));
    return recentlyViewed
      .filter(
        (property) =>
          availableIds.has(property._id) && !selectedIds.has(property._id)
      )
      .slice(0, 3); // Show only the 3 most recent
  }, [recentlyViewed, availableProperties, selectedIds]);

  // Filter and search properties
  const filteredProperties = useMemo(() => {
    let filtered = availableProperties.filter(
      (property) => !selectedIds.has(property._id)
    );

    // Apply search
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (property) =>
          property.title.toLowerCase().includes(search) ||
          property.location.county.toLowerCase().includes(search) ||
          property.location.constituency.toLowerCase().includes(search) ||
          property.description.toLowerCase().includes(search)
      );
    }

    // Apply filters
    if (filters.type) {
      filtered = filtered.filter((property) => property.type === filters.type);
    }
    if (filters.listingType) {
      filtered = filtered.filter(
        (property) => property.listingType === filters.listingType
      );
    }
    if (filters.county) {
      filtered = filtered.filter(
        (property) => property.location.county === filters.county
      );
    }
    if (filters.minPrice) {
      filtered = filtered.filter(
        (property) =>
          property.pricing.rent >= Number.parseInt(filters.minPrice, 10)
      );
    }
    if (filters.maxPrice) {
      filtered = filtered.filter(
        (property) =>
          property.pricing.rent <= Number.parseInt(filters.maxPrice, 10)
      );
    }
    if (filters.minBedrooms) {
      filtered = filtered.filter(
        (property) =>
          (property.specifications.bedrooms || 0) >=
          Number.parseInt(filters.minBedrooms, 10)
      );
    }

    return filtered;
  }, [availableProperties, selectedIds, searchTerm, filters]);

  // Get unique values for filter dropdowns
  const uniqueTypes = useMemo(
    () => Array.from(new Set(availableProperties.map((p) => p.type))).sort(),
    [availableProperties]
  );

  const uniqueCounties = useMemo(
    () =>
      Array.from(
        new Set(availableProperties.map((p) => p.location.county))
      ).sort(),
    [availableProperties]
  );

  const uniqueListingTypes = useMemo(
    () =>
      Array.from(
        new Set(availableProperties.map((p) => p.listingType).filter(Boolean))
      ).sort(),
    [availableProperties]
  );

  const handleSelect = (property: Property) => {
    onSelect(property);
    if (selectedProperties.length + 1 >= maxProperties) {
      setIsOpen(false);
    }
  };

  const clearFilters = () => {
    setFilters({
      type: "",
      minPrice: "",
      maxPrice: "",
      minBedrooms: "",
      county: "",
      listingType: "",
    });
    setSearchTerm("");
  };

  const hasActiveFilters = Object.values(filters).some(Boolean) || searchTerm;

  return (
    <Dialog onOpenChange={setIsOpen} open={isOpen}>
      <DialogTrigger asChild>
        <Button
          className="gap-2"
          disabled={selectedProperties.length >= maxProperties}
          size="sm"
        >
          <Plus className="h-4 w-4" />
          Add Property ({selectedProperties.length}/{maxProperties})
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[80vh] max-w-4xl p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle>Select Properties to Compare</DialogTitle>
          <DialogDescription>
            Choose up to {maxProperties} properties to compare side by side
          </DialogDescription>
        </DialogHeader>

        <div className="flex h-full flex-col">
          {/* Search and Filters */}
          <div className="space-y-4 p-6 pb-0">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute top-3 left-3 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-9"
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search properties by title, location, or description..."
                value={searchTerm}
              />
            </div>

            {/* Filters */}
            <div className="flex items-center gap-2">
              <Button
                className="gap-2"
                onClick={() => setShowFilters(!showFilters)}
                size="sm"
                variant="outline"
              >
                <Filter className="h-4 w-4" />
                Filters
                {hasActiveFilters && (
                  <Badge
                    className="ml-1 h-5 px-1.5 text-xs"
                    variant="secondary"
                  >
                    {Object.values(filters).filter(Boolean).length +
                      (searchTerm ? 1 : 0)}
                  </Badge>
                )}
              </Button>
              {hasActiveFilters && (
                <Button onClick={clearFilters} size="sm" variant="ghost">
                  Clear All
                </Button>
              )}
            </div>

            {/* Filter Controls */}
            <AnimatePresence>
              {showFilters && (
                <motion.div
                  animate={{ opacity: 1, height: "auto" }}
                  className="grid grid-cols-2 gap-3 pt-2 md:grid-cols-3 lg:grid-cols-6"
                  exit={{ opacity: 0, height: 0 }}
                  initial={{ opacity: 0, height: 0 }}
                >
                  <Select
                    onValueChange={(value) =>
                      setFilters((prev) => ({ ...prev, type: value }))
                    }
                    value={filters.type}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Property Type" />
                    </SelectTrigger>
                    <SelectContent>
                      {/* <SelectItem value="">All Types</SelectItem> */}
                      {uniqueTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type.charAt(0).toUpperCase() + type.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    onValueChange={(value) =>
                      setFilters((prev) => ({ ...prev, listingType: value }))
                    }
                    value={filters.listingType}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Listing Type" />
                    </SelectTrigger>
                    <SelectContent>
                      {/* <SelectItem value="">All Listings</SelectItem> */}
                      {uniqueListingTypes.map((type) => (
                        <SelectItem key={type} value={type || ""}>
                          For{" "}
                          {type?.charAt(0)?.toUpperCase() +
                            (type as string)?.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    onValueChange={(value) =>
                      setFilters((prev) => ({ ...prev, county: value }))
                    }
                    value={filters.county}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="County" />
                    </SelectTrigger>
                    <SelectContent>
                      {/* <SelectItem value="">All Counties</SelectItem> */}
                      {uniqueCounties.map((county) => (
                        <SelectItem key={county} value={county}>
                          {county}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Input
                    onChange={(e) =>
                      setFilters((prev) => ({
                        ...prev,
                        minPrice: e.target.value,
                      }))
                    }
                    placeholder="Min Price (KES)"
                    type="number"
                    value={filters.minPrice}
                  />

                  <Input
                    onChange={(e) =>
                      setFilters((prev) => ({
                        ...prev,
                        maxPrice: e.target.value,
                      }))
                    }
                    placeholder="Max Price (KES)"
                    type="number"
                    value={filters.maxPrice}
                  />

                  <Select
                    onValueChange={(value) =>
                      setFilters((prev) => ({ ...prev, minBedrooms: value }))
                    }
                    value={filters.minBedrooms}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Min Bedrooms" />
                    </SelectTrigger>
                    <SelectContent>
                      {/* <SelectItem value="">Any</SelectItem> */}
                      <SelectItem value="1">1+</SelectItem>
                      <SelectItem value="2">2+</SelectItem>
                      <SelectItem value="3">3+</SelectItem>
                      <SelectItem value="4">4+</SelectItem>
                      <SelectItem value="5">5+</SelectItem>
                    </SelectContent>
                  </Select>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <Separator className="my-4" />

          <ScrollArea className="h-[400px] pr-4">
            {/* Recently Viewed Section */}
            {availableRecentlyViewed.length > 0 && (
              <div className="px-6 pb-4">
                <div className="mb-3 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <h3 className="font-medium text-sm">Recently Viewed</h3>
                </div>
                <div className="grid gap-2 md:grid-cols-3">
                  {availableRecentlyViewed.map((property) => (
                    <Card
                      className="group cursor-pointer border-dashed transition-all duration-200 hover:shadow-md"
                      key={property._id}
                      onClick={() => handleSelect(property as Property)}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-center gap-2">
                          {property.media?.images?.[0] && (
                            <Image
                              alt={property.title}
                              className="h-8 w-8 shrink-0 rounded object-cover"
                              height={32}
                              src={property.media.images[0].url ?? ""}
                              width={32}
                            />
                          )}
                          <div className="min-w-0 flex-1">
                            <div className="line-clamp-1 font-medium text-xs transition-colors group-hover:text-primary">
                              {property.title}
                            </div>
                            <div className="line-clamp-1 text-muted-foreground text-xs">
                              KES {property.pricing.rent?.toLocaleString()}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                <Separator className="mt-4" />
              </div>
            )}

            {/* Results */}
            <div className="flex-1 p-6 pt-4">
              {filteredProperties.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Building className="h-12 w-12 text-muted-foreground/50" />
                  <h3 className="mt-4 font-medium text-lg">
                    No properties found
                  </h3>
                  <p className="mt-2 max-w-sm text-muted-foreground text-sm">
                    {searchTerm || hasActiveFilters
                      ? "Try adjusting your search or filters to find more properties."
                      : "No available properties to select from."}
                  </p>
                  {hasActiveFilters && (
                    <Button
                      className="mt-4"
                      onClick={clearFilters}
                      variant="outline"
                    >
                      Clear Filters
                    </Button>
                  )}
                </div>
              ) : (
                <ScrollArea className="h-[400px] pr-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    {filteredProperties.map((property, index) => (
                      <motion.div
                        animate={{ opacity: 1, y: 0 }}
                        initial={{ opacity: 0, y: 20 }}
                        key={property._id}
                        transition={{ delay: index * 0.05 }}
                      >
                        <Card className="group cursor-pointer transition-all duration-200 hover:shadow-md">
                          <div onClick={() => handleSelect(property)}>
                            <CardHeader className="pb-3">
                              <div className="flex items-start gap-3">
                                {property.media?.images?.[0] && (
                                  <Image
                                    alt={property.title}
                                    className="h-12 w-12 shrink-0 rounded-lg object-cover"
                                    height={48}
                                    src={property.media.images[0].url ?? ""}
                                    width={48}
                                  />
                                )}
                                <div className="min-w-0 flex-1">
                                  <CardTitle className="line-clamp-2 text-base leading-tight transition-colors group-hover:text-primary">
                                    {property.title}
                                  </CardTitle>
                                  <CardDescription className="mt-1 flex items-center gap-1 text-xs">
                                    <MapPin className="h-3 w-3" />
                                    {property.location.county},{" "}
                                    {property.location.constituency}
                                  </CardDescription>
                                </div>
                                <div className="shrink-0 text-right">
                                  <div className="font-semibold text-green-600">
                                    KES{" "}
                                    {property.pricing.rent?.toLocaleString()}
                                  </div>
                                  <div className="text-muted-foreground text-xs">
                                    /{property.pricing.paymentFrequency}
                                  </div>
                                </div>
                              </div>
                            </CardHeader>
                            <CardContent className="pt-0">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4 text-muted-foreground text-sm">
                                  <div className="flex items-center gap-1">
                                    <Bed className="h-3 w-3" />
                                    {property.specifications.bedrooms || 0}
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Bath className="h-3 w-3" />
                                    {property.specifications.bathrooms || 0}
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Home className="h-3 w-3" />
                                    {property.specifications.totalArea || 0} sq
                                    m
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Badge className="text-xs" variant="outline">
                                    {property.type}
                                  </Badge>
                                  {property.listingType && (
                                    <Badge
                                      className="text-xs"
                                      variant="secondary"
                                    >
                                      For {property.listingType}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </div>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                </ScrollArea>
              )}

              {filteredProperties.length > 0 && (
                <div className="mt-4 text-center text-muted-foreground text-sm">
                  Showing {filteredProperties.length}{" "}
                  {filteredProperties.length === 1 ? "property" : "properties"}
                  {selectedProperties.length > 0 && (
                    <>
                      {" "}
                      • {selectedProperties.length}/{maxProperties} selected
                    </>
                  )}
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
};
