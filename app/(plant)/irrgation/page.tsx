// // "use client";

// // import { useEffect, useMemo, useRef, useState } from "react";
// // import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// // import { Button } from "@/components/ui/button";
// // import { Input } from "@/components/ui/input";
// // import { Label } from "@/components/ui/label";
// // import { Badge } from "@/components/ui/badge";
// // import { Switch } from "@/components/ui/switch";
// // import {
// //   Select,
// //   SelectContent,
// //   SelectItem,
// //   SelectTrigger,
// //   SelectValue,
// // } from "@/components/ui/select";
// // import { fetchJSON } from "@/lib/fetch-json";
// // import { useRouter } from "next/navigation";
// // import {
// //   Activity,
// //   AlarmClockCheck,
// //   Clock,
// //   Leaf,
// //   Signal,
// //   Sprout,
// //   Waves,
// // } from "lucide-react";
// // import { cn } from "@/lib/utils";

// // type Device = {
// //   id: string;
// //   name: string;
// //   threshold?: number | null;
// //   lastMoisture?: number | null;
// //   lastSeen?: string | null;
// //   pumpOn?: boolean | null;
// // };

// // type ActionRow = {
// //   id: string;
// //   deviceId: string;
// //   action: string;
// //   state?: boolean | null;
// //   status?: string;
// //   createdAt?: string;
// // };

// // export default function IrrigationPage() {
// //   const router = useRouter();
// //   const [devices, setDevices] = useState<Device[]>([]);
// //   const [deviceId, setDeviceId] = useState<string>("");
// //   const [loading, setLoading] = useState(true);

// //   //note: Controls
// //   const [pumpOn, setPumpOn] = useState(false);
// //   const [threshold, setThreshold] = useState<number>(35);
// //   const [quickRunSec, setQuickRunSec] = useState<number>(10);
// //   const [runCountdown, setRunCountdown] = useState<number>(0);
// //   const runTimerRef = useRef<NodeJS.Timeout | null>(null);
// //   const countdownRef = useRef<NodeJS.Timeout | null>(null);

// //   const [actions, setActions] = useState<ActionRow[]>([]);

// //   const selected = useMemo(
// //     () => devices.find((d) => d.id === deviceId) || null,
// //     [devices, deviceId]
// //   );

// //   const loadDevices = async () => {
// //     const res = await fetchJSON<{ data?: Device[]; error?: string }>(
// //       "/api/devices"
// //     );
// //     if (!res.ok) {
// //       if (res.status === 401) router.push("/login");
// //       else alert(res.error || "Failed to load devices");
// //       return;
// //     }
// //     const list = res.data?.data || [];
// //     setDevices(list);
// //     // Initialize selection
// //     if (!deviceId && list.length) {
// //       setDeviceId(list[0].id);
// //       setThreshold(list[0].threshold ?? 35);
// //       setPumpOn(!!list[0].pumpOn);
// //     } else if (deviceId) {
// //       const d = list.find((x) => x.id === deviceId);
// //       if (d) {
// //         setThreshold(d.threshold ?? 35);
// //         setPumpOn(!!d.pumpOn);
// //       }
// //     }
// //   };

// //   const loadActions = async () => {
// //     const res = await fetchJSON<{ data?: ActionRow[] }>("/api/actions/list");
// //     if (res.ok) {
// //       const rows = (res.data?.data || []).filter(
// //         (r) => r.deviceId === deviceId && r.action === "pump"
// //       );
// //       setActions(rows.slice(0, 10));
// //     }
// //   };

// //   useEffect(() => {
// //     (async () => {
// //       await loadDevices();
// //       setLoading(false);
// //     })();
// //     // eslint-disable-next-line react-hooks/exhaustive-deps
// //   }, []);

// //   useEffect(() => {
// //     if (!deviceId) return;
// //     loadDevices();
// //     loadActions();
// //     // eslint-disable-next-line react-hooks/exhaustive-deps
// //   }, [deviceId]);

// //   // Cleanup timers on unmount or device change
// //   useEffect(() => {
// //     return () => {
// //       if (runTimerRef.current) clearTimeout(runTimerRef.current);
// //       if (countdownRef.current) clearInterval(countdownRef.current);
// //     };
// //   }, []);

// //   const sendPump = async (next: boolean) => {
// //     const res = await fetch("/api/actions", {
// //       method: "POST",
// //       headers: { "Content-Type": "application/json" },
// //       body: JSON.stringify({ deviceId, action: "pump", state: next }),
// //     }).catch(() => null);
// //     return !!res?.ok;
// //   };

// //   const togglePump = async (next: boolean) => {
// //     setPumpOn(next);
// //     const ok = await sendPump(next);
// //     if (!ok) {
// //       alert("Failed to send pump command.");
// //       setPumpOn(!next);
// //     } else {
// //       // refresh recent actions
// //       loadActions();
// //     }
// //   };

// //   const saveThreshold = async () => {
// //     const res = await fetch("/api/actions", {
// //       method: "POST",
// //       headers: { "Content-Type": "application/json" },
// //       body: JSON.stringify({
// //         deviceId,
// //         action: "calibrate",
// //         value: { lowThreshold: threshold },
// //       }),
// //     }).catch(() => null);
// //     if (!res || !res.ok) {
// //       alert("Failed to save threshold.");
// //       return;
// //     }
// //     await loadDevices();
// //   };

// //   const startQuickRun = async () => {
// //     if (!deviceId) return;
// //     if (quickRunSec <= 0) return;
// //     // Send pump ON
// //     const onOk = await sendPump(true);
// //     if (!onOk) {
// //       alert("Failed to start quick run.");
// //       return;
// //     }
// //     setPumpOn(true);
// //     setRunCountdown(quickRunSec);

// //     // Countdown tick
// //     if (countdownRef.current) clearInterval(countdownRef.current);
// //     countdownRef.current = setInterval(() => {
// //       setRunCountdown((s) => {
// //         if (s <= 1) {
// //           if (countdownRef.current) clearInterval(countdownRef.current);
// //           return 0;
// //         }
// //         return s - 1;
// //       });
// //     }, 1000);

// //     // Schedule OFF after quickRunSec
// //     if (runTimerRef.current) clearTimeout(runTimerRef.current);
// //     runTimerRef.current = setTimeout(async () => {
// //       const offOk = await sendPump(false);
// //       setPumpOn(false);
// //       if (!offOk) alert("Failed to stop pump at end of run.");
// //       loadActions();
// //     }, quickRunSec * 1000);
// //   };

// //   const stopQuickRun = async () => {
// //     if (runTimerRef.current) clearTimeout(runTimerRef.current);
// //     if (countdownRef.current) clearInterval(countdownRef.current);
// //     setRunCountdown(0);
// //     const offOk = await sendPump(false);
// //     if (!offOk) alert("Failed to stop pump.");
// //     setPumpOn(false);
// //     loadActions();
// //   };

// //   return (
// //     <div className="grid gap-6">
// //       {/* Header row */}
// //       <div className="grid gap-4 md:grid-cols-3">
// //         <Card className="card-elevated">
// //           <CardHeader className="flex flex-row items-center justify-between">
// //             <CardTitle className="text-base flex items-center gap-2">
// //               <Sprout className="w-4 h-4 text-emerald-600" /> Device
// //             </CardTitle>
// //             <Badge
// //               variant={selected?.lastSeen ? "secondary" : "outline"}
// //               className={cn(selected?.lastSeen && "bg-green-600 text-white")}
// //             >
// //               <Signal className="w-3 h-3 mr-1" />
// //               {selected?.lastSeen ? "Connected" : "Unknown"}
// //             </Badge>
// //           </CardHeader>
// //           <CardContent className="grid gap-3">
// //             <div className="grid gap-1">
// //               <Label>Choose device</Label>
// //               <Select
// //                 value={deviceId}
// //                 onValueChange={setDeviceId}
// //                 disabled={loading || !devices.length}
// //               >
// //                 <SelectTrigger>
// //                   <SelectValue
// //                     placeholder={loading ? "Loading..." : "Select device"}
// //                   />
// //                 </SelectTrigger>
// //                 <SelectContent>
// //                   {devices.map((d) => (
// //                     <SelectItem key={d.id} value={d.id}>
// //                       {d.name} ({d.id})
// //                     </SelectItem>
// //                   ))}
// //                 </SelectContent>
// //               </Select>
// //             </div>
// //             <div className="grid grid-cols-2 gap-3 text-sm text-muted-foreground">
// //               <div>
// //                 <div className="font-medium text-foreground">Last Moisture</div>
// //                 <div>{selected?.lastMoisture ?? "--"}%</div>
// //               </div>
// //               <div>
// //                 <div className="font-medium text-foreground">Last Seen</div>
// //                 <div>
// //                   {selected?.lastSeen
// //                     ? new Date(selected.lastSeen).toLocaleString()
// //                     : "—"}
// //                 </div>
// //               </div>
// //             </div>
// //           </CardContent>
// //         </Card>

