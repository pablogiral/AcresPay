import { CheckCircle, ArrowLeft, Share2, PartyPopper } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import SettlementCard from "@/components/SettlementCard";
import type { BillWithDetails, Settlement, ParticipantData, Payment } from "@shared/schema";
import { useLocation, useRoute } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";

function calculateSettlements(bill: BillWithDetails): Settlement[] {
  const balances: Record<string, number> = {};

  bill.participants.forEach(p => {
    balances[p.id] = 0;
  });

  bill.items.forEach(item => {
    if (item.isShared) {
      // For shared items, split total among participants
      const participantsInItem = item.claims.filter(c => c.isShared);
      if (participantsInItem.length > 0) {
        const perPerson = item.totalPrice / participantsInItem.length;
        participantsInItem.forEach(claim => {
          balances[claim.participantId] += perPerson;
        });
      }
    } else {
      // For individual items, charge based on quantity
      item.claims.forEach(claim => {
        const cost = claim.quantity * item.unitPrice;
        balances[claim.participantId] += cost;
      });
    }
  });

  const total = parseFloat(bill.total);
  if (bill.payerId) {
    balances[bill.payerId] -= total;
  }

  const settlements: Settlement[] = [];
  const debtors = Object.entries(balances).filter(([_, amount]) => amount > 0.01);
  const creditors = Object.entries(balances)
    .filter(([_, amount]) => amount < -0.01)
    .map(([id, amount]) => ({ id, remainingCredit: Math.abs(amount) }));

  debtors.forEach(([debtorId, debtAmount]) => {
    let remainingDebt = debtAmount;
    
    for (const creditor of creditors) {
      if (remainingDebt > 0.01 && creditor.remainingCredit > 0.01) {
        const amount = Math.min(remainingDebt, creditor.remainingCredit);
        settlements.push({
          from: debtorId,
          to: creditor.id,
          amount: Math.round(amount * 100) / 100,
        });
        remainingDebt -= amount;
        creditor.remainingCredit -= amount;
      }
      
      if (remainingDebt <= 0.01) break;
    }
  });

  return settlements;
}

export default function SettlementPage() {
  const [, setLocation] = useLocation();
  const [, params] = useRoute('/settlement/:id');
  const billId = params?.id;

  const { data: bill, isLoading } = useQuery<BillWithDetails>({
    queryKey: ['/api/bills', billId],
    enabled: !!billId,
  });

  const { data: payments = [] } = useQuery<Payment[]>({
    queryKey: ['/api/bills', billId, 'payments'],
    enabled: !!billId,
  });

  const togglePaymentMutation = useMutation({
    mutationFn: async ({ fromParticipantId, toParticipantId, amount, isPaid }: {
      fromParticipantId: string;
      toParticipantId: string;
      amount: number;
      isPaid: boolean;
    }) => {
      return apiRequest('PUT', `/api/bills/${billId}/payments`, {
        fromParticipantId,
        toParticipantId,
        amount,
        isPaid,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/bills', billId, 'payments'] });
    },
  });

  if (isLoading || !bill) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Cargando...</div>
      </div>
    );
  }

  const settlements = calculateSettlements(bill);
  const payer = bill.participants.find(p => p.id === bill.payerId);
  
  const getPaymentStatus = (settlement: Settlement) => {
    const payment = payments.find(p => 
      p.fromParticipantId === settlement.from && 
      p.toParticipantId === settlement.to
    );
    return payment?.isPaid || false;
  };

  const handleTogglePayment = (settlement: Settlement, isPaid: boolean) => {
    togglePaymentMutation.mutate({
      fromParticipantId: settlement.from,
      toParticipantId: settlement.to,
      amount: settlement.amount,
      isPaid,
    });
  };

  const allPaid = settlements.length > 0 && settlements.every(s => getPaymentStatus(s));

  const handleShare = () => {
    const text = `División de ${bill.name}\n\n` +
      settlements.map(s => {
        const from = bill.participants.find(p => p.id === s.from);
        const to = bill.participants.find(p => p.id === s.to);
        return `${from?.name} debe ${s.amount.toFixed(2)}€ a ${to?.name}`;
      }).join('\n');

    if (navigator.share) {
      navigator.share({ text });
    } else {
      navigator.clipboard.writeText(text);
      alert('Resumen copiado al portapapeles');
    }
  };

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
            <h1 className="text-xl font-semibold">División Calculada</h1>
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
        {allPaid && (
          <Card className="p-6 bg-primary/10 border-primary" data-testid="banner-all-paid">
            <div className="flex items-start gap-3">
              <div className="mt-0.5">
                <PartyPopper className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1 space-y-1">
                <h2 className="font-semibold text-lg text-primary">¡Todo Pagado!</h2>
                <p className="text-sm text-muted-foreground">
                  Todas las transferencias han sido marcadas como completadas
                </p>
              </div>
            </div>
          </Card>
        )}

        <Card className="p-6 bg-primary/5 border-primary/20">
          <div className="flex items-start gap-3">
            <div className="mt-0.5">
              <CheckCircle className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1 space-y-1">
              <h2 className="font-semibold text-lg">¡Listo!</h2>
              <p className="text-sm text-muted-foreground">
                {payer?.name} pagó {parseFloat(bill.total).toFixed(2)}€
              </p>
              {settlements.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No se requieren transferencias
                </p>
              )}
            </div>
          </div>
        </Card>

        <div className="space-y-3">
          <h3 className="font-semibold">Transferencias a Realizar</h3>
          
          {settlements.length > 0 ? (
            settlements.map((settlement, index) => (
              <SettlementCard
                key={`${settlement.from}-${settlement.to}-${index}`}
                settlement={settlement}
                participants={bill.participants}
                isPaid={getPaymentStatus(settlement)}
                onTogglePaid={(isPaid) => handleTogglePayment(settlement, isPaid)}
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
          <h3 className="font-semibold">Desglose por Persona</h3>
          {bill.participants.map(participant => {
            let total = 0;
            
            bill.items.forEach(item => {
              if (item.isShared) {
                const participantsInItem = item.claims.filter(c => c.isShared);
                const isInShared = participantsInItem.some(c => c.participantId === participant.id);
                if (isInShared && participantsInItem.length > 0) {
                  total += item.totalPrice / participantsInItem.length;
                }
              } else {
                const claim = item.claims.find(c => c.participantId === participant.id);
                if (claim) {
                  total += claim.quantity * item.unitPrice;
                }
              }
            });

            return (
              <Card key={participant.id} className="p-4" data-testid={`breakdown-${participant.id}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold"
                      style={{ backgroundColor: participant.color, color: '#fff' }}
                    >
                      {participant.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                    </div>
                    <div>
                      <div className="font-medium">{participant.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {participant.id === bill.payerId ? 'Pagador' : 'Participante'}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold tabular-nums">{total.toFixed(2)}€</div>
                    <div className="text-xs text-muted-foreground">Total consumido</div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </main>
    </div>
  );
}
