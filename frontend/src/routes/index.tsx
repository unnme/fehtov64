import { createFileRoute, Link } from "@tanstack/react-router";
import { LogIn, User } from "lucide-react";

import { Navbar } from "@/components/Common/Navbar";
import { Button } from "@/components/ui/button";
import { isLoggedIn } from "@/hooks/useAuth";
import { PublicNewsList } from "@/components/News/PublicNewsList";

export const Route = createFileRoute("/")({
  component: Landing,
  head: () => ({
    meta: [
      {
        title: "Welcome - FastAPI Cloud",
      },
    ],
  }),
});

// Landing page with hero section and public news list
function Landing() {
  const loggedIn = isLoggedIn();

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-background to-muted/20">
      <Navbar />
      <main className="flex flex-1 flex-col">
        {/* Hero section with welcome message and CTA buttons */}
        <section className="flex items-center justify-center px-4 py-12">
          <div className="container flex flex-col items-center gap-8 text-center max-w-4xl mx-auto">
            <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <h1 className="text-4xl font-bold tracking-tight sm:text-6xl lg:text-7xl bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                Добро пожаловать
              </h1>
              <p className="text-lg text-muted-foreground sm:text-xl max-w-2xl">
                Современная платформа для управления вашими задачами и новостями
              </p>
            </div>

            {loggedIn ? (
              <div className="flex flex-col sm:flex-row gap-4 animate-in fade-in slide-in-from-bottom-6 duration-1000">
                    <Link to="/dashboard">
                      <Button size="lg" className="text-lg px-8 py-6 gap-2">
                        <User className="h-5 w-5" />
                        Перейти в панель управления
                      </Button>
                    </Link>
                    <Link to="/news">
                  <Button
                    size="lg"
                    variant="outline"
                    className="text-lg px-8 py-6"
                  >
                    Просмотреть новости
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row gap-4 animate-in fade-in slide-in-from-bottom-6 duration-1000">
                <Link to="/auth/login">
                  <Button size="lg" className="text-lg px-8 py-6 gap-2">
                    <LogIn className="h-5 w-5" />
                    Войти в систему
                  </Button>
                </Link>
                <Link to="/auth/signup">
                  <Button
                    size="lg"
                    variant="outline"
                    className="text-lg px-8 py-6"
                  >
                    Зарегистрироваться
                  </Button>
                </Link>
              </div>
            )}

            <div className="mt-12 grid gap-8 sm:grid-cols-3 w-full max-w-3xl animate-in fade-in slide-in-from-bottom-8 duration-1200">
              <div className="flex flex-col gap-2 p-6 rounded-lg border bg-card">
                <div className="text-3xl font-bold text-primary">Быстро</div>
                <p className="text-sm text-muted-foreground">
                  Высокая производительность и отзывчивый интерфейс
                </p>
              </div>
              <div className="flex flex-col gap-2 p-6 rounded-lg border bg-card">
                <div className="text-3xl font-bold text-primary">Безопасно</div>
                <p className="text-sm text-muted-foreground">
                  Защита данных и безопасная аутентификация
                </p>
              </div>
              <div className="flex flex-col gap-2 p-6 rounded-lg border bg-card">
                <div className="text-3xl font-bold text-primary">Удобно</div>
                <p className="text-sm text-muted-foreground">
                  Интуитивный интерфейс и простое управление
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Public news section */}
        <section id="news-section" className="border-t bg-muted/30 py-12">
          <PublicNewsList />
        </section>
      </main>
    </div>
  );
}
