"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sprout } from "lucide-react";
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
  const [name, setName] = useState("");
  const [id, setId] = useState("");
  const router = useRouter();

  const load = async () => {
    const res = await fetchJSON<{ data?: Device[]; error?: string }>(
      "/api/devices"
    );
    if (!res.ok) {
      if (res.status === 401) router.push("/login");
      else alert(`Failed to load devices: ${res.error}`);
      return;
    }
    setDevices(res.data?.data || []);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="grid gap-6">
      <Card className="">
        <CardHeader>
          <CardTitle>Register Device</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3">
          <div className="grid sm:grid-cols-3 gap-3">
            <div className="grid gap-1">
              <Label>Device ID</Label>
              <Input
                value={id}
                onChange={(e) => setId(e.target.value)}
                placeholder="esp32-xxxx"
              />
            </div>
            <div className="grid gap-1">
              <Label>Device Name</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Green Basil"
              />
            </div>
          </div>
          <Button
            onClick={async () => {
              const created = await fetchJSON<{
                secret?: string;
                error?: string;
              }>("/api/devices", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id, name }),
              });
              if (!created.ok) {
                alert(
                  `Failed to add device: ${
                    created.error ||
                    (created.data as any)?.message ||
                    "Unknown error"
                  }`
                );
                return;
              }
              await load();
              alert(
                `Device secret (copy to your ESP): ${created.data?.secret}`
              );
              setName("");
              setId("");
            }}
          >
            Add Device
          </Button>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {devices.map((d) => (
          <Card key={d.id} className="">
            <CardHeader className="flex flex-row items-center gap-2">
              <Sprout className="w-4 h-4 text-green-600" />
              <CardTitle className="text-base">{d.name}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <div>ID: {d.id}</div>
              <div>Last Moisture: {d.lastMoisture ?? "--"}%</div>
              <div>
                Last Seen:{" "}
                {d.lastSeen ? new Date(d.lastSeen).toLocaleString() : "never"}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