// //         <Card className="card-elevated">
// //           <CardHeader className="flex flex-row items-center justify-between">
// //             <CardTitle className="text-base flex items-center gap-2">
// //               <Waves className="w-4 h-4" /> Manual Pump
// //             </CardTitle>
// //             <Badge variant={pumpOn ? "default" : "secondary"}>
// //               {pumpOn ? "On" : "Off"}
// //             </Badge>
// //           </CardHeader>
// //           <CardContent className="flex items-center justify-between">
// //             <div className="text-sm text-muted-foreground">
// //               Toggle water pump
// //             </div>
// //             <Switch
// //               checked={pumpOn}
// //               onCheckedChange={togglePump}
// //               aria-label="Toggle pump"
// //               disabled={!deviceId}
// //             />
// //           </CardContent>
// //         </Card>

// //         <Card className="card-elevated">
// //           <CardHeader className="flex flex-row items-center justify-between">
// //             <CardTitle className="text-base flex items-center gap-2">
// //               <Leaf className="w-4 h-4 text-green-600" /> Threshold
// //             </CardTitle>
// //             <Badge variant="secondary">{threshold}%</Badge>
// //           </CardHeader>
// //           <CardContent className="grid gap-3">
// //             <div className="grid gap-1">
// //               <Label htmlFor="threshold">Low moisture threshold (%)</Label>
// //               <Input
// //                 id="threshold"
// //                 type="number"
// //                 value={threshold}
// //                 onChange={(e) =>
// //                   setThreshold(Number.parseInt(e.target.value || "0", 10))
// //                 }
// //                 min={0}
// //                 max={100}
// //                 step={1}
// //               />
// //             </div>
// //             <Button
// //               variant="outline"
// //               onClick={saveThreshold}
// //               disabled={!deviceId}
// //             >
// //               Save Threshold
// //             </Button>
// //           </CardContent>
// //         </Card>
// //       </div>

// //       {/* Quick Run + Recent */}
// //       <div className="grid gap-4 md:grid-cols-3">
// //         <Card className="card-elevated md:col-span-2">
// //           <CardHeader className="flex flex-row items-center justify-between">
// //             <CardTitle className="text-base flex items-center gap-2">
// //               <AlarmClockCheck className="w-4 h-4 text-emerald-600" /> Quick Run
// //             </CardTitle>
// //             {runCountdown > 0 ? (
// //               <Badge variant="default">
// //                 <Clock className="w-3 h-3 mr-1" />
// //                 {runCountdown}s left
// //               </Badge>
// //             ) : null}
// //           </CardHeader>
// //           <CardContent className="grid gap-3 md:flex md:items-end md:gap-4">
// //             <div className="grid gap-1">
// //               <Label htmlFor="duration">Duration (seconds)</Label>
// //               <Input
// //                 id="duration"
// //                 type="number"
// //                 value={quickRunSec}
// //                 onChange={(e) =>
// //                   setQuickRunSec(Number.parseInt(e.target.value || "0", 10))
// //                 }
// //                 min={1}
// //                 step={1}
// //                 className="w-40"
// //               />
// //             </div>
// //             <div className="flex gap-2">
// //               <Button
// //                 onClick={startQuickRun}
// //                 disabled={!deviceId || quickRunSec <= 0 || runCountdown > 0}
// //               >
// //                 Start Run
// //               </Button>
// //               <Button
// //                 variant="outline"
// //                 onClick={stopQuickRun}
// //                 disabled={!deviceId || (runCountdown <= 0 && !pumpOn)}
// //               >
// //                 Stop
// //               </Button>
// //             </div>
// //             <div className="text-xs text-muted-foreground md:ml-auto">
// //               Tip: Quick Run turns the pump on, then off after the selected
// //               duration.
// //             </div>
// //           </CardContent>
// //         </Card>

// //         <Card className="card-elevated">
// //           <CardHeader className="flex flex-row items-center justify-between">
// //             <CardTitle className="text-base flex items-center gap-2">
// //               <Activity className="w-4 h-4 text-emerald-600" /> Recent
// //               Irrigation
// //             </CardTitle>
// //           </CardHeader>
// //           <CardContent className="grid gap-2 text-sm">
// //             {actions.length ? (
// //               actions.map((a) => (
// //                 <div
// //                   key={a.id}
// //                   className="flex items-center justify-between border rounded px-3 py-2"
// //                 >
// //                   <div className="font-medium">
// //                     {a.state ? "Pump ON" : "Pump OFF"}
// //                   </div>
// //                   <div className="text-xs text-muted-foreground">
// //                     {a.createdAt ? new Date(a.createdAt).toLocaleString() : ""}
// //                   </div>
// //                 </div>
// //               ))
// //             ) : (
// //               <div className="text-muted-foreground">
// //                 No recent irrigation events.
// //               </div>
// //             )}
// //             <div className="text-xs text-muted-foreground">
// //               Showing latest 10 pump actions for this device.
// //             </div>
// //           </CardContent>
// //         </Card>
// //       </div>
// //     </div>
// //   );
// // }

// "use client";

// import { useEffect, useMemo, useRef, useState } from "react";
// import {
//   Card,
//   CardContent,
//   CardHeader,
//   CardTitle,
//   CardDescription,
// } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { Badge } from "@/components/ui/badge";
// import { Switch } from "@/components/ui/switch";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// import { fetchJSON } from "@/lib/fetch-json";
// import { useRouter } from "next/navigation";
// import {
//   Activity,
//   AlarmClockCheck,
//   Calendar,
//   Clock,
//   Droplets,
//   Leaf,
//   Thermometer,
//   Waves,
//   Zap,
//   TrendingUp,
//   AlertTriangle,
//   CheckCircle,
// } from "lucide-react";
// import { cn } from "@/lib/utils";
// import { SensorGauge } from "@/components/sensor-gauge";
// import { SensorTrend } from "@/components/sensor-trend";
// import { DeviceStatus } from "@/components/device-status";
// import { IrrigationChart } from "@/components/irrigation-chart";
// import { WaterUsageChart } from "@/components/water-usage-chart";

// type Device = {
//   id: string;
//   name: string;
//   threshold?: number | null;
//   lastMoisture?: number | null;
//   lastSeen?: string | null;
//   pumpOn?: boolean | null;
// };

// type ActionRow = {
//   id: string;
//   deviceId: string;
//   action: string;
//   state?: boolean | null;
//   status?: string;
//   createdAt?: string;
// };

// type Telemetry = {
//   at: string;
//   moisture: number;
//   pumpOn: boolean;
// };

// // Extended telemetry with simulated values
// type ExtendedTelemetry = Telemetry & {
//   humidity?: number;
//   temperature?: number;
//   pH?: number;
//   batteryLevel?: number;
// };

// export default function IrrigationPage() {
//   const router = useRouter();
//   const [devices, setDevices] = useState<Device[]>([]);
//   const [deviceId, setDeviceId] = useState<string>("");
//   const [loading, setLoading] = useState(true);

//   // Real-time data
//   const [connected, setConnected] = useState(false);
//   const [moisture, setMoisture] = useState<number | null>(null);
//   const [humidity, setHumidity] = useState<number | null>(null);
//   const [temperature, setTemperature] = useState<number | null>(null);
//   const [pH, setPH] = useState<number | null>(null);
//   const [batteryLevel, setBatteryLevel] = useState<number | null>(null);
//   const [lastSeen, setLastSeen] = useState<string | null>(null);
//   const [history, setHistory] = useState<Telemetry[]>([]);
//   const esRef = useRef<EventSource | null>(null);

//   // Trends
//   const [moistureTrend, setMoistureTrend] = useState<number>(0);
//   const [humidityTrend, setHumidityTrend] = useState<number>(0);
//   const [temperatureTrend, setTemperatureTrend] = useState<number>(0);
//   const [pHTrend, setPHTrend] = useState<number>(0);

