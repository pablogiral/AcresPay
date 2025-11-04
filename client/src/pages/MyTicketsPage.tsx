import { ArrowLeft, Receipt, Calendar, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import type { Bill } from "@shared/schema";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default function MyTicketsPage() {
  const [, setLocation] = useLocation();

  const { data: bills, isLoading } = useQuery<Bill[]>({
    queryKey: ["/api/my-bills"],
  });

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 bg-card border-b">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation("/")}
            data-testid="button-back"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-semibold flex-1">Mis Tickets</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {isLoading ? (
          <Card className="p-6 text-center text-muted-foreground">
            Cargando tickets...
          </Card>
        ) : bills && bills.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {bills.map((bill) => (
              <Card
                key={bill.id}
                className="p-4 cursor-pointer hover-elevate active-elevate-2 transition-all"
                onClick={() => setLocation(`/bill/${bill.id}`)}
                data-testid={`bill-${bill.id}`}
              >
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Receipt className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate">{bill.name}</h3>
                    {bill.date && (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                        <Calendar className="h-3 w-3" />
                        <span>
                          {format(new Date(bill.date), "d 'de' MMMM, yyyy", { locale: es })}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 text-lg font-bold text-primary">
                  <DollarSign className="h-4 w-4" />
                  <span>{(parseFloat(bill.total) || 0).toFixed(2)}€</span>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-8 text-center">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Receipt className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-semibold mb-2">No tienes tickets todavía</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Crea tu primer ticket para comenzar a dividir cuentas
            </p>
            <Button onClick={() => setLocation("/bill/new")} data-testid="button-create-first-bill">
              <Receipt className="h-4 w-4 mr-2" />
              Crear Ticket
            </Button>
          </Card>
        )}
      </main>
    </div>
  );
}
