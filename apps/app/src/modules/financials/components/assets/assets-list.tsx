import { Badge } from "@kaa/ui/components/badge";
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
  DropdownMenuTrigger,
} from "@kaa/ui/components/dropdown-menu";
import { Input } from "@kaa/ui/components/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@kaa/ui/components/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@kaa/ui/components/table";
import {
  Building,
  Calendar,
  Car,
  Edit,
  Eye,
  Filter,
  Laptop,
  MoreHorizontal,
  Package,
  Plus,
  Search,
  Sofa,
  Trash2,
  TrendingDown,
} from "lucide-react";
import { useState } from "react";
import { formatCurrency, formatDate } from "@/shared/utils/format.util";
import { useAssets, useDeleteAsset } from "../../financials.queries";
import { useFinancialsStore } from "../../financials.store";
import type { Asset, AssetFilters } from "../../financials.type";
import { AssetDetailsDialog } from "./asset-details-dialog";

type AssetsListProps = {
  onCreateAsset?: () => void;
  onEditAsset?: (asset: Asset) => void;
  onViewAsset?: (asset: Asset) => void;
  onDisposeAsset?: (assetId: string) => void;
};

export function AssetsList({
  onCreateAsset,
  onEditAsset,
  onViewAsset,
  onDisposeAsset,
}: AssetsListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);

  const { assetFilters, updateAssetFilters } = useFinancialsStore();
  const { data: assetsData, isLoading } = useAssets(assetFilters);
  const { mutate: deleteAsset } = useDeleteAsset();

  const assets = assetsData?.assets || [];
  const pagination = assetsData?.pagination;

  const handleFilterChange = (filters: Partial<AssetFilters>) => {
    updateAssetFilters({ ...filters, page: 1 });
  };

  const handlePageChange = (page: number) => {
    updateAssetFilters({ page });
  };

  const handleDeleteAsset = (assetId: string) => {
    // biome-ignore lint/suspicious/noAlert: ignore
    if (confirm("Are you sure you want to delete this asset?")) {
      deleteAsset(assetId);
    }
  };

  const handleViewAsset = (asset: Asset) => {
    setSelectedAsset(asset);
    setShowDetailsDialog(true);
    if (onViewAsset) {
      onViewAsset(asset);
    }
  };

  const handleCloseDetailsDialog = () => {
    setShowDetailsDialog(false);
    setSelectedAsset(null);
  };

  const calculateDepreciation = (asset: Asset): number => {
    const yearsOwned =
      (Date.now() - new Date(asset.purchaseDate).getTime()) /
      (365.25 * 24 * 60 * 60 * 1000);
    const annualDepreciation =
      (asset.purchasePrice - asset.salvageValue) / asset.usefulLife;
    return Math.min(
      annualDepreciation * yearsOwned,
      asset.purchasePrice - asset.salvageValue
    );
  };

  const filteredAssets = assets.filter((asset) => {
    const matchesSearch =
      asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !statusFilter || asset.status === statusFilter;
    const matchesCategory =
      !categoryFilter || asset.category === categoryFilter;

    return matchesSearch && matchesStatus && matchesCategory;
  });

  // Get category icon
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "property":
        return Building;
      case "equipment":
        return Laptop;
      case "furniture":
        return Sofa;
      case "vehicle":
        return Car;
      default:
        return Package;
    }
  };

  // Get status badge color
  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "disposed":
        return "bg-red-100 text-red-800";
      case "fully_depreciated":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Calculate depreciation percentage
  const calculateDepreciationPercentage = (asset: Asset) => {
    const totalDepreciation = calculateDepreciation(asset);
    return (
      (totalDepreciation / (asset.purchasePrice - asset.salvageValue)) * 100
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Assets</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {new Array(5).fill(0).map((_, i) => (
              <div
                className="flex animate-pulse items-center justify-between rounded border p-4"
                key={i.toString()}
              >
                <div className="flex flex-col space-y-2">
                  <div className="h-4 w-48 rounded bg-muted" />
                  <div className="h-3 w-32 rounded bg-muted" />
                </div>
                <div className="h-6 w-20 rounded bg-muted" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Assets</CardTitle>
          <Button onClick={onCreateAsset}>
            <Plus className="mr-2 h-4 w-4" />
            Add Asset
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="mb-6 flex items-center space-x-4">
          <div className="relative flex-1">
            <Search className="absolute top-2.5 left-2 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-8"
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search assets..."
              value={searchTerm}
            />
          </div>
          <Select onValueChange={setStatusFilter} value={statusFilter}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              {/* <SelectItem value="">All Status</SelectItem> */}
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="disposed">Disposed</SelectItem>
              <SelectItem value="fully_depreciated">
                Fully Depreciated
              </SelectItem>
            </SelectContent>
          </Select>
          <Select onValueChange={setCategoryFilter} value={categoryFilter}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              {/* <SelectItem value="">All Categories</SelectItem> */}
              <SelectItem value="property">Property</SelectItem>
              <SelectItem value="equipment">Equipment</SelectItem>
              <SelectItem value="furniture">Furniture</SelectItem>
              <SelectItem value="vehicle">Vehicle</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
          <Button size="icon" variant="outline">
            <Filter className="h-4 w-4" />
          </Button>
        </div>

        {/* Assets Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Asset Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Purchase Price</TableHead>
                <TableHead>Current Value</TableHead>
                <TableHead>Purchase Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Depreciation</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAssets.length === 0 ? (
                <TableRow>
                  <TableCell className="py-8 text-center" colSpan={8}>
                    <div className="text-muted-foreground">No assets found</div>
                    <Button
                      className="mt-2"
                      onClick={onCreateAsset}
                      variant="outline"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add First Asset
                    </Button>
                  </TableCell>
                </TableRow>
              ) : (
                filteredAssets.map((asset) => {
                  const Icon = getCategoryIcon(asset.category);
                  const depreciation = calculateDepreciation(asset);
                  const depreciationPercent =
                    calculateDepreciationPercentage(asset);

                  return (
                    <TableRow key={asset._id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{asset.name}</span>
                          {asset.description && (
                            <span className="text-muted-foreground text-sm">
                              {asset.description}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className="capitalize" variant="outline">
                          <Building className="mr-1 h-3 w-3" />
                          {asset.category}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(asset.purchasePrice)}
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(asset.currentValue)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                          {formatDate(asset.purchaseDate)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            asset.status === "active"
                              ? "default"
                              : asset.status === "disposed"
                                ? "destructive"
                                : "secondary"
                          }
                        >
                          {asset.status.replace("_", " ")}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <div className="flex items-center">
                            <TrendingDown className="mr-1 h-3 w-3 text-red-500" />
                            <span className="font-medium">
                              {formatCurrency(depreciation)}
                            </span>
                          </div>
                          <span className="text-muted-foreground text-xs">
                            {depreciationPercent.toFixed(1)}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="icon" variant="ghost">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => handleViewAsset(asset)}
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => onEditAsset?.(asset)}
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => handleDeleteAsset(asset._id)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {pagination && pagination.pages > 1 && (
          <div className="mt-4 flex items-center justify-between">
            <div className="text-muted-foreground text-sm">
              Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
              {Math.min(pagination.page * pagination.limit, pagination.total)}{" "}
              of {pagination.total} assets
            </div>
            <div className="flex items-center space-x-2">
              <Button
                disabled={pagination.page <= 1}
                onClick={() => handlePageChange(pagination.page - 1)}
                size="sm"
                variant="outline"
              >
                Previous
              </Button>
              {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(
                (page) => (
                  <Button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    size="sm"
                    variant={page === pagination.page ? "default" : "outline"}
                  >
                    {page}
                  </Button>
                )
              )}
              <Button
                disabled={pagination.page >= pagination.pages}
                onClick={() => handlePageChange(pagination.page + 1)}
                size="sm"
                variant="outline"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </CardContent>

      {/* Asset Details Dialog */}
      <AssetDetailsDialog
        asset={selectedAsset}
        isOpen={showDetailsDialog}
        onClose={handleCloseDetailsDialog}
        onDispose={onDisposeAsset}
        onEdit={onEditAsset}
      />
    </Card>
  );
}
