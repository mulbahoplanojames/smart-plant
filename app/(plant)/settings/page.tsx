"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { fetchJSON } from "@/lib/fetch-json";

type Me = { uid: string; email: string; name?: string | null };

export default function SettingsPage() {
  const [me, setMe] = useState<Me | null>(null);
  const router = useRouter();

  useEffect(() => {
    const load = async () => {
      const res = await fetchJSON<Me>("/api/users/me");
      if (!res.ok) {
        if (res.status === 401) router.push("/login");
        return;
      }
      setMe(res.data as any);
    };
    load();
  }, [router]);

  return (
    <div className="grid gap-6 max-w-3xl">
      <Card className="">
        <CardHeader>
          <CardTitle>Account</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3">
          <div className="grid gap-1">
            <Label>Name</Label>
            <Input value={me?.name || ""} disabled placeholder="Your name" />
          </div>
          <div className="grid gap-1">
            <Label>Email</Label>
            <Input
              value={me?.email || ""}
              disabled
              placeholder="you@example.com"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
