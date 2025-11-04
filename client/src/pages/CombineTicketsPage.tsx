import { useState } from "react";
import { ArrowLeft, Combine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";

interface BillSummary {
  id: string;
  name: string;
  date: string;
  total: string;
}

export default function CombineTicketsPage() {
  const [, setLocation] = useLocation();
  const [selectedBillIds, setSelectedBillIds] = useState<string[]>([]);

  const { data: bills = [], isLoading } = useQuery<BillSummary[]>({
    queryKey: ['/api/my-bills'],
  });

  const toggleBillSelection = (billId: string) => {
    if (selectedBillIds.includes(billId)) {
      setSelectedBillIds(selectedBillIds.filter(id => id !== billId));
    } else {
      setSelectedBillIds([...selectedBillIds, billId]);
    }
  };

  const handleCombine = () => {
    if (selectedBillIds.length >= 2) {
      const billsParam = selectedBillIds.join(',');
      setLocation(`/combined-settlement?bills=${billsParam}`);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 bg-card border-b">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation('/')}
            data-testid="button-back"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-semibold">Combinar Tickets</h1>
            <p className="text-xs text-muted-foreground">
              Selecciona 2 o más tickets
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {bills.length === 0 ? (
          <Card className="p-6 text-center">
            <p className="text-muted-foreground">No tienes tickets todavía</p>
          </Card>
        ) : (
          <>
            {bills.map(bill => {
              const isSelected = selectedBillIds.includes(bill.id);
              const date = new Date(bill.date);
              const totalAmount = parseFloat(bill.total || '0');

              return (
                <Card
                  key={bill.id}
                  className={`p-4 ${isSelected ? 'border-primary' : ''}`}
                  data-testid={`bill-card-${bill.id}`}
                >
                  <div className="flex items-center gap-3">
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => toggleBillSelection(bill.id)}
                      data-testid={`checkbox-bill-${bill.id}`}
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold truncate">{bill.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {date.toLocaleDateString('es-ES', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold tabular-nums">
                        {totalAmount.toFixed(2)}€
                      </div>
                      <div className="text-xs text-muted-foreground">Total</div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </>
        )}

        {selectedBillIds.length >= 2 && (
          <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-20">
            <Button
              onClick={handleCombine}
              size="lg"
              className="shadow-lg"
              data-testid="button-combine"
            >
              <Combine className="h-5 w-5 mr-2" />
              Combinar {selectedBillIds.length} Tickets
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
