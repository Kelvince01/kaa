import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@kaa/ui/components/button";
import { Calendar } from "@kaa/ui/components/calendar";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@kaa/ui/components/card";
import { Checkbox } from "@kaa/ui/components/checkbox";
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
import {
  ArrowLeft,
  Calendar as CalendarIcon,
  FileText,
  Key,
  Users,
} from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const availabilitySchema = z.object({
  // Availability Status
  isAvailable: z.boolean(),
  availableFrom: z.date(),
  availableUntil: z.date().optional(),

  // Lease Terms
  minimumLeaseTerm: z.number().min(1, "Minimum lease term is required"),
  maximumLeaseTerm: z.number().optional(),
  leaseTermUnit: z.enum(["days", "weeks", "months", "years"]),

  // Viewing & Contact
  viewingDays: z.array(z.string()),
  viewingTimes: z
    .object({
      start: z.string(),
      end: z.string(),
    })
    .optional(),
  viewingByAppointment: z.boolean(),
  instantBooking: z.boolean(),

  // Contact Information
  showingContact: z.object({
    name: z.string(),
    phone: z.string(),
    email: z.email(),
    role: z.enum(["owner", "agent", "manager", "leasing_office"]),
  }),

  // application requirements
  applicationRequired: z.boolean(),
  applicationFee: z.number().min(0).optional(),
  backgroundCheck: z.boolean(),
  creditCheck: z.boolean(),
  incomeVerification: z.boolean(),
  referencesRequired: z.number().min(0),

  // Income Requirements
  minimumIncome: z.number().min(0).optional(),
  incomeMultiplier: z.number().min(1), // 3x rent
  acceptStudents: z.boolean(),
  acceptInternational: z.boolean(),

  // Required Documents
  requiredDocuments: z.array(z.string()),

  // Move-in Requirements
  firstMonthRent: z.boolean(),
  lastMonthRent: z.boolean(),
  securityDepositRequired: z.boolean(),
  brokerageFeeRequired: z.boolean(),

  // Special Conditions
  immediateOccupancy: z.boolean(),
  flexibleMoveIn: z.boolean(),
  furnishedAvailable: z.boolean(),
  utilitiesIncluded: z.boolean(),

  // Seasonal Availability
  seasonalRental: z.boolean(),
  seasonalRates: z
    .object({
      highSeason: z.object({
        startMonth: z.number().min(1).max(12),
        endMonth: z.number().min(1).max(12),
        rate: z.number().min(0),
      }),
      lowSeason: z.object({
        rate: z.number().min(0),
      }),
    })
    .optional(),

  // Special Notes
  availabilityNotes: z.string().optional(),
  showingInstructions: z.string().optional(),
  applicationInstructions: z.string().optional(),
});

type AvailabilityFormData = z.infer<typeof availabilitySchema>;

type AvailabilityFormProps = {
  defaultValues?: Partial<AvailabilityFormData>;
  onSubmit: (data: AvailabilityFormData) => void;
  onNext: () => void;
  onPrevious: () => void;
  className?: string;
};

const daysOfWeek = [
  { value: "monday", label: "Monday" },
  { value: "tuesday", label: "Tuesday" },
  { value: "wednesday", label: "Wednesday" },
  { value: "thursday", label: "Thursday" },
  { value: "friday", label: "Friday" },
  { value: "saturday", label: "Saturday" },
  { value: "sunday", label: "Sunday" },
];

const leaseTermUnits = [
  { value: "days", label: "Days" },
  { value: "weeks", label: "Weeks" },
  { value: "months", label: "Months" },
  { value: "years", label: "Years" },
];

const contactRoles = [
  { value: "owner", label: "Property Owner" },
  { value: "agent", label: "Real Estate Agent" },
  { value: "manager", label: "Property Manager" },
  { value: "leasing_office", label: "Leasing Office" },
];

const requiredDocumentsOptions = [
  "Government ID/Passport",
  "Proof of Income",
  "Bank Statements",
  "Employment Letter",
  "Previous Rental References",
  "Credit Report",
  "Guarantor Information",
  "Student ID (if applicable)",
  "Visa/Work Permit",
  "Insurance Coverage",
];

