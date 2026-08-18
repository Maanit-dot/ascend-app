"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { GlassCard } from "@/components/ui/GlassCard";
import { resolveIcon } from "@/lib/icon-map";
import { cn } from "@/lib/utils";
import type { InventoryItem, ItemRarity } from "@/types";

const RARITY_STYLES: Record<ItemRarity, { border: string; text: string; bg: string }> = {
  common: { border: "border-panel-border", text: "text-ink-secondary", bg: "bg-void/40" },
  uncommon: { border: "border-cyan-500/30", text: "text-cyan-400", bg: "bg-cyan-500/[0.06]" },
  rare: { border: "border-arc-500/30", text: "text-arc-400", bg: "bg-arc-500/[0.06]" },
  epic: { border: "border-amber-500/30", text: "text-amber-400", bg: "bg-amber-500/[0.06]" },
  legendary: { border: "border-crimson-500/30", text: "text-crimson-400", bg: "bg-crimson-500/[0.06]" },
};

export function InventoryItemCard({
  inventoryItem,
  onUse,
}: {
  inventoryItem: InventoryItem;
  onUse: (id: string) => Promise<void>;
}) {
  const [isUsing, setIsUsing] = useState(false);
  const Icon = resolveIcon(inventoryItem.item.icon_key);
  const style = RARITY_STYLES[inventoryItem.item.rarity];

  async function handleUse() {
    setIsUsing(true);
    try {
      await onUse(inventoryItem.id);
    } finally {
      setIsUsing(false);
    }
  }

  return (
    <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}>
      <GlassCard padding="md" className={cn("relative", style.border)}>
        <div className="flex items-start justify-between">
          <div className={cn("flex h-11 w-11 items-center justify-center rounded-lg border", style.border, style.bg)}>
            <Icon className={cn("h-5 w-5", style.text)} />
          </div>
          <span className="rounded-full bg-void/60 px-2 py-0.5 font-mono text-xs font-semibold text-ink-secondary">
            ×{inventoryItem.quantity}
          </span>
        </div>

        <h3 className="mt-3 font-body text-sm font-semibold text-ink-primary">{inventoryItem.item.name}</h3>
        <p className={cn("hud-label mt-0.5", style.text)}>{inventoryItem.item.rarity}</p>
        <p className="mt-2 font-body text-xs text-ink-muted">{inventoryItem.item.description}</p>

        {inventoryItem.is_active_buff && (
          <p className="mt-2 rounded-md bg-cyan-500/10 px-2 py-1 font-mono text-[11px] text-cyan-400">
            Active buff
          </p>
        )}

        <button
          onClick={handleUse}
          disabled={isUsing || inventoryItem.quantity <= 0}
          className="btn-secondary mt-3 w-full text-xs"
        >
          {isUsing ? "Using..." : "Use Item"}
        </button>
      </GlassCard>
    </motion.div>
  );
}