//   // Controls
//   const [pumpOn, setPumpOn] = useState(false);
//   const [threshold, setThreshold] = useState<number>(316);
//   const [quickRunSec, setQuickRunSec] = useState<number>(10);
//   const [runCountdown, setRunCountdown] = useState<number>(0);
//   const runTimerRef = useRef<NodeJS.Timeout | null>(null);
//   const countdownRef = useRef<NodeJS.Timeout | null>(null);

//   // Scheduling
//   const [autoMode, setAutoMode] = useState(true);
//   const [scheduleTime, setScheduleTime] = useState("06:00");
//   const [scheduleDuration, setScheduleDuration] = useState(30);
//   const [scheduleEnabled, setScheduleEnabled] = useState(false);

//   const [actions, setActions] = useState<ActionRow[]>([]);

//   const selected = useMemo(
//     () => devices.find((d) => d.id === deviceId) || null,
//     [devices, deviceId]
//   );

//   // Water usage calculations
//   const waterUsageToday = useMemo(() => {
//     const today = new Date().toDateString();
//     const todayActions = actions.filter(
//       (a) =>
//         a.createdAt &&
//         new Date(a.createdAt).toDateString() === today &&
//         a.state === true
//     );
//     return todayActions.length * 0.5; // Assume 0.5L per pump activation
//   }, [actions]);

//   const waterUsageWeek = useMemo(() => {
//     const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
//     const weekActions = actions.filter(
//       (a) => a.createdAt && new Date(a.createdAt) > weekAgo && a.state === true
//     );
//     return weekActions.length * 0.5;
//   }, [actions]);

//   // Environmental conditions
//   const environmentalStatus = useMemo(() => {
//     if (!moisture || !humidity || !temperature) return "unknown";

//     const moistureOk = moisture >= threshold;
//     const humidityOk = humidity >= 40 && humidity <= 80;
//     const tempOk = temperature >= 18 && temperature <= 28;

//     if (moistureOk && humidityOk && tempOk) return "optimal";
//     if (!moistureOk) return "dry";
//     if (!humidityOk || !tempOk) return "suboptimal";
//     return "good";
//   }, [moisture, humidity, temperature, threshold]);

//   const loadDevices = async () => {
//     const res = await fetchJSON<{ data?: Device[]; error?: string }>(
//       "/api/devices"
//     );
//     if (!res.ok) {
//       if (res.status === 401) router.push("/login");
//       else alert(res.error || "Failed to load devices");
//       return;
//     }
//     const list = res.data?.data || [];
//     setDevices(list);
//     // Initialize selection
//     if (!deviceId && list.length) {
//       setDeviceId(list[0].id);
//       setThreshold(list[0].threshold ?? 316);
//       setPumpOn(!!list[0].pumpOn);
//     } else if (deviceId) {
//       const d = list.find((x) => x.id === deviceId);
//       if (d) {
//         setThreshold(d.threshold ?? 316);
//         setPumpOn(!!d.pumpOn);
//       }
//     }
//   };

//   const loadActions = async () => {
//     const res = await fetchJSON<{ data?: ActionRow[] }>("/api/actions/list");
//     if (res.ok) {
//       const rows = (res.data?.data || []).filter(
//         (r) => r.deviceId === deviceId
//       );
//       setActions(rows.slice(0, 50));
//     }
//   };

//   const loadTelemetry = async () => {
//     const res = await fetchJSON<{ data: Telemetry[] }>(
//       `/api/telemetry?deviceId=${encodeURIComponent(deviceId)}&limit=100`
//     );
//     if (res.ok) {
//       const rows = res.data?.data || [];
//       setHistory(rows);

//       if (rows.length) {
//         const latest = rows[rows.length - 1];
//         setMoisture(latest.moisture);
//         setPumpOn(!!latest.pumpOn);
//         setLastSeen(latest.at);

//         // Simulate additional sensor values
//         const hour = new Date(latest.at).getHours();
//         const simHumidity = Math.min(
//           95,
//           Math.max(
//             40,
//             70 +
//               Math.sin((hour / 24) * Math.PI * 2) * 15 +
//               (Math.random() * 10 - 5)
//           )
//         );
//         const simTemp = Math.min(
//           35,
//           Math.max(
//             15,
//             22 +
//               Math.sin((hour / 24) * Math.PI * 2) * 5 +
//               (Math.random() * 4 - 2)
//           )
//         );
//         const simPH = Math.min(
//           8,
//           Math.max(
//             5,
//             6.5 +
//               Math.sin((hour / 12) * Math.PI) * 0.5 +
//               (Math.random() * 0.4 - 0.2)
//           )
//         );
//         const simBattery = Math.max(
//           20,
//           100 -
//             ((Date.now() - new Date(latest.at).getTime()) /
//               (1000 * 60 * 60 * 24 * 7)) *
//               10
//         );

//         setHumidity(Math.round(simHumidity * 10) / 10);
//         setTemperature(Math.round(simTemp * 10) / 10);
//         setPH(Math.round(simPH * 10) / 10);
//         setBatteryLevel(Math.round(simBattery));

//         // Calculate trends
//         if (rows.length > 24) {
//           const prev = rows[rows.length - 25];
//           setMoistureTrend(latest.moisture - prev.moisture);
//           setHumidityTrend(simHumidity - 70); // Simplified trend
//           setTemperatureTrend(simTemp - 22);
//           setPHTrend(simPH - 6.5);
//         }
//       }
//     }
//   };

//   useEffect(() => {
//     (async () => {
//       await loadDevices();
//       setLoading(false);
//     })();
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, []);

//   useEffect(() => {
//     if (!deviceId) return;
//     loadDevices();
//     loadActions();
//     loadTelemetry();
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [deviceId]);

//   // Real-time SSE connection
//   useEffect(() => {
//     if (!deviceId) return;

//     if (esRef.current) {
//       esRef.current.close();
//       esRef.current = null;
//     }

//     const es = new EventSource(
//       `/api/telemetry/stream?deviceId=${encodeURIComponent(deviceId)}`
//     );
//     es.onopen = () => setConnected(true);
//     es.onerror = () => setConnected(false);
//     es.onmessage = (ev) => {
//       try {
//         const rows: Telemetry[] = JSON.parse(ev.data);
//         if (rows.length) {
//           setHistory((prev) => [...prev, ...rows].slice(-200));
//           const latest = rows[rows.length - 1];
//           setMoisture(latest.moisture);
//           setPumpOn(!!latest.pumpOn);
//           setLastSeen(latest.at);

//           // Update simulated values
//           const hour = new Date(latest.at).getHours();
//           const simHumidity = Math.min(
//             95,
//             Math.max(
//               40,
//               70 +
//                 Math.sin((hour / 24) * Math.PI * 2) * 15 +
//                 (Math.random() * 10 - 5)
//             )
//           );
//           const simTemp = Math.min(
//             35,
//             Math.max(
//               15,
//               22 +
//                 Math.sin((hour / 24) * Math.PI * 2) * 5 +
//                 (Math.random() * 4 - 2)
//             )
//           );
//           const simPH = Math.min(
//             8,
//             Math.max(
//               5,
//               6.5 +
//                 Math.sin((hour / 12) * Math.PI) * 0.5 +
//                 (Math.random() * 0.4 - 0.2)
//             )
//           );

//           setHumidity(Math.round(simHumidity * 10) / 10);
//           setTemperature(Math.round(simTemp * 10) / 10);
//           setPH(Math.round(simPH * 10) / 10);
//         }
//       } catch {
//         // ignore
//       }
//     };
//     esRef.current = es;
//     return () => {
//       es.close();
//       esRef.current = null;
//     };
//   }, [deviceId]);

//   // Cleanup timers on unmount or device change
//   useEffect(() => {
//     return () => {
//       if (runTimerRef.current) clearTimeout(runTimerRef.current);
//       if (countdownRef.current) clearInterval(countdownRef.current);
//     };
//   }, []);

//   const sendPump = async (next: boolean) => {
//     const res = await fetch("/api/actions", {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({ deviceId, action: "pump", state: next }),
//     }).catch(() => null);
//     return !!res?.ok;
//   };

//   const togglePump = async (next: boolean) => {
//     setPumpOn(next);
//     const ok = await sendPump(next);
//     if (!ok) {
//       alert("Failed to send pump command.");
//       setPumpOn(!next);
//     } else {
//       loadActions();
//     }
//   };

