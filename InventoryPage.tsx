import { trpc } from "@/lib/trpc";
import { Spinner } from "@/components/ui/spinner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, TrendingDown, Package } from "lucide-react";
import { useState } from "react";

export default function InventoryPage() {
  const { data: items, isLoading } = trpc.inventory.list.useQuery();
  const { data: critical } = trpc.inventory.critical.useQuery();
  const { data: lowStock } = trpc.inventory.lowStock.useQuery();
  const { data: buyNext } = trpc.inventory.buyNext.useQuery();
  const { data: stats } = trpc.inventory.statistics.useQuery();
  const [activeTab, setActiveTab] = useState("all");

  if (isLoading) return <Spinner />;

  const displayItems =
    activeTab === "all"
      ? items
      : activeTab === "critical"
        ? critical
        : activeTab === "low"
          ? lowStock
          : buyNext;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Inventory</h1>
          <p className="text-muted-foreground mt-1">Track stock levels and manage restocking</p>
        </div>
        <Button>Add Item</Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Items</p>
              <p className="text-2xl font-bold">{stats?.totalItems || 0}</p>
            </div>
            <Package className="w-8 h-8 text-muted-foreground opacity-50" />
          </div>
        </Card>

        <Card className="p-4 border-red-500/50 bg-red-500/5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-red-600 font-medium">Critical</p>
              <p className="text-2xl font-bold text-red-600">{stats?.criticalCount || 0}</p>
            </div>
            <AlertCircle className="w-8 h-8 text-red-600 opacity-50" />
          </div>
        </Card>

        <Card className="p-4 border-yellow-500/50 bg-yellow-500/5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-yellow-600 font-medium">Low Stock</p>
              <p className="text-2xl font-bold text-yellow-600">{stats?.lowCount || 0}</p>
            </div>
            <TrendingDown className="w-8 h-8 text-yellow-600 opacity-50" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Buy Next</p>
              <p className="text-2xl font-bold">{stats?.buyNextCount || 0}</p>
            </div>
            <Package className="w-8 h-8 text-muted-foreground opacity-50" />
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All Items ({items?.length || 0})</TabsTrigger>
          <TabsTrigger value="critical">Critical ({critical?.length || 0})</TabsTrigger>
          <TabsTrigger value="low">Low Stock ({lowStock?.length || 0})</TabsTrigger>
          <TabsTrigger value="buyNext">Buy Next ({buyNext?.length || 0})</TabsTrigger>
        </TabsList>

        {/* All Items Tab */}
        <TabsContent value="all">
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/50">
                  <tr>
                    <th className="text-left p-4 font-medium">Item</th>
                    <th className="text-left p-4 font-medium">Category</th>
                    <th className="text-left p-4 font-medium">Stock</th>
                    <th className="text-left p-4 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {displayItems?.map((item: any) => (
                    <tr key={item.id} className="border-b hover:bg-muted/50">
                      <td className="p-4 font-medium">{item.name}</td>
                      <td className="p-4 text-muted-foreground">{item.category}</td>
                      <td className="p-4">
                        {item.currentQuantity} / {item.minimumQuantity}
                      </td>
                      <td className="p-4">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            item.status === "Critical"
                              ? "bg-red-500/20 text-red-700"
                              : item.status === "Low"
                                ? "bg-yellow-500/20 text-yellow-700"
                                : "bg-green-500/20 text-green-700"
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        {/* Critical Tab */}
        <TabsContent value="critical">
          {critical && critical.length > 0 ? (
            <Card>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b bg-muted/50">
                    <tr>
                      <th className="text-left p-4 font-medium">Item</th>
                      <th className="text-left p-4 font-medium">Current</th>
                      <th className="text-left p-4 font-medium">Minimum</th>
                      <th className="text-left p-4 font-medium">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {critical.map((item: any) => (
                      <tr key={item.id} className="border-b hover:bg-muted/50">
                        <td className="p-4 font-medium">{item.name}</td>
                        <td className="p-4 text-red-600 font-bold">{item.currentQuantity}</td>
                        <td className="p-4">{item.minimumQuantity}</td>
                        <td className="p-4">
                          <Button size="sm" variant="outline">
                            Restock
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          ) : (
            <Card className="p-8 text-center text-muted-foreground">
              <Package className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p>No critical items</p>
            </Card>
          )}
        </TabsContent>

        {/* Low Stock Tab */}
        <TabsContent value="low">
          {lowStock && lowStock.length > 0 ? (
            <Card>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b bg-muted/50">
                    <tr>
                      <th className="text-left p-4 font-medium">Item</th>
                      <th className="text-left p-4 font-medium">Current</th>
                      <th className="text-left p-4 font-medium">Minimum</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lowStock.map((item: any) => (
                      <tr key={item.id} className="border-b hover:bg-muted/50">
                        <td className="p-4 font-medium">{item.name}</td>
                        <td className="p-4 text-yellow-600">{item.currentQuantity}</td>
                        <td className="p-4">{item.minimumQuantity}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          ) : (
            <Card className="p-8 text-center text-muted-foreground">
              <Package className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p>No low stock items</p>
            </Card>
          )}
        </TabsContent>

        {/* Buy Next Tab */}
        <TabsContent value="buyNext">
          {buyNext && buyNext.length > 0 ? (
            <Card>
              <div className="space-y-3 p-4">
                {buyNext.map((item: any, index: number) => (
                  <div key={item.id} className="flex items-center justify-between p-3 border rounded bg-muted/30">
                    <div>
                      <p className="font-medium">
                        {index + 1}. {item.name}
                      </p>
                      <p className="text-sm text-muted-foreground">{item.category}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{item.currentQuantity}/{item.minimumQuantity}</p>
                      <span
                        className={`text-xs px-2 py-1 rounded ${
                          item.status === "Critical"
                            ? "bg-red-500/20 text-red-700"
                            : "bg-yellow-500/20 text-yellow-700"
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          ) : (
            <Card className="p-8 text-center text-muted-foreground">
              <Package className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p>No items need restocking</p>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
