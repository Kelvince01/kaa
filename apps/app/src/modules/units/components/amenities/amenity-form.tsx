"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Badge } from "@kaa/ui/components/badge";
import { Button } from "@kaa/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@kaa/ui/components/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@kaa/ui/components/form";
import { Input } from "@kaa/ui/components/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@kaa/ui/components/select";
import { Textarea } from "@kaa/ui/components/textarea";
import { useForm } from "react-hook-form";
import { z } from "zod";

import type { UnitAmenity } from "../../unit.type";

const amenityFormSchema = z.object({
  name: z.string().min(1, "Amenity name is required"),
  description: z.string().optional(),
  icon: z.string().optional(),
});

type AmenityFormData = z.infer<typeof amenityFormSchema>;

type AmenityFormProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  amenity?: UnitAmenity | null;
  onSubmit: (amenity: UnitAmenity) => void;
};

const commonAmenities = [
  { name: "Wi-Fi", icon: "wifi" },
  { name: "Parking", icon: "car" },
  { name: "Gym/Fitness Center", icon: "dumbbell" },
  { name: "Swimming Pool", icon: "waves" },
  { name: "24/7 Security", icon: "shield" },
  { name: "Air Conditioning", icon: "wind" },
  { name: "Furnished", icon: "bed" },
  { name: "Kitchen", icon: "utensils" },
  { name: "Balcony", icon: "building" },
  { name: "Elevator", icon: "building" },
  { name: "Laundry Facilities", icon: "building" },
  { name: "Garden", icon: "tree" },
  { name: "Common Area/Lounge", icon: "users" },
  { name: "Cable TV", icon: "tv" },
  { name: "Backup Generator", icon: "zap" },
  { name: "Water Backup", icon: "droplets" },
  { name: "CCTV Surveillance", icon: "camera" },
  { name: "Intercom System", icon: "phone" },
  { name: "Play Area", icon: "gamepad" },
  { name: "Rooftop Access", icon: "building" },
];

export function AmenityForm({
  open,
  onOpenChange,
  amenity,
  onSubmit,
}: AmenityFormProps) {
  const isEditing = Boolean(amenity);

  const form = useForm<AmenityFormData>({
    resolver: zodResolver(amenityFormSchema),
    defaultValues: {
      name: amenity?.name || "",
      description: amenity?.description || "",
      icon: amenity?.icon || "",
    },
  });

  const handleSubmit = (data: AmenityFormData) => {
    const amenityData: UnitAmenity = {
      name: data.name,
      ...(data.description && { description: data.description }),
      ...(data.icon && { icon: data.icon }),
    };

    onSubmit(amenityData);
    form.reset();
  };

  const handleClose = () => {
    onOpenChange(false);
    form.reset();
  };

  const handleQuickSelect = (selectedAmenity: (typeof commonAmenities)[0]) => {
    form.setValue("name", selectedAmenity.name);
    form.setValue("icon", selectedAmenity.icon);
  };

  return (
    <Dialog onOpenChange={handleClose} open={open}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Amenity" : "Add Amenity"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the amenity information"
              : "Add a new amenity to this unit"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            className="space-y-4"
            onSubmit={form.handleSubmit(handleSubmit)}
          >
            {!isEditing && (
              <div className="space-y-3">
                <label className="font-medium text-sm" htmlFor="quickSelect">
                  Quick Select
                </label>
                <div className="flex max-h-32 flex-wrap gap-2 overflow-y-auto">
                  {commonAmenities.map((commonAmenity) => (
                    <Badge
                      className="cursor-pointer transition-colors hover:bg-primary hover:text-primary-foreground"
                      key={commonAmenity.name}
                      onClick={() => handleQuickSelect(commonAmenity)}
                      variant="outline"
                    >
                      {commonAmenity.name}
                    </Badge>
                  ))}
                </div>
                <p className="text-muted-foreground text-xs">
                  Click on any amenity above to auto-fill, or enter custom
                  details below
                </p>
              </div>
            )}

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amenity Name *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Swimming Pool, Gym, Parking"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      className="min-h-[80px]"
                      placeholder="Optional description of the amenity..."
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Provide additional details about this amenity
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="icon"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Icon</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose an icon (optional)" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="wifi">Wi-Fi</SelectItem>
                      <SelectItem value="car">Parking</SelectItem>
                      <SelectItem value="dumbbell">Gym</SelectItem>
                      <SelectItem value="waves">Pool</SelectItem>
                      <SelectItem value="shield">Security</SelectItem>
                      <SelectItem value="wind">Air Conditioning</SelectItem>
                      <SelectItem value="bed">Furniture</SelectItem>
                      <SelectItem value="utensils">Kitchen</SelectItem>
                      <SelectItem value="building">Building Feature</SelectItem>
                      <SelectItem value="tree">Garden</SelectItem>
                      <SelectItem value="users">Common Area</SelectItem>
                      <SelectItem value="tv">Entertainment</SelectItem>
                      <SelectItem value="zap">Power</SelectItem>
                      <SelectItem value="droplets">Water</SelectItem>
                      <SelectItem value="camera">Surveillance</SelectItem>
                      <SelectItem value="phone">Communication</SelectItem>
                      <SelectItem value="gamepad">Recreation</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Choose an icon to represent this amenity
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button onClick={handleClose} type="button" variant="outline">
                Cancel
              </Button>
              <Button type="submit">
                {isEditing ? "Update Amenity" : "Add Amenity"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
