import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "next-themes";
import { PrayerProvider } from "./contexts/prayer-context";
import { Navigation } from "./components/navigation";
import { ThemeToggle } from "./components/theme-toggle";
import Dashboard from "./pages/dashboard";
import Achievements from "./pages/achievements";
import Analytics from "./pages/analytics";
import NotFound from "@/pages/not-found";

function Header() {
  return (
    <header className="glass-nav fixed top-0 left-0 right-0 z-50 px-4 py-3 m-4 rounded-2xl" data-testid="header-main">
      <div className="flex items-center justify-between max-w-6xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
            <span className="text-primary-foreground text-lg">🕌</span>
          </div>
          <h1 className="text-xl font-bold text-foreground" data-testid="text-app-title">
            Namaz Tracker
          </h1>
        </div>
        <ThemeToggle />
      </div>
    </header>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/achievements" component={Achievements} />
      <Route path="/analytics" component={Analytics} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
        <PrayerProvider>
          <TooltipProvider>
            <div className="min-h-screen">
              <Header />
              <main className="pt-24 pb-24 px-4 max-w-6xl mx-auto">
                <Router />
              </main>
              <Navigation />
              <Toaster />
            </div>
          </TooltipProvider>
        </PrayerProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
