import { useState } from "react";
import { ArrowLeft, Plus, Receipt, Users2, Share2, PartyPopper, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import SettlementCard from "@/components/SettlementCard";
import type { EventWithDetails, BillWithDetails, Settlement, Payment } from "@shared/schema";
import { useLocation, useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";

interface CombinedBalance {
  participantKey: string;
  name: string;
  color: string;
  balance: number;
}

export default function EventDetailPage() {
  const [, setLocation] = useLocation();
  const [, params] = useRoute('/events/:id');
  const eventId = params?.id;

  const { data: event, isLoading: eventLoading } = useQuery<EventWithDetails>({
    queryKey: ['/api/events', eventId],
    enabled: !!eventId,
  });

  const { data: billsWithPayments = [], isLoading: billsLoading } = useQuery<Array<BillWithDetails & { payments: Payment[] }>>({
    queryKey: ['/api/events', eventId, 'bills'],
    enabled: !!eventId,
  });

  const bills = billsWithPayments;
  const allPayments = billsWithPayments.flatMap(b => b.payments || []);
  const isLoading = eventLoading || billsLoading;

  if (isLoading || !event) {
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
          const perPerson = parseFloat(item.totalPrice.toString()) / participantsInItem.length;
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
            const cost = claim.quantity * parseFloat(item.unitPrice.toString());
            combinedBalances[key].balance += cost;
          }
        });
      }
    });

    const total = parseFloat(bill.total);
    if (bill.payerId) {
      const payer = bill.participants.find(p => p.id === bill.payerId);
      if (payer) {
        const key = `${payer.name.toLowerCase()}-${payer.color}`;
        combinedBalances[key].balance -= total;
      }
    }
  });

  const settlements: Settlement[] = [];
  const debtors = Object.values(combinedBalances).filter(p => p.balance > 0.01);
  const creditors = Object.values(combinedBalances)
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
    billId: '',
  }));

  const paymentsWithKeys = allPayments.map(payment => {
    const bill = bills.find(b => b.id === payment.billId);
    if (!bill) return null;

    const fromParticipant = bill.participants.find(p => p.id === payment.fromParticipantId);
    const toParticipant = bill.participants.find(p => p.id === payment.toParticipantId);

    if (!fromParticipant || !toParticipant) return null;

    return {
      payment,
      fromKey: `${fromParticipant.name.toLowerCase()}-${fromParticipant.color}`,
      toKey: `${toParticipant.name.toLowerCase()}-${toParticipant.color}`,
    };
  }).filter(p => p !== null);

  const getPaymentStatus = (settlement: Settlement) => {
    const relevantPayments = paymentsWithKeys.filter(
      p => p && ((p.fromKey === settlement.from && p.toKey === settlement.to) || 
           (p.fromKey === settlement.to && p.toKey === settlement.from))
    );

    if (relevantPayments.length === 0) return false;

    return relevantPayments.every(p => p!.payment.isPaid);
  };

  const allPaid = settlements.length > 0 && settlements.every(s => getPaymentStatus(s));
  const allBalanced = settlements.length === 0;
  const totalAmount = bills.reduce((sum, bill) => sum + parseFloat(bill.total), 0);

  const handleShare = () => {
    const text = `${event.name}\n\n` +
      `Tickets (${bills.length}):\n` +
      bills.map(b => `- ${b.name}: ${parseFloat(b.total).toFixed(2)}€`).join('\n') +
      `\n\nTotal: ${totalAmount.toFixed(2)}€\n\n` +
      `Transferencias:\n` +
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

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 bg-card border-b">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation('/my-events')}
            data-testid="button-back"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-semibold">{event.name}</h1>
            <p className="text-xs text-muted-foreground">
              {event.participants.length} participantes • {bills.length} tickets
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleShare}
            data-testid="button-share"
          >
            <Share2 className="h-5 w-5" />
          </Button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {(allPaid || allBalanced) && (
          <Card className="p-6 bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
            <div className="flex items-center gap-3">
              <PartyPopper className="h-6 w-6 text-green-600 dark:text-green-400" />
              <div>
                <h3 className="font-semibold text-green-900 dark:text-green-100">¡Todo Pagado!</h3>
                <p className="text-sm text-green-700 dark:text-green-300">
                  {allBalanced ? 'Todos están equilibrados' : 'Todas las transferencias están completadas'}
                </p>
              </div>
            </div>
          </Card>
        )}

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Participantes</h2>
            <Badge variant="secondary">{event.participants.length}</Badge>
          </div>
          <div className="flex flex-wrap gap-2">
            {event.participants.map(friend => (
              <div
                key={friend.id}
                className="flex items-center gap-2 px-3 py-2 rounded-full border"
                data-testid={`participant-${friend.id}`}
              >
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold"
                  style={{ backgroundColor: friend.color, color: '#fff' }}
                >
                  {friend.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                </div>
                <span className="text-sm">{friend.name}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Tickets</h2>
            <Badge variant="secondary">{bills.length}</Badge>
          </div>
          {bills.length === 0 ? (
            <p className="text-sm text-muted-foreground mb-4">
              Aún no hay tickets en este evento
            </p>
          ) : (
            <div className="space-y-3 mb-4">
              {bills.map(bill => (
                <div
                  key={bill.id}
                  className="flex items-center justify-between p-3 rounded-md border hover-elevate active-elevate-2 cursor-pointer"
                  onClick={() => setLocation(`/bill/${bill.id}`)}
                  data-testid={`bill-${bill.id}`}
                >
                  <div className="flex items-center gap-3">
                    <Receipt className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="font-medium">{bill.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(bill.date).toLocaleDateString('es-ES')}
                      </div>
                    </div>
                  </div>
                  <div className="font-semibold tabular-nums">
                    {parseFloat(bill.total).toFixed(2)}€
                  </div>
                </div>
              ))}
            </div>
          )}
          <Button
            className="w-full"
            onClick={() => setLocation(`/bill/new?eventId=${eventId}`)}
            data-testid="button-add-ticket"
          >
            <Plus className="h-4 w-4 mr-2" />
            Agregar Ticket
          </Button>
        </Card>

        {bills.length > 0 && (
          <>
            <div className="space-y-3">
              <h3 className="font-semibold">División del Evento</h3>
              
              {settlements.length > 0 ? (
                settlements.map((settlement, index) => (
                  <SettlementCard
                    key={`${settlement.from}-${settlement.to}-${index}`}
                    settlement={settlement}
                    participants={participantData}
                    isPaid={getPaymentStatus(settlement)}
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

            <Card className="p-6 bg-primary/5 border-primary/20">
              <div className="flex items-center justify-between">
                <span className="font-semibold">Total del Evento</span>
                <span className="font-bold text-lg tabular-nums text-primary">
                  {totalAmount.toFixed(2)}€
                </span>
              </div>
            </Card>
          </>
        )}
      </main>
    </div>
  );
}