//   const saveThreshold = async () => {
//     const res = await fetch("/api/actions", {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({
//         deviceId,
//         action: "calibrate",
//         value: { lowThreshold: threshold },
//       }),
//     }).catch(() => null);
//     if (!res || !res.ok) {
//       alert("Failed to save threshold.");
//       return;
//     }
//     await loadDevices();
//   };

//   const startQuickRun = async () => {
//     if (!deviceId) return;
//     if (quickRunSec <= 0) return;

//     const onOk = await sendPump(true);
//     if (!onOk) {
//       alert("Failed to start quick run.");
//       return;
//     }
//     setPumpOn(true);
//     setRunCountdown(quickRunSec);

//     if (countdownRef.current) clearInterval(countdownRef.current);
//     countdownRef.current = setInterval(() => {
//       setRunCountdown((s) => {
//         if (s <= 1) {
//           if (countdownRef.current) clearInterval(countdownRef.current);
//           return 0;
//         }
//         return s - 1;
//       });
//     }, 1000);

//     if (runTimerRef.current) clearTimeout(runTimerRef.current);
//     runTimerRef.current = setTimeout(async () => {
//       const offOk = await sendPump(false);
//       setPumpOn(false);
//       if (!offOk) alert("Failed to stop pump at end of run.");
//       loadActions();
//     }, quickRunSec * 1000);
//   };

//   const stopQuickRun = async () => {
//     if (runTimerRef.current) clearTimeout(runTimerRef.current);
//     if (countdownRef.current) clearInterval(countdownRef.current);
//     setRunCountdown(0);
//     const offOk = await sendPump(false);
//     if (!offOk) alert("Failed to stop pump.");
//     setPumpOn(false);
//     loadActions();
//   };

//   const getEnvironmentalStatusColor = () => {
//     switch (environmentalStatus) {
//       case "optimal":
//         return "text-green-500";
//       case "good":
//         return "text-blue-500";
//       case "suboptimal":
//         return "text-orange-500";
//       case "dry":
//         return "text-red-500";
//       default:
//         return "text-muted-foreground";
//     }
//   };

//   const getEnvironmentalStatusIcon = () => {
//     switch (environmentalStatus) {
//       case "optimal":
//         return <CheckCircle className="w-4 h-4" />;
//       case "good":
//         return <TrendingUp className="w-4 h-4" />;
//       case "suboptimal":
//         return <AlertTriangle className="w-4 h-4" />;
//       case "dry":
//         return <AlertTriangle className="w-4 h-4" />;
//       default:
//         return <Clock className="w-4 h-4" />;
//     }
//   };

//   return (
//     <div className="grid gap-6">
//       {/* Header */}
//       <Card className="card-elevated">
//         <CardHeader className="pb-2">
//           <CardTitle className="text-lg flex items-center gap-2">
//             <Waves className="w-5 h-5 text-blue-500" />
//             Smart Irrigation Control
//           </CardTitle>
//           <CardDescription>
//             Advanced irrigation management with real-time environmental
//             monitoring
//           </CardDescription>
//         </CardHeader>
//         <CardContent>
//           <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
//             <div className="grid gap-1 min-w-[200px]">
//               <Label htmlFor="deviceSelect">Select Device</Label>
//               <Select
//                 value={deviceId}
//                 onValueChange={setDeviceId}
//                 disabled={loading || !devices.length}
//               >
//                 <SelectTrigger id="deviceSelect">
//                   <SelectValue
//                     placeholder={loading ? "Loading..." : "Select device"}
//                   />
//                 </SelectTrigger>
//                 <SelectContent>
//                   {devices.map((d) => (
//                     <SelectItem key={d.id} value={d.id}>
//                       {d.name} ({d.id})
//                     </SelectItem>
//                   ))}
//                 </SelectContent>
//               </Select>
//             </div>
//             <DeviceStatus
//               connected={connected}
//               lastSeen={lastSeen}
//               batteryLevel={batteryLevel}
//               className="ml-auto"
//             />
//           </div>
//         </CardContent>
//       </Card>

//       {/* Environmental Status */}
//       <div className="grid md:grid-cols-5 gap-4">
//         <Card className="card-elevated">
//           <CardHeader className="flex flex-row items-center justify-between pb-2">
//             <CardTitle className="text-base">Environment</CardTitle>
//             <div
//               className={cn(
//                 "flex items-center gap-1",
//                 getEnvironmentalStatusColor()
//               )}
//             >
//               {getEnvironmentalStatusIcon()}
//             </div>
//           </CardHeader>
//           <CardContent>
//             <div
//               className={cn(
//                 "text-lg font-semibold capitalize",
//                 getEnvironmentalStatusColor()
//               )}
//             >
//               {environmentalStatus}
//             </div>
//             <div className="text-xs text-muted-foreground mt-1">
//               Overall growing conditions
//             </div>
//           </CardContent>
//         </Card>

//         <Card className="card-elevated">
//           <CardHeader className="flex flex-row items-center justify-between pb-2">
//             <CardTitle className="text-base">Soil Moisture</CardTitle>
//             <Droplets className="w-4 h-4 text-blue-500" />
//           </CardHeader>
//           <CardContent>
//             <div className="flex items-center justify-between mb-2">
//               <div className="text-2xl font-bold">{moisture ?? "--"}%</div>
//               <SensorTrend value={moistureTrend} />
//             </div>
//             <SensorGauge
//               value={moisture || 0}
//               min={0}
//               max={100}
//               threshold={threshold}
//               label="Current level"
//             />
//           </CardContent>
//         </Card>

//         <Card className="card-elevated">
//           <CardHeader className="flex flex-row items-center justify-between pb-2">
//             <CardTitle className="text-base">Air Humidity</CardTitle>
//             <Droplets className="w-4 h-4 text-cyan-500" />
//           </CardHeader>
//           <CardContent>
//             <div className="flex items-center justify-between mb-2">
//               <div className="text-2xl font-bold">{humidity ?? "--"}%</div>
//               <SensorTrend value={humidityTrend} />
//             </div>
//             <SensorGauge
//               value={humidity || 0}
//               min={0}
//               max={100}
//               threshold={40}
//               highThreshold={80}
//               label="Optimal: 40-80%"
//               color="blue"
//             />
//           </CardContent>
//         </Card>

//         <Card className="card-elevated">
//           <CardHeader className="flex flex-row items-center justify-between pb-2">
//             <CardTitle className="text-base">Temperature</CardTitle>
//             <Thermometer className="w-4 h-4 text-orange-500" />
//           </CardHeader>
//           <CardContent>
//             <div className="flex items-center justify-between mb-2">
//               <div className="text-2xl font-bold">{temperature ?? "--"}°C</div>
//               <SensorTrend value={temperatureTrend} precision={1} />
//             </div>
//             <SensorGauge
//               value={temperature || 0}
//               min={0}
//               max={40}
//               threshold={18}
//               highThreshold={28}
//               label="Optimal: 18-28°C"
//               color="orange"
//             />
//           </CardContent>
//         </Card>

//         <Card className="card-elevated">
//           <CardHeader className="flex flex-row items-center justify-between pb-2">
//             <CardTitle className="text-base">Soil pH</CardTitle>
//             <Leaf className="w-4 h-4 text-purple-500" />
//           </CardHeader>
//           <CardContent>
//             <div className="flex items-center justify-between mb-2">
//               <div className="text-2xl font-bold">{pH?.toFixed(1) ?? "--"}</div>
//               <SensorTrend value={pHTrend} precision={1} />
//             </div>
//             <SensorGauge
//               value={pH || 0}
//               min={4}
//               max={9}
//               threshold={5.5}
//               highThreshold={7.5}
//               label="Optimal: 5.5-7.5"
//               color="purple"
//             />
//           </CardContent>
//         </Card>
//       </div>

//       {/* Main Controls */}
//       <Tabs defaultValue="manual" className="w-full">
//         <TabsList className="grid w-full grid-cols-4">
//           <TabsTrigger value="manual">Manual Control</TabsTrigger>
//           <TabsTrigger value="schedule">Scheduling</TabsTrigger>
//           <TabsTrigger value="analytics">Analytics</TabsTrigger>
//           <TabsTrigger value="history">History</TabsTrigger>
//         </TabsList>

