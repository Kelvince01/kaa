import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@kaa/ui/components/button";
import { Calendar } from "@kaa/ui/components/calendar";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@kaa/ui/components/form";
import { Input } from "@kaa/ui/components/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@kaa/ui/components/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@kaa/ui/components/select";
import { Textarea } from "@kaa/ui/components/textarea";
import { cn } from "@kaa/ui/lib/utils";
import { format } from "date-fns";
import { CalendarIcon, Save } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useAuthStore } from "@/modules/auth/auth.store";
import { useUserProperties } from "@/modules/properties/property.queries";
import { useCreateAsset, useUpdateAsset } from "../../financials.queries";
import type { Asset, CreateAssetRequest } from "../../financials.type";

const assetSchema = z.object({
  name: z.string().min(1, "Asset name is required"),
  description: z.string().optional(),
  category: z.enum(["property", "equipment", "furniture", "vehicle", "other"]),
  purchasePrice: z.number().positive("Purchase price must be positive"),
  purchaseDate: z.date(),
  depreciationMethod: z
    .enum(["straight_line", "declining_balance", "units_of_production"])
    .optional(),
  usefulLife: z.number().positive("Useful life must be positive"),
  salvageValue: z
    .number()
    .min(0, "Salvage value must be non-negative")
    .optional(),
  property: z.string().optional(),
});

type AssetFormData = z.infer<typeof assetSchema>;

type AssetFormProps = {
  asset?: Asset;
  onSuccess?: () => void;
  onCancel?: () => void;
};

export function AssetForm({ asset, onSuccess, onCancel }: AssetFormProps) {
  const { user } = useAuthStore();
  const { data: propertiesData } = useUserProperties(user?.id || "", {
    // status: "active",
    limit: 100,
  });

  const { mutate: createAsset, isPending: isCreating } = useCreateAsset();
  const { mutate: updateAsset, isPending: isUpdating } = useUpdateAsset();

  const isEditing = !!asset;
  const isPending = isCreating || isUpdating;

  const form = useForm<AssetFormData>({
    resolver: zodResolver(assetSchema),
    defaultValues: {
      name: asset?.name || "",
      description: asset?.description || "",
      category: asset?.category || "equipment",
      purchasePrice: asset?.purchasePrice || 0,
      purchaseDate: asset ? new Date(asset.purchaseDate) : new Date(),
      depreciationMethod: asset?.depreciationMethod || "straight_line",
      usefulLife: asset?.usefulLife || 5,
      salvageValue: asset?.salvageValue || 0,
      property: asset?.property || "",
    },
  });

  const onSubmit = (data: AssetFormData) => {
    const assetData: CreateAssetRequest = {
      name: data.name,
      description: data.description,
      category: data.category,
      purchasePrice: data.purchasePrice,
      purchaseDate: data.purchaseDate.toISOString(),
      depreciationMethod: data.depreciationMethod,
      usefulLife: data.usefulLife,
      salvageValue: data.salvageValue,
      property: data.property || undefined,
    };

    if (isEditing) {
      updateAsset({ id: asset._id, data: assetData }, { onSuccess });
    } else {
      createAsset(assetData, { onSuccess });
    }
  };

  const properties = propertiesData?.properties || [];

  return (
    // <Card className="mx-auto w-full max-w-3xl">
    // 	<CardHeader>
    // 		<CardTitle className="flex items-center">
    // 			<Building className="mr-2 h-5 w-5" />
    // 			{isEditing ? "Edit Asset" : "Add New Asset"}
    // 		</CardTitle>
    // 	</CardHeader>
    // 	<CardContent>
    <Form {...form}>
      <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
        {/* Basic Information */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Asset Name</FormLabel>
                <FormControl>
                  <Input placeholder="Enter asset name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <Select
                  defaultValue={field.value}
                  onValueChange={field.onChange}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="property">Property</SelectItem>
                    <SelectItem value="equipment">Equipment</SelectItem>
                    <SelectItem value="furniture">Furniture</SelectItem>
                    <SelectItem value="vehicle">Vehicle</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="purchasePrice"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Purchase Price</FormLabel>
                <FormControl>
                  <Input
                    placeholder="0.00"
                    step="0.01"
                    type="number"
                    {...field}
                    onChange={(e) =>
                      field.onChange(Number.parseFloat(e.target.value) || 0)
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="purchaseDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Purchase Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        className={cn(
                          "pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                        variant="outline"
                      >
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent align="start" className="w-auto p-0">
                    <Calendar
                      disabled={(date) => date > new Date()}
                      initialFocus
                      mode="single"
                      onSelect={field.onChange}
                      selected={field.value}
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="usefulLife"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Useful Life (Years)</FormLabel>
                <FormControl>
                  <Input
                    placeholder="5"
                    type="number"
                    {...field}
                    onChange={(e) =>
                      field.onChange(Number.parseInt(e.target.value, 10) || 0)
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="salvageValue"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Salvage Value (Optional)</FormLabel>
                <FormControl>
                  <Input
                    placeholder="0.00"
                    step="0.01"
                    type="number"
                    {...field}
                    onChange={(e) =>
                      field.onChange(Number.parseFloat(e.target.value) || 0)
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="depreciationMethod"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Depreciation Method (Optional)</FormLabel>
                <Select
                  defaultValue={field.value}
                  onValueChange={field.onChange}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select method" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="straight_line">Straight Line</SelectItem>
                    <SelectItem value="declining_balance">
                      Declining Balance
                    </SelectItem>
                    <SelectItem value="units_of_production">
                      Units of Production
                    </SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="property"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Property (Optional)</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a property" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="none">No Property</SelectItem>
                    {properties.map((property) => (
                      <SelectItem key={property._id} value={property._id}>
                        {property.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Description */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description (Optional)</FormLabel>
              <FormControl>
                <Textarea placeholder="Enter asset description" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Actions */}
        <div className="flex justify-end space-x-2 pt-6">
          <Button onClick={onCancel} type="button" variant="outline">
            Cancel
          </Button>
          <Button disabled={isPending} type="submit">
            {isPending ? (
              <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            {isEditing ? "Update" : "Create"} Asset
          </Button>
        </div>
      </form>
    </Form>
    // 	</CardContent>
    // </Card>
  );
}
