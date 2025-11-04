"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@kaa/ui/components/button";
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
import { Switch } from "@kaa/ui/components/switch";
import { Textarea } from "@kaa/ui/components/textarea";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";
import { useCreateUnit, useUpdateUnit } from "@/modules/units";
import { type Unit, UnitStatus, UnitType } from "../unit.type";

const unitFormSchema = z.object({
  unitNumber: z.string().min(1, {
    message: "Unit number is required.",
  }),
  description: z.string().optional(),
  type: z.enum(UnitType),
  bedrooms: z.number().min(0, "Bedrooms must be 0 or more"),
  bathrooms: z.number().min(1, "Must have at least 1 bathroom"),
  rent: z.number().min(0, "Rent must be positive"),
  depositAmount: z.number().min(0, "Deposit must be positive"),
  rentDueDay: z.number().min(1).max(31, "Rent due day must be between 1-31"),
  size: z.number().min(0),
  features: z.string(),
  status: z.enum(UnitStatus),
  isActive: z.boolean(),
  floor: z.number().optional(),
  notes: z.string().optional(),
});

type UnitFormSchema = z.infer<typeof unitFormSchema>;

type UnitFormValues = Omit<
  Unit,
  "id" | "tenantId" | "createdAt" | "updatedAt" // "propertyId"
>;

type UnitFormProps = {
  propertyId: string;
  initialData?: UnitFormValues;
  unitId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
};

