"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Sprout,
  Plus,
  Wifi,
  WifiOff,
  Droplets,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  RefreshCw,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { fetchJSON } from "@/lib/fetch-json";
import { useRouter } from "next/navigation";

type Device = {
  id: string;
  name: string;
  threshold?: number | null;
  lastMoisture?: number | null;
  lastSeen?: string | null;
};

export default function DevicesPage() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [id, setId] = useState("");
  const [copiedSecret, setCopiedSecret] = useState<string | null>(null);
  const router = useRouter();

  const load = async () => {
    setLoading(true);
    const res = await fetchJSON<{ data?: Device[]; error?: string }>(
      "/api/devices"
    );
    if (!res.ok) {
      if (res.status === 401) router.push("/login");
      else alert(`Failed to load devices: ${res.error}`);
      setLoading(false);
      return;
    }
    setDevices(res.data?.data || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addDevice = async () => {
    if (!id.trim() || !name.trim()) return;

    setAdding(true);
    const created = await fetchJSON<{ secret?: string; error?: string }>(
      "/api/devices",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: id.trim(), name: name.trim() }),
      }
    );

    if (!created.ok) {
      alert(
        `Failed to add device: ${
          created.error || (created.data as any)?.message || "Unknown error"
        }`
      );
      setAdding(false);
      return;
    }

    // Copy secret to clipboard and show success
    if (created.data?.secret) {
      await navigator.clipboard.writeText(created.data.secret);
      setCopiedSecret(created.data.secret);
      setTimeout(() => setCopiedSecret(null), 5000);
    }

    await load();
    setName("");
    setId("");
    setAdding(false);
  };

  const getConnectionStatus = (device: Device) => {
    if (!device.lastSeen) return "never";

    const lastSeenTime = new Date(device.lastSeen).getTime();
    const now = Date.now();
    const diffMinutes = (now - lastSeenTime) / (1000 * 60);

    if (diffMinutes < 5) return "online";
    if (diffMinutes < 30) return "recent";
    return "offline";
  };

  const getConnectionBadge = (status: string) => {
    switch (status) {
      case "online":
        return (
          <Badge
            variant="secondary"
            className="bg-green-50 text-green-700 border-green-200"
          >
            <Wifi className="w-3 h-3 mr-1" />
            Online
          </Badge>
        );
      case "recent":
        return (
          <Badge
            variant="secondary"
            className="bg-orange-50 text-orange-700 border-orange-200"
          >
            <Wifi className="w-3 h-3 mr-1" />
            Recent
          </Badge>
        );
      case "offline":
        return (
          <Badge
            variant="secondary"
            className="bg-red-50 text-red-700 border-red-200"
          >
            <WifiOff className="w-3 h-3 mr-1" />
            Offline
          </Badge>
        );
      default:
        return (
          <Badge
            variant="secondary"
            className="bg-gray-50 text-gray-700 border-gray-200"
          >
            <WifiOff className="w-3 h-3 mr-1" />
            Unknown
          </Badge>
        );
    }
  };

  const getMoistureStatus = (
    moisture?: number | null,
    threshold?: number | null
  ) => {
    if (moisture === null || moisture === undefined) return "unknown";
    const thresholdValue = threshold || 35;

    if (moisture < thresholdValue) return "low";
    if (moisture < thresholdValue + 15) return "moderate";
    return "good";
  };

  const getMoistureBadge = (
    moisture?: number | null,
    threshold?: number | null
  ) => {
    const status = getMoistureStatus(moisture, threshold);

    switch (status) {
      case "good":
        return (
          <Badge
            variant="secondary"
            className="bg-green-50 text-green-700 border-green-200"
          >
            <Droplets className="w-3 h-3 mr-1" />
            Good
          </Badge>
        );
      case "moderate":
        return (
          <Badge
            variant="secondary"
            className="bg-orange-50 text-orange-700 border-orange-200"
          >
            <Droplets className="w-3 h-3 mr-1" />
            Moderate
          </Badge>
        );
      case "low":
        return (
          <Badge
            variant="secondary"
            className="bg-red-50 text-red-700 border-red-200"
          >
            <AlertTriangle className="w-3 h-3 mr-1" />
            Low
          </Badge>
        );
      default:
        return (
          <Badge
            variant="secondary"
            className="bg-gray-50 text-gray-700 border-gray-200"
          >
            <Droplets className="w-3 h-3 mr-1" />
            Unknown
          </Badge>
        );
    }
  };

  return (
    <div className="grid gap-6">
      {/* Header */}
      <Card className="card-elevated">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl flex items-center gap-2">
                <Sprout className="w-5 h-5 text-emerald-600" />
                Device Management
              </CardTitle>
              <CardDescription className="mt-1">
                Register and monitor your IoT irrigation devices
              </CardDescription>
            </div>
            <Button
              onClick={load}
              disabled={loading}
              variant="outline"
              size="sm"
            >
              <RefreshCw
                className={cn("w-4 h-4 mr-2", loading && "animate-spin")}
              />
              Refresh
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Add Device Form */}
      <Card className="card-elevated">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Plus className="w-5 h-5 text-blue-600" />
            Register New Device
          </CardTitle>
          <CardDescription>
            Add a new IoT device to your irrigation system
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          {copiedSecret && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2 text-green-800">
                <CheckCircle2 className="w-4 h-4" />
                <span className="font-medium">
                  Device registered successfully!
                </span>
              </div>
              <div className="mt-2 text-sm text-green-700">
                Device secret has been copied to your clipboard. Paste it into
                your ESP firmware.
              </div>
              <div className="mt-2 p-2 bg-green-100 rounded font-mono text-xs break-all">
                {copiedSecret}
              </div>
            </div>
          )}

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="deviceId">Device ID</Label>
              <Input
                id="deviceId"
                value={id}
                onChange={(e) => setId(e.target.value)}
                placeholder="esp32-garden-01"
                disabled={adding}
              />
              <div className="text-xs text-muted-foreground">
                Unique identifier for your device (e.g., esp32-garden-01)
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="deviceName">Device Name</Label>
              <Input
                id="deviceName"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Garden Basil Sensor"
                disabled={adding}
              />
              <div className="text-xs text-muted-foreground">
                Friendly name for easy identification
              </div>
            </div>
          </div>

          <Button
            onClick={addDevice}
            disabled={adding || !id.trim() || !name.trim()}
            className="w-fit"
          >
            {adding ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Registering...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" />
                Register Device
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Devices Grid */}
      <div className="grid gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            Your Devices ({devices.length})
          </h2>
        </div>

        {loading ? (
          <Card className="card-elevated">
            <CardContent className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-muted-foreground">
                Loading devices...
              </span>
            </CardContent>
          </Card>
        ) : devices.length > 0 ? (
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
            {devices.map((device) => {
              const connectionStatus = getConnectionStatus(device);
              const moistureStatus = getMoistureStatus(
                device.lastMoisture,
                device.threshold
              );

              return (
                <Card
                  key={device.id}
                  className="card-elevated hover:shadow-lg transition-shadow"
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            "p-2 rounded-lg",
                            connectionStatus === "online"
                              ? "bg-green-50 text-green-600"
                              : connectionStatus === "recent"
                              ? "bg-orange-50 text-orange-600"
                              : "bg-gray-50 text-gray-600"
                          )}
                        >
                          <Sprout className="w-4 h-4" />
                        </div>
                        <div>
                          <CardTitle className="text-base">
                            {device.name}
                          </CardTitle>
                          <div className="text-xs text-muted-foreground mt-1">
                            ID: {device.id}
                          </div>
                        </div>
                      </div>
                      {getConnectionBadge(connectionStatus)}
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="grid gap-3">
                      {/* Moisture Level */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Droplets className="w-4 h-4 text-blue-500" />
                          <span className="text-sm font-medium">Moisture</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-bold">
                            {device.lastMoisture ?? "--"}%
                          </span>
                          {getMoistureBadge(
                            device.lastMoisture,
                            device.threshold
                          )}
                        </div>
                      </div>

                      {/* Threshold */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Settings className="w-4 h-4 text-purple-500" />
                          <span className="text-sm font-medium">Threshold</span>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {device.threshold ?? 35}%
                        </span>
                      </div>

                      {/* Last Seen */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-gray-500" />
                          <span className="text-sm font-medium">Last Seen</span>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {device.lastSeen
                            ? new Date(device.lastSeen).toLocaleString()
                            : "Never"}
                        </span>
                      </div>

                      {/* Progress bar for moisture */}
                      <div className="mt-2">
                        <div className="flex justify-between text-xs text-muted-foreground mb-1">
                          <span>Moisture Level</span>
                          <span>{device.lastMoisture ?? 0}%</span>
                        </div>
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={cn(
                              "h-full rounded-full transition-all",
                              moistureStatus === "good"
                                ? "bg-green-500"
                                : moistureStatus === "moderate"
                                ? "bg-orange-500"
                                : "bg-red-500"
                            )}
                            style={{
                              width: `${Math.min(
                                100,
                                Math.max(0, device.lastMoisture || 0)
                              )}%`,
                            }}
                          />
                        </div>
                        {device.threshold && (
                          <div className="text-xs text-muted-foreground mt-1">
                            Threshold: {device.threshold}%
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="card-elevated">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <Sprout className="w-12 h-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium text-muted-foreground mb-2">
                No devices registered
              </h3>
              <p className="text-sm text-muted-foreground max-w-sm mb-4">
                Get started by registering your first IoT irrigation device
                using the form above.
              </p>
              <Button
                variant="outline"
                onClick={() => document.getElementById("deviceId")?.focus()}
              >
                <Plus className="w-4 h-4 mr-2" />
                Register First Device
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
