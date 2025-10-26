import { Package, TrendingDown } from "lucide-react";
import { formatCurrency } from "../../../maintenance";
import type { Asset } from "../../financials.type";

export const AssetsOverview = ({ assets }: { assets: Asset[] }) => {
  const calculateDepreciation = (asset: Asset) => {
    const purchaseDate = new Date(asset.purchaseDate);
    const currentDate = new Date();
    const yearsSincePurchase =
      currentDate.getFullYear() - purchaseDate.getFullYear();
    const depreciation =
      (asset.purchasePrice / asset.usefulLife) * yearsSincePurchase;
    return depreciation;
  };

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-600 text-sm">Total Assets</p>
            <p className="font-bold text-2xl text-gray-900">{assets.length}</p>
          </div>
          <Package className="h-8 w-8 text-blue-600" />
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-600 text-sm">Total Value</p>
            <p className="font-bold text-2xl text-gray-900">
              {formatCurrency(
                assets.reduce((sum, asset) => sum + asset.purchasePrice, 0)
              )}
            </p>
          </div>
          <TrendingDown className="h-8 w-8 text-green-600" />
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-600 text-sm">Current Value</p>
            <p className="font-bold text-2xl text-gray-900">
              {formatCurrency(
                assets.reduce((sum, asset) => sum + asset.currentValue, 0)
              )}
            </p>
          </div>
          <TrendingDown className="h-8 w-8 text-orange-600" />
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-600 text-sm">Total Depreciation</p>
            <p className="font-bold text-2xl text-gray-900">
              {formatCurrency(
                assets.reduce(
                  (sum, asset) => sum + calculateDepreciation(asset),
                  0
                )
              )}
            </p>
          </div>
          <TrendingDown className="h-8 w-8 text-red-600" />
        </div>
      </div>
    </div>
  );
};
