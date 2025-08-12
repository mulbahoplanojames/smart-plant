"use client";

import * as React from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

type ActionRow = {
  id: string;
  deviceId: string;
  action: string;
  state?: boolean | null;
  status?: string;
  createdAt?: string;
};

export function WaterUsageChart({ data }: { data: ActionRow[] }) {
  const chartData = React.useMemo(() => {
    // Group by day and count pump activations
    const dailyUsage = data.reduce((acc, action) => {
      if (!action.createdAt) return acc;

      const date = new Date(action.createdAt).toLocaleDateString();
      if (!acc[date]) {
        acc[date] = { date, activations: 0, usage: 0 };
      }
      acc[date].activations += 1;
      acc[date].usage += 0.5; // Assume 0.5L per activation
      return acc;
    }, {} as Record<string, { date: string; activations: number; usage: number }>);

    return Object.values(dailyUsage).slice(-7); // Last 7 days
  }, [data]);

  return (
    <ChartContainer
      config={{
        usage: {
          label: "Water Usage (L)",
          color: "hsl(var(--primary))",
        },
      }}
      className="w-full h-[300px]"
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData}>
          <CartesianGrid vertical={false} strokeDasharray="4 4" />
          <XAxis dataKey="date" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Bar
            dataKey="usage"
            fill="hsl(var(--primary))"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}
