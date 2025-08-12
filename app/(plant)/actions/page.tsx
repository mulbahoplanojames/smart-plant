"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { fetchJSON } from "@/lib/fetch-json";
import { useRouter } from "next/navigation";
import {
  Activity,
  CheckCircle2,
  Clock,
  Filter,
  Loader2,
  RefreshCw,
  Search,
  Settings,
  Waves,
  Zap,
  AlertCircle,
  Calendar,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Action = {
  id: string;
  deviceId: string;
  action: string;
  state?: boolean | null;
  createdAt?: string;
  status?: string;
};

export default function ActionsPage() {
  const [actions, setActions] = useState<Action[]>([]);
  const [filteredActions, setFilteredActions] = useState<Action[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [actionFilter, setActionFilter] = useState("all");
  const router = useRouter();

  const load = async () => {
    setLoading(true);
    const res = await fetchJSON<{ data?: Action[]; error?: string }>(
      "/api/actions/list"
    );
    if (!res.ok) {
      if (res.status === 401) router.push("/login");
      setLoading(false);
      return;
    }
    const data = res.data?.data || [];
    setActions(data);
    setFilteredActions(data);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [router]);

  // Filter actions based on search and filters
  useEffect(() => {
    let filtered = actions;

    if (searchTerm) {
      filtered = filtered.filter(
        (action) =>
          action.deviceId.toLowerCase().includes(searchTerm.toLowerCase()) ||
          action.action.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((action) => action.status === statusFilter);
    }

    if (actionFilter !== "all") {
      filtered = filtered.filter((action) => action.action === actionFilter);
    }

    setFilteredActions(filtered);
  }, [actions, searchTerm, statusFilter, actionFilter]);

  const getActionIcon = (action: string) => {
    switch (action) {
      case "pump":
        return <Waves className="w-4 h-4" />;
      case "calibrate":
        return <Settings className="w-4 h-4" />;
      default:
        return <Zap className="w-4 h-4" />;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case "pump":
        return "text-blue-600";
      case "calibrate":
        return "text-purple-600";
      default:
        return "text-gray-600";
    }
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case "done":
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case "pending":
        return <Clock className="w-4 h-4 text-orange-500" />;
      case "failed":
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />;
    }
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case "done":
        return (
          <Badge
            variant="secondary"
            className="bg-green-50 text-green-700 border-green-200"
          >
            Completed
          </Badge>
        );
      case "pending":
        return (
          <Badge
            variant="secondary"
            className="bg-orange-50 text-orange-700 border-orange-200"
          >
            Pending
          </Badge>
        );
      case "failed":
        return (
          <Badge
            variant="secondary"
            className="bg-red-50 text-red-700 border-red-200"
          >
            Failed
          </Badge>
        );
      default:
        return (
          <Badge
            variant="secondary"
            className="bg-gray-50 text-gray-700 border-gray-200"
          >
            Unknown
          </Badge>
        );
    }
  };

  const formatActionDescription = (action: Action) => {
    if (action.action === "pump") {
      return action.state ? "Water pump activated" : "Water pump deactivated";
    }
    if (action.action === "calibrate") {
      return "Moisture threshold calibrated";
    }
    return `${action.action} command executed`;
  };

  const stats = {
    total: actions.length,
    completed: actions.filter((a) => a.status === "done").length,
    pending: actions.filter((a) => a.status === "pending").length,
    failed: actions.filter((a) => a.status === "failed").length,
  };

  return (
    <div className="grid gap-6">
      {/* Header */}
      <Card className="card-elevated">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl flex items-center gap-2">
                <Activity className="w-5 h-5 text-emerald-600" />
                System Activity
              </CardTitle>
              <CardDescription className="mt-1">
                Monitor and track all irrigation system actions and commands
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

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="card-elevated">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded-lg">
                <TrendingUp className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{stats.total}</div>
                <div className="text-xs text-muted-foreground">
                  Total Actions
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-elevated">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-50 rounded-lg">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{stats.completed}</div>
                <div className="text-xs text-muted-foreground">Completed</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-elevated">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-50 rounded-lg">
                <Clock className="w-4 h-4 text-orange-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{stats.pending}</div>
                <div className="text-xs text-muted-foreground">Pending</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-elevated">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-50 rounded-lg">
                <AlertCircle className="w-4 h-4 text-red-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{stats.failed}</div>
                <div className="text-xs text-muted-foreground">Failed</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="card-elevated">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search by device or action..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="done">Completed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  <SelectItem value="pump">Pump</SelectItem>
                  <SelectItem value="calibrate">Calibrate</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions List */}
      <Card className="card-elevated">
        <CardHeader>
          <CardTitle className="text-lg">Recent Activity</CardTitle>
          <CardDescription>
            {filteredActions.length} of {actions.length} actions
            {searchTerm && ` matching "${searchTerm}"`}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-muted-foreground">
                Loading activities...
              </span>
            </div>
          ) : filteredActions.length > 0 ? (
            <div className="divide-y divide-border">
              {filteredActions.map((action, index) => (
                <div
                  key={action.id}
                  className={cn(
                    "p-4 hover:bg-muted/30 transition-colors",
                    index === 0 && "bg-muted/20" // Highlight most recent
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div
                        className={cn(
                          "p-2 rounded-lg bg-muted",
                          getActionColor(action.action)
                        )}
                      >
                        {getActionIcon(action.action)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">
                            {formatActionDescription(action)}
                          </h3>
                          {index === 0 && (
                            <Badge
                              variant="secondary"
                              className="bg-blue-50 text-blue-700 border-blue-200 text-xs"
                            >
                              Latest
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {action.createdAt
                              ? new Date(action.createdAt).toLocaleString()
                              : "Unknown time"}
                          </span>
                          <span>Device: {action.deviceId}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {getStatusIcon(action.status)}
                      {getStatusBadge(action.status)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Activity className="w-12 h-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium text-muted-foreground mb-2">
                No activities found
              </h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                {searchTerm || statusFilter !== "all" || actionFilter !== "all"
                  ? "Try adjusting your filters to see more results."
                  : "System activities will appear here once your devices start sending commands."}
              </p>
              {(searchTerm ||
                statusFilter !== "all" ||
                actionFilter !== "all") && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4 bg-transparent"
                  onClick={() => {
                    setSearchTerm("");
                    setStatusFilter("all");
                    setActionFilter("all");
                  }}
                >
                  Clear Filters
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
