"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUserSession } from "@/lib/hooks/use-user-session";
import { Toaster } from "@/components/ui/sonner";
import {
  SidebarProvider,
  SidebarTrigger,
  SidebarInset,
} from "@/components/ui/sidebar";
import "@/styles/brand.css";

export default function PlantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, refetch } = useUserSession();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      // Clear user state
      refetch();
      // Navigate to login without full page reload
      router.push("/login");
      router.refresh();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <div className="min-h-screen">
      <SidebarProvider defaultOpen>
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-14 items-center gap-4 border-b header-blur px-4">
            <SidebarTrigger />
            <div className="flex-1 flex items-center gap-4 text-sm">
              <Link href="/dashboard" className="hover:underline">
                Dashboard
              </Link>
              <Link href="/devices" className="hover:underline">
                Devices
              </Link>
              <Link href="/plants" className="hover:underline">
                Plants
              </Link>
              <Link href="/actions" className="hover:underline">
                Activity
              </Link>
              <Link href="/settings" className="hover:underline">
                Settings
              </Link>
            </div>
            <div className="ml-auto flex items-center gap-2">
              {user ? (
                <>
                  <span className="text-xs text-muted-foreground">
                    {user.email}
                  </span>
                  <Button size="sm" variant="outline" onClick={handleLogout}>
                    Sign out
                  </Button>
                </>
              ) : (
                <>
                  <Link href="/login" passHref>
                    <Button variant="outline" size="sm">
                      Login
                    </Button>
                  </Link>
                  <Link href="/signup" passHref>
                    <Button size="sm">Sign up</Button>
                  </Link>
                </>
              )}
            </div>
          </header>
          <main className="p-4 md:p-6">{children}</main>
          <Toaster position="bottom-right" />
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}
