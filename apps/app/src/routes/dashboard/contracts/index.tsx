"use client";

import { Button } from "@kaa/ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@kaa/ui/components/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@kaa/ui/components/dropdown-menu";
import { Input } from "@kaa/ui/components/input";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@kaa/ui/components/tabs";
import {
  Activity,
  Download,
  File,
  FileText,
  Filter,
  MoreVertical,
  Plus,
  Search,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
// Import all components
import {
  AdvancedFilterPanel,
  AmendmentManager,
  ContractDetailsModal,
  ContractsTable,
  CreateContractForm,
  DeleteContractModal,
  DocumentManager,
  RenewalManager,
  SignatureModal,
  StatusManager,
  TemplateManager,
} from "@/modules/contracts/components";
import {
  useContracts,
  useDeleteContract,
} from "@/modules/contracts/contract.queries";
import {
  type Contract,
  ContractStatus,
  type ContractTemplate,
} from "@/modules/contracts/contract.type";
import type { Property } from "@/modules/properties";
import { useTenants } from "@/modules/tenants/tenant.queries";
import type { Tenant } from "@/modules/tenants/tenant.type";

export function ContractsContainer() {
  // Modal states
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showContractDetails, setShowContractDetails] = useState(false);
  const [showDeleteContractModal, setShowDeleteContractModal] = useState(false);
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [showAdvancedFilter, setShowAdvancedFilter] = useState(false);
  const [showDocumentManager, setShowDocumentManager] = useState(false);
  const [showAmendmentManager, setShowAmendmentManager] = useState(false);
  const [showRenewalManager, setShowRenewalManager] = useState(false);
  const [showStatusManager, setShowStatusManager] = useState(false);
  const [showTemplateManager, setShowTemplateManager] = useState(false);

  // Selected contract state
  const [selectedContract, setSelectedContract] = useState<Contract | null>(
    null
  );

  // Filter and search states
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  // Data fetching
  const { data: contractsData, isLoading, error } = useContracts();
  const { data: tenantsData } = useTenants();
  const deleteContractMutation = useDeleteContract();
  const contracts = contractsData?.contracts;
  const tenants = tenantsData?.items;

  const getTenantInfo = (tenantId: string) =>
    tenants?.find((t) => t._id === tenantId);

  // Filter contracts based on search and tab
  const filteredContracts = contracts?.filter((contract: Contract) => {
    const matchesSearch =
      (contract.tenants as Tenant[]).some((tenant: Tenant) =>
        // (tenant as Tenant).personalInfo.firstName.toLowerCase().includes(searchQuery.toLowerCase())
        getTenantInfo(tenant._id)
          ?.personalInfo.firstName.toLowerCase()
          .includes(searchQuery.toLowerCase())
      ) ||
      (contract.property as Property)?.location.address.line1
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      contract._id.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesTab =
      activeTab === "all" ||
      (activeTab === "active" && contract.status === ContractStatus.ACTIVE) ||
      (activeTab === "pending" && contract.status === ContractStatus.PENDING) ||
      (activeTab === "expired" && contract.status === ContractStatus.EXPIRED) ||
      (activeTab === "draft" && contract.status === ContractStatus.DRAFT);

    return matchesSearch && matchesTab;
  }) as Contract[];

  // Get contract counts for tabs
  const getContractCounts = () => ({
    all: contracts?.length,
    active: contracts?.filter(
      (c: Contract) => c.status === ContractStatus.ACTIVE
    ).length,
    pending: contracts?.filter(
      (c: Contract) => c.status === ContractStatus.PENDING
    ).length,
    expired: contracts?.filter(
      (c: Contract) => c.status === ContractStatus.EXPIRED
    ).length,
    draft: contracts?.filter((c: Contract) => c.status === ContractStatus.DRAFT)
      .length,
  });

  // Handle contract selection and modal opening
  const handleViewContract = (contract: Contract) => {
    setSelectedContract(contract);
    setShowContractDetails(true);
  };

  const handleSignContract = (contract: Contract) => {
    setSelectedContract(contract);
    setShowSignatureModal(true);
  };

  const handleManageDocuments = (contract: Contract) => {
    setSelectedContract(contract);
    setShowDocumentManager(true);
  };

  const handleManageAmendments = (contract: Contract) => {
    setSelectedContract(contract);
    setShowAmendmentManager(true);
  };

  const handleRenewContract = (contract: Contract) => {
    setSelectedContract(contract);
    setShowRenewalManager(true);
  };

  const handleManageStatus = (contract: Contract) => {
    setSelectedContract(contract);
    setShowStatusManager(true);
  };

  const handleDeleteContract = async (contractId: string) => {
    setShowDeleteContractModal(true);
    try {
      await deleteContractMutation.mutateAsync(contractId);
      toast.success("Contract deleted successfully!");
    } catch (error) {
      toast.error("Failed to delete contract. Please try again.");
      console.error("Delete contract error:", error);
    } finally {
      setShowDeleteContractModal(false);
      setSelectedContract(null);
    }
  };

  // Handle bulk operations
  const handleBulkExport = () => {
    toast.info("Bulk export feature coming soon!");
  };

  const handleBulkStatusUpdate = () => {
    toast.info("Bulk status update feature coming soon!");
  };

  const counts = getContractCounts();

  return (
    <div className="container mx-auto space-y-6 py-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-bold text-3xl">Contracts</h1>
          <p className="text-muted-foreground">
            Manage rental contracts, signatures, and documentation
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => setShowTemplateManager(true)}
            variant="outline"
          >
            <File className="mr-2 h-4 w-4" />
            Templates
          </Button>

          <Button onClick={() => setShowAdvancedFilter(true)} variant="outline">
            <Filter className="mr-2 h-4 w-4" />
            Advanced Filter
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <MoreVertical className="mr-2 h-4 w-4" />
                More Actions
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleBulkExport}>
                <Download className="mr-2 h-4 w-4" />
                Export Contracts
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleBulkStatusUpdate}>
                <Activity className="mr-2 h-4 w-4" />
                Bulk Status Update
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setShowTemplateManager(true)}>
                <File className="mr-2 h-4 w-4" />
                Manage Templates
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button onClick={() => setShowCreateForm(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Contract
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-muted-foreground text-sm">
                  Total Contracts
                </p>
                <p className="font-bold text-2xl">{counts.all}</p>
              </div>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-muted-foreground text-sm">
                  Active
                </p>
                <p className="font-bold text-2xl text-green-600">
                  {counts.active}
                </p>
              </div>
              <div className="h-2 w-2 rounded-full bg-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-muted-foreground text-sm">
                  Pending Signatures
                </p>
                <p className="font-bold text-2xl text-yellow-600">
                  {counts.pending}
                </p>
              </div>
              <div className="h-2 w-2 rounded-full bg-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-muted-foreground text-sm">
                  Expired
                </p>
                <p className="font-bold text-2xl text-red-600">
                  {counts.expired}
                </p>
              </div>
              <div className="h-2 w-2 rounded-full bg-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-muted-foreground text-sm">
                  Drafts
                </p>
                <p className="font-bold text-2xl text-gray-600">
                  {counts.draft}
                </p>
              </div>
              <div className="h-2 w-2 rounded-full bg-gray-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute top-2.5 left-2 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-8"
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search contracts by tenant, property, or contract ID..."
                value={searchQuery}
              />
            </div>

            <Button
              onClick={() => setShowAdvancedFilter(true)}
              variant="outline"
            >
              <Filter className="mr-2 h-4 w-4" />
              Advanced Filter
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Contracts Table with Tabs */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Contracts</CardTitle>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => setShowTemplateManager(true)}
                size="sm"
                variant="outline"
              >
                <File className="mr-2 h-4 w-4" />
                Templates
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <Tabs onValueChange={setActiveTab} value={activeTab}>
            <TabsList>
              <TabsTrigger value="all">All ({counts.all})</TabsTrigger>
              <TabsTrigger value="active">Active ({counts.active})</TabsTrigger>
              <TabsTrigger value="pending">
                Pending ({counts.pending})
              </TabsTrigger>
              <TabsTrigger value="expired">
                Expired ({counts.expired})
              </TabsTrigger>
              <TabsTrigger value="draft">Drafts ({counts.draft})</TabsTrigger>
            </TabsList>

            <TabsContent className="mt-6" value={activeTab}>
              <ContractsTable
                contracts={filteredContracts}
                isLoading={isLoading}
                onDeleteContract={handleDeleteContract}
                onEditContract={(contract: Contract) => {
                  setSelectedContract(contract);
                  setShowCreateForm(true);
                }}
                onManageAmendments={handleManageAmendments}
                onManageDocuments={handleManageDocuments}
                onManageStatus={handleManageStatus}
                onRenewContract={handleRenewContract}
                onSignContract={handleSignContract}
                onViewContract={handleViewContract}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Modals */}

      {/* Create/Edit Contract Form */}
      <CreateContractForm
        onClose={() => {
          setShowCreateForm(false);
          setSelectedContract(null);
        }}
        open={showCreateForm}
        // editContract={selectedContract}
      />

      {/* Delete Contract Modal */}
      <DeleteContractModal
        contract={selectedContract as Contract}
        onClose={() => {
          setShowDeleteContractModal(false);
          setSelectedContract(null);
        }}
        onConfirm={() => {
          handleDeleteContract(selectedContract?._id as string);
          setShowDeleteContractModal(false);
          setSelectedContract(null);
        }}
        open={showDeleteContractModal}
      />

      {/* Contract Details Modal */}
      <ContractDetailsModal
        contract={selectedContract}
        onCloseAction={() => {
          setShowContractDetails(false);
          setSelectedContract(null);
        }}
        onSignAction={(contract: Contract) => {
          setShowContractDetails(false);
          handleSignContract(contract);
        }}
        open={showContractDetails}
        // onManageDocuments={(contract) => {
        // 	setShowContractDetails(false);
        // 	handleManageDocuments(contract);
        // }}
        // onManageAmendments={(contract) => {
        // 	setShowContractDetails(false);
        // 	handleManageAmendments(contract);
        // }}
        // onRenewContract={(contract) => {
        // 	setShowContractDetails(false);
        // 	handleRenewContract(contract);
        // }}
        // onManageStatus={(contract) => {
        // 	setShowContractDetails(false);
        // 	handleManageStatus(contract);
        // }}
      />

      {/* Signature Modal */}
      <SignatureModal
        contract={selectedContract}
        onClose={() => {
          setShowSignatureModal(false);
          setSelectedContract(null);
        }}
        onSuccess={() => {
          setShowSignatureModal(false);
          setSelectedContract(null);
          toast.success("Contract signed successfully!");
        }}
        open={showSignatureModal}
      />

      {/* Advanced Filter Panel */}
      <AdvancedFilterPanel
        // open={showAdvancedFilter}
        // onClose={() => setShowAdvancedFilter(false)}
        onApplyFilters={() => {
          // filters
          // Apply filters to the contracts list
          // console.log("Applied filters:", filters);
          setShowAdvancedFilter(false);
          toast.success("Filters applied successfully!");
        }}
      />

      {/* Document Manager */}
      <DocumentManager
        contract={selectedContract}
        onClose={() => {
          setShowDocumentManager(false);
          setSelectedContract(null);
        }}
        open={showDocumentManager}
      />

      {/* Amendment Manager */}
      <AmendmentManager
        contract={selectedContract}
        onClose={() => {
          setShowAmendmentManager(false);
          setSelectedContract(null);
        }}
        open={showAmendmentManager}
      />

      {/* Renewal Manager */}
      <RenewalManager
        contract={selectedContract}
        onClose={() => {
          setShowRenewalManager(false);
          setSelectedContract(null);
        }}
        open={showRenewalManager}
      />

      {/* Status Manager */}
      <StatusManager
        contract={selectedContract}
        onClose={() => {
          setShowStatusManager(false);
          setSelectedContract(null);
        }}
        open={showStatusManager}
      />

      {/* Template Manager */}
      <TemplateManager
        onClose={() => setShowTemplateManager(false)}
        onSelectTemplate={(template: ContractTemplate) => {
          setShowTemplateManager(false);
          // You can pre-fill the create form with template data
          setShowCreateForm(true);
          toast.success(`Template "${template.name}" selected!`);
        }}
        open={showTemplateManager}
      />
    </div>
  );
}