//         <TabsContent value="manual" className="space-y-4">
//           <div className="grid md:grid-cols-3 gap-4">
//             <Card className="card-elevated">
//               <CardHeader className="flex flex-row items-center justify-between pb-2">
//                 <CardTitle className="text-base">Manual Pump</CardTitle>
//                 <Badge variant={pumpOn ? "default" : "secondary"}>
//                   {pumpOn ? "Active" : "Inactive"}
//                 </Badge>
//               </CardHeader>
//               <CardContent className="grid gap-3">
//                 <div className="flex items-center justify-between">
//                   <div className="flex items-center gap-2">
//                     <Waves className="w-4 h-4" />
//                     <span>Water Pump</span>
//                   </div>
//                   <Switch
//                     checked={pumpOn}
//                     onCheckedChange={togglePump}
//                     aria-label="Toggle pump"
//                     disabled={!deviceId}
//                   />
//                 </div>
//                 <div className="text-xs text-muted-foreground">
//                   Manually control the water pump. Use for immediate watering
//                   needs.
//                 </div>
//               </CardContent>
//             </Card>

//             <Card className="card-elevated">
//               <CardHeader className="flex flex-row items-center justify-between pb-2">
//                 <CardTitle className="text-base">Quick Run</CardTitle>
//                 {runCountdown > 0 ? (
//                   <Badge variant="default">
//                     <Clock className="w-3 h-3 mr-1" />
//                     {runCountdown}s left
//                   </Badge>
//                 ) : null}
//               </CardHeader>
//               <CardContent className="grid gap-3">
//                 <div className="grid gap-1">
//                   <Label htmlFor="duration">Duration (seconds)</Label>
//                   <Input
//                     id="duration"
//                     type="number"
//                     value={quickRunSec}
//                     onChange={(e) =>
//                       setQuickRunSec(Number.parseInt(e.target.value || "0", 10))
//                     }
//                     min={1}
//                     step={1}
//                   />
//                 </div>
//                 <div className="flex gap-2">
//                   <Button
//                     onClick={startQuickRun}
//                     disabled={!deviceId || quickRunSec <= 0 || runCountdown > 0}
//                     size="sm"
//                   >
//                     Start
//                   </Button>
//                   <Button
//                     variant="outline"
//                     onClick={stopQuickRun}
//                     disabled={!deviceId || (runCountdown <= 0 && !pumpOn)}
//                     size="sm"
//                   >
//                     Stop
//                   </Button>
//                 </div>
//               </CardContent>
//             </Card>

//             <Card className="card-elevated">
//               <CardHeader className="flex flex-row items-center justify-between pb-2">
//                 <CardTitle className="text-base">Threshold</CardTitle>
//                 <Badge variant="secondary">{threshold}%</Badge>
//               </CardHeader>
//               <CardContent className="grid gap-3">
//                 <div className="grid gap-1">
//                   <Label htmlFor="threshold">Low moisture threshold (%)</Label>
//                   <Input
//                     id="threshold"
//                     type="number"
//                     value={threshold}
//                     onChange={(e) =>
//                       setThreshold(Number.parseInt(e.target.value || "0", 10))
//                     }
//                     min={0}
//                     max={100}
//                     step={1}
//                   />
//                 </div>
//                 <Button
//                   variant="outline"
//                   onClick={saveThreshold}
//                   disabled={!deviceId}
//                   size="sm"
//                 >
//                   Save Threshold
//                 </Button>
//               </CardContent>
//             </Card>
//           </div>
//         </TabsContent>

//         <TabsContent value="schedule" className="space-y-4">
//           <div className="grid md:grid-cols-2 gap-4">
//             <Card className="card-elevated">
//               <CardHeader>
//                 <CardTitle className="text-base flex items-center gap-2">
//                   <Zap className="w-4 h-4 text-yellow-500" />
//                   Auto Mode
//                 </CardTitle>
//               </CardHeader>
//               <CardContent className="grid gap-4">
//                 <div className="flex items-center justify-between">
//                   <div>
//                     <div className="font-medium">Smart Watering</div>
//                     <div className="text-sm text-muted-foreground">
//                       Automatically water when moisture is low
//                     </div>
//                   </div>
//                   <Switch checked={autoMode} onCheckedChange={setAutoMode} />
//                 </div>
//                 <div className="text-xs text-muted-foreground">
//                   When enabled, the system will automatically water your plants
//                   when soil moisture drops below the threshold.
//                 </div>
//               </CardContent>
//             </Card>

//             <Card className="card-elevated">
//               <CardHeader>
//                 <CardTitle className="text-base flex items-center gap-2">
//                   <Calendar className="w-4 h-4 text-green-500" />
//                   Scheduled Watering
//                 </CardTitle>
//               </CardHeader>
//               <CardContent className="grid gap-4">
//                 <div className="flex items-center justify-between">
//                   <div>
//                     <div className="font-medium">Daily Schedule</div>
//                     <div className="text-sm text-muted-foreground">
//                       Water at a specific time each day
//                     </div>
//                   </div>
//                   <Switch
//                     checked={scheduleEnabled}
//                     onCheckedChange={setScheduleEnabled}
//                   />
//                 </div>
//                 <div className="grid grid-cols-2 gap-3">
//                   <div className="grid gap-1">
//                     <Label htmlFor="scheduleTime">Time</Label>
//                     <Input
//                       id="scheduleTime"
//                       type="time"
//                       value={scheduleTime}
//                       onChange={(e) => setScheduleTime(e.target.value)}
//                       disabled={!scheduleEnabled}
//                     />
//                   </div>
//                   <div className="grid gap-1">
//                     <Label htmlFor="scheduleDuration">Duration (sec)</Label>
//                     <Input
//                       id="scheduleDuration"
//                       type="number"
//                       value={scheduleDuration}
//                       onChange={(e) =>
//                         setScheduleDuration(
//                           Number.parseInt(e.target.value || "0", 10)
//                         )
//                       }
//                       disabled={!scheduleEnabled}
//                       min={1}
//                     />
//                   </div>
//                 </div>
//               </CardContent>
//             </Card>
//           </div>
//         </TabsContent>

//         <TabsContent value="analytics" className="space-y-4">
//           <div className="grid md:grid-cols-3 gap-4">
//             <Card className="card-elevated">
//               <CardHeader className="flex flex-row items-center justify-between pb-2">
//                 <CardTitle className="text-base">Water Usage</CardTitle>
//                 <Droplets className="w-4 h-4 text-blue-500" />
//               </CardHeader>
//               <CardContent className="grid gap-3">
//                 <div className="grid grid-cols-2 gap-4">
//                   <div>
//                     <div className="text-xs text-muted-foreground">Today</div>
//                     <div className="text-xl font-semibold">
//                       {waterUsageToday.toFixed(1)}L
//                     </div>
//                   </div>
//                   <div>
//                     <div className="text-xs text-muted-foreground">
//                       This Week
//                     </div>
//                     <div className="text-xl font-semibold">
//                       {waterUsageWeek.toFixed(1)}L
//                     </div>
//                   </div>
//                 </div>
//                 <div className="text-xs text-muted-foreground">
//                   Estimated based on pump activations
//                 </div>
//               </CardContent>
//             </Card>

//             <Card className="card-elevated">
//               <CardHeader className="flex flex-row items-center justify-between pb-2">
//                 <CardTitle className="text-base">Efficiency</CardTitle>
//                 <TrendingUp className="w-4 h-4 text-green-500" />
//               </CardHeader>
//               <CardContent className="grid gap-3">
//                 <div className="grid grid-cols-2 gap-4">
//                   <div>
//                     <div className="text-xs text-muted-foreground">
//                       Avg Moisture
//                     </div>
//                     <div className="text-xl font-semibold">
//                       {history.length
//                         ? Math.round(
//                             history.reduce((a, b) => a + b.moisture, 0) /
//                               history.length
//                           )
//                         : 0}
//                       %
//                     </div>
//                   </div>
//                   <div>
//                     <div className="text-xs text-muted-foreground">
//                       Pump Cycles
//                     </div>
//                     <div className="text-xl font-semibold">
//                       {actions.filter((a) => a.state === true).length}
//                     </div>
//                   </div>
//                 </div>
//                 <div className="text-xs text-muted-foreground">
//                   System performance metrics
//                 </div>
//               </CardContent>
//             </Card>

