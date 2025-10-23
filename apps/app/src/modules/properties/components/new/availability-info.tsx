import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@kaa/ui/components/button";
import { Calendar } from "@kaa/ui/components/calendar";
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@kaa/ui/components/popover";
import { cn } from "@kaa/ui/lib/utils";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Info, Key } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import type { UseFormProps } from "react-hook-form";
import { useStepper } from "@/components/common/stepper";
import UnsavedBadge from "@/components/common/unsaved-badge";
import { SubmitButton } from "@/components/ui/submit-button";
import { useBeforeUnload } from "@/hooks/use-before-unload";
import { useFormWithDraft } from "@/hooks/use-draft-form";
import useHideElementsById from "@/hooks/use-hide-elements-by-id";
import type { Property } from "@/modules/properties/property.type";
import { type PropertyFormData, propertyFormSchema } from "./schema";

type AvailabilityInfoFormProps = {
  property: Property;
  sheet?: boolean;
  callback?: (property: Property) => void;
  hiddenFields?: string[];
  children?: React.ReactNode;
};

export const AvailabilityInfoForm = ({
  property,
  sheet: isSheet,
  callback,
  hiddenFields,
  children,
}: AvailabilityInfoFormProps) => {
  const t = useTranslations();
  const { nextStep } = useStepper();

  const isPending = false;
  const initialFormValues: PropertyFormData["availability"] = property
    ? {
        availableFrom: property.availability?.availableFrom
          ? new Date(property.availability.availableFrom)
          : undefined,
        availableTo: property.availability?.availableTo
          ? new Date(property.availability.availableTo)
          : undefined,
        noticePeriod: property.noticePeriod || undefined,
      }
    : {
        availableFrom: undefined,
        availableTo: undefined,
        noticePeriod: undefined,
      };

  // Hide fields if requested
  if (hiddenFields) {
    const fieldIds = hiddenFields.map(
      (field) => `${field}-form-item-container`
    );
    // biome-ignore lint/correctness/useHookAtTopLevel: we need to call this hook conditionally
    useHideElementsById(fieldIds);
  }

  const formOptions: UseFormProps<PropertyFormData["availability"]> = useMemo(
    () => ({
      resolver: zodResolver(propertyFormSchema.shape.availability),
      defaultValues: initialFormValues,
    }),
    [initialFormValues]
  );

  const form = useFormWithDraft<PropertyFormData["availability"]>(
    "property-availability-info",
    {
      formOptions,
      onUnsavedChanges: () => console.info("Unsaved changes detected!"),
    }
  );
  const watchedValues = form.watch();

  // Prevent data loss
  useBeforeUnload({
    when: form.formState.isDirty,
    message: "You have unsaved changes. Are you sure you want to leave?",
  });

  const onSubmit = (data: PropertyFormData["availability"]) => {
    console.log(data);
    nextStep?.();
    callback?.(property);
  };

  return (
    <div>
      <Form {...form}>
        <form className="space-y-8" onSubmit={form.handleSubmit(onSubmit)}>
          {!isSheet && form.unsavedChanges && <UnsavedBadge />}

          {/* Availability Status */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              <h3 className="font-semibold text-lg">Availability Status</h3>
            </div>
            <p className="text-muted-foreground text-sm">
              Set when your property is available for rent
            </p>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="availableFrom"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Available From *</FormLabel>
                    <FormDescription>
                      When is the property available for move-in?
                    </FormDescription>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            className={cn(
                              "w-full pl-3 text-left font-normal",
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
                          disabled={(date) => date < new Date()}
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
                name="availableTo"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Available Until (Optional)</FormLabel>
                    <FormDescription>
                      If you have an end date for availability
                    </FormDescription>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                            variant="outline"
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick end date (optional)</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent align="start" className="w-auto p-0">
                        <Calendar
                          disabled={(date) => {
                            if (date < new Date()) return true;
                            if (
                              watchedValues.availableFrom &&
                              date < watchedValues.availableFrom
                            )
                              return true;
                            return false;
                          }}
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
            </div>
          </div>

          {/* Lease Terms */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              <h3 className="font-semibold text-lg">Lease Terms</h3>
            </div>
            <p className="text-muted-foreground text-sm">
              Specify notice period and other lease requirements
            </p>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="noticePeriod"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notice Period (Days)</FormLabel>
                    <FormDescription>
                      How many days notice for move-out?
                    </FormDescription>
                    <FormControl>
                      <Input
                        placeholder="30"
                        type="number"
                        {...field}
                        onChange={(e) =>
                          field.onChange(
                            Number.parseInt(e.target.value, 10) || undefined
                          )
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* Additional Information */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Info className="h-5 w-5" />
              <h3 className="font-semibold text-lg">Additional Information</h3>
            </div>

            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
              <h4 className="mb-2 font-medium">
                💡 Tips for Better Availability
              </h4>
              <ul className="space-y-1 text-blue-700 text-sm">
                <li>
                  • Set a realistic available date to attract serious inquiries
                </li>
                <li>• Properties available immediately get more views</li>
                <li>• Standard notice period is 30 days in Kenya</li>
                <li>
                  • Clear availability dates reduce confusion for potential
                  tenants
                </li>
              </ul>
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            {children}
            <SubmitButton
              disabled={
                !(hiddenFields?.length || form.formState.isDirty) ||
                Object.keys(form.formState.errors).length > 0
              }
              loading={isPending}
            >
              {t(
                `common.${hiddenFields?.length ? "continue" : "save_changes"}`
              )}
            </SubmitButton>
            {!children && (
              <Button
                className={form.formState.isDirty ? "" : "invisible"}
                onClick={() => form.reset()}
                type="reset"
                variant="secondary"
              >
                {t("common.cancel")}
              </Button>
            )}
          </div>
        </form>
      </Form>
    </div>
  );
};

export default AvailabilityInfoForm;
