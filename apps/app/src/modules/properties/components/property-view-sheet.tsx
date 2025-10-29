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
  DialogHeader,
  DialogTitle,
} from "@kaa/ui/components/dialog";
import { ScrollArea } from "@kaa/ui/components/scroll-area";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@kaa/ui/components/tabs";
import MapContainer from "@/components/map-container";
import { PropertyAmenitiesView } from "@/modules/properties";
import { formatCurrency } from "@/shared/utils/format.util";
import type { Property } from "../property.type";

type PropertyViewSheetProps = {
  property: Property;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit?: () => void;
};

export function PropertyViewSheet({
  property,
  open,
  onOpenChange,
  onEdit,
}: PropertyViewSheetProps) {
  // TODO: Fetch property details by ID
  // const property = {
  // 	_id: propertyId,
  // 	title: "Luxury Apartment",
  // 	description: "Beautiful apartment in the city center",
  // 	status: "available" as const,
  // 	pricing: {
  // 		rentAmount: 2500,
  // 		currency: "USD",
  // 		paymentFrequency: "monthly",
  // 		securityDeposit: 2500,
  // 		utilitiesIncluded: ["water", "internet"],
  // 	},
  // 	details: {
  // 		bedrooms: 2,
  // 		bathrooms: 2,
  // 		furnished: true,
  // 		petsAllowed: true,
  // 		size: 1200,
  // 	},
  // 	location: {
  // 		address: {
  // 			line1: "123 Main St",
  // 			town: "New York",
  // 			postalCode: "10001",
  // 		},
  // 	},
  // };

  const statusVariant = {
    active: "bg-green-100 text-green-800",
    rented: "bg-blue-100 text-blue-800",
    sold: "bg-purple-100 text-purple-800",
    pending: "bg-yellow-100 text-yellow-800",
    inactive: "bg-gray-100 text-gray-800",
    draft: "bg-gray-100 text-gray-800",
    archived: "bg-gray-100 text-gray-800",
    available: "bg-green-100 text-green-800",
    maintenance: "bg-gray-100 text-gray-800",
    let: "bg-blue-100 text-blue-800",
  }[property.status];

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl">{property.title}</DialogTitle>
              <DialogDescription>Property ID: {property._id}</DialogDescription>
            </div>
            <Badge className={`${statusVariant} capitalize`}>
              {property.status}
            </Badge>
          </div>
        </DialogHeader>

        <ScrollArea className="h-[calc(100vh-200px)]">
          <div className="grid gap-4 overflow-y-auto py-4">
            <Tabs className="w-full" defaultValue="details">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="location">Location</TabsTrigger>
                <TabsTrigger value="amenities">Nearby Amenities</TabsTrigger>
              </TabsList>

              <TabsContent className="mt-6" value="details">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Property Details</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="mb-4 text-muted-foreground">
                      {property.description}
                    </p>

                    <div className="mt-4 grid grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-medium">Price</h4>
                        <p className="text-muted-foreground">
                          {formatCurrency(
                            property.pricing.rent,
                            property.pricing.currency
                          )}
                          /{property.pricing.paymentFrequency}
                        </p>
                      </div>
                      <div>
                        <h4 className="font-medium">Security Deposit</h4>
                        <p className="text-muted-foreground">
                          {formatCurrency(
                            property.pricing.deposit,
                            property.pricing.currency
                          )}
                        </p>
                      </div>
                      <div>
                        <h4 className="font-medium">Bedrooms</h4>
                        <p className="text-muted-foreground">
                          {property.specifications.bedrooms}
                        </p>
                      </div>
                      <div>
                        <h4 className="font-medium">Bathrooms</h4>
                        <p className="text-muted-foreground">
                          {property.specifications.bathrooms}
                        </p>
                      </div>
                      <div>
                        <h4 className="font-medium">Size</h4>
                        <p className="text-muted-foreground">
                          {property.specifications.totalArea} sq.ft
                        </p>
                      </div>
                      <div>
                        <h4 className="font-medium">Furnished</h4>
                        <p className="text-muted-foreground">
                          {property.specifications.furnished ? "Yes" : "No"}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent className="mt-6" value="location">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Location</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <address className="not-italic">
                      <p>{property.location.address.line1}</p>
                      <p>
                        {property.location.address.town},{" "}
                        {property.location.address.postalCode}
                      </p>
                    </address>
                    <MapContainer
                      className="mt-4 flex h-full w-full items-center justify-center rounded-md bg-muted"
                      latitude={property.geolocation.coordinates[1] ?? 0}
                      longitude={property.geolocation.coordinates[0] ?? 0}
                      zoom={10}
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent className="mt-6" value="amenities">
                <PropertyAmenitiesView
                  propertyId={property._id}
                  propertyLocation={{
                    latitude: property.geolocation.coordinates[1] ?? 0,
                    longitude: property.geolocation.coordinates[0] ?? 0,
                    county: property.location.county,
                    address: property.location.address.line1,
                  }}
                  radius={2}
                />
              </TabsContent>
            </Tabs>
          </div>
        </ScrollArea>

        <div className="flex justify-between border-t pt-4">
          <Button onClick={() => onOpenChange(false)} variant="outline">
            Close
          </Button>
          {onEdit && <Button onClick={onEdit}>Edit Property</Button>}
        </div>
      </DialogContent>
    </Dialog>
  );
}
