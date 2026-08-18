"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Package } from "lucide-react";
import { InventoryItemCard } from "@/features/inventory/InventoryItemCard";
import { inventoryApi } from "@/lib/api";
import { useUIStore } from "@/store/useUIStore";
import type { InventoryItem } from "@/types";

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const pushToast = useUIStore((s) => s.pushToast);

  const load = useCallback(async () => {
    setIsLoading(true);
    const result = await inventoryApi.list();
    setItems(result);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleUse(inventoryItemId: string) {
    try {
      const result = await inventoryApi.use(inventoryItemId);
      pushToast({ variant: "success", title: "Item used", description: result.detail });
      await load();
    } catch {
      pushToast({ variant: "danger", title: "Could not use item" });
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink-primary">Inventory</h1>
        <p className="mt-1 font-body text-sm text-ink-muted">
          Consumables and permanent items earned from quests, bosses, and chests.
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-arc-400" />
        </div>
      ) : items.length === 0 ? (
        <div className="glass-panel flex flex-col items-center justify-center gap-2 py-16 text-center">
          <Package className="h-8 w-8 text-ink-faint" />
          <p className="font-body text-sm text-ink-muted">
            Your inventory is empty. Complete quests and defeat bosses to earn items.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {items.map((item) => (
            <InventoryItemCard key={item.id} inventoryItem={item} onUse={handleUse} />
          ))}
        </div>
      )}
    </div>
  );
}
