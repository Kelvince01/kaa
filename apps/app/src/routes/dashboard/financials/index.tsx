"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@kaa/ui/components/dialog";
import { ScrollArea } from "@kaa/ui/components/scroll-area";
import { Skeleton } from "@kaa/ui/components/skeleton";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@kaa/ui/components/tabs";
import {
  Building,
  Calculator,
  DollarSign,
  FileText,
  Receipt,
  Settings,
} from "lucide-react";
import { useState } from "react";
import { useAuthStore } from "@/modules/auth/auth.store";
import {
  AssetForm,
  AssetsList,
  ExpenseForm,
  ExpensesList,
  FinancialOverview,
  FinancialSettings,
  ReportGenerator,
  TaxReports,
} from "@/modules/financials/components";
import type { Asset, Expense } from "@/modules/financials/financials.type";

// import { useUpdateExpense } from "@/modules/financials/financials.queries";
// import { useAssets } from "@/modules/financials/financials.queries";

const FinancialsContainer = () => {
  const { user, isAuthenticated, isLoading: authLoading } = useAuthStore();
  const [activeTab, setActiveTab] = useState("overview");
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [showAssetForm, setShowAssetForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | undefined>();
  const [editingAsset, setEditingAsset] = useState<Asset | undefined>();
  // const { data: assetsData, isLoading: assetsLoading } = useAssets();

  // const assets = assetsData?.assets || [];

  // const { mutate: updateExpense } = useUpdateExpense();

  // Check if user is landlord or admin
  if (
    !authLoading &&
    isAuthenticated &&
    user?.role !== "landlord" &&
    user?.role !== "admin"
  ) {
    return (
      <div className="container mx-auto space-y-6 p-6">
        <div className="text-center">
          <h1 className="font-bold text-2xl">Access Denied</h1>
          <p className="text-muted-foreground">
            Only landlords and admins can access financial data.
          </p>
        </div>
      </div>
    );
  }

  // Show loading state
  if (authLoading || !(isAuthenticated || authLoading)) {
    return (
      <div className="container mx-auto space-y-6 p-6">
        <div className="animate-pulse space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  // Handle expense form actions
  const handleCreateExpense = () => {
    setEditingExpense(undefined);
    setShowExpenseForm(true);
  };

  const handleEditExpense = (expense: Expense) => {
    setEditingExpense(expense);
    setShowExpenseForm(true);
  };

  const handleExpenseFormSuccess = () => {
    setShowExpenseForm(false);
    setEditingExpense(undefined);
  };

  const handleExpenseFormCancel = () => {
    setShowExpenseForm(false);
    setEditingExpense(undefined);
  };

  // Handle asset form actions
  const handleCreateAsset = () => {
    setEditingAsset(undefined);
    setShowAssetForm(true);
  };

  const handleEditAsset = (asset: Asset) => {
    setEditingAsset(asset);
    setShowAssetForm(true);
  };

  const handleAssetFormSuccess = () => {
    setShowAssetForm(false);
    setEditingAsset(undefined);
  };

  const handleAssetFormCancel = () => {
    setShowAssetForm(false);
    setEditingAsset(undefined);
  };

  const handleApproveExpense = (expenseId: string) => {
    console.log("Approve expense:", expenseId);
    // updateExpense({ id: expenseId, data: { status: "approved" } });
  };

  const handleRejectExpense = (expenseId: string) => {
    console.log("Reject expense:", expenseId);
    // updateExpense({ id: expenseId, data: { status: "rejected" } });
  };

  // Tab navigation items
  const tabs = [
    {
      id: "overview",
      name: "Overview",
      icon: DollarSign,
      component: () => <FinancialOverview period="monthly" />,
    },
    {
      id: "expenses",
      name: "Expenses",
      icon: Receipt,
      component: () => (
        <ExpensesList
          onApproveExpense={handleApproveExpense}
          onCreateExpense={handleCreateExpense}
          onEditExpense={handleEditExpense}
          onRejectExpense={handleRejectExpense}
          onViewExpense={(expense) => {
            // Handle view expense
            console.log("View expense:", expense);
          }}
        />
      ),
    },
    {
      id: "assets",
      name: "Assets",
      icon: Building,
      component: () => (
        // <div className="space-y-6">
        // 	<AssetsOverview assets={assets} />

        <AssetsList
          onCreateAsset={handleCreateAsset}
          onEditAsset={handleEditAsset}
          onViewAsset={(asset) => {
            // Handle view asset
            console.log("View asset:", asset);
          }}
        />
        // </div>
      ),
    },
    {
      id: "reports",
      name: "Reports",
      icon: FileText,
      component: () => <ReportGenerator />,
    },
    {
      id: "tax-reports",
      name: "Tax Reports",
      icon: Calculator,
      component: () => <TaxReports />,
    },
    {
      id: "settings",
      name: "Settings",
      icon: Settings,
      component: () => <FinancialSettings />,
    },
  ];

  return (
    <div className="container mx-auto space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col space-y-2">
        <h1 className="font-bold text-3xl tracking-tight">Finances</h1>
        <p className="text-muted-foreground">
          Manage your property finances, track expenses, assets, and generate
          reports.
        </p>
      </div>
      {/* Tabs */}
      <Tabs
        className="space-y-4"
        onValueChange={setActiveTab}
        value={activeTab}
      >
        <TabsList className="grid w-full grid-cols-6">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <TabsTrigger
                className="flex items-center space-x-2"
                key={tab.id}
                value={tab.id}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{tab.name}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>

        {tabs.map((tab) => {
          const Component = tab.component;
          return (
            <TabsContent className="space-y-4" key={tab.id} value={tab.id}>
              <Component />
            </TabsContent>
          );
        })}
      </Tabs>
      {/* Expense Form Dialog */}
      <Dialog onOpenChange={setShowExpenseForm} open={showExpenseForm}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>
              {editingExpense ? "Edit Expense" : "Add New Expense"}
            </DialogTitle>
          </DialogHeader>

          <ScrollArea className="h-[calc(100vh-200px)]">
            <ExpenseForm
              expense={editingExpense}
              onCancel={handleExpenseFormCancel}
              onSuccess={handleExpenseFormSuccess}
            />
          </ScrollArea>
        </DialogContent>
      </Dialog>
      <Dialog onOpenChange={setShowAssetForm} open={showAssetForm}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>
              {editingAsset ? "Edit Asset" : "Add New Asset"}
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-[calc(100vh-200px)]">
            <AssetForm
              asset={editingAsset}
              onCancel={handleAssetFormCancel}
              onSuccess={handleAssetFormSuccess}
            />
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FinancialsContainer;
