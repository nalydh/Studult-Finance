"use client";

import React, { useState, useEffect } from "react";
import {
  Table, TableHeader, TableBody, TableHead, TableRow, TableCell,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DollarSign, Package, Pencil, Trash2, Settings, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  type CategoryItem, type Asset, MAX_CATEGORY_TABS, COLOR_PALETTE, getCategoryColor,
} from "./types";
import { AddAssetDialog } from "./AddAssetDialog";
import { EditAssetDialog } from "./EditAssetDialog";
import { DeleteAssetDialog } from "./DeleteAssetDialog";
import { SellAssetDialog } from "./SellAssetDialog";
import { BulkSellDialog } from "./BulkSellDialog";
import { ManageCategoriesDialog } from "./ManageCategoriesDialog";
import { API_BASE } from "@/lib/api";
import { useAuthFetch } from "@/hooks/useAuthFetch";

export default function AssetLedger() {
  const authFetch = useAuthFetch();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [categories, setCategories] = useState<CategoryItem[]>([]);

  const [addOpen, setAddOpen] = useState(false);
  const [sellOpen, setSellOpen] = useState(false);
  const [bulkSellOpen, setBulkSellOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [manageCategoriesOpen, setManageCategoriesOpen] = useState(false);

  const [sellingAsset, setSellingAsset] = useState<Asset | null>(null);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [deletingAsset, setDeletingAsset] = useState<Asset | null>(null);

  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [selectedTab, setSelectedTab] = useState("All");

  type SortKey = "name" | "purchase_price" | "market_value" | "date_acquired";
  type SortDir = "asc" | "desc";
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      if (sortDir === "asc") setSortDir("desc");
      else { setSortKey(null); setSortDir("asc"); }
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  function SortIcon({ column }: { column: SortKey }) {
    if (sortKey !== column) return <ArrowUpDown className="h-3.5 w-3.5 ml-1 opacity-40" />;
    return sortDir === "asc"
      ? <ArrowUp className="h-3.5 w-3.5 ml-1" />
      : <ArrowDown className="h-3.5 w-3.5 ml-1" />;
  }

  async function fetchCategories() {
    try {
      const res = await authFetch("/categories/");
      const data = await res.json();
      setCategories(
        (Array.isArray(data) ? data : []).map((c: any) => ({
          id: c.id,
          name: c.name,
          colorIndex: c.color_index,
        }))
      );
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  }

  async function fetchAssets() {
    try {
      const res = await authFetch("/assets/");
      const data = await res.json();
      setAssets(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching assets:", error);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchCategories();
    fetchAssets();
  }, [authFetch]);

  // ─── Category handlers ────────────────────────────────────────────
  async function handleCreateCategory(name: string, colorIndex: number) {
    const res = await authFetch("/categories/", {
      method: "POST",
      body: JSON.stringify({ name, color_index: colorIndex }),
    });
    if (!res.ok) throw new Error("Failed to create category");
    await fetchCategories();
  }

  async function handleDeleteCategory(catId: number) {
    const cat = categories.find((c) => c.id === catId);
    const res = await authFetch(`/categories/${catId}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Failed to delete category");
    await fetchCategories();
    if (cat && selectedTab === cat.name) setSelectedTab("All");
  }

  async function handleSaveCategory(id: number, name: string, colorIndex: number) {
    const oldCat = categories.find((c) => c.id === id);
    const res = await authFetch(`/categories/${id}`, {
      method: "PUT",
      body: JSON.stringify({ name, color_index: colorIndex }),
    });
    if (!res.ok) throw new Error("Failed to update category");
    await fetchCategories();
    if (oldCat && oldCat.name !== name) {
      await fetchAssets();
      if (selectedTab === oldCat.name) setSelectedTab(name);
    }
  }

  function handleReorderCategories(reordered: CategoryItem[]) {
    setCategories(reordered);
    authFetch("/categories/reorder", {
      method: "PUT",
      body: JSON.stringify({ category_ids: reordered.map((c) => c.id) }),
    }).catch((err) => console.error("Error reordering categories:", err));
  }

  // ─── Asset handlers ───────────────────────────────────────────────
  async function handleAddAsset(data: {
    name: string; category: string; purchase_price: number; market_value: number | null; date_acquired: string;
  }) {
    const res = await authFetch("/assets/", {
      method: "POST",
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to add asset");
    setAddOpen(false);
    fetchAssets();
  }

  async function handleEditAsset(id: number, data: {
    name: string; category: string; purchase_price: number; market_value: number | null; date_acquired: string;
  }) {
    const res = await authFetch(`/assets/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to update asset");
    setEditOpen(false);
    setEditingAsset(null);
    fetchAssets();
  }

  async function handleDeleteAsset(id: number) {
    const res = await authFetch(`/assets/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Failed to delete asset");
    setDeleteOpen(false);
    setDeletingAsset(null);
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    fetchAssets();
  }

  async function handleSellAsset(
    assetId: number, salePrice: number, dateSold: string, wallet: string,
  ) {
    const res = await authFetch(
      `/assets/${assetId}/sell?sale_price=${salePrice}&destination_wallet=${wallet}&date_sold=${dateSold}`,
      { method: "PUT" },
    );
    if (!res.ok) throw new Error("Failed to sell asset");
    setSellOpen(false);
    setSellingAsset(null);
    fetchAssets();
  }

  async function handleBulkSell(
    sales: { id: number; salePrice: number; dateSold: string }[], wallet: string,
  ) {
    const promises = sales.map((sale) =>
      authFetch(
        `/assets/${sale.id}/sell?sale_price=${sale.salePrice}&destination_wallet=${wallet}&date_sold=${sale.dateSold}`,
        { method: "PUT" },
      )
    );
    await Promise.all(promises);
    setBulkSellOpen(false);
    setSelectedIds(new Set());
    fetchAssets();
  }

  // ─── Selection helpers ────────────────────────────────────────────
  function toggleSelect(id: number) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selectedIds.size === filteredAssets.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredAssets.map((a) => a.id)));
    }
  }

  // ─── Computed values ──────────────────────────────────────────────
  const activeAssets = assets.filter((a) => !a.is_sold);
  const selectedAssets = activeAssets.filter((a) => selectedIds.has(a.id));
  const visibleCategories = categories.slice(0, MAX_CATEGORY_TABS);
  const filteredAssets =
    selectedTab === "All"
      ? activeAssets
      : activeAssets.filter((a) => a.category === selectedTab);

  const sortedAssets = sortKey
    ? [...filteredAssets].sort((a, b) => {
        let cmp = 0;
        switch (sortKey) {
          case "name":
            cmp = a.name.localeCompare(b.name);
            break;
          case "purchase_price":
            cmp = a.purchase_price - b.purchase_price;
            break;
          case "market_value":
            cmp = (a.market_value ?? 0) - (b.market_value ?? 0);
            break;
          case "date_acquired":
            cmp = new Date(a.date_acquired).getTime() - new Date(b.date_acquired).getTime();
            break;
        }
        return sortDir === "asc" ? cmp : -cmp;
      })
    : filteredAssets;

  const filteredValue = filteredAssets.reduce((sum, a) => sum + a.purchase_price, 0);

  // ─── Render ───────────────────────────────────────────────────────
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div>
          <CardTitle className="text-xl font-semibold flex items-center gap-2">
            <Package className="h-5 w-5" />
            Asset Ledger
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            {filteredAssets.length} item{filteredAssets.length !== 1 && "s"} &middot; $
            {filteredValue.toLocaleString("en-US", { minimumFractionDigits: 2 })}{" "}
            {selectedTab === "All" ? "total value" : "in category"}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {selectedIds.size > 0 && (
            <Button size="sm" variant="outline" onClick={() => setBulkSellOpen(true)}>
              <DollarSign className="h-4 w-4 mr-1" />
              Sell {selectedIds.size} Selected
            </Button>
          )}

          <AddAssetDialog
            open={addOpen}
            onOpenChange={setAddOpen}
            categories={categories}
            selectedTab={selectedTab}
            onSubmit={handleAddAsset}
            onCreateCategory={handleCreateCategory}
            onDeleteCategory={handleDeleteCategory}
          />
        </div>
      </CardHeader>

      <CardContent className="px-0">
        {/* Category Tabs */}
        {categories.length > 0 && (
          <div className="px-6 pb-4 flex items-center gap-2">
            <Tabs
              value={selectedTab}
              onValueChange={(val) => { setSelectedTab(val); setSelectedIds(new Set()); }}
              className="flex-1"
            >
              <TabsList>
                <TabsTrigger value="All">All</TabsTrigger>
                {visibleCategories.map((cat) => {
                  const color = COLOR_PALETTE[cat.colorIndex % COLOR_PALETTE.length];
                  return (
                    <TabsTrigger key={cat.id} value={cat.name}>
                      <span className="flex items-center gap-1.5">
                        <span className={cn("h-2 w-2 rounded-full", color.dot)} />
                        {cat.name}
                      </span>
                    </TabsTrigger>
                  );
                })}
              </TabsList>
            </Tabs>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
              onClick={() => setManageCategoriesOpen(true)}
              title="Manage categories"
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        )}

        {isLoading ? (
          <p className="text-center text-muted-foreground py-8">Loading...</p>
        ) : filteredAssets.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Package className="h-10 w-10 mx-auto mb-3 opacity-40" />
            <p className="font-medium">
              {selectedTab === "All" ? "No assets yet" : `No assets in ${selectedTab}`}
            </p>
            <p className="text-sm mt-1">
              {selectedTab === "All"
                ? 'Click "Add Asset" to log your first purchase.'
                : "Add an asset to this category or switch tabs."}
            </p>
          </div>
        ) : (
          <div className="max-h-[520px] overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-6 w-10">
                  <Checkbox
                    checked={filteredAssets.length > 0 && selectedIds.size === filteredAssets.length}
                    onCheckedChange={toggleSelectAll}
                    aria-label="Select all"
                  />
                </TableHead>
                <TableHead>
                  <button type="button" onClick={() => handleSort("name")} className="inline-flex items-center hover:text-foreground transition-colors">
                    Name <SortIcon column="name" />
                  </button>
                </TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">
                  <button type="button" onClick={() => handleSort("purchase_price")} className="inline-flex items-center ml-auto hover:text-foreground transition-colors">
                    Purchase Price <SortIcon column="purchase_price" />
                  </button>
                </TableHead>
                <TableHead className="text-right">
                  <button type="button" onClick={() => handleSort("market_value")} className="inline-flex items-center ml-auto hover:text-foreground transition-colors">
                    Market Value <SortIcon column="market_value" />
                  </button>
                </TableHead>
                <TableHead className="text-right">
                  <button type="button" onClick={() => handleSort("date_acquired")} className="inline-flex items-center ml-auto hover:text-foreground transition-colors">
                    Date Acquired <SortIcon column="date_acquired" />
                  </button>
                </TableHead>
                <TableHead className="text-right pr-6 w-[120px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedAssets.map((asset) => {
                const color = getCategoryColor(categories, asset.category);
                return (
                  <TableRow
                    key={asset.id}
                    className="group"
                    data-state={selectedIds.has(asset.id) ? "selected" : undefined}
                  >
                    <TableCell className="pl-6 align-middle">
                      <Checkbox
                        checked={selectedIds.has(asset.id)}
                        onCheckedChange={() => toggleSelect(asset.id)}
                        aria-label={`Select ${asset.name}`}
                      />
                    </TableCell>
                    <TableCell className="font-medium">{asset.name}</TableCell>
                    <TableCell>
                      <span className={cn(
                        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
                        color.bg, color.text,
                      )}>
                        <span className={cn("h-1.5 w-1.5 rounded-full", color.dot)} />
                        {asset.category}
                      </span>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      ${asset.purchase_price.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-muted-foreground">
                      {asset.market_value != null
                        ? `$${asset.market_value.toLocaleString("en-US", { minimumFractionDigits: 2 })}`
                        : "—"}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {new Date(asset.date_acquired).toLocaleDateString("en-US", {
                        month: "short", day: "numeric", year: "numeric",
                      })}
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost" size="sm" className="h-7 w-7 p-0"
                          onClick={() => { setEditingAsset(asset); setEditOpen(true); }}
                          title="Edit"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost" size="sm" className="h-7 px-2 gap-1"
                          onClick={() => { setSellingAsset(asset); setSellOpen(true); }}
                          title="Sell"
                        >
                          <DollarSign className="h-3.5 w-3.5" />
                          <span className="text-xs">Sell</span>
                        </Button>
                        <Button
                          variant="ghost" size="sm"
                          className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                          onClick={() => { setDeletingAsset(asset); setDeleteOpen(true); }}
                          title="Delete"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          </div>
        )}
      </CardContent>

      {/* ── Dialogs ── */}
      <SellAssetDialog
        open={sellOpen}
        onOpenChange={setSellOpen}
        asset={sellingAsset}
        onSubmit={handleSellAsset}
      />

      <BulkSellDialog
        open={bulkSellOpen}
        onOpenChange={setBulkSellOpen}
        assets={selectedAssets}
        categories={categories}
        onSubmit={handleBulkSell}
      />

      <EditAssetDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        asset={editingAsset}
        categories={categories}
        onSubmit={handleEditAsset}
      />

      <DeleteAssetDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        asset={deletingAsset}
        onConfirm={handleDeleteAsset}
      />

      <ManageCategoriesDialog
        open={manageCategoriesOpen}
        onOpenChange={setManageCategoriesOpen}
        categories={categories}
        assets={assets}
        onReorder={handleReorderCategories}
        onSave={handleSaveCategory}
        onDelete={handleDeleteCategory}
      />
    </Card>
  );
}
