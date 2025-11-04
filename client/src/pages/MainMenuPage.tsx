import { Receipt, Users, History, LogOut } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";

export default function MainMenuPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  const menuItems = [
    {
      icon: Receipt,
      title: "Nuevo Ticket",
      description: "Crear un nuevo ticket para dividir",
      path: "/bill/new",
      testId: "button-new-bill",
      color: "bg-blue-500",
    },
    {
      icon: Users,
      title: "Amigos",
      description: "Gestionar tu lista de amigos",
      path: "/friends",
      testId: "button-friends",
      color: "bg-green-500",
    },
    {
      icon: History,
      title: "Mis Tickets",
      description: "Ver tus tickets anteriores",
      path: "/my-bills",
      testId: "button-my-bills",
      color: "bg-orange-500",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
              <Receipt className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Divvy</h1>
              {user && (
                <p className="text-sm text-muted-foreground">
                  Hola, {user.firstName || user.email}
                </p>
              )}
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => window.location.href = "/api/logout"}
            data-testid="button-logout"
          >
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-2">¿Qué deseas hacer?</h2>
          <p className="text-muted-foreground">Selecciona una opción para comenzar</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <Card
                key={item.path}
                className="p-6 cursor-pointer hover-elevate active-elevate-2 transition-all"
                onClick={() => setLocation(item.path)}
                data-testid={item.testId}
              >
                <div className={`w-14 h-14 ${item.color} rounded-full flex items-center justify-center mb-4`}>
                  <Icon className="h-7 w-7 text-white" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </Card>
            );
          })}
        </div>
      </main>
    </div>
  );
}
