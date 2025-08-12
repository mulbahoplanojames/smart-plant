"use client";
import { cn } from "@/lib/utils";

interface SensorGaugeProps {
  value: number;
  min: number;
  max: number;
  threshold?: number;
  highThreshold?: number;
  label?: string;
  color?: "green" | "blue" | "orange" | "purple" | "red";
}

export function SensorGauge({
  value,
  min,
  max,
  threshold,
  highThreshold,
  label,
  color = "green",
}: SensorGaugeProps) {
  // Calculate percentage for gauge
  const percentage = Math.min(
    100,
    Math.max(0, ((value - min) / (max - min)) * 100)
  );

  // Determine color based on thresholds
  const getColor = () => {
    if (threshold !== undefined && value < threshold) {
      return "bg-red-500";
    }
    if (highThreshold !== undefined && value > highThreshold) {
      return "bg-red-500";
    }

    switch (color) {
      case "blue":
        return "bg-blue-500";
      case "orange":
        return "bg-orange-500";
      case "purple":
        return "bg-purple-500";
      case "red":
        return "bg-red-500";
      default:
        return "bg-emerald-500";
    }
  };

  return (
    <div className="w-full">
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={cn("h-full rounded-full", getColor())}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {label && (
        <div className="mt-1 text-xs text-muted-foreground flex justify-between">
          <span>{label}</span>
          <span>
            {threshold !== undefined && (
              <span className="text-red-500 mr-2">Min: {threshold}</span>
            )}
            {highThreshold !== undefined && (
              <span className="text-red-500">Max: {highThreshold}</span>
            )}
          </span>
        </div>
      )}
    </div>
  );
}