export function UnitForm({
  propertyId,
  initialData,
  unitId,
  onSuccess,
  onCancel,
}: UnitFormProps) {
  const t = useTranslations("properties.units");
  const createUnitMutation = useCreateUnit();
  const updateUnitMutation = useUpdateUnit();

  const form = useForm<UnitFormSchema>({
    resolver: zodResolver(unitFormSchema),
    defaultValues: {
      unitNumber: initialData ? initialData.unitNumber : "",
      type: initialData ? initialData.type : UnitType.STUDIO,
      rent: initialData ? initialData.rent : 0,
      depositAmount: initialData ? initialData.depositAmount : 0,
      size: initialData ? initialData.size : 0,
      // features: initialData ? initialData.features : "",
      status: initialData ? initialData.status : UnitStatus.VACANT,
      isActive: initialData ? initialData.isActive : true,
      floor: initialData ? initialData.floor : 0,
      notes: initialData ? initialData.notes : "",
    },
  });

  async function onSubmit(data: UnitFormSchema) {
    try {
      if (unitId) {
        await updateUnitMutation.mutateAsync({
          id: unitId,
          data: {
            ...data,
            property: propertyId,
          },
        });
      } else {
        createUnitMutation.mutate({
          property: propertyId,
          ...data,
        });
      }

      toast.success(unitId ? t("update_success") : t("create_success"));
      onSuccess?.();
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error(t("error"));
      }
    }
  }

  const unitTypeOptions = [
    { value: UnitType.BEDSITTER, label: "Bedsitter" },
    { value: UnitType.SINGLE_ROOM, label: "Single Room" },
    { value: UnitType.DOUBLE_ROOM, label: "Double Room" },
    { value: UnitType.STUDIO, label: "Studio" },
    { value: UnitType.ONE_BEDROOM, label: "1 Bedroom" },
    { value: UnitType.TWO_BEDROOM, label: "2 Bedroom" },
    { value: UnitType.THREE_BEDROOM, label: "3 Bedroom" },
    { value: UnitType.PENTHOUSE, label: "Penthouse" },
    { value: UnitType.SHOP, label: "Shop" },
    { value: UnitType.OFFICE, label: "Office" },
    { value: UnitType.WAREHOUSE, label: "Warehouse" },
    { value: UnitType.OTHER, label: "Other" },
  ];

  return (
    <Form {...form}>
      <form className="space-y-8" onSubmit={form.handleSubmit(onSubmit)}>
        {/* Basic Information */}
        <div className="space-y-4">
          <h3 className="font-semibold text-lg">Basic Information</h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <FormField
              control={form.control}
              name="unitNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("unit_number")}</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., A1, 101, Unit 1" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("unit_type")}</FormLabel>
                  <Select
                    defaultValue={field.value}
                    onValueChange={field.onChange}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {/*<SelectItem value="studio">{t("types.studio")}</SelectItem>*/}
                      {/*<SelectItem value="1br">{t("types.1br")}</SelectItem>*/}
                      {/*<SelectItem value="2br">{t("types.2br")}</SelectItem>*/}
                      {/*<SelectItem value="3br">{t("types.3br")}</SelectItem>*/}
                      {/*<SelectItem value="commercial">{t("types.commercial")}</SelectItem>*/}
                      {/*<SelectItem value="other">{t("types.other")}</SelectItem>*/}

                      {unitTypeOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("status_text")}</FormLabel>
                  <Select
                    defaultValue={field.value}
                    onValueChange={field.onChange}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="vacant">
                        {t("status.vacant")}
                      </SelectItem>
                      <SelectItem value="occupied">
                        {t("status.occupied")}
                      </SelectItem>
                      <SelectItem value="maintenance">
                        {t("status.maintenance")}
                      </SelectItem>
                      <SelectItem value="reserved">
                        {t("status.reserved")}
                      </SelectItem>
                      <SelectItem value="unavailable">
                        {t("status.unavailable")}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description (Optional)</FormLabel>
                <FormControl>
                  <Textarea
                    className="min-h-[80px]"
                    placeholder="Describe the unit..."
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Unit Specifications */}
        <div className="space-y-4">
          <h3 className="font-semibold text-lg">Specifications</h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            <FormField
              control={form.control}
              name="size"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("size")}</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                      onChange={(e) =>
                        field.onChange(Number.parseInt(e.target.value, 10))
                      }
                    />
                  </FormControl>
                  <FormDescription>{t("size_description")}</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="bedrooms"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("bedrooms")}</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                      onChange={(e) =>
                        field.onChange(Number.parseInt(e.target.value, 10))
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="bathrooms"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("bathrooms")}</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                      onChange={(e) =>
                        field.onChange(Number.parseInt(e.target.value, 10))
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="floor"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("floor")}</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                      onChange={(e) =>
                        field.onChange(Number.parseInt(e.target.value, 10))
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Financial Information */}
        <div className="space-y-4">
          <h3 className="font-semibold text-lg">Financial Information</h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <FormField
              control={form.control}
              name="rent"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("rent_amount")}</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                      onChange={(e) =>
                        field.onChange(Number.parseInt(e.target.value, 10))
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="depositAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("security_deposit")}</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                      onChange={(e) =>
                        field.onChange(Number.parseInt(e.target.value, 10))
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="rentDueDay"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("rent_due_day")}</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                      onChange={(e) =>
                        field.onChange(Number.parseInt(e.target.value, 10))
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Additional Notes */}
        <div className="space-y-4">
          <h3 className="font-semibold text-lg">Additional Information</h3>

          <FormField
            control={form.control}
            name="features"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("features")}</FormLabel>
                <FormControl>
                  <Textarea {...field} />
                </FormControl>
                <FormDescription>{t("features_description")}</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("notes")}</FormLabel>
                <FormControl>
                  <Textarea {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="isActive"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">{t("is_active")}</FormLabel>
                  <FormDescription>
                    {t("is_active_description")}
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        <div className="flex gap-4 pt-6">
          <Button onClick={onCancel} type="button" variant="outline">
            Cancel
          </Button>
          <Button
            className="flex-1"
            disabled={createUnitMutation.isPending}
            type="submit"
          >
            {createUnitMutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            {createUnitMutation.isPending
              ? t("saving")
              : unitId
                ? t("update")
                : t("create")}
          </Button>
        </div>
      </form>
    </Form>
  );
}
