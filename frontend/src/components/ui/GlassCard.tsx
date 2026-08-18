import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  raised?: boolean;
  glow?: "none" | "arc" | "cyan" | "amber" | "crimson";
  padding?: "none" | "sm" | "md" | "lg";
}

const GLOW_CLASSES: Record<NonNullable<GlassCardProps["glow"]>, string> = {
  none: "",
  arc: "shadow-glow-arc",
  cyan: "shadow-glow-cyan",
  amber: "shadow-glow-amber",
  crimson: "shadow-glow-crimson",
};

const PADDING_CLASSES: Record<NonNullable<GlassCardProps["padding"]>, string> = {
  none: "",
  sm: "p-4",
  md: "p-5 sm:p-6",
  lg: "p-6 sm:p-8",
};

/** The base glassmorphism surface every panel in ASCEND is built from. */
export function GlassCard({
  raised = false,
  glow = "none",
  padding = "md",
  className,
  children,
  ...props
}: GlassCardProps) {
  return (
    <div
      className={cn(
        raised ? "glass-panel-raised" : "glass-panel",
        GLOW_CLASSES[glow],
        PADDING_CLASSES[padding],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
