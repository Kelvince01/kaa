import { zodResolver } from "@hookform/resolvers/zod";
import { Badge } from "@kaa/ui/components/badge";
import { Button } from "@kaa/ui/components/button";
import { Calendar } from "@kaa/ui/components/calendar";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@kaa/ui/components/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@kaa/ui/components/form";
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
import {
  BarChart3,
  Calculator,
  CalendarIcon,
  Download,
  Eye,
  FileText,
  PieChart,
  TrendingUp,
} from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useAuthStore } from "@/modules/auth/auth.store";
import { useUserProperties } from "@/modules/properties/property.queries";
import {
  useDownloadReport,
  useFinancialReports,
  useGenerateReport,
} from "../../financials.queries";
import type { GenerateReportRequest, ReportType } from "../../financials.type";
import { ReportDetailsModal } from "./report-details-modal";

const reportSchema = z.object({
  reportType: z.enum([
    "profit_loss",
    "tax_summary",
    "cash_flow",
    "balance_sheet",
  ]),
  period: z.object({
    startDate: z.date(),
    endDate: z.date(),
    type: z.enum(["monthly", "quarterly", "yearly", "custom"]),
  }),
  propertyId: z.string().optional(),
});

type ReportFormData = z.infer<typeof reportSchema>;

const reportTypes = [
  {
    value: "profit_loss",
    label: "Profit & Loss",
    description: "Income and expenses summary",
    icon: TrendingUp,
    color: "bg-green-500",
  },
  {
    value: "tax_summary",
    label: "Tax Summary",
    description: "Tax deductible expenses and income",
    icon: Calculator,
    color: "bg-blue-500",
  },
  {
    value: "cash_flow",
    label: "Cash Flow",
    description: "Money in and out over time",
    icon: BarChart3,
    color: "bg-purple-500",
  },
  {
    value: "balance_sheet",
    label: "Balance Sheet",
    description: "Assets, liabilities and equity",
    icon: PieChart,
    color: "bg-orange-500",
  },
] as const;

