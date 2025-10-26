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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@kaa/ui/components/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@kaa/ui/components/tabs";
import { cn } from "@kaa/ui/lib/utils";
import { format } from "date-fns";
import {
  BarChart3,
  Calculator,
  DollarSign,
  Download,
  FileText,
  LineChartIcon,
  PieChart as PieChartIcon,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatCurrency, formatDate } from "@/shared/utils/format.util";
import { useDownloadReport } from "../../financials.queries";
import type { FinancialReport, TaxReport } from "../../financials.type";

type ReportDetailsModalProps = {
  report: FinancialReport | TaxReport | null;
  isOpen: boolean;
  onClose: () => void;
};

const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#8884D8",
  "#82CA9D",
];

export function ReportDetailsModal({
  report,
  isOpen,
  onClose,
}: ReportDetailsModalProps) {
  const [activeTab, setActiveTab] = useState("overview");
  const { mutate: downloadReport, isPending: isDownloading } =
    useDownloadReport();

  if (!report) return null;

  const isTaxReport = "taxYear" in report;

  const handleDownload = () => {
    downloadReport(report._id);
  };

  // Mock data for charts (would come from report in real implementation)
  const expenseBreakdown = [
    { name: "Maintenance", value: 2400, percentage: 35 },
    { name: "Utilities", value: 1200, percentage: 18 },
    { name: "Insurance", value: 800, percentage: 12 },
    { name: "Property Tax", value: 1000, percentage: 15 },
    { name: "Marketing", value: 600, percentage: 9 },
    { name: "Other", value: 700, percentage: 11 },
  ];

  const monthlyTrend = [
    { month: "Jan", income: 4000, expenses: 2400 },
    { month: "Feb", income: 3000, expenses: 1398 },
    { month: "Mar", income: 2000, expenses: 9800 },
    { month: "Apr", income: 2780, expenses: 3908 },
    { month: "May", income: 1890, expenses: 4800 },
    { month: "Jun", income: 2390, expenses: 3800 },
  ];

  const quarterlyData = [
    { quarter: "Q1", amount: 12_000 },
    { quarter: "Q2", amount: 15_000 },
    { quarter: "Q3", amount: 18_000 },
    { quarter: "Q4", amount: 16_000 },
  ];

  return (
    <Dialog onOpenChange={onClose} open={isOpen}>
      <DialogContent className="max-h-[90vh] max-w-6xl overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="flex items-center">
                <FileText className="mr-2 h-5 w-5" />
                {isTaxReport
                  ? `Tax Report - ${(report as TaxReport).taxYear}`
                  : `${report.reportType.replace("_", " ").toUpperCase()} Report`}
              </DialogTitle>
              <DialogDescription>
                Generated on {formatDate(report.createdAt)} • Period:{" "}
                {format(
                  new Date((report as FinancialReport).period.startDate),
                  "MMM d"
                )}{" "}
                -{" "}
                {format(
                  new Date((report as FinancialReport).period.endDate),
                  "MMM d, yyyy"
                )}
              </DialogDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Badge
                variant={report.status === "final" ? "default" : "secondary"}
              >
                {report.status}
              </Badge>
              <Button
                disabled={isDownloading}
                onClick={handleDownload}
                size="sm"
                variant="outline"
              >
                {isDownloading ? (
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                ) : (
                  <Download className="mr-2 h-4 w-4" />
                )}
                Download PDF
              </Button>
            </div>
          </div>
        </DialogHeader>

        <Tabs className="w-full" onValueChange={setActiveTab} value={activeTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="breakdown">Breakdown</TabsTrigger>
            <TabsTrigger value="trends">Trends</TabsTrigger>
            <TabsTrigger value="details">Details</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent className="space-y-6" value="overview">
            {isTaxReport ? (
              <TaxReportOverview report={report as TaxReport} />
            ) : (
              <FinancialReportOverview _report={report as FinancialReport} />
            )}
          </TabsContent>

          {/* Breakdown Tab */}
          <TabsContent className="space-y-6" value="breakdown">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <PieChartIcon className="mr-2 h-4 w-4" />
                    Expense Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer height={300} width="100%">
                    <PieChart>
                      <Pie
                        cx="50%"
                        cy="50%"
                        data={expenseBreakdown}
                        dataKey="value"
                        fill="#8884d8"
                        label={({ name, percentage }) =>
                          `${name} ${percentage}%`
                        }
                        labelLine={false}
                        outerRadius={80}
                      >
                        {expenseBreakdown.map((_, index) => (
                          <Cell
                            fill={COLORS[index % COLORS.length]}
                            key={`cell-${index.toString()}`}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value) => formatCurrency(Number(value))}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <BarChart3 className="mr-2 h-4 w-4" />
                    Category Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer height={300} width="100%">
                    <BarChart data={expenseBreakdown}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip
                        formatter={(value) => formatCurrency(Number(value))}
                      />
                      <Bar dataKey="value" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Trends Tab */}
          <TabsContent className="space-y-6" value="trends">
            <div className="grid grid-cols-1 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <LineChartIcon className="mr-2 h-4 w-4" />
                    Monthly Income vs Expenses
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer height={400} width="100%">
                    <LineChart data={monthlyTrend}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip
                        formatter={(value) => formatCurrency(Number(value))}
                      />
                      <Line
                        dataKey="income"
                        name="Income"
                        stroke="#00C49F"
                        strokeWidth={2}
                        type="monotone"
                      />
                      <Line
                        dataKey="expenses"
                        name="Expenses"
                        stroke="#FF8042"
                        strokeWidth={2}
                        type="monotone"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <BarChart3 className="mr-2 h-4 w-4" />
                    Quarterly Performance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer height={300} width="100%">
                    <BarChart data={quarterlyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="quarter" />
                      <YAxis />
                      <Tooltip
                        formatter={(value) => formatCurrency(Number(value))}
                      />
                      <Bar dataKey="amount" fill="#0088FE" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Details Tab */}
          <TabsContent className="space-y-6" value="details">
            <ReportDetailsTable _report={report} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

function FinancialReportOverview({ _report }: { _report: FinancialReport }) {
  const totalIncome = 45_000; // Mock data
  const totalExpenses = 32_000; // Mock data
  const netIncome = totalIncome - totalExpenses;

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="font-medium text-sm">Total Income</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="font-bold text-2xl text-green-600">
            {formatCurrency(totalIncome)}
          </div>
          <p className="text-muted-foreground text-xs">
            +12% from previous period
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="font-medium text-sm">Total Expenses</CardTitle>
          <TrendingDown className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="font-bold text-2xl text-red-600">
            {formatCurrency(totalExpenses)}
          </div>
          <p className="text-muted-foreground text-xs">
            +8% from previous period
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="font-medium text-sm">Net Income</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div
            className={cn(
              "font-bold text-2xl",
              netIncome >= 0 ? "text-green-600" : "text-red-600"
            )}
          >
            {formatCurrency(netIncome)}
          </div>
          <p className="text-muted-foreground text-xs">
            {netIncome >= 0 ? "+" : "-"}25% from previous period
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function TaxReportOverview({ report }: { report: TaxReport }) {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="font-medium text-sm">Total Income</CardTitle>
          <TrendingUp className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="font-bold text-2xl">
            {formatCurrency(report.income.total)}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="font-medium text-sm">
            Total Deductions
          </CardTitle>
          <TrendingDown className="h-4 w-4 text-red-600" />
        </CardHeader>
        <CardContent>
          <div className="font-bold text-2xl">
            {formatCurrency(report.deductions.total)}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="font-medium text-sm">Taxable Income</CardTitle>
          <Calculator className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="font-bold text-2xl">
            {formatCurrency(report.taxableIncome)}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="font-medium text-sm">Estimated Tax</CardTitle>
          <Calculator className="h-4 w-4 text-orange-600" />
        </CardHeader>
        <CardContent>
          <div className="font-bold text-2xl">
            {formatCurrency(report.estimatedTax)}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ReportDetailsTable({
  _report,
}: {
  _report: FinancialReport | TaxReport;
}) {
  // Mock data for detailed line items
  const lineItems = [
    {
      category: "Property Management",
      description: "Monthly fees",
      amount: 1200,
      date: "2024-01-15",
    },
    {
      category: "Maintenance",
      description: "HVAC repair",
      amount: 850,
      date: "2024-01-20",
    },
    {
      category: "Utilities",
      description: "Electric bill",
      amount: 450,
      date: "2024-01-25",
    },
    {
      category: "Insurance",
      description: "Property insurance",
      amount: 300,
      date: "2024-01-30",
    },
    {
      category: "Marketing",
      description: "Online listings",
      amount: 200,
      date: "2024-02-05",
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Detailed Line Items</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {lineItems.map((item, index) => (
              <TableRow key={index.toString()}>
                <TableCell>
                  {format(new Date(item.date), "MMM d, yyyy")}
                </TableCell>
                <TableCell>{item.category}</TableCell>
                <TableCell>{item.description}</TableCell>
                <TableCell className="text-right">
                  {formatCurrency(item.amount)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
