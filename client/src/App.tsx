import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import LandingPage from "@/pages/LandingPage";
import MainMenuPage from "@/pages/MainMenuPage";
import HomePage from "@/pages/HomePage";
import FriendsPage from "@/pages/FriendsPage";
import MyTicketsPage from "@/pages/MyTicketsPage";
import SettlementPage from "@/pages/SettlementPage";
import CombineTicketsPage from "@/pages/CombineTicketsPage";
import CombinedSettlementPage from "@/pages/CombinedSettlementPage";
import NotFound from "@/pages/not-found";

function Router() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Cargando...</div>
      </div>
    );
  }

  if (!user) {
    return <LandingPage />;
  }

  return (
    <Switch>
      <Route path="/" component={MainMenuPage} />
      <Route path="/bill/:billId" component={HomePage} />
      <Route path="/friends" component={FriendsPage} />
      <Route path="/my-bills" component={MyTicketsPage} />
      <Route path="/settlement/:id" component={SettlementPage} />
      <Route path="/combine-tickets" component={CombineTicketsPage} />
      <Route path="/combined-settlement" component={CombinedSettlementPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