export function ReportGenerator() {
  const [selectedReportType, setSelectedReportType] =
    useState<ReportType | null>(null);
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { user } = useAuthStore();
  const { data: propertiesData } = useUserProperties(user?.id || "", {
    // status: "active",
    limit: 100,
  });

  const { mutate: generateReport, isPending } = useGenerateReport();
  const { mutate: downloadReport, isPending: isDownloading } =
    useDownloadReport();
  const { data: reportsData } = useFinancialReports();

  const form = useForm<ReportFormData>({
    resolver: zodResolver(reportSchema),
    defaultValues: {
      reportType: "profit_loss",
      period: {
        startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        endDate: new Date(),
        type: "monthly",
      },
    },
  });

  const onSubmit = (data: ReportFormData) => {
    const reportData: GenerateReportRequest = {
      reportType: data.reportType,
      period: {
        startDate: data.period.startDate.toISOString(),
        endDate: data.period.endDate.toISOString(),
        type: data.period.type,
      },
      propertyId: data.propertyId,
    };

    generateReport(reportData);
  };

  const setPredefinedPeriod = (type: "monthly" | "quarterly" | "yearly") => {
    const now = new Date();
    let startDate: Date;
    const endDate: Date = new Date();

    switch (type) {
      case "monthly":
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case "quarterly": {
        const quarter = Math.floor(now.getMonth() / 3);
        startDate = new Date(now.getFullYear(), quarter * 3, 1);
        break;
      }
      case "yearly":
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
    }

    form.setValue("period.startDate", startDate);
    form.setValue("period.endDate", endDate);
    form.setValue("period.type", type);
  };

  const handleViewReport = (report: any) => {
    setSelectedReport(report);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedReport(null);
  };

  const recentReports = reportsData?.reports?.slice(0, 3) || [];

  return (
    <div className="space-y-6">
      {/* Report Type Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="mr-2 h-5 w-5" />
            Generate Financial Report
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            {reportTypes.map((type) => {
              const Icon = type.icon;
              const isSelected = selectedReportType === type.value;

              return (
                <div
                  className={cn(
                    "cursor-pointer rounded-lg border p-4 transition-all hover:shadow-md",
                    isSelected ? "border-primary bg-primary/5" : "border-border"
                  )}
                  key={type.value}
                  onClick={() => {
                    setSelectedReportType(type.value as ReportType);
                    form.setValue("reportType", type.value as ReportType);
                  }}
                >
                  <div className="flex items-start space-x-3">
                    <div className={cn("rounded-md p-2", type.color)}>
                      <Icon className="h-4 w-4 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium">{type.label}</h3>
                      <p className="text-muted-foreground text-sm">
                        {type.description}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {selectedReportType && (
            <Form {...form}>
              <form
                className="space-y-6"
                onSubmit={form.handleSubmit(onSubmit)}
              >
                {/* Period Selection */}
                <div className="space-y-4">
                  <h4 className="font-medium">Report Period</h4>

                  {/* Quick Period Buttons */}
                  <div className="flex space-x-2">
                    <Button
                      onClick={() => setPredefinedPeriod("monthly")}
                      size="sm"
                      type="button"
                      variant="outline"
                    >
                      This Month
                    </Button>
                    <Button
                      onClick={() => setPredefinedPeriod("quarterly")}
                      size="sm"
                      type="button"
                      variant="outline"
                    >
                      This Quarter
                    </Button>
                    <Button
                      onClick={() => setPredefinedPeriod("yearly")}
                      size="sm"
                      type="button"
                      variant="outline"
                    >
                      This Year
                    </Button>
                  </div>

                  {/* Custom Date Range */}
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="period.startDate"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Start Date</FormLabel>
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
                                    <span>Pick start date</span>
                                  )}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent
                              align="start"
                              className="w-auto p-0"
                            >
                              <Calendar
                                disabled={(date) => date > new Date()}
                                initialFocus
                                mode="single"
                                onSelect={(date: any) => {
                                  field.onChange(date);
                                  form.setValue("period.type", "custom");
                                }}
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
                      name="period.endDate"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>End Date</FormLabel>
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
                            <PopoverContent
                              align="start"
                              className="w-auto p-0"
                            >
                              <Calendar
                                disabled={(date) => date > new Date()}
                                initialFocus
                                mode="single"
                                onSelect={(date: any) => {
                                  field.onChange(date);
                                  form.setValue("period.type", "custom");
                                }}
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

                {/* Property Filter */}
                <FormField
                  control={form.control}
                  name="propertyId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Property (Optional)</FormLabel>
                      <Select
                        defaultValue={field.value}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="All properties" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {propertiesData?.properties?.map((property) => (
                            <SelectItem key={property._id} value={property._id}>
                              {property.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Generate report for a specific property or all
                        properties
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Actions */}
                <div className="flex justify-end space-x-2 pt-4">
                  <Button
                    onClick={() => setSelectedReportType(null)}
                    type="button"
                    variant="outline"
                  >
                    Cancel
                  </Button>
                  <Button disabled={isPending} type="submit">
                    {isPending ? (
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    ) : (
                      <FileText className="mr-2 h-4 w-4" />
                    )}
                    Generate Report
                  </Button>
                </div>
              </form>
            </Form>
          )}
        </CardContent>
      </Card>

      {/* Recent Reports */}
      {recentReports.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Reports</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentReports.map((report) => {
                const reportType = reportTypes.find(
                  (t) => t.value === report.reportType
                );
                const Icon = reportType?.icon || FileText;

                return (
                  <div
                    className="flex items-center justify-between rounded-lg border p-4"
                    key={report._id}
                  >
                    <div className="flex items-center space-x-3">
                      <div
                        className={cn(
                          "rounded-md p-2",
                          reportType?.color || "bg-gray-500"
                        )}
                      >
                        <Icon className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <h4 className="font-medium">
                          {reportType?.label || report.reportType}
                        </h4>
                        <p className="text-muted-foreground text-sm">
                          {format(new Date(report.period.startDate), "MMM d")} -{" "}
                          {format(
                            new Date(report.period.endDate),
                            "MMM d, yyyy"
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge
                        variant={
                          report.status === "final"
                            ? "default"
                            : report.status === "draft"
                              ? "secondary"
                              : "outline"
                        }
                      >
                        {report.status}
                      </Badge>
                      <Button
                        onClick={() => handleViewReport(report)}
                        size="sm"
                        variant="ghost"
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        View
                      </Button>
                      <Button
                        disabled={isDownloading}
                        onClick={() => downloadReport(report._id)}
                        size="sm"
                        variant="ghost"
                      >
                        {isDownloading ? (
                          <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        ) : (
                          <Download className="mr-2 h-4 w-4" />
                        )}
                        Download
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Report Details Modal */}
      <ReportDetailsModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        report={selectedReport}
      />
    </div>
  );
}
