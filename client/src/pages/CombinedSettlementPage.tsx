import { ArrowLeft, Share2, PartyPopper } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import SettlementCard from "@/components/SettlementCard";
import type { BillWithDetails, Settlement } from "@shared/schema";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";

interface CombinedBalance {
  participantKey: string;
  name: string;
  color: string;
  balance: number;
}

export default function CombinedSettlementPage() {
  const [, setLocation] = useLocation();
  const urlParams = new URLSearchParams(window.location.search);
  const billIdsParam = urlParams.get('bills');
  const billIds = billIdsParam?.split(',') || [];

  const billQueries = billIds.map(billId =>
    useQuery<BillWithDetails>({
      queryKey: ['/api/bills', billId],
      enabled: !!billId,
    })
  );

  const isLoading = billQueries.some(q => q.isLoading);
  const bills = billQueries.map(q => q.data).filter((b): b is BillWithDetails => !!b);

  if (isLoading || bills.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Cargando...</div>
      </div>
    );
  }

  const combinedBalances: Record<string, CombinedBalance> = {};

  bills.forEach(bill => {
    bill.participants.forEach(p => {
      const key = `${p.name.toLowerCase()}-${p.color}`;
      if (!combinedBalances[key]) {
        combinedBalances[key] = {
          participantKey: key,
          name: p.name,
          color: p.color,
          balance: 0,
        };
      }
    });

    bill.items.forEach(item => {
      if (item.isShared) {
        const participantsInItem = item.claims.filter(c => c.isShared);
        if (participantsInItem.length > 0) {
          const perPerson = item.totalPrice / participantsInItem.length;
          participantsInItem.forEach(claim => {
            const participant = bill.participants.find(p => p.id === claim.participantId);
            if (participant) {
              const key = `${participant.name.toLowerCase()}-${participant.color}`;
              combinedBalances[key].balance += perPerson;
            }
          });
        }
      } else {
        item.claims.forEach(claim => {
          const participant = bill.participants.find(p => p.id === claim.participantId);
          if (participant) {
            const key = `${participant.name.toLowerCase()}-${participant.color}`;
            const cost = claim.quantity * item.unitPrice;
            combinedBalances[key].balance += cost;
          }
        });
      }
    });

    if (bill.payerId) {
      const payer = bill.participants.find(p => p.id === bill.payerId);
      if (payer) {
        const key = `${payer.name.toLowerCase()}-${payer.color}`;
        const total = parseFloat(bill.total);
        combinedBalances[key].balance -= total;
      }
    }
  });

  const settlements: Settlement[] = [];
  const balanceArray = Object.values(combinedBalances);
  const debtors = balanceArray.filter(p => p.balance > 0.01);
  const creditors = balanceArray
    .filter(p => p.balance < -0.01)
    .map(p => ({ ...p, remainingCredit: Math.abs(p.balance) }));

  debtors.forEach(debtor => {
    let remainingDebt = debtor.balance;
    
    for (const creditor of creditors) {
      if (remainingDebt > 0.01 && creditor.remainingCredit > 0.01) {
        const amount = Math.min(remainingDebt, creditor.remainingCredit);
        settlements.push({
          from: debtor.participantKey,
          to: creditor.participantKey,
          amount: Math.round(amount * 100) / 100,
        });
        remainingDebt -= amount;
        creditor.remainingCredit -= amount;
      }
      
      if (remainingDebt <= 0.01) break;
    }
  });

  const participantData = Object.values(combinedBalances).map(p => ({
    id: p.participantKey,
    name: p.name,
    color: p.color,
  }));

  const allBalanced = settlements.length === 0;

  const handleShare = () => {
    const ticketNames = bills.map(b => b.name).join(', ');
    const text = `División Combinada: ${ticketNames}\n\n` +
      settlements.map(s => {
        const from = participantData.find(p => p.id === s.from);
        const to = participantData.find(p => p.id === s.to);
        return `${from?.name} debe ${s.amount.toFixed(2)}€ a ${to?.name}`;
      }).join('\n');

    if (navigator.share) {
      navigator.share({ text });
    } else {
      navigator.clipboard.writeText(text);
      alert('Resumen copiado al portapapeles');
    }
  };

  const totalAmount = bills.reduce((sum, bill) => sum + parseFloat(bill.total), 0);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 bg-card border-b">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation('/combine-tickets')}
            data-testid="button-back"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-semibold">División Combinada</h1>
            <p className="text-xs text-muted-foreground">
              {bills.length} tickets
            </p>
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={handleShare}
            data-testid="button-share"
          >
            <Share2 className="h-4 w-4" />
          </Button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {allBalanced && (
          <Card className="p-6 bg-primary/10 border-primary" data-testid="banner-all-balanced">
            <div className="flex items-start gap-3">
              <div className="mt-0.5">
                <PartyPopper className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1 space-y-1">
                <h2 className="font-semibold text-lg text-primary">¡Perfecto!</h2>
                <p className="text-sm text-muted-foreground">
                  Todos están equilibrados en estos tickets
                </p>
              </div>
            </div>
          </Card>
        )}

        <Card className="p-6 bg-primary/5 border-primary/20">
          <div className="space-y-3">
            <h2 className="font-semibold text-lg">Tickets Incluidos</h2>
            {bills.map(bill => (
              <div key={bill.id} className="flex items-center justify-between py-2">
                <span className="text-sm text-muted-foreground">{bill.name}</span>
                <span className="text-sm font-medium tabular-nums">
                  {parseFloat(bill.total).toFixed(2)}€
                </span>
              </div>
            ))}
            <div className="pt-2 border-t flex items-center justify-between">
              <span className="font-semibold">Total Combinado</span>
              <span className="font-bold text-lg tabular-nums text-primary">
                {totalAmount.toFixed(2)}€
              </span>
            </div>
          </div>
        </Card>

        <div className="space-y-3">
          <h3 className="font-semibold">Transferencias Optimizadas</h3>
          
          {settlements.length > 0 ? (
            settlements.map((settlement, index) => (
              <SettlementCard
                key={`${settlement.from}-${settlement.to}-${index}`}
                settlement={settlement}
                participants={participantData}
              />
            ))
          ) : (
            <Card className="p-6 text-center">
              <p className="text-muted-foreground">
                Todos están equilibrados, no se requieren transferencias
              </p>
            </Card>
          )}
        </div>

        <div className="space-y-3">
          <h3 className="font-semibold">Balance por Persona</h3>
          {Object.values(combinedBalances)
            .sort((a, b) => a.name.localeCompare(b.name))
            .map(participant => (
              <Card key={participant.participantKey} className="p-4" data-testid={`balance-${participant.participantKey}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold"
                      style={{ backgroundColor: participant.color, color: '#fff' }}
                    >
                      {participant.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                    </div>
                    <div className="font-medium">{participant.name}</div>
                  </div>
                  <div className="text-right">
                    <div className={`font-semibold tabular-nums ${
                      participant.balance > 0.01 ? 'text-destructive' : 
                      participant.balance < -0.01 ? 'text-green-600 dark:text-green-400' :
                      'text-muted-foreground'
                    }`}>
                      {participant.balance > 0.01 ? '+' : ''}
                      {participant.balance.toFixed(2)}€
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {participant.balance > 0.01 ? 'Debe' : 
                       participant.balance < -0.01 ? 'Le deben' : 'Equilibrado'}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
        </div>
      </main>
    </div>
  );
}
