"use client";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { GlassCard } from "@/components/ui/GlassCard";
import type { QuestHistoryEntry } from "@/types";
import { format, parseISO } from "date-fns";

export function QuestHistoryChart({ data }: { data: QuestHistoryEntry[] }) {
  const chartData = [...data]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((entry) => ({
      ...entry,
      label: format(parseISO(entry.date), "MMM d"),
    }));

  if (chartData.length === 0) {
    return (
      <GlassCard padding="lg" className="flex items-center justify-center">
        <p className="font-body text-sm text-ink-muted">No quest history yet — complete your first quest.</p>
      </GlassCard>
    );
  }

  return (
    <GlassCard padding="md">
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="completionGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#7C5CFF" stopOpacity={0.4} />
                <stop offset="100%" stopColor="#7C5CFF" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
            <XAxis
              dataKey="label"
              stroke="#565B72"
              fontSize={11}
              fontFamily="var(--font-mono)"
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="#565B72"
              fontSize={11}
              fontFamily="var(--font-mono)"
              tickLine={false}
              axisLine={false}
              domain={[0, 100]}
              width={36}
            />
            <Tooltip
              contentStyle={{
                background: "#181B26",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 10,
                fontSize: 12,
                fontFamily: "var(--font-body)",
              }}
              labelStyle={{ color: "#EEF0F7" }}
              formatter={(value: number, name: string) =>
                name === "completion_percent" ? [`${value}%`, "Completion"] : [value, "XP Earned"]
              }
            />
            <Area
              type="monotone"
              dataKey="completion_percent"
              stroke="#7C5CFF"
              strokeWidth={2}
              fill="url(#completionGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </GlassCard>
  );
}
