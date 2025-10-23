import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@kaa/ui/components/button";
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
import { useForm } from "react-hook-form";
import { z } from "zod";
import type { Property } from "../property.type";

// Define form schema using Zod
const propertyFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  price: z.number().min(0, "Price must be a positive number"),
  // Add more fields as needed
});

type PropertyFormValues = z.infer<typeof propertyFormSchema>;

type PropertyFormSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  property?: Property | null;
  onSuccess?: () => void;
};

export function PropertyFormSheet({
  open,
  onOpenChange,
  property,
  onSuccess,
}: PropertyFormSheetProps) {
  const isEdit = !!property;
  const defaultValues = {
    title: property?.title || "",
    description: property?.description || "",
    price: property?.pricing?.rent || 0,
  };

  const form = useForm<PropertyFormValues>({
    resolver: zodResolver(propertyFormSchema),
    defaultValues,
  });

  const onSubmit = (data: PropertyFormValues) => {
    try {
      // TODO: Implement create/update API call
      console.log("Form submitted:", data);
      onSuccess?.();
    } catch (error) {
      console.error("Error saving property:", error);
    }
  };

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit Property" : "Add New Property"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update the property details below."
              : "Fill in the details to add a new property."}
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right" htmlFor="title">
                Title
              </Label>
              <Input
                className="col-span-3"
                id="title"
                {...form.register("title")}
              />
              {form.formState.errors.title && (
                <p className="col-span-4 text-right text-red-500 text-sm">
                  {form.formState.errors.title.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right" htmlFor="description">
                Description
              </Label>
              <Input
                className="col-span-3"
                id="description"
                {...form.register("description")}
              />
              {form.formState.errors.description && (
                <p className="col-span-4 text-right text-red-500 text-sm">
                  {form.formState.errors.description.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right" htmlFor="price">
                Price
              </Label>
              <Input
                className="col-span-3"
                id="price"
                type="number"
                {...form.register("price", { valueAsNumber: true })}
              />
              {form.formState.errors.price && (
                <p className="col-span-4 text-right text-red-500 text-sm">
                  {form.formState.errors.price.message}
                </p>
              )}
            </div>

            {/* Add more form fields as needed */}
          </div>
          <DialogFooter>
            <Button
              onClick={() => onOpenChange(false)}
              type="button"
              variant="outline"
            >
              Cancel
            </Button>
            <Button type="submit">
              {isEdit ? "Update Property" : "Add Property"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
