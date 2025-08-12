"use client";
import { ArrowDown, ArrowUp, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface SensorTrendProps {
  value: number;
  precision?: number;
}

export function SensorTrend({ value, precision = 0 }: SensorTrendProps) {
  if (Math.abs(value) < 0.1) {
    return (
      <div className="flex items-center text-muted-foreground">
        <Minus className="h-4 w-4 mr-1" />
        <span className="text-sm">Stable</span>
      </div>
    );
  }

  const isPositive = value > 0;
  const formattedValue = value.toFixed(precision);

  return (
    <div
      className={cn(
        "flex items-center",
        isPositive ? "text-green-500" : "text-red-500"
      )}
    >
      {isPositive ? (
        <ArrowUp className="h-4 w-4 mr-1" />
      ) : (
        <ArrowDown className="h-4 w-4 mr-1" />
      )}
      <span className="text-sm">{formattedValue}</span>
    </div>
  );
}
