import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

import { UsersService } from "@/client";
import AppSidebar from "@/components/Sidebar/AppSidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { isLoggedIn } from "@/hooks/useAuth";

// Protected layout route - requires authentication
export const Route = createFileRoute("/_layout")({
  component: Layout,
  beforeLoad: async () => {
    if (!isLoggedIn()) {
      throw redirect({
        to: "/auth/login",
      });
    }
    // Validate token authenticity
    try {
      await UsersService.usersReadUserMe();
    } catch (error: any) {
      // Clear invalid token and redirect to login on auth errors
      if (error?.status === 401 || error?.status === 403) {
        localStorage.removeItem("access_token");
        localStorage.removeItem("token_expires_at");
        throw redirect({
          to: "/auth/login",
        });
      }
      // Ignore other errors (may be network issue)
    }
  },
});

function Layout() {
  return (
    <SidebarProvider className="h-svh">
      <AppSidebar />
      <SidebarInset className="h-full flex flex-col overflow-hidden">
        <main className="flex-1 overflow-hidden flex flex-col min-h-0">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}

export default Layout;
