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
} from "@kaa/ui/components/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@kaa/ui/components/dropdown-menu";
import {
  Bed,
  Building,
  Car,
  Dumbbell,
  Edit,
  MoreVertical,
  Plus,
  Shield,
  Trash2,
  TreePine,
  Tv,
  Users,
  UtensilsCrossed,
  Waves,
  Wifi,
  Wind,
} from "lucide-react";
import { useState } from "react";

import type { UnitAmenity } from "../../unit.type";
import { AmenityForm } from "./amenity-form";

type AmenityManagerProps = {
  amenities: UnitAmenity[];
  onUpdate: (amenities: UnitAmenity[]) => void;
  readonly?: boolean;
};

const amenityIcons = {
  wifi: Wifi,
  internet: Wifi,
  parking: Car,
  gym: Dumbbell,
  fitness: Dumbbell,
  pool: Waves,
  swimming: Waves,
  "common area": Users,
  lounge: Users,
  security: Shield,
  "24/7 security": Shield,
  "air conditioning": Wind,
  ac: Wind,
  tv: Tv,
  television: Tv,
  kitchen: UtensilsCrossed,
  furnished: Bed,
  garden: TreePine,
  balcony: Building,
  elevator: Building,
  laundry: Building,
  default: Building,
};

const getAmenityIcon = (amenityName: string) => {
  const name = amenityName.toLowerCase();
  for (const [key, Icon] of Object.entries(amenityIcons)) {
    if (name.includes(key)) {
      return Icon;
    }
  }
  return amenityIcons.default;
};

export function AmenityManager({
  amenities,
  onUpdate,
  readonly = false,
}: AmenityManagerProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAmenity, setEditingAmenity] = useState<UnitAmenity | null>(
    null
  );
  const [deletingAmenity, setDeletingAmenity] = useState<UnitAmenity | null>(
    null
  );

  const handleAddAmenity = (amenity: UnitAmenity) => {
    onUpdate([...amenities, amenity]);
    setIsFormOpen(false);
  };

  const handleUpdateAmenity = (updatedAmenity: UnitAmenity) => {
    const updatedAmenities = amenities.map((amenity) =>
      amenity.name === editingAmenity?.name ? updatedAmenity : amenity
    );
    onUpdate(updatedAmenities);
    setEditingAmenity(null);
  };

  const handleDeleteAmenity = () => {
    if (deletingAmenity) {
      const updatedAmenities = amenities.filter(
        (amenity) => amenity.name !== deletingAmenity.name
      );
      onUpdate(updatedAmenities);
      setDeletingAmenity(null);
    }
  };

  const handleEditAmenity = (amenity: UnitAmenity) => {
    setEditingAmenity(amenity);
  };

  return (
    <div className="space-y-6">
      {/* Amenities Grid */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Unit Amenities</CardTitle>
          {!readonly && (
            <Button
              className="gap-2"
              onClick={() => setIsFormOpen(true)}
              size="sm"
            >
              <Plus className="h-4 w-4" />
              Add Amenity
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {amenities.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {amenities.map((amenity) => {
                const Icon = getAmenityIcon(amenity.name);
                return (
                  <Card className="group relative" key={amenity.name}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0">
                          <Icon className="h-6 w-6 text-primary" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="truncate font-medium">
                            {amenity.name}
                          </h4>
                          {amenity.description && (
                            <p className="mt-1 line-clamp-2 text-muted-foreground text-sm">
                              {amenity.description}
                            </p>
                          )}
                        </div>
                        {!readonly && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                className="h-8 w-8 opacity-0 transition-opacity group-hover:opacity-100"
                                size="icon"
                                variant="ghost"
                              >
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => handleEditAmenity(amenity)}
                              >
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-red-600"
                                onClick={() => setDeletingAmenity(amenity)}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="py-8 text-center text-muted-foreground">
              No amenities added
              {!readonly && (
                <div className="mt-2">
                  <Button
                    className="gap-2"
                    onClick={() => setIsFormOpen(true)}
                    size="sm"
                    variant="outline"
                  >
                    <Plus className="h-4 w-4" />
                    Add First Amenity
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Amenities Summary */}
      {amenities.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Amenities Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {amenities.map((amenity) => {
                const Icon = getAmenityIcon(amenity.name);
                return (
                  <Badge className="gap-2" key={amenity.name} variant="outline">
                    <Icon className="h-3 w-3" />
                    {amenity.name}
                  </Badge>
                );
              })}
            </div>
            <div className="mt-4 text-muted-foreground text-sm">
              {amenities.length} amenity{amenities.length !== 1 ? "ies" : ""}{" "}
              available
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add/Edit Amenity Dialog */}
      <AmenityForm
        amenity={editingAmenity}
        onOpenChange={(open) => {
          if (!open) {
            setIsFormOpen(false);
            setEditingAmenity(null);
          }
        }}
        onSubmit={editingAmenity ? handleUpdateAmenity : handleAddAmenity}
        open={isFormOpen || editingAmenity !== null}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog
        onOpenChange={() => setDeletingAmenity(null)}
        open={deletingAmenity !== null}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Amenity</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{deletingAmenity?.name}"? This
              action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setDeletingAmenity(null)} variant="outline">
              Cancel
            </Button>
            <Button onClick={handleDeleteAmenity} variant="destructive">
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
