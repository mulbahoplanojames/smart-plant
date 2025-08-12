"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { fetchJSON } from "@/lib/fetch-json";
import { useRouter } from "next/navigation";

type Plant = {
  id: string;
  name: string;
  species?: string;
  notes?: string;
  deviceId?: string | null;
  threshold?: number | null;
};

export default function PlantsPage() {
  const [plants, setPlants] = useState<Plant[]>([]);
  const [name, setName] = useState("");
  const [species, setSpecies] = useState("");
  const [deviceId, setDeviceId] = useState("");
  const [devices, setDevices] = useState<any[]>([]);
  const [notes, setNotes] = useState("");
  const [threshold, setThreshold] = useState<number | "">("");
  const router = useRouter();

  const load = async () => {
    const res = await fetchJSON<{ data?: Plant[]; error?: string }>(
      "/api/plants"
    );
    if (!res.ok) {
      if (res.status === 401) router.push("/login");
      else alert(`Failed to load plants: ${res.error}`);
      return;
    }
    setPlants(res.data?.data || []);
  };

  useEffect(() => {
    load();
    // Fetch devices for dropdown
    (async () => {
      const res = await fetchJSON<{ data: any[] }>("/api/devices");
      if (res.ok && res.data?.data?.length) {
        setDevices(res.data.data);
        setDeviceId((curr) => curr || res?.data?.data[0].id);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const create = async () => {
    const res = await fetchJSON("/api/plants", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        species,
        deviceId: deviceId || null,
        notes,
        threshold: threshold === "" ? null : threshold,
      }),
    });
    if (!res.ok) {
      alert(`Failed to create plant: ${res.error}`);
      return;
    }
    setName("");
    setSpecies("");
    setDeviceId("");
    setNotes("");
    setThreshold("");
    await load();
  };

  return (
    <div className="grid gap-6">
      <Card className="">
        <CardHeader>
          <CardTitle>Add Plant</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3">
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="grid gap-1">
              <Label>Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="grid gap-1">
              <Label>Species</Label>
              <Input
                value={species}
                onChange={(e) => setSpecies(e.target.value)}
              />
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="grid gap-1">
              <Label>Device</Label>
              <select
                value={deviceId}
                onChange={(e) => setDeviceId(e.target.value)}
                className="border rounded px-2 py-1"
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
            <div className="grid gap-1">
              <Label>Threshold (%)</Label>
              <Input
                type="number"
                value={threshold}
                onChange={(e) =>
                  setThreshold(
                    e.target.value === "" ? "" : Number(e.target.value)
                  )
                }
                placeholder="35"
              />
            </div>
          </div>
          <div className="grid gap-1">
            <Label>Notes</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
          <Button onClick={create} disabled={!name}>
            Create
          </Button>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {plants.map((p) => (
          <Card key={p.id} className="">
            <CardHeader>
              <CardTitle className="text-base">{p.name}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground grid gap-1">
              <div>Species: {p.species || "-"}</div>
              <div>Device: {p.deviceId || "-"}</div>
              <div>Threshold: {p.threshold ?? "-"}</div>
              <div className="text-xs">{p.notes || ""}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
