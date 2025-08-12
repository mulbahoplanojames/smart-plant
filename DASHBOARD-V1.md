```js

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { MoistureChart } from "@/components/telemetry-chart";
import {
  Activity,
  AlertTriangle,
  Clock,
  Leaf,
  Signal,
  Waves,
} from "lucide-react";
import { fetchJSON } from "@/lib/fetch-json";
import { useRouter } from "next/navigation";

type Telemetry = {
  at: string;
  moisture: number;
  pumpOn: boolean;
};

export default function DashboardPage() {
  const [deviceId, setDeviceId] = useState<string>("");
  const [devices, setDevices] = useState<any[]>([]);
  const [moisture, setMoisture] = useState<number | null>(null);
  const [pumpOn, setPumpOn] = useState(false);
  const [history, setHistory] = useState<Telemetry[]>([]);
  const [lowThreshold, setLowThreshold] = useState(35);
  const [connected, setConnected] = useState(false);
  const [lastSeen, setLastSeen] = useState<string | null>(null);
  const router = useRouter();
  const esRef = useRef<EventSource | null>(null);

  //note: Fetch all devices on mount and set the first one as default
  useEffect(() => {
    const fetchDevices = async () => {
      const devs = await fetchJSON<{ data: any[] }>("/api/devices");
      if (devs.ok && devs.data?.data?.length) {
        // console.log("devs", devs.data?.data);
        setDevices(devs.data?.data);
        // Only set deviceId if not already set
        setDeviceId((curr) => curr || devs?.data?.data[0].id);
      }
    };
    fetchDevices();
  }, []);

  useEffect(() => {
    //note: Load initial telemetry + device meta
    const load = async () => {
      if (!deviceId) return;
      const res = await fetchJSON<{ data: Telemetry[] }>(
        `/api/telemetry?deviceId=${encodeURIComponent(deviceId)}&limit=100`
      );
      if (!res.ok) {
        if (res.status === 401) router.push("/login");
        return;
      }
      const rows = res.data?.data || [];
      // console.log("rows", rows);
      setHistory(rows);
      if (rows.length) {
        const latest = rows[rows.length - 1];
        setMoisture(latest.moisture);
        setPumpOn(!!latest.pumpOn);
        setLastSeen(latest.at);
      }
      const devs = await fetchJSON<{ data: any[] }>("/api/devices");
      if (devs.ok) {
        const d = devs.data?.data?.find((x: any) => x.id === deviceId);
        if (d) {
          setLowThreshold(d.threshold ?? 35);
          setLastSeen(d.lastSeen || lastSeen);
        }
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deviceId]);

  useEffect(() => {
    //note: Live SSE stream
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
          const latest = rows[rows.length - 1];
          setMoisture(latest.moisture);
          setPumpOn(!!latest.pumpOn);
          setLastSeen(latest.at);
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
      toast("Failed to send pump command.");
    }
  };

  return (
    <div className="grid gap-6">
      {/* KPI row */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card className="">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Device</CardTitle>
            <Badge
              variant={connected ? "default" : "secondary"}
              className={cn(connected ? "bg-green-600" : "")}
            >
              <Signal className="w-3 h-3 mr-1" />
              {connected ? "Live" : "Idle"}
            </Badge>
          </CardHeader>
          <CardContent className="grid gap-3">
            <div className="grid gap-1">
              <Label htmlFor="deviceId">Device</Label>
              <select
                id="deviceId"
                className="input"
                value={deviceId}
                onChange={(e) => setDeviceId(e.target.value)}
              >
                {devices.length === 0 && (
                  <option value="">No devices found</option>
                )}
                {devices.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name || d.id}
                  </option>
                ))}
              </select>
            </div>
          </CardContent>
        </Card>

        <Card className="">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Moisture</CardTitle>
            {critical ? (
              <Badge variant="destructive">
                <AlertTriangle className="w-3 h-3 mr-1" />
                Low
              </Badge>
            ) : (
              <Badge variant="secondary">OK</Badge>
            )}
          </CardHeader>
          <CardContent className="flex items-center gap-4">
            <div className="text-4xl font-bold">{moisture ?? "--"}</div>
            <div className="text-muted-foreground">%</div>
          </CardContent>
        </Card>

        <Card className="">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Averages</CardTitle>
            <Activity className="w-4 h-4 text-emerald-600" />
          </CardHeader>
          <CardContent className="grid">
            <div className="text-xs text-muted-foreground">
              Avg (last samples)
            </div>
            <div className="text-xl font-semibold">{avg}%</div>
          </CardContent>
        </Card>

        <Card className="">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Last seen</CardTitle>
            <Clock className="w-4 h-4 text-emerald-600" />
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {lastSeen ? new Date(lastSeen).toLocaleString() : "—"}
          </CardContent>
        </Card>
      </div>

      {/* Control + Chart */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card id="pump" className=" md:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Pump Control</CardTitle>
            <Leaf className="w-4 h-4 text-green-600" />
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
                if (!res || !res.ok) toast("Failed to save threshold.");
              }}
            >
              Save Threshold
            </Button>
          </CardContent>
        </Card>

        <Card className="w-full  md:col-span-2">
          <CardHeader>
            <CardTitle>Moisture History</CardTitle>
          </CardHeader>
          <CardContent>
            <MoistureChart
              data={history.map(({ at, moisture }) => ({ at, moisture }))}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

```
