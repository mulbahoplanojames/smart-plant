"use client";
import { Battery, Clock, Signal } from "lucide-react";
import { cn } from "@/lib/utils";

interface DeviceStatusProps {
  connected: boolean;
  lastSeen: string | null;
  batteryLevel: number | null;
  className?: string;
}

export function DeviceStatus({
  connected,
  lastSeen,
  batteryLevel,
  className,
}: DeviceStatusProps) {
  const getBatteryColor = () => {
    if (!batteryLevel) return "text-muted-foreground";
    if (batteryLevel < 20) return "text-red-500";
    if (batteryLevel < 50) return "text-orange-500";
    return "text-green-500";
  };

  return (
    <div className={cn("flex items-center gap-4", className)}>
      <div className="flex items-center gap-1">
        <Signal
          className={cn(
            "h-4 w-4",
            connected ? "text-green-500" : "text-muted-foreground"
          )}
        />
        <span className="text-xs text-muted-foreground">
          {connected ? "Connected" : "Offline"}
        </span>
      </div>

      {batteryLevel && (
        <div className="flex items-center gap-1">
          <Battery className={cn("h-4 w-4", getBatteryColor())} />
          <span className="text-xs text-muted-foreground">{batteryLevel}%</span>
        </div>
      )}

      {lastSeen && (
        <div className="hidden sm:flex items-center gap-1">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">
            {new Date(lastSeen).toLocaleString()}
          </span>
        </div>
      )}
    </div>
  );
}
