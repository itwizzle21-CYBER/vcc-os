import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { AlertCircle, Package, TrendingDown } from "lucide-react";

export default function InventoryCard() {
  const { data: stats, isLoading } = trpc.inventory.statistics.useQuery();

  if (isLoading || !stats) return null;

  return (
    <Card className="p-6 col-span-1">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Inventory</h3>
        <Package className="w-5 h-5 text-muted-foreground opacity-50" />
      </div>

      <div className="space-y-3">
        {/* Total Items */}
        <div className="flex justify-between items-center text-sm">
          <span className="text-muted-foreground">Total Items</span>
          <span className="font-semibold">{stats.totalItems}</span>
        </div>

        {/* Critical Alert */}
        {stats.criticalCount > 0 && (
          <div className="flex justify-between items-center text-sm p-2 bg-red-500/10 rounded border border-red-500/20">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600" />
              <span className="text-red-600 font-medium">Critical</span>
            </div>
            <span className="font-bold text-red-600">{stats.criticalCount}</span>
          </div>
        )}

        {/* Low Stock Alert */}
        {stats.lowCount > 0 && (
          <div className="flex justify-between items-center text-sm p-2 bg-yellow-500/10 rounded border border-yellow-500/20">
            <div className="flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-yellow-600" />
              <span className="text-yellow-600 font-medium">Low Stock</span>
            </div>
            <span className="font-bold text-yellow-600">{stats.lowCount}</span>
          </div>
        )}

        {/* Buy Next */}
        <div className="flex justify-between items-center text-sm pt-2 border-t">
          <span className="text-muted-foreground">Buy Next</span>
          <span className="font-semibold">{stats.buyNextCount}</span>
        </div>

        {/* Good Stock */}
        <div className="flex justify-between items-center text-sm">
          <span className="text-muted-foreground">Good Stock</span>
          <span className="font-semibold text-green-600">{stats.goodCount}</span>
        </div>
      </div>
    </Card>
  );
}