//             <Card className="card-elevated">
//               <CardHeader className="flex flex-row items-center justify-between pb-2">
//                 <CardTitle className="text-base">Recommendations</CardTitle>
//                 <AlarmClockCheck className="w-4 h-4 text-purple-500" />
//               </CardHeader>
//               <CardContent className="grid gap-2">
//                 {moisture && moisture < threshold && (
//                   <div className="text-sm text-orange-600">
//                     • Consider watering soon - moisture is low
//                   </div>
//                 )}
//                 {humidity && humidity < 40 && (
//                   <div className="text-sm text-blue-600">
//                     • Low humidity detected - monitor closely
//                   </div>
//                 )}
//                 {temperature && temperature > 28 && (
//                   <div className="text-sm text-red-600">
//                     • High temperature - increase watering frequency
//                   </div>
//                 )}
//                 {(!moisture || moisture >= threshold) &&
//                   (!humidity || humidity >= 40) &&
//                   (!temperature || temperature <= 28) && (
//                     <div className="text-sm text-green-600">
//                       • All conditions optimal
//                     </div>
//                   )}
//               </CardContent>
//             </Card>
//           </div>

//           <Card className="card-elevated">
//             <CardHeader>
//               <CardTitle>Water Usage Trends</CardTitle>
//             </CardHeader>
//             <CardContent>
//               <WaterUsageChart
//                 data={actions.filter((a) => a.state === true).slice(-30)}
//               />
//             </CardContent>
//           </Card>
//         </TabsContent>

//         <TabsContent value="history" className="space-y-4">
//           <div className="grid gap-4">
//             <Card className="card-elevated">
//               <CardHeader>
//                 <CardTitle>Irrigation History</CardTitle>
//               </CardHeader>
//               <CardContent>
//                 <IrrigationChart
//                   data={history.map(({ at, moisture }) => ({ at, moisture }))}
//                   threshold={threshold}
//                   pumpEvents={history.filter((h) => h.pumpOn).map((h) => h.at)}
//                 />
//               </CardContent>
//             </Card>

//             <Card className="card-elevated">
//               <CardHeader className="flex flex-row items-center justify-between">
//                 <CardTitle className="text-base flex items-center gap-2">
//                   <Activity className="w-4 h-4 text-emerald-600" />
//                   Recent Actions
//                 </CardTitle>
//               </CardHeader>
//               <CardContent className="grid gap-2 text-sm max-h-96 overflow-y-auto">
//                 {actions.length ? (
//                   actions.map((a) => (
//                     <div
//                       key={a.id}
//                       className="flex items-center justify-between border rounded px-3 py-2"
//                     >
//                       <div className="grid">
//                         <div className="font-medium">
//                           {a.action === "pump"
//                             ? a.state
//                               ? "Pump ON"
//                               : "Pump OFF"
//                             : a.action}
//                         </div>
//                         <div className="text-xs text-muted-foreground">
//                           Device: {a.deviceId}
//                         </div>
//                       </div>
//                       <div className="text-right text-xs text-muted-foreground">
//                         <div
//                           className={cn(
//                             "capitalize",
//                             a.status === "done"
//                               ? "text-green-600"
//                               : a.status === "pending"
//                               ? "text-orange-600"
//                               : ""
//                           )}
//                         >
//                           {a.status || "pending"}
//                         </div>
//                         <div>
//                           {a.createdAt
//                             ? new Date(a.createdAt).toLocaleString()
//                             : ""}
//                         </div>
//                       </div>
//                     </div>
//                   ))
//                 ) : (
//                   <div className="text-muted-foreground">
//                     No irrigation history available.
//                   </div>
//                 )}
//               </CardContent>
//             </Card>
//           </div>
//         </TabsContent>
//       </Tabs>
//     </div>
//   );
// }

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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { fetchJSON } from "@/lib/fetch-json";
import { useRouter } from "next/navigation";
import {
  Activity,
  AlarmClockCheck,
  Calendar,
  Clock,
  Droplets,
  Leaf,
  Thermometer,
  Waves,
  Zap,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SensorGauge } from "@/components/sensor-gauge";
import { SensorTrend } from "@/components/sensor-trend";
import { DeviceStatus } from "@/components/device-status";
import { IrrigationChart } from "@/components/irrigation-chart";
import { WaterUsageChart } from "@/components/water-usage-chart";

type Device = {
  id: string;
  name: string;
  threshold?: number | null;
  lastMoisture?: number | null;
  lastTemperature?: number | null;
  lastHumidity?: number | null;
  lastSeen?: string | null;
  pumpOn?: boolean | null;
};

type ActionRow = {
  id: string;
  deviceId: string;
  action: string;
  state?: boolean | null;
  status?: string;
  createdAt?: string;
};

type Telemetry = {
  at: string;
  moisture: number;
  temperature?: number | null;
  humidity?: number | null;
  pumpOn: boolean;
};

