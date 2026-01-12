import { createFileRoute } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";

import { Breadcrumbs } from "@/components/Common/Breadcrumbs";
import useAuth from "@/hooks/useAuth";

export const Route = createFileRoute("/_layout/dashboard")({
  component: Dashboard,
  head: () => ({
    meta: [
      {
        title: "Dashboard - FastAPI Cloud",
      },
    ],
  }),
});

function Dashboard() {
  const { user } = useAuth();
  const userName = user?.full_name;
  const userEmail = user?.email;

  return (
    <div className="flex flex-col h-full">
      <Breadcrumbs />
      <div className="flex items-center justify-center flex-1">
        <div className="text-center space-y-6 max-w-2xl mx-auto px-4">
        <div className="flex items-center justify-center gap-1 mb-2">
          <Sparkles className="h-6 w-6 text-primary animate-pulse" />
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            {userName ? (
              <>
                Добро пожаловать,{" "}
                <span className="text-primary">{userName}</span>!
              </>
            ) : userEmail ? (
              <>
                Добро пожаловать,{" "}
                <span className="text-primary">{userEmail}</span>!
              </>
            ) : (
              "Добро пожаловать!"
            )}
          </h1>
          <Sparkles className="h-6 w-6 text-primary animate-pulse" />
        </div>
        <p className="text-sm md:text-base text-muted-foreground">
          Рады видеть вас в панели управления
        </p>
        </div>
      </div>
    </div>
  );
}
