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
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { fetchJSON } from "@/lib/fetch-json";
import { useRouter } from "next/navigation";
import {
  Flower2,
  Plus,
  Leaf,
  Sprout,
  Droplets,
  FileText,
  Loader2,
  RefreshCw,
  Search,
  Filter,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
  const [filteredPlants, setFilteredPlants] = useState<Plant[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterConnected, setFilterConnected] = useState("all");

  // Form state
  const [name, setName] = useState("");
  const [species, setSpecies] = useState("");
  const [deviceId, setDeviceId] = useState("");
  const [notes, setNotes] = useState("");
  const [threshold, setThreshold] = useState<number | "">("");

  const router = useRouter();

  const load = async () => {
    setLoading(true);
    const res = await fetchJSON<{ data?: Plant[]; error?: string }>(
      "/api/plants"
    );
    if (!res.ok) {
      if (res.status === 401) router.push("/login");
      else alert(`Failed to load plants: ${res.error}`);
      setLoading(false);
      return;
    }
    const data = res.data?.data || [];
    setPlants(data);
    setFilteredPlants(data);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Filter plants based on search and connection status
  useEffect(() => {
    let filtered = plants;

    if (searchTerm) {
      filtered = filtered.filter(
        (plant) =>
          plant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          plant.species?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          plant.deviceId?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterConnected !== "all") {
      if (filterConnected === "connected") {
        filtered = filtered.filter((plant) => plant.deviceId);
      } else {
        filtered = filtered.filter((plant) => !plant.deviceId);
      }
    }

    setFilteredPlants(filtered);
  }, [plants, searchTerm, filterConnected]);

  const create = async () => {
    if (!name.trim()) return;

    setAdding(true);
    const res = await fetchJSON("/api/plants", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: name.trim(),
        species: species.trim() || null,
        deviceId: deviceId.trim() || null,
        notes: notes.trim() || null,
        threshold: threshold === "" ? null : threshold,
      }),
    });

    if (!res.ok) {
      alert(`Failed to create plant: ${res.error}`);
      setAdding(false);
      return;
    }

    // Reset form
    setName("");
    setSpecies("");
    setDeviceId("");
    setNotes("");
    setThreshold("");
    setAdding(false);

    await load();
  };

  const getPlantIcon = (species?: string) => {
    if (!species) return <Leaf className="w-4 h-4" />;

    const lowerSpecies = species.toLowerCase();
    if (
      lowerSpecies.includes("herb") ||
      lowerSpecies.includes("basil") ||
      lowerSpecies.includes("mint")
    ) {
      return <Leaf className="w-4 h-4 text-green-600" />;
    }
    if (
      lowerSpecies.includes("flower") ||
      lowerSpecies.includes("rose") ||
      lowerSpecies.includes("tulip")
    ) {
      return <Flower2 className="w-4 h-4 text-pink-600" />;
    }
    return <Sprout className="w-4 h-4 text-emerald-600" />;
  };

  const getConnectionBadge = (deviceId?: string | null) => {
    if (deviceId) {
      return (
        <Badge
          variant="secondary"
          className="bg-green-50 text-green-700 border-green-200"
        >
          <Sprout className="w-3 h-3 mr-1" />
          Connected
        </Badge>
      );
    }
    return (
      <Badge
        variant="secondary"
        className="bg-gray-50 text-gray-700 border-gray-200"
      >
        Manual
      </Badge>
    );
  };

  const stats = {
    total: plants.length,
    connected: plants.filter((p) => p.deviceId).length,
    manual: plants.filter((p) => !p.deviceId).length,
  };

  return (
    <div className="grid gap-6">
      {/* Header */}
      <Card className="card-elevated">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl flex items-center gap-2">
                <Flower2 className="w-5 h-5 text-pink-600" />
                Plant Management
              </CardTitle>
              <CardDescription className="mt-1">
                Manage your plants and connect them to irrigation devices
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

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="card-elevated">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded-lg">
                <Flower2 className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{stats.total}</div>
                <div className="text-xs text-muted-foreground">
                  Total Plants
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-elevated">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-50 rounded-lg">
                <Sprout className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{stats.connected}</div>
                <div className="text-xs text-muted-foreground">Connected</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-elevated">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-50 rounded-lg">
                <Leaf className="w-4 h-4 text-orange-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{stats.manual}</div>
                <div className="text-xs text-muted-foreground">Manual Care</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add Plant Form */}
      <Card className="card-elevated">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Plus className="w-5 h-5 text-green-600" />
            Add New Plant
          </CardTitle>
          <CardDescription>
            Register a new plant in your garden management system
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="plantName">Plant Name *</Label>
              <Input
                id="plantName"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="My Beautiful Basil"
                disabled={adding}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="plantSpecies">Species</Label>
              <Input
                id="plantSpecies"
                value={species}
                onChange={(e) => setSpecies(e.target.value)}
                placeholder="Ocimum basilicum"
                disabled={adding}
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="plantDevice">Device ID (optional)</Label>
              <Input
                id="plantDevice"
                value={deviceId}
                onChange={(e) => setDeviceId(e.target.value)}
                placeholder="demo-device-1"
                disabled={adding}
              />
              <div className="text-xs text-muted-foreground">
                Connect to an irrigation device
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="plantThreshold">Moisture Threshold (%)</Label>
              <Input
                id="plantThreshold"
                type="number"
                value={threshold}
                onChange={(e) =>
                  setThreshold(
                    e.target.value === "" ? "" : Number(e.target.value)
                  )
                }
                placeholder="35"
                min={0}
                max={100}
                disabled={adding}
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="plantNotes">Care Notes</Label>
            <Textarea
              id="plantNotes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Special care instructions, watering schedule, or other notes..."
              disabled={adding}
              rows={3}
            />
          </div>

          <Button
            onClick={create}
            disabled={adding || !name.trim()}
            className="w-fit"
          >
            {adding ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Adding Plant...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" />
                Add Plant
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Search and Filter */}
      <Card className="card-elevated">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search plants by name, species, or device..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterConnected} onValueChange={setFilterConnected}>
              <SelectTrigger className="w-40">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Plants</SelectItem>
                <SelectItem value="connected">Connected</SelectItem>
                <SelectItem value="manual">Manual Care</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Plants Grid */}
      <div className="grid gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            Your Plants ({filteredPlants.length}
            {filteredPlants.length !== plants.length && ` of ${plants.length}`})
          </h2>
        </div>

        {loading ? (
          <Card className="card-elevated">
            <CardContent className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-muted-foreground">
                Loading plants...
              </span>
            </CardContent>
          </Card>
        ) : filteredPlants.length > 0 ? (
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredPlants.map((plant) => (
              <Card
                key={plant.id}
                className="card-elevated hover:shadow-lg transition-shadow"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-50 rounded-lg">
                        {getPlantIcon(plant.species)}
                      </div>
                      <div>
                        <CardTitle className="text-base">
                          {plant.name}
                        </CardTitle>
                        {plant.species && (
                          <div className="text-xs text-muted-foreground mt-1 italic">
                            {plant.species}
                          </div>
                        )}
                      </div>
                    </div>
                    {getConnectionBadge(plant.deviceId)}
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="grid gap-3">
                    {/* Device Connection */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Sprout className="w-4 h-4 text-emerald-500" />
                        <span className="text-sm font-medium">Device</span>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {plant.deviceId || "Manual care"}
                      </span>
                    </div>

                    {/* Threshold */}
                    {plant.threshold && (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Droplets className="w-4 h-4 text-blue-500" />
                          <span className="text-sm font-medium">Threshold</span>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {plant.threshold}%
                        </span>
                      </div>
                    )}

                    {/* Notes */}
                    {plant.notes && (
                      <div className="mt-2">
                        <div className="flex items-center gap-2 mb-1">
                          <FileText className="w-4 h-4 text-purple-500" />
                          <span className="text-sm font-medium">
                            Care Notes
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
                          {plant.notes.length > 100
                            ? `${plant.notes.substring(0, 100)}...`
                            : plant.notes}
                        </p>
                      </div>
                    )}

                    {/* Status indicator */}
                    <div className="mt-2 pt-2 border-t">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Status</span>
                        <div className="flex items-center gap-1">
                          <div
                            className={cn(
                              "w-2 h-2 rounded-full",
                              plant.deviceId ? "bg-green-500" : "bg-orange-500"
                            )}
                          />
                          <span
                            className={cn(
                              plant.deviceId
                                ? "text-green-600"
                                : "text-orange-600"
                            )}
                          >
                            {plant.deviceId ? "Automated" : "Manual"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="card-elevated">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <Flower2 className="w-12 h-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium text-muted-foreground mb-2">
                {searchTerm || filterConnected !== "all"
                  ? "No plants found"
                  : "No plants added yet"}
              </h3>
              <p className="text-sm text-muted-foreground max-w-sm mb-4">
                {searchTerm || filterConnected !== "all"
                  ? "Try adjusting your search or filter criteria."
                  : "Start building your digital garden by adding your first plant."}
              </p>
              {searchTerm || filterConnected !== "all" ? (
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchTerm("");
                    setFilterConnected("all");
                  }}
                >
                  Clear Filters
                </Button>
              ) : (
                <Button
                  variant="outline"
                  onClick={() => document.getElementById("plantName")?.focus()}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Your First Plant
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