export default function IrrigationPage() {
  const router = useRouter();
  const [devices, setDevices] = useState<Device[]>([]);
  const [deviceId, setDeviceId] = useState<string>("");
  const [loading, setLoading] = useState(true);

  // Real-time data
  const [connected, setConnected] = useState(false);
  const [moisture, setMoisture] = useState<number | null>(null);
  const [humidity, setHumidity] = useState<number | null>(null);
  const [temperature, setTemperature] = useState<number | null>(null);
  const [lastSeen, setLastSeen] = useState<string | null>(null);
  const [history, setHistory] = useState<Telemetry[]>([]);
  const esRef = useRef<EventSource | null>(null);

  // Simulated values (only for pH and battery since they're not in the API yet)
  const [pH, setPH] = useState<number | null>(null);
  const [batteryLevel, setBatteryLevel] = useState<number | null>(null);

  // Trends
  const [moistureTrend, setMoistureTrend] = useState<number>(0);
  const [humidityTrend, setHumidityTrend] = useState<number>(0);
  const [temperatureTrend, setTemperatureTrend] = useState<number>(0);
  const [pHTrend, setPHTrend] = useState<number>(0);

  // Controls
  const [pumpOn, setPumpOn] = useState(false);
  const [threshold, setThreshold] = useState<number>(35);
  const [quickRunSec, setQuickRunSec] = useState<number>(10);
  const [runCountdown, setRunCountdown] = useState<number>(0);
  const runTimerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);

  // Scheduling
  const [autoMode, setAutoMode] = useState(true);
  const [scheduleTime, setScheduleTime] = useState("06:00");
  const [scheduleDuration, setScheduleDuration] = useState(30);
  const [scheduleEnabled, setScheduleEnabled] = useState(false);

  const [actions, setActions] = useState<ActionRow[]>([]);

  const selected = useMemo(
    () => devices.find((d) => d.id === deviceId) || null,
    [devices, deviceId]
  );

  // Water usage calculations
  const waterUsageToday = useMemo(() => {
    const today = new Date().toDateString();
    const todayActions = actions.filter(
      (a) =>
        a.createdAt &&
        new Date(a.createdAt).toDateString() === today &&
        a.state === true
    );
    return todayActions.length * 0.5; // Assume 0.5L per pump activation
  }, [actions]);

  const waterUsageWeek = useMemo(() => {
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const weekActions = actions.filter(
      (a) => a.createdAt && new Date(a.createdAt) > weekAgo && a.state === true
    );
    return weekActions.length * 0.5;
  }, [actions]);

  // Environmental conditions
  const environmentalStatus = useMemo(() => {
    if (!moisture || !humidity || !temperature) return "unknown";

    const moistureOk = moisture >= threshold;
    const humidityOk = humidity >= 40 && humidity <= 80;
    const tempOk = temperature >= 18 && temperature <= 28;

    if (moistureOk && humidityOk && tempOk) return "optimal";
    if (!moistureOk) return "dry";
    if (!humidityOk || !tempOk) return "suboptimal";
    return "good";
  }, [moisture, humidity, temperature, threshold]);

  const loadDevices = async () => {
    const res = await fetchJSON<{ data?: Device[]; error?: string }>(
      "/api/devices"
    );
    if (!res.ok) {
      if (res.status === 401) router.push("/login");
      else alert(res.error || "Failed to load devices");
      return;
    }
    const list = res.data?.data || [];
    setDevices(list);
    // Initialize selection
    if (!deviceId && list.length) {
      setDeviceId(list[0].id);
      setThreshold(list[0].threshold ?? 35);
      setPumpOn(!!list[0].pumpOn);
    } else if (deviceId) {
      const d = list.find((x) => x.id === deviceId);
      if (d) {
        setThreshold(d.threshold ?? 35);
        setPumpOn(!!d.pumpOn);
        // Set current values from device if available
        if (d.lastMoisture !== null && d.lastMoisture !== undefined) {
          setMoisture(d.lastMoisture);
        }
        if (d.lastTemperature !== null && d.lastTemperature !== undefined) {
          setTemperature(d.lastTemperature);
        }
        if (d.lastHumidity !== null && d.lastHumidity !== undefined) {
          setHumidity(d.lastHumidity);
        }
        // setLastSeen(d.lastSeen);
      }
    }
  };

  const loadActions = async () => {
    const res = await fetchJSON<{ data?: ActionRow[] }>("/api/actions/list");
    if (res.ok) {
      const rows = (res.data?.data || []).filter(
        (r) => r.deviceId === deviceId
      );
      setActions(rows.slice(0, 50));
    }
  };

  const loadTelemetry = async () => {
    const res = await fetchJSON<{ data: Telemetry[] }>(
      `/api/telemetry?deviceId=${encodeURIComponent(deviceId)}&limit=100`
    );
    if (res.ok) {
      const rows = res.data?.data || [];
      setHistory(rows);

      if (rows.length) {
        const latest = rows[rows.length - 1];
        setMoisture(latest.moisture);
        setTemperature(latest.temperature || null);
        setHumidity(latest.humidity || null);
        setPumpOn(!!latest.pumpOn);
        setLastSeen(latest.at);

        // Calculate trends (24h change) for real sensor data
        if (rows.length > 24) {
          const prev = rows[rows.length - 25]; // ~24h ago
          setMoistureTrend(latest.moisture - prev.moisture);
          if (
            latest.humidity !== null &&
            latest.humidity !== undefined &&
            prev.humidity !== null &&
            prev.humidity !== undefined
          ) {
            setHumidityTrend(latest.humidity - prev.humidity);
          }
          if (
            latest.temperature !== null &&
            latest.temperature !== undefined &&
            prev.temperature !== null &&
            prev.temperature !== undefined
          ) {
            setTemperatureTrend(latest.temperature - prev.temperature);
          }
        }

        // Still simulate pH and battery since they're not in the API
        const hour = new Date(latest.at).getHours();
        const simPH = Math.min(
          8,
          Math.max(
            5,
            6.5 +
              Math.sin((hour / 12) * Math.PI) * 0.5 +
              (Math.random() * 0.4 - 0.2)
          )
        );
        const simBattery = Math.max(
          20,
          100 -
            ((Date.now() - new Date(latest.at).getTime()) /
              (1000 * 60 * 60 * 24 * 7)) *
              10
        );
        setPH(Math.round(simPH * 10) / 10);
        setBatteryLevel(Math.round(simBattery));
        setPHTrend(simPH - 6.5); // Simplified trend
      }
    }
  };

  useEffect(() => {
    (async () => {
      await loadDevices();
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!deviceId) return;
    loadDevices();
    loadActions();
    loadTelemetry();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deviceId]);

  // Real-time SSE connection
  useEffect(() => {
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
          const latest = rows[rows.length - 1];
          setMoisture(latest.moisture);
          setTemperature(latest.temperature || null);
          setHumidity(latest.humidity || null);
          setPumpOn(!!latest.pumpOn);
          setLastSeen(latest.at);

          // Update simulated pH (still not in API)
          const hour = new Date(latest.at).getHours();
          const simPH = Math.min(
            8,
            Math.max(
              5,
              6.5 +
                Math.sin((hour / 12) * Math.PI) * 0.5 +
                (Math.random() * 0.4 - 0.2)
            )
          );
          setPH(Math.round(simPH * 10) / 10);
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

  // Cleanup timers on unmount or device change
  useEffect(() => {
    return () => {
      if (runTimerRef.current) clearTimeout(runTimerRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, []);

  const sendPump = async (next: boolean) => {
    const res = await fetch("/api/actions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ deviceId, action: "pump", state: next }),
    }).catch(() => null);
    return !!res?.ok;
  };

  const togglePump = async (next: boolean) => {
    setPumpOn(next);
    const ok = await sendPump(next);
    if (!ok) {
      alert("Failed to send pump command.");
      setPumpOn(!next);
    } else {
      loadActions();
    }
  };

  const saveThreshold = async () => {
    const res = await fetch("/api/actions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        deviceId,
        action: "calibrate",
        value: { lowThreshold: threshold },
      }),
    }).catch(() => null);
    if (!res || !res.ok) {
      alert("Failed to save threshold.");
      return;
    }
    await loadDevices();
  };

  const startQuickRun = async () => {
    if (!deviceId) return;
    if (quickRunSec <= 0) return;

    const onOk = await sendPump(true);
    if (!onOk) {
      alert("Failed to start quick run.");
      return;
    }
    setPumpOn(true);
    setRunCountdown(quickRunSec);

    if (countdownRef.current) clearInterval(countdownRef.current);
    countdownRef.current = setInterval(() => {
      setRunCountdown((s) => {
        if (s <= 1) {
          if (countdownRef.current) clearInterval(countdownRef.current);
          return 0;
        }
        return s - 1;
      });
    }, 1000);

    if (runTimerRef.current) clearTimeout(runTimerRef.current);
    runTimerRef.current = setTimeout(async () => {
      const offOk = await sendPump(false);
      setPumpOn(false);
      if (!offOk) alert("Failed to stop pump at end of run.");
      loadActions();
    }, quickRunSec * 1000);
  };

  const stopQuickRun = async () => {
    if (runTimerRef.current) clearTimeout(runTimerRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);
    setRunCountdown(0);
    const offOk = await sendPump(false);
    if (!offOk) alert("Failed to stop pump.");
    setPumpOn(false);
    loadActions();
  };

  const getEnvironmentalStatusColor = () => {
    switch (environmentalStatus) {
      case "optimal":
        return "text-green-500";
      case "good":
        return "text-blue-500";
      case "suboptimal":
        return "text-orange-500";
      case "dry":
        return "text-red-500";
      default:
        return "text-muted-foreground";
    }
  };

  const getEnvironmentalStatusIcon = () => {
    switch (environmentalStatus) {
      case "optimal":
        return <CheckCircle className="w-4 h-4" />;
      case "good":
        return <TrendingUp className="w-4 h-4" />;
      case "suboptimal":
        return <AlertTriangle className="w-4 h-4" />;
      case "dry":
        return <AlertTriangle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  return (
    <div className="grid gap-6">
      {/* Header */}
      <Card className="card-elevated">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Waves className="w-5 h-5 text-blue-500" />
            Smart Irrigation Control
          </CardTitle>
          <CardDescription>
            Advanced irrigation management with real-time environmental
            monitoring
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
                      {d.name} ({d.id})
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

      {/* Environmental Status */}
      <div className="grid md:grid-cols-5 gap-4">
        <Card className="card-elevated">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base">Environment</CardTitle>
            <div
              className={cn(
                "flex items-center gap-1",
                getEnvironmentalStatusColor()
              )}
            >
              {getEnvironmentalStatusIcon()}
            </div>
          </CardHeader>
          <CardContent>
            <div
              className={cn(
                "text-lg font-semibold capitalize",
                getEnvironmentalStatusColor()
              )}
            >
              {environmentalStatus}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Overall growing conditions
            </div>
          </CardContent>
        </Card>

        <Card className="card-elevated">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base">Soil Moisture</CardTitle>
            <Droplets className="w-4 h-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-2">
              <div className="text-2xl font-bold">{moisture ?? "--"}%</div>
              <SensorTrend value={moistureTrend} />
            </div>
            <SensorGauge
              value={moisture || 0}
              min={0}
              max={100}
              threshold={threshold}
              label="Current level"
            />
          </CardContent>
        </Card>

        <Card className="card-elevated">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base">Air Humidity</CardTitle>
            <Droplets className="w-4 h-4 text-cyan-500" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-2">
              <div className="text-2xl font-bold">
                {humidity?.toFixed(1) ?? "--"}%
              </div>
              <SensorTrend value={humidityTrend} precision={1} />
            </div>
            <SensorGauge
              value={humidity || 0}
              min={0}
              max={100}
              threshold={40}
              highThreshold={80}
              label="Optimal: 40-80%"
              color="blue"
            />
          </CardContent>
        </Card>

        <Card className="card-elevated">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base">Temperature</CardTitle>
            <Thermometer className="w-4 h-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-2">
              <div className="text-2xl font-bold">
                {temperature?.toFixed(1) ?? "--"}°C
              </div>
              <SensorTrend value={temperatureTrend} precision={1} />
            </div>
            <SensorGauge
              value={temperature || 0}
              min={0}
              max={40}
              threshold={18}
              highThreshold={28}
              label="Optimal: 18-28°C"
              color="orange"
            />
          </CardContent>
        </Card>

        <Card className="card-elevated">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base">Soil pH</CardTitle>
            <Leaf className="w-4 h-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-2">
              <div className="text-2xl font-bold">{pH?.toFixed(1) ?? "--"}</div>
              <SensorTrend value={pHTrend} precision={1} />
            </div>
            <SensorGauge
              value={pH || 0}
              min={4}
              max={9}
              threshold={5.5}
              highThreshold={7.5}
              label="Optimal: 5.5-7.5"
              color="purple"
            />
          </CardContent>
        </Card>
      </div>

      {/* Main Controls */}
      <Tabs defaultValue="manual" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="manual">Manual Control</TabsTrigger>
          <TabsTrigger value="schedule">Scheduling</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="manual" className="space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            <Card className="card-elevated">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-base">Manual Pump</CardTitle>
                <Badge variant={pumpOn ? "default" : "secondary"}>
                  {pumpOn ? "Active" : "Inactive"}
                </Badge>
              </CardHeader>
              <CardContent className="grid gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Waves className="w-4 h-4" />
                    <span>Water Pump</span>
                  </div>
                  <Switch
                    checked={pumpOn}
                    onCheckedChange={togglePump}
                    aria-label="Toggle pump"
                    disabled={!deviceId}
                  />
                </div>
                <div className="text-xs text-muted-foreground">
                  Manually control the water pump. Use for immediate watering
                  needs.
                </div>
              </CardContent>
            </Card>

            <Card className="card-elevated">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-base">Quick Run</CardTitle>
                {runCountdown > 0 ? (
                  <Badge variant="default">
                    <Clock className="w-3 h-3 mr-1" />
                    {runCountdown}s left
                  </Badge>
                ) : null}
              </CardHeader>
              <CardContent className="grid gap-3">
                <div className="grid gap-1">
                  <Label htmlFor="duration">Duration (seconds)</Label>
                  <Input
                    id="duration"
                    type="number"
                    value={quickRunSec}
                    onChange={(e) =>
                      setQuickRunSec(Number.parseInt(e.target.value || "0", 10))
                    }
                    min={1}
                    step={1}
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={startQuickRun}
                    disabled={!deviceId || quickRunSec <= 0 || runCountdown > 0}
                    size="sm"
                  >
                    Start
                  </Button>
                  <Button
                    variant="outline"
                    onClick={stopQuickRun}
                    disabled={!deviceId || (runCountdown <= 0 && !pumpOn)}
                    size="sm"
                  >
                    Stop
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="card-elevated">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-base">Threshold</CardTitle>
                <Badge variant="secondary">{threshold}%</Badge>
              </CardHeader>
              <CardContent className="grid gap-3">
                <div className="grid gap-1">
                  <Label htmlFor="threshold">Low moisture threshold (%)</Label>
                  <Input
                    id="threshold"
                    type="number"
                    value={threshold}
                    onChange={(e) =>
                      setThreshold(Number.parseInt(e.target.value || "0", 10))
                    }
                    min={0}
                    max={100}
                    step={1}
                  />
                </div>
                <Button
                  variant="outline"
                  onClick={saveThreshold}
                  disabled={!deviceId}
                  size="sm"
                >
                  Save Threshold
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="schedule" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <Card className="card-elevated">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Zap className="w-4 h-4 text-yellow-500" />
                  Auto Mode
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Smart Watering</div>
                    <div className="text-sm text-muted-foreground">
                      Automatically water when moisture is low
                    </div>
                  </div>
                  <Switch checked={autoMode} onCheckedChange={setAutoMode} />
                </div>
                <div className="text-xs text-muted-foreground">
                  When enabled, the system will automatically water your plants
                  when soil moisture drops below the threshold.
                </div>
              </CardContent>
            </Card>

            <Card className="card-elevated">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-green-500" />
                  Scheduled Watering
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Daily Schedule</div>
                    <div className="text-sm text-muted-foreground">
                      Water at a specific time each day
                    </div>
                  </div>
                  <Switch
                    checked={scheduleEnabled}
                    onCheckedChange={setScheduleEnabled}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="grid gap-1">
                    <Label htmlFor="scheduleTime">Time</Label>
                    <Input
                      id="scheduleTime"
                      type="time"
                      value={scheduleTime}
                      onChange={(e) => setScheduleTime(e.target.value)}
                      disabled={!scheduleEnabled}
                    />
                  </div>
                  <div className="grid gap-1">
                    <Label htmlFor="scheduleDuration">Duration (sec)</Label>
                    <Input
                      id="scheduleDuration"
                      type="number"
                      value={scheduleDuration}
                      onChange={(e) =>
                        setScheduleDuration(
                          Number.parseInt(e.target.value || "0", 10)
                        )
                      }
                      disabled={!scheduleEnabled}
                      min={1}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            <Card className="card-elevated">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-base">Water Usage</CardTitle>
                <Droplets className="w-4 h-4 text-blue-500" />
              </CardHeader>
              <CardContent className="grid gap-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-muted-foreground">Today</div>
                    <div className="text-xl font-semibold">
                      {waterUsageToday.toFixed(1)}L
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">
                      This Week
                    </div>
                    <div className="text-xl font-semibold">
                      {waterUsageWeek.toFixed(1)}L
                    </div>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">
                  Estimated based on pump activations
                </div>
              </CardContent>
            </Card>

            <Card className="card-elevated">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-base">Efficiency</CardTitle>
                <TrendingUp className="w-4 h-4 text-green-500" />
              </CardHeader>
              <CardContent className="grid gap-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-muted-foreground">
                      Avg Moisture
                    </div>
                    <div className="text-xl font-semibold">
                      {history.length
                        ? Math.round(
                            history.reduce((a, b) => a + b.moisture, 0) /
                              history.length
                          )
                        : 0}
                      %
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">
                      Pump Cycles
                    </div>
                    <div className="text-xl font-semibold">
                      {actions.filter((a) => a.state === true).length}
                    </div>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">
                  System performance metrics
                </div>
              </CardContent>
            </Card>

            <Card className="card-elevated">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-base">Recommendations</CardTitle>
                <AlarmClockCheck className="w-4 h-4 text-purple-500" />
              </CardHeader>
              <CardContent className="grid gap-2">
                {moisture && moisture < threshold && (
                  <div className="text-sm text-orange-600">
                    • Consider watering soon - moisture is low
                  </div>
                )}
                {humidity && humidity < 40 && (
                  <div className="text-sm text-blue-600">
                    • Low humidity detected - monitor closely
                  </div>
                )}
                {temperature && temperature > 28 && (
                  <div className="text-sm text-red-600">
                    • High temperature - increase watering frequency
                  </div>
                )}
                {(!moisture || moisture >= threshold) &&
                  (!humidity || humidity >= 40) &&
                  (!temperature || temperature <= 28) && (
                    <div className="text-sm text-green-600">
                      • All conditions optimal
                    </div>
                  )}
              </CardContent>
            </Card>
          </div>

          <Card className="card-elevated">
            <CardHeader>
              <CardTitle>Water Usage Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <WaterUsageChart
                data={actions.filter((a) => a.state === true).slice(-30)}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <div className="grid gap-4">
            <Card className="card-elevated">
              <CardHeader>
                <CardTitle>Irrigation History</CardTitle>
              </CardHeader>
              <CardContent>
                <IrrigationChart
                  data={history.map(({ at, moisture }) => ({ at, moisture }))}
                  threshold={threshold}
                  pumpEvents={history.filter((h) => h.pumpOn).map((h) => h.at)}
                />
              </CardContent>
            </Card>

            <Card className="card-elevated">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-600" />
                  Recent Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-2 text-sm max-h-96 overflow-y-auto">
                {actions.length ? (
                  actions.map((a) => (
                    <div
                      key={a.id}
                      className="flex items-center justify-between border rounded px-3 py-2"
                    >
                      <div className="grid">
                        <div className="font-medium">
                          {a.action === "pump"
                            ? a.state
                              ? "Pump ON"
                              : "Pump OFF"
                            : a.action}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Device: {a.deviceId}
                        </div>
                      </div>
                      <div className="text-right text-xs text-muted-foreground">
                        <div
                          className={cn(
                            "capitalize",
                            a.status === "done"
                              ? "text-green-600"
                              : a.status === "pending"
                              ? "text-orange-600"
                              : ""
                          )}
                        >
                          {a.status || "pending"}
                        </div>
                        <div>
                          {a.createdAt
                            ? new Date(a.createdAt).toLocaleString()
                            : ""}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-muted-foreground">
                    No irrigation history available.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
