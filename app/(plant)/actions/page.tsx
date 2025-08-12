"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchJSON } from "@/lib/fetch-json";
import { useRouter } from "next/navigation";

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
  const router = useRouter();

  useEffect(() => {
    const load = async () => {
      const res = await fetchJSON<{ data?: Action[]; error?: string }>(
        "/api/actions/list"
      );
      if (!res.ok) {
        if (res.status === 401) router.push("/login");
        return;
      }
      setActions(res.data?.data || []);
    };
    load();
  }, [router]);

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Recent Actions</CardTitle>
        </CardHeader>
        <CardContent className="text-sm">
          <div className="grid gap-2">
            {actions.map((a) => (
              <div
                key={a.id}
                className="flex items-center justify-between border rounded px-3 py-2"
              >
                <div className="grid">
                  <div className="font-medium">{a.action}</div>
                  <div className="text-xs text-muted-foreground">
                    Device: {a.deviceId}
                  </div>
                </div>
                <div className="text-right text-xs text-muted-foreground">
                  <div>{a.status || "pending"}</div>
                  <div>
                    {a.createdAt ? new Date(a.createdAt).toLocaleString() : ""}
                  </div>
                </div>
              </div>
            ))}
            {!actions.length && (
              <div className="text-muted-foreground">No actions yet.</div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
