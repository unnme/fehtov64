import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

import { UsersService } from "@/client";
import { AdminNavbar } from "@/components/Common/AdminNavbar";
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
    // Validate token by calling API
    try {
      await UsersService.usersReadUserMe();
    } catch {
      // Any error means invalid session - clear and redirect
      localStorage.removeItem("access_token");
      localStorage.removeItem("token_expires_at");
      throw redirect({
        to: "/auth/login",
      });
    }
  },
});

function Layout() {
  return (
    <div className="h-svh flex flex-col">
      <AdminNavbar />
      <main className="flex-1 overflow-hidden flex flex-col min-h-0">
        <Outlet />
      </main>
    </div>
  );
}

export default Layout;
