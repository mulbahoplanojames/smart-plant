import { useState, useEffect, useCallback } from "react";
import { fetchJSON } from "@/lib/fetch-json";

export function useUserSession() {
  const [user, setUser] = useState<{ email?: string } | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetchJSON<{ uid: string; email: string }>(
        "/api/users/me"
      );
      if (res.ok && res.data?.email) {
        setUser({ email: res.data.email });
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error("Failed to fetch user:", error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  return { user, loading, refetch: fetchUser };
}