export function AvailabilityForm({
  defaultValues,
  onSubmit,
  onNext,
  onPrevious,
  className,
}: AvailabilityFormProps) {
  const [showSeasonalRates, setShowSeasonalRates] = useState(false);

  const form = useForm<AvailabilityFormData>({
    resolver: zodResolver(availabilitySchema),
    defaultValues: {
      isAvailable: true,
      availableFrom: new Date(),
      minimumLeaseTerm: 12,
      leaseTermUnit: "months",
      viewingDays: [],
      viewingByAppointment: true,
      instantBooking: false,
      showingContact: {
        name: "",
        phone: "",
        email: "",
        role: "owner",
      },
      applicationRequired: true,
      backgroundCheck: true,
      creditCheck: true,
      incomeVerification: true,
      referencesRequired: 2,
      incomeMultiplier: 3,
      acceptStudents: false,
      acceptInternational: false,
      requiredDocuments: [],
      firstMonthRent: true,
      lastMonthRent: false,
      securityDepositRequired: true,
      brokerageFeeRequired: false,
      immediateOccupancy: false,
      flexibleMoveIn: true,
      furnishedAvailable: false,
      utilitiesIncluded: false,
      seasonalRental: false,
      ...defaultValues,
    },
  });

  const watchedValues = form.watch();

  const handleSubmit = (data: AvailabilityFormData) => {
    console.log("data", data);
    console.log("watchedValues", watchedValues);
    console.log("form.formState.errors", form.formState.errors);
    console.log("form.formState.isSubmitting", form.formState.isSubmitting);
    console.log("form.formState.isDirty", form.formState.isDirty);
    console.log("form.formState.isValid", form.formState.isValid);
    console.log("form.formState.isValidating", form.formState.isValidating);
    console.log("form.formState.isSubmitted", form.formState.isSubmitted);
    console.log(
      "form.formState.isSubmitSuccessful",
      form.formState.isSubmitSuccessful
    );
    onSubmit(data);
    onNext();
  };

  const toggleRequiredDocument = (doc: string) => {
    const current = form.getValues("requiredDocuments");
    const updated = current.includes(doc)
      ? current.filter((d) => d !== doc)
      : [...current, doc];
    form.setValue("requiredDocuments", updated);
  };

  const toggleViewingDay = (day: string) => {
    const current = form.getValues("viewingDays");
    const updated = current.includes(day)
      ? current.filter((d) => d !== day)
      : [...current, day];
    form.setValue("viewingDays", updated);
  };

  return (
    <div className={cn("space-y-6", className)}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Availability & Leasing Terms
          </CardTitle>
          <p className="text-gray-600 text-sm">
            Set when your property is available and define the leasing
            requirements
          </p>
        </CardHeader>

        <CardContent>
          <Form {...form}>
            <form
              className="space-y-8"
              onSubmit={form.handleSubmit(handleSubmit)}
            >
              {/* Availability Status */}
              <div className="space-y-4">
                <h3 className="font-medium text-lg">Availability Status</h3>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <FormField
                    control={form.control}
                    name="isAvailable"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Property is available for rent</FormLabel>
                          <FormDescription>
                            Uncheck if property is not ready yet
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="availableFrom"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Available From *</FormLabel>
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
                              disabled={(date) =>
                                date < new Date(new Date().setHours(0, 0, 0, 0))
                              }
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
                    name="availableUntil"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Available Until</FormLabel>
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
                                  <span>Open-ended</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent align="start" className="w-auto p-0">
                            <Calendar
                              disabled={(date) =>
                                date < watchedValues.availableFrom
                              }
                              initialFocus
                              mode="single"
                              onSelect={field.onChange}
                              selected={field.value}
                            />
                          </PopoverContent>
                        </Popover>
                        <FormDescription>
                          Leave blank for open-ended availability
                        </FormDescription>
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Lease Terms */}
              <div className="space-y-4">
                <h3 className="font-medium text-lg">Lease Terms</h3>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <FormField
                    control={form.control}
                    name="minimumLeaseTerm"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Minimum Lease Term *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="12"
                            type="number"
                            {...field}
                            onChange={(e) =>
                              field.onChange(
                                Number.parseInt(e.target.value, 10) || 1
                              )
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="maximumLeaseTerm"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Maximum Lease Term</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="24"
                            type="number"
                            {...field}
                            onChange={(e) =>
                              field.onChange(
                                Number.parseInt(e.target.value, 10) || undefined
                              )
                            }
                          />
                        </FormControl>
                        <FormDescription>
                          Leave blank for no maximum
                        </FormDescription>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="leaseTermUnit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Term Unit</FormLabel>
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
                            {leaseTermUnits.map((unit) => (
                              <SelectItem key={unit.value} value={unit.value}>
                                {unit.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Viewing & Contact */}
              <div className="space-y-4">
                <h3 className="flex items-center gap-2 font-medium text-lg">
                  <Users className="h-4 w-4" />
                  Viewing & Contact Information
                </h3>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  {/* Viewing Schedule */}
                  <div className="space-y-4">
                    <h4 className="font-medium">Viewing Schedule</h4>

                    <div className="space-y-3">
                      <FormField
                        control={form.control}
                        name="viewingByAppointment"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <FormLabel>Viewing by appointment only</FormLabel>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="instantBooking"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>Allow instant booking</FormLabel>
                              <FormDescription>
                                Qualified tenants can book immediately
                              </FormDescription>
                            </div>
                          </FormItem>
                        )}
                      />
                    </div>

                    <div>
                      <FormLabel>Available Viewing Days</FormLabel>
                      <div className="mt-2 grid grid-cols-2 gap-2">
                        {daysOfWeek.map((day) => (
                          <div
                            className={cn(
                              "flex cursor-pointer items-center gap-2 rounded border p-2",
                              watchedValues.viewingDays.includes(day.value)
                                ? "border-primary bg-primary/5"
                                : "border-gray-200 hover:border-gray-300"
                            )}
                            key={day.value}
                            onClick={() => toggleViewingDay(day.value)}
                          >
                            <Checkbox
                              checked={watchedValues.viewingDays.includes(
                                day.value
                              )}
                              onChange={() => toggleViewingDay(day.value)}
                            />
                            <span className="text-sm">{day.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <FormField
                        control={form.control}
                        name="viewingTimes.start"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Start Time</FormLabel>
                            <FormControl>
                              <Input type="time" {...field} />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="viewingTimes.end"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>End Time</FormLabel>
                            <FormControl>
                              <Input type="time" {...field} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* Contact Information */}
                  <div className="space-y-4">
                    <h4 className="font-medium">Contact Information</h4>

                    <FormField
                      control={form.control}
                      name="showingContact.name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Contact Name *</FormLabel>
                          <FormControl>
                            <Input placeholder="John Doe" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="showingContact.role"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Role</FormLabel>
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
                              {contactRoles.map((role) => (
                                <SelectItem key={role.value} value={role.value}>
                                  {role.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="showingContact.phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Number *</FormLabel>
                          <FormControl>
                            <Input placeholder="+254 700 000 000" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="showingContact.email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email Address *</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="contact@example.com"
                              type="email"
                              {...field}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </div>

              {/* Application Requirements */}
              <div className="space-y-4">
                <h3 className="flex items-center gap-2 font-medium text-lg">
                  <FileText className="h-4 w-4" />
                  Application Requirements
                </h3>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="applicationRequired"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <FormLabel>Formal application required</FormLabel>
                        </FormItem>
                      )}
                    />

                    {watchedValues.applicationRequired && (
                      <FormField
                        control={form.control}
                        name="applicationFee"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Application Fee (KES)</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="2000"
                                type="number"
                                {...field}
                                onChange={(e) =>
                                  field.onChange(
                                    Number.parseFloat(e.target.value) ||
                                      undefined
                                  )
                                }
                              />
                            </FormControl>
                            <FormDescription>
                              One-time fee for processing applications
                            </FormDescription>
                          </FormItem>
                        )}
                      />
                    )}

                    <div className="space-y-3">
                      <FormField
                        control={form.control}
                        name="backgroundCheck"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <FormLabel>Background check required</FormLabel>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="creditCheck"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <FormLabel>Credit check required</FormLabel>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="incomeVerification"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <FormLabel>Income verification required</FormLabel>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="referencesRequired"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>References Required</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="2"
                              type="number"
                              {...field}
                              onChange={(e) =>
                                field.onChange(
                                  Number.parseInt(e.target.value, 10) || 0
                                )
                              }
                            />
                          </FormControl>
                          <FormDescription>
                            Number of personal/professional references
                          </FormDescription>
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="incomeMultiplier"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Income Multiplier</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="3"
                                step="0.5"
                                type="number"
                                {...field}
                                onChange={(e) =>
                                  field.onChange(
                                    Number.parseFloat(e.target.value) || 3
                                  )
                                }
                              />
                            </FormControl>
                            <FormDescription>
                              Times monthly rent
                            </FormDescription>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="minimumIncome"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Minimum Income (KES)</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="150000"
                                type="number"
                                {...field}
                                onChange={(e) =>
                                  field.onChange(
                                    Number.parseFloat(e.target.value) ||
                                      undefined
                                  )
                                }
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="space-y-3">
                      <FormField
                        control={form.control}
                        name="acceptStudents"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <FormLabel>Accept student tenants</FormLabel>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="acceptInternational"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <FormLabel>Accept international tenants</FormLabel>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </div>

                {/* Required Documents */}
                <div className="space-y-3">
                  <FormLabel>Required Documents</FormLabel>
                  <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                    {requiredDocumentsOptions.map((doc) => (
                      <div
                        className={cn(
                          "flex cursor-pointer items-center gap-2 rounded border p-2",
                          watchedValues.requiredDocuments.includes(doc)
                            ? "border-primary bg-primary/5"
                            : "border-gray-200 hover:border-gray-300"
                        )}
                        key={doc}
                        onClick={() => toggleRequiredDocument(doc)}
                      >
                        <Checkbox
                          checked={watchedValues.requiredDocuments.includes(
                            doc
                          )}
                          onChange={() => toggleRequiredDocument(doc)}
                        />
                        <span className="text-sm">{doc}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Move-in Requirements */}
              <div className="space-y-4">
                <h3 className="flex items-center gap-2 font-medium text-lg">
                  <Key className="h-4 w-4" />
                  Move-in Requirements
                </h3>

                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                  <FormField
                    control={form.control}
                    name="firstMonthRent"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormLabel className="text-sm">
                          First month's rent
                        </FormLabel>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="lastMonthRent"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormLabel className="text-sm">
                          Last month's rent
                        </FormLabel>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="securityDepositRequired"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormLabel className="text-sm">
                          Security deposit
                        </FormLabel>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="brokerageFeeRequired"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormLabel className="text-sm">Brokerage fee</FormLabel>
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Special Notes */}
              <div className="space-y-4">
                <h3 className="font-medium text-lg">Additional Information</h3>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="showingInstructions"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Showing Instructions</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Special instructions for property viewings..."
                            rows={3}
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Parking, entry instructions, etc.
                        </FormDescription>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="applicationInstructions"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Application Instructions</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="How to apply, required documents, process..."
                            rows={3}
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Guide tenants through your application process
                        </FormDescription>
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="availabilityNotes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Additional Availability Notes</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Any additional information about availability, special conditions, etc..."
                          rows={3}
                          {...field}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              {/* Form Actions */}
              <div className="flex justify-between">
                <Button
                  className="flex items-center gap-2"
                  onClick={onPrevious}
                  type="button"
                  variant="outline"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to Media
                </Button>

                <Button className="min-w-32" type="submit">
                  Continue to Review
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
