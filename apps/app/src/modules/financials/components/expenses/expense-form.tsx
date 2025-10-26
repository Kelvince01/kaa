import { zodResolver } from "@hookform/resolvers/zod";
import { Badge } from "@kaa/ui/components/badge";
import { Button } from "@kaa/ui/components/button";
import { Calendar } from "@kaa/ui/components/calendar";
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
import { Label } from "@kaa/ui/components/label";
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
import { cn } from "@kaa/ui/lib/utils";
import { format } from "date-fns";
import { CalendarIcon, Save, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  useCreateExpense,
  useExpenseCategories,
  useUpdateExpense,
} from "../../financials.queries";
import type { CreateExpenseRequest, Expense } from "../../financials.type";

const expenseSchema = z.object({
  amount: z.number().positive("Amount must be positive"),
  currency: z.string(),
  category: z.string().min(1, "Category is required"),
  subcategory: z.string().optional(),
  description: z.string().min(1, "Description is required"),
  date: z.date(),
  property: z.string().optional(),
  taxDeductible: z.boolean(),
  recurring: z
    .object({
      isRecurring: z.boolean(),
      frequency: z.enum(["monthly", "quarterly", "yearly"]).optional(),
      nextDue: z.date().optional(),
      endDate: z.date().optional(),
    })
    .optional(),
  vendor: z
    .object({
      name: z.string(),
      contact: z.string(),
      vatNumber: z.string().optional(),
    })
    .optional(),
});

type ExpenseFormData = z.infer<typeof expenseSchema>;

type ExpenseFormProps = {
  expense?: Expense;
  onSuccess?: () => void;
  onCancel?: () => void;
};

export function ExpenseForm({
  expense,
  onSuccess,
  onCancel,
}: ExpenseFormProps) {
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [showVendorForm, setShowVendorForm] = useState(false);
  const [showRecurringForm, setShowRecurringForm] = useState(false);

  const { data: categories = [] } = useExpenseCategories();
  const { mutate: createExpense, isPending: isCreating } = useCreateExpense();
  const { mutate: updateExpense, isPending: isUpdating } = useUpdateExpense();

  const isEditing = !!expense;
  const isPending = isCreating || isUpdating;

  const form = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      amount: expense?.amount || 0,
      currency: expense?.currency || "KES",
      category: expense?.category || "",
      subcategory: expense?.subcategory || "",
      description: expense?.description || "",
      date: expense ? new Date(expense.date) : new Date(),
      property: expense?.property || "",
      taxDeductible: expense?.taxDeductible ?? true,
      recurring: {
        isRecurring: expense?.recurring?.isRecurring,
        frequency: expense?.recurring?.frequency,
        nextDue: expense?.recurring?.nextDue
          ? new Date(expense.recurring.nextDue)
          : undefined,
        endDate: expense?.recurring?.endDate
          ? new Date(expense.recurring.endDate)
          : undefined,
      },
      vendor: expense?.vendor
        ? {
            name: expense.vendor.name,
            contact: expense.vendor.contact,
            vatNumber: expense.vendor.vatNumber,
          }
        : undefined,
    },
  });

  useEffect(() => {
    if (expense?.vendor) {
      setShowVendorForm(true);
    }
    if (expense?.recurring?.isRecurring) {
      setShowRecurringForm(true);
    }
  }, [expense]);

  const onSubmit = (data: ExpenseFormData) => {
    const expenseData: CreateExpenseRequest = {
      amount: data.amount,
      currency: data.currency,
      category: data.category,
      subcategory: data.subcategory,
      description: data.description,
      date: data.date.toISOString(),
      property: data.property || undefined,
      taxDeductible: data.taxDeductible,
      recurring: data.recurring?.isRecurring
        ? {
            isRecurring: data.recurring.isRecurring,
            frequency: data.recurring.frequency,
            nextDue: data.recurring.nextDue?.toISOString(),
            endDate: data.recurring.endDate?.toISOString(),
          }
        : undefined,
      vendor: showVendorForm && data.vendor ? data.vendor : undefined,
    };

    if (isEditing) {
      updateExpense({ id: expense._id, data: expenseData }, { onSuccess });
    } else {
      createExpense(expenseData, { onSuccess });
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file?.type.startsWith("image/") || file?.type === "application/pdf") {
      setReceiptFile(file);
    }
  };

  return (
    // <Card className="mx-auto w-full max-w-3xl">
    // 	<CardHeader>
    // 		<CardTitle className="flex items-center">
    // 			<Receipt className="mr-2 h-5 w-5" />
    // 			{isEditing ? "Edit Expense" : "Add New Expense"}
    // 		</CardTitle>
    // 	</CardHeader>
    // 	<CardContent>
    <Form {...form}>
      <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
        {/* Basic Information */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Input placeholder="Enter expense description" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Amount</FormLabel>
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
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
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
            name="subcategory"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Subcategory (Optional)</FormLabel>
                <FormControl>
                  <Input placeholder="Enter subcategory" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Date</FormLabel>
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
            name="currency"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Currency</FormLabel>
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
                    <SelectItem value="KES">KES</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="GBP">GBP</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Tax Deductible */}
        <FormField
          control={form.control}
          name="taxDeductible"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>Tax Deductible</FormLabel>
                <FormDescription>
                  Mark this expense as tax deductible for reporting purposes.
                </FormDescription>
              </div>
            </FormItem>
          )}
        />

        {/* Receipt Upload */}
        <div className="space-y-2">
          <Label>Receipt (Optional)</Label>
          <div className="flex items-center space-x-2">
            <Input
              accept="image/*,application/pdf"
              className="file:mr-4 file:rounded-md file:border-0 file:px-4 file:py-2 file:font-medium file:text-sm"
              onChange={handleFileChange}
              type="file"
            />
            {receiptFile && (
              <Badge className="flex items-center space-x-1" variant="outline">
                <span>{receiptFile.name}</span>
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => setReceiptFile(null)}
                />
              </Badge>
            )}
          </div>
        </div>

        {/* Vendor Information */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              checked={showVendorForm}
              onCheckedChange={(checked) => setShowVendorForm(!!checked)}
            />
            <Label>Add Vendor Information</Label>
          </div>

          {showVendorForm && (
            <div className="grid grid-cols-1 gap-4 pl-6 md:grid-cols-2">
              <FormField
                control={form.control}
                name="vendor.name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vendor Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter vendor name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="vendor.contact"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact</FormLabel>
                    <FormControl>
                      <Input placeholder="Email or phone" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="vendor.vatNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>VAT Number (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter VAT number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          )}
        </div>

        {/* Recurring Expense */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              checked={showRecurringForm}
              onCheckedChange={(checked) => {
                setShowRecurringForm(!!checked);
                form.setValue("recurring.isRecurring", !!checked);
              }}
            />
            <Label>Recurring Expense</Label>
          </div>

          {showRecurringForm && (
            <div className="grid grid-cols-1 gap-4 pl-6 md:grid-cols-2">
              <FormField
                control={form.control}
                name="recurring.frequency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Frequency</FormLabel>
                    <Select
                      defaultValue={field.value}
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select frequency" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="quarterly">Quarterly</SelectItem>
                        <SelectItem value="yearly">Yearly</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="recurring.endDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>End Date (Optional)</FormLabel>
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
                              <span>Pick end date</span>
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
            </div>
          )}
        </div>

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
            {isEditing ? "Update" : "Create"} Expense
          </Button>
        </div>
      </form>
    </Form>
    // 	</CardContent>
    // </Card>
  );
}
