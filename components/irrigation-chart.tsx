"use client";

import * as React from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

type Telemetry = { at: string; moisture: number };

export function IrrigationChart({
  data,
  threshold,
  pumpEvents = [],
}: {
  data: Telemetry[];
  threshold?: number;
  pumpEvents?: string[];
}) {
  const chartData = React.useMemo(
    () =>
      data.map((d) => ({
        ts: new Date(d.at).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        moisture: d.moisture,
        at: d.at,
      })),
    [data]
  );

  // Find indices of pump events in the chart data
  const pumpEventIndices = React.useMemo(() => {
    if (!pumpEvents.length) return [];
    return pumpEvents
      .map((eventAt) => {
        const index = chartData.findIndex((d) => d.at === eventAt);
        return index >= 0 ? index : null;
      })
      .filter((i) => i !== null) as number[];
  }, [chartData, pumpEvents]);

  return (
    <ChartContainer
      config={{
        moisture: {
          label: "Soil Moisture",
          color: "hsl(var(--primary))",
        },
      }}
      className="w-full h-[400px]"
    >
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData}>
          <CartesianGrid vertical={false} strokeDasharray="4 4" />
          <XAxis dataKey="ts" tick={{ fontSize: 12 }} />
          <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
          <ChartTooltip content={<ChartTooltipContent />} />

          {/* Threshold line */}
          {threshold !== undefined && (
            <ReferenceLine
              y={threshold}
              stroke="rgba(239, 68, 68, 0.7)"
              strokeDasharray="3 3"
              label={{
                value: `Threshold: ${threshold}%`,
                position: "insideBottomRight",
                fill: "rgba(239, 68, 68, 0.9)",
                fontSize: 12,
              }}
            />
          )}

          {/* Optimal range */}
          <ReferenceLine
            y={60}
            stroke="rgba(34, 197, 94, 0.5)"
            strokeDasharray="2 2"
            label={{
              value: "Optimal: 60%+",
              position: "insideTopRight",
              fill: "rgba(34, 197, 94, 0.7)",
              fontSize: 10,
            }}
          />

          {/* Moisture area */}
          <Area
            type="monotone"
            dataKey="moisture"
            stroke="hsl(var(--primary))"
            fill="hsl(var(--primary))"
            fillOpacity={0.2}
            strokeWidth={2}
          />

          {/* Pump event markers */}
          {pumpEventIndices.map((index, i) => (
            <ReferenceLine
              key={i}
              x={chartData[index].ts}
              stroke="rgba(59, 130, 246, 0.8)"
              strokeWidth={3}
              label={{
                value: "💧",
                position: "top",
                fontSize: 16,
              }}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}
