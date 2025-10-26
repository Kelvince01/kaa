import { Badge } from "@kaa/ui/components/badge";
import { Button } from "@kaa/ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@kaa/ui/components/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@kaa/ui/components/tabs";
import {
  BarChart3,
  CreditCard,
  DollarSign,
  FileImage,
  PieChart,
  Receipt,
  TrendingUp,
  Upload,
} from "lucide-react";
import { useState } from "react";
import { formatCurrency } from "@/shared/utils/format.util";
import type { Expense } from "../financials.type";
import { ExpenseForm } from "./expenses/expense-form";
import { ExpensesList } from "./expenses/expenses-list";
import { ReceiptManager } from "./receipts";

// Mock data for dashboard
const mockStats = {
  totalExpenses: 15_420.5,
  monthlyChange: 8.3,
  pendingApprovals: 12,
  totalReceipts: 42,
  ocrProcessedReceipts: 38,
  categories: [
    { name: "Maintenance", amount: 5240.3, percentage: 34 },
    { name: "Utilities", amount: 3180.75, percentage: 21 },
    { name: "Insurance", amount: 2890.0, percentage: 19 },
    { name: "Office Supplies", amount: 2456.2, percentage: 16 },
    { name: "Travel", amount: 1653.25, percentage: 10 },
  ],
};

