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
  DialogHeader,
  DialogTitle,
} from "@kaa/ui/components/dialog";
import { Separator } from "@kaa/ui/components/separator";
import {
  BarChart3,
  Building,
  Calculator,
  Calendar,
  CheckCircle,
  Clock,
  DollarSign,
  Edit,
  FileText,
  Info,
  Tag,
  TrendingDown,
  XCircle,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/shared/utils/format.util";
import type { Asset } from "../../financials.type";

type AssetDetailsDialogProps = {
  asset: Asset | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (asset: Asset) => void;
  onDispose?: (assetId: string) => void;
};

export function AssetDetailsDialog({
  asset,
  isOpen,
  onClose,
  onEdit,
  onDispose,
}: AssetDetailsDialogProps) {
  if (!asset) return null;

  const calculateDepreciation = () => {
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

  const calculateRemainingValue = () => {
    const depreciation = calculateDepreciation();
    return asset.purchasePrice - depreciation;
  };

  const calculateAnnualDepreciation = () =>
    (asset.purchasePrice - asset.salvageValue) / asset.usefulLife;

  const calculateDepreciationRate = () => {
    const depreciation = calculateDepreciation();
    return (depreciation / asset.purchasePrice) * 100;
  };

  const getRemainingLife = () => {
    const yearsOwned =
      (Date.now() - new Date(asset.purchaseDate).getTime()) /
      (365.25 * 24 * 60 * 60 * 1000);
    return Math.max(asset.usefulLife - yearsOwned, 0);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "disposed":
        return <XCircle className="h-4 w-4 text-red-600" />;
      case "fully_depreciated":
        return <TrendingDown className="h-4 w-4 text-orange-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 border-green-300";
      case "disposed":
        return "bg-red-100 text-red-800 border-red-300";
      case "fully_depreciated":
        return "bg-orange-100 text-orange-800 border-orange-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const depreciation = calculateDepreciation();
  const remainingValue = calculateRemainingValue();
  const annualDepreciation = calculateAnnualDepreciation();
  const depreciationRate = calculateDepreciationRate();
  const remainingLife = getRemainingLife();

  return (
    <Dialog onOpenChange={onClose} open={isOpen}>
      <DialogContent className="max-h-[90vh] max-w-5xl overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center space-x-2">
              <Building className="h-5 w-5" />
              <span>Asset Details</span>
            </DialogTitle>
            <div className="flex items-center space-x-2">
              <Badge
                className={`${getStatusColor(asset.status)} flex items-center space-x-1`}
              >
                {getStatusIcon(asset.status)}
                <span className="capitalize">
                  {asset.status.replace("_", " ")}
                </span>
              </Badge>
              {onEdit && (
                <Button
                  onClick={() => onEdit(asset)}
                  size="sm"
                  variant="outline"
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </Button>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Main Details */}
          <div className="space-y-6 lg:col-span-2">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="h-4 w-4" />
                  <span>Basic Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label
                      className="font-medium text-muted-foreground text-sm"
                      htmlFor="name"
                    >
                      Asset Name
                    </label>
                    <p className="font-medium text-base">{asset.name}</p>
                  </div>
                  <div>
                    <label
                      className="font-medium text-muted-foreground text-sm"
                      htmlFor="category"
                    >
                      Category
                    </label>
                    <Badge
                      className="flex w-fit items-center space-x-1"
                      variant="outline"
                    >
                      <Tag className="h-3 w-3" />
                      <span className="capitalize">{asset.category}</span>
                    </Badge>
                  </div>
                </div>

                {asset.description && (
                  <div>
                    <label
                      className="font-medium text-muted-foreground text-sm"
                      htmlFor="description"
                    >
                      Description
                    </label>
                    <p className="text-base">{asset.description}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label
                      className="font-medium text-muted-foreground text-sm"
                      htmlFor="purchasePrice"
                    >
                      Purchase Price
                    </label>
                    <p className="flex items-center font-semibold text-base">
                      <DollarSign className="mr-1 h-4 w-4" />
                      {formatCurrency(asset.purchasePrice)}
                    </p>
                  </div>
                  <div>
                    <label
                      className="font-medium text-muted-foreground text-sm"
                      htmlFor="currentValue"
                    >
                      Current Value
                    </label>
                    <p className="flex items-center font-semibold text-base">
                      <DollarSign className="mr-1 h-4 w-4" />
                      {formatCurrency(asset.currentValue)}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label
                      className="font-medium text-muted-foreground text-sm"
                      htmlFor="purchaseDate"
                    >
                      Purchase Date
                    </label>
                    <p className="flex items-center text-base">
                      <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                      {formatDate(asset.purchaseDate)}
                    </p>
                  </div>
                  {asset.property && (
                    <div>
                      <label
                        className="font-medium text-muted-foreground text-sm"
                        htmlFor="property"
                      >
                        Property
                      </label>
                      <p className="flex items-center text-base">
                        <Building className="mr-2 h-4 w-4 text-muted-foreground" />
                        {asset.property}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Depreciation Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Calculator className="h-4 w-4" />
                  <span>Depreciation Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label
                      className="font-medium text-muted-foreground text-sm"
                      htmlFor="depreciationMethod"
                    >
                      Depreciation Method
                    </label>
                    <Badge className="capitalize" variant="outline">
                      {asset.depreciationMethod.replace("_", " ")}
                    </Badge>
                  </div>
                  <div>
                    <label
                      className="font-medium text-muted-foreground text-sm"
                      htmlFor="usefulLife"
                    >
                      Useful Life
                    </label>
                    <p className="text-base">{asset.usefulLife} years</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label
                      className="font-medium text-muted-foreground text-sm"
                      htmlFor="salvageValue"
                    >
                      Salvage Value
                    </label>
                    <p className="flex items-center text-base">
                      <DollarSign className="mr-1 h-4 w-4" />
                      {formatCurrency(asset.salvageValue)}
                    </p>
                  </div>
                  <div>
                    <label
                      className="font-medium text-muted-foreground text-sm"
                      htmlFor="annualDepreciation"
                    >
                      Annual Depreciation
                    </label>
                    <p className="flex items-center text-base">
                      <DollarSign className="mr-1 h-4 w-4" />
                      {formatCurrency(annualDepreciation)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Disposal Information */}
            {asset.status === "disposed" && asset.disposalDate && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <XCircle className="h-4 w-4 text-red-600" />
                    <span>Disposal Information</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label
                        className="font-medium text-muted-foreground text-sm"
                        htmlFor="disposalDate"
                      >
                        Disposal Date
                      </label>
                      <p className="flex items-center text-base">
                        <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                        {formatDate(asset.disposalDate)}
                      </p>
                    </div>
                    {asset.disposalPrice && (
                      <div>
                        <label
                          className="font-medium text-muted-foreground text-sm"
                          htmlFor="disposalPrice"
                        >
                          Disposal Price
                        </label>
                        <p className="flex items-center text-base">
                          <DollarSign className="mr-1 h-4 w-4" />
                          {formatCurrency(asset.disposalPrice)}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Side Panel */}
          <div className="space-y-6">
            {/* Depreciation Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="h-4 w-4" />
                  <span>Depreciation Summary</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div>
                    <div className="mb-1 flex items-center justify-between">
                      <label
                        className="font-medium text-muted-foreground text-sm"
                        htmlFor="totalDepreciation"
                      >
                        Total Depreciation
                      </label>
                      <div className="flex items-center">
                        <TrendingDown className="mr-1 h-3 w-3 text-red-500" />
                        <span
                          className="font-medium text-sm"
                          id="depreciationRate"
                        >
                          {depreciationRate.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                    <p className="font-semibold text-lg text-red-600">
                      {formatCurrency(depreciation)}
                    </p>
                  </div>

                  <Separator />

                  <div>
                    <label
                      className="font-medium text-muted-foreground text-sm"
                      htmlFor="remainingValue"
                    >
                      Remaining Value
                    </label>
                    <p className="font-semibold text-green-600 text-lg">
                      {formatCurrency(remainingValue)}
                    </p>
                  </div>

                  <div>
                    <label
                      className="font-medium text-muted-foreground text-sm"
                      htmlFor="remainingLife"
                    >
                      Remaining Life
                    </label>
                    <p className="text-base">
                      {remainingLife > 0
                        ? `${remainingLife.toFixed(1)} years`
                        : "Fully depreciated"}
                    </p>
                  </div>
                </div>

                {/* Depreciation Progress */}
                <div className="space-y-2">
                  <label
                    className="font-medium text-muted-foreground text-sm"
                    htmlFor="depreciationProgress"
                  >
                    Depreciation Progress
                  </label>
                  <div className="h-2 w-full rounded-full bg-gray-200">
                    <div
                      className="h-2 rounded-full bg-red-500 transition-all"
                      style={{ width: `${Math.min(depreciationRate, 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-muted-foreground text-xs">
                    <span>0%</span>
                    <span>100%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            {asset.status === "active" && onDispose && (
              <Card>
                <CardHeader>
                  <CardTitle>Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button
                    className="w-full border-orange-300 text-orange-600 hover:bg-orange-50"
                    onClick={() => onDispose(asset._id)}
                    variant="outline"
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Mark as Disposed
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Quick Facts */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Info className="h-4 w-4" />
                  <span>Quick Facts</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground text-sm">Age:</span>
                    <span className="font-medium text-sm">
                      {(
                        (Date.now() - new Date(asset.purchaseDate).getTime()) /
                        (365.25 * 24 * 60 * 60 * 1000)
                      ).toFixed(1)}{" "}
                      years
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground text-sm">
                      Value Lost:
                    </span>
                    <span className="font-medium text-red-600 text-sm">
                      {formatCurrency(asset.purchasePrice - asset.currentValue)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground text-sm">
                      Depreciation Rate:
                    </span>
                    <span className="font-medium text-sm">
                      {(
                        (((asset.purchasePrice - asset.salvageValue) /
                          asset.purchasePrice) *
                          100) /
                        asset.usefulLife
                      ).toFixed(1)}
                      % annually
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Timestamps */}
            <Card>
              <CardHeader>
                <CardTitle>Timeline</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <label
                    className="font-medium text-muted-foreground text-sm"
                    htmlFor="createdAt"
                  >
                    Created
                  </label>
                  <p className="text-sm">{formatDate(asset.createdAt)}</p>
                </div>
                <div>
                  <label
                    className="font-medium text-muted-foreground text-sm"
                    htmlFor="updatedAt"
                  >
                    Last Updated
                  </label>
                  <p className="text-sm">{formatDate(asset.updatedAt)}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
