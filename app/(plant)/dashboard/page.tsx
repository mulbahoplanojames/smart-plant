"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { MoistureChart } from "@/components/telemetry-chart";
import {
  Activity,
  AlertTriangle,
  Battery,
  Clock,
  Droplets,
  Leaf,
  Signal,
  Thermometer,
  Waves,
} from "lucide-react";
import { fetchJSON } from "@/lib/fetch-json";
import { useRouter } from "next/navigation";
import { SensorGauge } from "@/components/sensor-gauge";
import { SensorTrend } from "@/components/sensor-trend";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DeviceStatus } from "@/components/device-status";

type Telemetry = {
  at: string;
  moisture: number;
  pumpOn: boolean;
};

// Extended telemetry with simulated values
type ExtendedTelemetry = Telemetry & {
  humidity?: number;
  temperature?: number;
  pH?: number;
  batteryLevel?: number;
};

export default function DashboardPage() {
  const [devices, setDevices] = useState<Array<{ id: string; name: string }>>(
    []
  );
  const [deviceId, setDeviceId] = useState("demo-device-1");
  const [moisture, setMoisture] = useState<number | null>(null);
  const [pumpOn, setPumpOn] = useState(false);
  const [history, setHistory] = useState<Telemetry[]>([]);
  const [extendedHistory, setExtendedHistory] = useState<ExtendedTelemetry[]>(
    []
  );
  const [lowThreshold, setLowThreshold] = useState(316);
  const [connected, setConnected] = useState(false);
  const [lastSeen, setLastSeen] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const esRef = useRef<EventSource | null>(null);

  // Simulated sensor values
  const [humidity, setHumidity] = useState<number | null>(null);
  const [temperature, setTemperature] = useState<number | null>(null);
  const [pH, setPH] = useState<number | null>(null);
  const [batteryLevel, setBatteryLevel] = useState<number | null>(null);

  // Trends (24h change)
  const [moistureTrend, setMoistureTrend] = useState<number>(0);
  const [humidityTrend, setHumidityTrend] = useState<number>(0);
  const [temperatureTrend, setTemperatureTrend] = useState<number>(0);
  const [pHTrend, setPHTrend] = useState<number>(0);

  useEffect(() => {
    // Load available devices
    const loadDevices = async () => {
      const res = await fetchJSON<{
        data: Array<{ id: string; name: string }>;
      }>("/api/devices");
      if (res.ok && res.data?.data) {
        setDevices(res.data.data);
        if (res.data.data.length > 0 && !deviceId) {
          setDeviceId(res.data.data[0].id);
        }
      }
    };
    loadDevices();
  }, [deviceId]);

  useEffect(() => {
    // Load initial telemetry + device meta
    const load = async () => {
      setLoading(true);
      const res = await fetchJSON<{ data: Telemetry[] }>(
        `/api/telemetry?deviceId=${encodeURIComponent(deviceId)}&limit=100`
      );
      if (!res.ok) {
        if (res.status === 401) router.push("/login");
        setLoading(false);
        return;
      }
      const rows = res.data?.data || [];
      setHistory(rows);

      // Generate extended telemetry with simulated values
      const extended = rows.map((row) => {
        const date = new Date(row.at);
        const hour = date.getHours();

        // Simulate values based on time of day and some randomness
        const humidity = Math.min(
          95,
          Math.max(
            40,
            70 +
              Math.sin((hour / 24) * Math.PI * 2) * 15 +
              (Math.random() * 10 - 5)
          )
        );

        const temperature = Math.min(
          35,
          Math.max(
            15,
            22 +
              Math.sin((hour / 24) * Math.PI * 2) * 5 +
              (Math.random() * 4 - 2)
          )
        );

        const pH = Math.min(
          8,
          Math.max(
            5,
            6.5 +
              Math.sin((hour / 12) * Math.PI) * 0.5 +
              (Math.random() * 0.4 - 0.2)
          )
        );

        // Battery decreases over time
        const batteryLevel = Math.max(
          20,
          100 - ((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24 * 7)) * 10
        );

        return {
          ...row,
          humidity: Math.round(humidity * 10) / 10,
          temperature: Math.round(temperature * 10) / 10,
          pH: Math.round(pH * 10) / 10,
          batteryLevel: Math.round(batteryLevel),
        };
      });

      setExtendedHistory(extended);

      if (rows.length) {
        const latest = rows[rows.length - 1];
        setMoisture(latest.moisture);
        setPumpOn(!!latest.pumpOn);
        setLastSeen(latest.at);

        // Set latest simulated values
        if (extended.length) {
          const latestExt = extended[extended.length - 1];
          setHumidity(latestExt.humidity || null);
          setTemperature(latestExt.temperature || null);
          setPH(latestExt.pH || null);
          setBatteryLevel(latestExt.batteryLevel || null);

          // Calculate trends (24h change)
          if (extended.length > 24) {
            const prev = extended[extended.length - 25]; // ~24h ago
            setMoistureTrend(latestExt.moisture - prev.moisture);
            setHumidityTrend((latestExt.humidity || 0) - (prev.humidity || 0));
            setTemperatureTrend(
              (latestExt.temperature || 0) - (prev.temperature || 0)
            );
            setPHTrend((latestExt.pH || 0) - (prev.pH || 0));
          }
        }
      }

      const devs = await fetchJSON<{ data: any[] }>("/api/devices");
      if (devs.ok) {
        const d = devs.data?.data?.find((x: any) => x.id === deviceId);
        if (d) {
          setLowThreshold(d.threshold ?? 316);
          setLastSeen(d.lastSeen || lastSeen);
        }
      }
      setLoading(false);
    };

    if (deviceId) {
      load();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deviceId]);

  useEffect(() => {
    // Live SSE stream
    if (!deviceId) return;

    if (esRef.current) {
      esRef.current.close();
      esRef.current = null;
    }

    const es = new EventSource(
      `/api/telemetry/stream?deviceId=${encodeURIComponent(deviceId)}`
    );
    es.onopen = () => setConnected(true);
    es.onerror = () => setConnected(false);
    es.onmessage = (ev) => {
      try {
        const rows: Telemetry[] = JSON.parse(ev.data);
        if (rows.length) {
          setHistory((prev) => [...prev, ...rows].slice(-200));

          // Generate extended telemetry with simulated values for new rows
          const extended = rows.map((row) => {
            const date = new Date(row.at);
            const hour = date.getHours();

            // Simulate values based on time of day and some randomness
            const humidity = Math.min(
              95,
              Math.max(
                40,
                70 +
                  Math.sin((hour / 24) * Math.PI * 2) * 15 +
                  (Math.random() * 10 - 5)
              )
            );

            const temperature = Math.min(
              35,
              Math.max(
                15,
                22 +
                  Math.sin((hour / 24) * Math.PI * 2) * 5 +
                  (Math.random() * 4 - 2)
              )
            );

            const pH = Math.min(
              8,
              Math.max(
                5,
                6.5 +
                  Math.sin((hour / 12) * Math.PI) * 0.5 +
                  (Math.random() * 0.4 - 0.2)
              )
            );

            // Battery decreases over time
            const batteryLevel = Math.max(
              20,
              100 -
                ((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24 * 7)) * 10
            );

            return {
              ...row,
              humidity: Math.round(humidity * 10) / 10,
              temperature: Math.round(temperature * 10) / 10,
              pH: Math.round(pH * 10) / 10,
              batteryLevel: Math.round(batteryLevel),
            };
          });

          setExtendedHistory((prev) => [...prev, ...extended].slice(-200));

          const latest = rows[rows.length - 1];
          setMoisture(latest.moisture);
          setPumpOn(!!latest.pumpOn);
          setLastSeen(latest.at);

          // Set latest simulated values
          if (extended.length) {
            const latestExt = extended[extended.length - 1];
            setHumidity(latestExt.humidity || null);
            setTemperature(latestExt.temperature || null);
            setPH(latestExt.pH || null);
            setBatteryLevel(latestExt.batteryLevel || null);
          }
        }
      } catch {
        // ignore
      }
    };
    esRef.current = es;
    return () => {
      es.close();
      esRef.current = null;
    };
  }, [deviceId]);

  const critical = (moisture ?? 100) < lowThreshold;
  const avg = useMemo(() => {
    if (!history.length) return 0;
    return Math.round(
      history.reduce((a, b) => a + b.moisture, 0) / history.length
    );
  }, [history]);

  const handlePumpToggle = async (next: boolean) => {
    setPumpOn(next);
    const res = await fetch(`/api/actions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ deviceId, action: "pump", state: next }),
    }).catch(() => null);
    if (!res || !res.ok) {
      alert("Failed to send pump command.");
    }
  };

  return (
    <div className="grid gap-6">
      {/* Device selector */}
      <Card className="card-elevated">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Smart Plant Dashboard</CardTitle>
          <CardDescription>
            Real-time monitoring and control of your irrigation system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <div className="grid gap-1 min-w-[200px]">
              <Label htmlFor="deviceSelect">Select Device</Label>
              <Select
                value={deviceId}
                onValueChange={setDeviceId}
                disabled={loading || !devices.length}
              >
                <SelectTrigger id="deviceSelect">
                  <SelectValue
                    placeholder={loading ? "Loading..." : "Select device"}
                  />
                </SelectTrigger>
                <SelectContent>
                  {devices.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DeviceStatus
              connected={connected}
              lastSeen={lastSeen}
              batteryLevel={batteryLevel}
              className="ml-auto"
            />
          </div>
        </CardContent>
      </Card>

      {/* Primary metrics */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card className="card-elevated">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base">Soil Moisture</CardTitle>
            {critical ? (
              <Badge variant="destructive">
                <AlertTriangle className="w-3 h-3 mr-1" />
                Low
              </Badge>
            ) : (
              <Badge variant="secondary">OK</Badge>
            )}
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="text-4xl font-bold">{moisture ?? "--"}</div>
                <div className="text-muted-foreground">% - Value</div>
              </div>
              <SensorTrend value={moistureTrend} />
            </div>
            <div className="mt-4">
              <SensorGauge
                value={moisture || 0}
                min={0}
                max={100}
                threshold={lowThreshold}
                label="Current moisture"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="card-elevated">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base">Air Humidity</CardTitle>
            <Droplets className="w-4 h-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="text-4xl font-bold">{humidity ?? "--"}</div>
                <div className="text-muted-foreground">%</div>
              </div>
              <SensorTrend value={humidityTrend} />
            </div>
            <div className="mt-4">
              <SensorGauge
                value={humidity || 0}
                min={0}
                max={100}
                threshold={40}
                label="Current humidity"
                color="blue"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="card-elevated">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base">Temperature</CardTitle>
            <Thermometer className="w-4 h-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="text-4xl font-bold">{temperature ?? "--"}</div>
                <div className="text-muted-foreground">°C</div>
              </div>
              <SensorTrend value={temperatureTrend} />
            </div>
            <div className="mt-4">
              <SensorGauge
                value={temperature || 0}
                min={0}
                max={40}
                threshold={30}
                label="Current temperature"
                color="orange"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="card-elevated">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base">Soil pH</CardTitle>
            <Leaf className="w-4 h-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="text-4xl font-bold">
                  {pH?.toFixed(1) ?? "--"}
                </div>
                <div className="text-muted-foreground">pH</div>
              </div>
              <SensorTrend value={pHTrend} precision={1} />
            </div>
            <div className="mt-4">
              <SensorGauge
                value={pH || 0}
                min={4}
                max={9}
                threshold={5.5}
                highThreshold={7.5}
                label="Current pH"
                color="purple"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Secondary metrics */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card className="card-elevated">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base">Averages & Stats</CardTitle>
            <Activity className="w-4 h-4 text-emerald-600" />
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-muted-foreground">
                  Avg Moisture (24h)
                </div>
                <div className="text-xl font-semibold">{avg}%</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">
                  Last Watering
                </div>
                <div className="text-sm">
                  {history.findLast((h) => h.pumpOn)?.at
                    ? new Date(
                        history.findLast((h) => h.pumpOn)!.at
                      ).toLocaleString()
                    : "—"}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-muted-foreground">
                  Moisture Threshold
                </div>
                <div className="text-xl font-semibold">{lowThreshold}%</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Pump Status</div>
                <div className="flex items-center gap-2">
                  <Badge variant={pumpOn ? "default" : "secondary"}>
                    {pumpOn ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card id="pump" className="card-elevated">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base">Pump Control</CardTitle>
            <Waves className="w-4 h-4 text-blue-500" />
          </CardHeader>
          <CardContent className="grid gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Waves className="w-4 h-4" />
                <span>Manual Pump</span>
              </div>
              <Switch
                checked={pumpOn}
                onCheckedChange={handlePumpToggle}
                aria-label="Toggle pump"
              />
            </div>
            <div className="grid gap-1">
              <Label htmlFor="lowThreshold">Low moisture threshold (%)</Label>
              <Input
                id="lowThreshold"
                type="number"
                value={lowThreshold}
                onChange={(e) =>
                  setLowThreshold(Number.parseInt(e.target.value || "0", 10))
                }
              />
            </div>
            <Button
              variant="outline"
              onClick={async () => {
                const res = await fetch("/api/actions", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    deviceId,
                    action: "calibrate",
                    value: { lowThreshold },
                  }),
                }).catch(() => null);
                if (!res || !res.ok) alert("Failed to save threshold.");
              }}
            >
              Save Threshold
            </Button>
          </CardContent>
        </Card>

        <Card className="card-elevated">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base">System Status</CardTitle>
            <Clock className="w-4 h-4 text-emerald-600" />
          </CardHeader>
          <CardContent className="grid gap-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-muted-foreground">Last Seen</div>
                <div className="text-sm">
                  {lastSeen ? new Date(lastSeen).toLocaleString() : "—"}
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Connection</div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={connected ? "default" : "secondary"}
                    className={cn(connected ? "bg-green-600" : "")}
                  >
                    <Signal className="w-3 h-3 mr-1" />
                    {connected ? "Live" : "Idle"}
                  </Badge>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-muted-foreground">Battery</div>
                <div className="flex items-center gap-2">
                  <Battery className="w-4 h-4" />
                  <span>{batteryLevel ?? "--"}%</span>
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Data Points</div>
                <div className="text-sm">{history.length}</div>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="mt-2 bg-transparent"
              asChild
            >
              <a href="/irrigation">Go to Irrigation Controls</a>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      <Card className="w-full card-elevated">
        <CardHeader>
          <CardTitle>Sensor History</CardTitle>
        </CardHeader>
        <CardContent>
          <MoistureChart
            data={history.map(({ at, moisture }) => ({ at, moisture }))}
            threshold={lowThreshold}
            pumpEvents={history.filter((h) => h.pumpOn).map((h) => h.at)}
          />
        </CardContent>
      </Card>
    </div>
  );
}