export function FinancialDashboardExample() {
  const [activeTab, setActiveTab] = useState("overview");
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [showReceiptUpload, setShowReceiptUpload] = useState(false);
  const [showReceiptGallery, setShowReceiptGallery] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [viewingExpense, setViewingExpense] = useState<Expense | null>(null);

  const handleCreateExpense = () => {
    setShowExpenseForm(true);
    setEditingExpense(null);
  };

  const handleEditExpense = (expense: Expense) => {
    setEditingExpense(expense);
    setShowExpenseForm(true);
  };

  const handleViewExpense = (expense: Expense) => {
    setViewingExpense(expense);
  };

  const handleUploadReceipt = () => {
    setShowReceiptUpload(true);
  };

  const handleViewReceiptGallery = () => {
    setShowReceiptGallery(true);
  };

  const handleCloseExpenseForm = () => {
    setShowExpenseForm(false);
    setEditingExpense(null);
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-bold text-3xl tracking-tight">
            Financial Dashboard
          </h1>
          <p className="text-muted-foreground">
            Manage expenses, receipts, and financial tracking with OCR
            integration
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button onClick={handleViewReceiptGallery} variant="outline">
            <FileImage className="mr-2 h-4 w-4" />
            View Receipts
          </Button>
          <Button onClick={handleUploadReceipt} variant="outline">
            <Upload className="mr-2 h-4 w-4" />
            Upload Receipt
          </Button>
          <Button onClick={handleCreateExpense}>
            <DollarSign className="mr-2 h-4 w-4" />
            Add Expense
          </Button>
        </div>
      </div>

      <Tabs
        className="space-y-6"
        onValueChange={setActiveTab}
        value={activeTab}
      >
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
          <TabsTrigger value="receipts">Receipts</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent className="space-y-6" value="overview">
          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="font-medium text-sm">
                  Total Expenses
                </CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="font-bold text-2xl">
                  {formatCurrency(mockStats.totalExpenses)}
                </div>
                <div className="flex items-center text-muted-foreground text-xs">
                  <TrendingUp className="mr-1 h-3 w-3 text-green-600" />+
                  {mockStats.monthlyChange}% from last month
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="font-medium text-sm">
                  Pending Approvals
                </CardTitle>
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="font-bold text-2xl">
                  {mockStats.pendingApprovals}
                </div>
                <p className="text-muted-foreground text-xs">Requires review</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="font-medium text-sm">
                  Total Receipts
                </CardTitle>
                <Receipt className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="font-bold text-2xl">
                  {mockStats.totalReceipts}
                </div>
                <p className="text-muted-foreground text-xs">
                  {mockStats.ocrProcessedReceipts} OCR processed
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="font-medium text-sm">
                  OCR Success Rate
                </CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="font-bold text-2xl">
                  {Math.round(
                    (mockStats.ocrProcessedReceipts / mockStats.totalReceipts) *
                      100
                  )}
                  %
                </div>
                <p className="text-muted-foreground text-xs">
                  Auto-extraction rate
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Button
                  className="flex h-20 flex-col space-y-2"
                  onClick={handleUploadReceipt}
                  variant="outline"
                >
                  <Upload className="h-6 w-6" />
                  <span>Upload Receipt</span>
                </Button>
                <Button
                  className="flex h-20 flex-col space-y-2"
                  onClick={handleCreateExpense}
                  variant="outline"
                >
                  <DollarSign className="h-6 w-6" />
                  <span>Add Expense</span>
                </Button>
                <Button
                  className="flex h-20 flex-col space-y-2"
                  onClick={handleViewReceiptGallery}
                  variant="outline"
                >
                  <FileImage className="h-6 w-6" />
                  <span>View Receipts</span>
                </Button>
                <Button
                  className="flex h-20 flex-col space-y-2"
                  onClick={() => setActiveTab("analytics")}
                  variant="outline"
                >
                  <PieChart className="h-6 w-6" />
                  <span>View Analytics</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Categories Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Expense Categories</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockStats.categories.map((category) => (
                  <div
                    className="flex items-center justify-between"
                    key={category.name}
                  >
                    <div className="flex items-center space-x-3">
                      <div
                        className="h-4 w-4 rounded bg-primary"
                        style={{
                          backgroundColor: `hsl(${category.percentage * 3.6}, 70%, 50%)`,
                        }}
                      />
                      <span className="font-medium">{category.name}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-muted-foreground text-sm">
                        {category.percentage}%
                      </span>
                      <span className="font-medium">
                        {formatCurrency(category.amount)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="expenses">
          <ExpensesList
            onCreateExpense={handleCreateExpense}
            onEditExpense={handleEditExpense}
            onUploadReceipt={handleUploadReceipt}
            onViewExpense={handleViewExpense}
            onViewReceiptGallery={handleViewReceiptGallery}
          />
        </TabsContent>

        <TabsContent value="receipts">
          <Card>
            <CardHeader>
              <CardTitle>Receipt Management</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="py-12 text-center">
                <FileImage className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
                <h3 className="mb-2 font-semibold text-lg">
                  Manage Your Receipts
                </h3>
                <p className="mb-6 text-muted-foreground">
                  Upload receipts with OCR processing or browse your existing
                  receipt gallery
                </p>
                <div className="flex items-center justify-center space-x-4">
                  <Button onClick={handleUploadReceipt}>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Receipt
                  </Button>
                  <Button onClick={handleViewReceiptGallery} variant="outline">
                    <FileImage className="mr-2 h-4 w-4" />
                    View Gallery
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Expense Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="py-12 text-center">
                  <BarChart3 className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    Analytics charts would be implemented here
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Receipt Processing Stats</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Total Receipts Processed</span>
                    <Badge>{mockStats.totalReceipts}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>OCR Success Rate</span>
                    <Badge variant="default">
                      {Math.round(
                        (mockStats.ocrProcessedReceipts /
                          mockStats.totalReceipts) *
                          100
                      )}
                      %
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Auto-created Expenses</span>
                    <Badge variant="secondary">32</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Manual Review Required</span>
                    <Badge variant="outline">
                      {mockStats.totalReceipts - mockStats.ocrProcessedReceipts}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Modals */}
      {showExpenseForm && (
        <ExpenseForm
          expense={editingExpense ?? undefined}
          //   isOpen={showExpenseForm}
          onCancel={handleCloseExpenseForm}
          onSuccess={handleCloseExpenseForm}
        />
      )}

      <ReceiptManager
        isGalleryOpen={showReceiptGallery}
        isUploadOpen={showReceiptUpload}
        onGalleryClose={() => setShowReceiptGallery(false)}
        onUploadClose={() => setShowReceiptUpload(false)}
        onUploadNew={() => setShowReceiptUpload(true)}
      />
    </div>
  );
}
