import { CheckCircle, ArrowLeft, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import SettlementCard from "@/components/SettlementCard";
import type { Bill, Settlement, Participant } from "@shared/schema";
import { useLocation } from "wouter";

// todo: remove mock functionality - replace with real data from context/state
const mockBill: Bill = {
  id: '1',
  name: 'Restaurante El Mar',
  date: new Date().toISOString(),
  payerId: '1',
  participants: [
    { id: '1', name: 'Ana García', color: '#3b82f6' },
    { id: '2', name: 'Carlos López', color: '#10b981' },
    { id: '3', name: 'María Sánchez', color: '#f59e0b' },
  ],
  items: [
    {
      id: '1',
      description: 'Paella Valenciana',
      quantity: 2,
      unitPrice: 15.50,
      totalPrice: 31.00,
      claims: [
        { participantId: '1', quantity: 1, isShared: false },
        { participantId: '2', quantity: 1, isShared: false },
      ],
    },
    {
      id: '2',
      description: 'Cerveza',
      quantity: 4,
      unitPrice: 2.50,
      totalPrice: 10.00,
      claims: [
        { participantId: '1', quantity: 2, isShared: false },
        { participantId: '2', quantity: 1, isShared: false },
        { participantId: '3', quantity: 1, isShared: false },
      ],
    },
    {
      id: '3',
      description: 'Patatas Bravas',
      quantity: 1,
      unitPrice: 6.00,
      totalPrice: 6.00,
      claims: [
        { participantId: '1', quantity: 1, isShared: true },
        { participantId: '2', quantity: 1, isShared: true },
        { participantId: '3', quantity: 1, isShared: true },
      ],
    },
  ],
  total: 47.00,
};

function calculateSettlements(bill: Bill): Settlement[] {
  const balances: Record<string, number> = {};

  bill.participants.forEach(p => {
    balances[p.id] = 0;
  });

  bill.items.forEach(item => {
    const sharedClaims = item.claims.filter(c => c.isShared);
    const individualClaims = item.claims.filter(c => !c.isShared);

    individualClaims.forEach(claim => {
      const cost = claim.quantity * item.unitPrice;
      balances[claim.participantId] += cost;
    });

    if (sharedClaims.length > 0) {
      const sharedTotal = sharedClaims.reduce((sum, claim) => sum + (claim.quantity * item.unitPrice), 0);
      const perPerson = sharedTotal / sharedClaims.length;
      sharedClaims.forEach(claim => {
        balances[claim.participantId] += perPerson;
      });
    }
  });

  balances[bill.payerId] -= bill.total;

  const settlements: Settlement[] = [];
  const debtors = Object.entries(balances).filter(([_, amount]) => amount > 0.01);
  const creditors = Object.entries(balances).filter(([_, amount]) => amount < -0.01);

  debtors.forEach(([debtorId, debtAmount]) => {
    creditors.forEach(([creditorId, creditAmount]) => {
      if (debtAmount > 0.01 && creditAmount < -0.01) {
        const amount = Math.min(debtAmount, Math.abs(creditAmount));
        settlements.push({
          from: debtorId,
          to: creditorId,
          amount: Math.round(amount * 100) / 100,
        });
        debtAmount -= amount;
        creditAmount += amount;
      }
    });
  });

  return settlements;
}

export default function SettlementPage() {
  const [, setLocation] = useLocation();
  const settlements = calculateSettlements(mockBill);
  const payer = mockBill.participants.find(p => p.id === mockBill.payerId);

  const handleShare = () => {
    const text = `División de ${mockBill.name}\n\n` +
      settlements.map(s => {
        const from = mockBill.participants.find(p => p.id === s.from);
        const to = mockBill.participants.find(p => p.id === s.to);
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
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation('/')}
            data-testid="button-back"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-semibold">Resumen</h1>
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
        <div className="text-center py-8">
          <CheckCircle className="h-16 w-16 mx-auto mb-4 text-primary" />
          <h2 className="text-3xl font-bold mb-2">¡División Completa!</h2>
          <p className="text-muted-foreground">
            {mockBill.name}
          </p>
        </div>

        <Card className="p-6">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Total de la cuenta</span>
              <span className="text-2xl font-bold tabular-nums" data-testid="text-bill-total">
                {mockBill.total.toFixed(2)}€
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Participantes</span>
              <span className="font-medium">{mockBill.participants.length}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Pagado por</span>
              <span className="font-medium">{payer?.name}</span>
            </div>
          </div>
        </Card>

        <div className="space-y-3">
          <h3 className="text-lg font-semibold">Transferencias Necesarias</h3>
          {settlements.length > 0 ? (
            settlements.map((settlement, idx) => (
              <SettlementCard
                key={idx}
                settlement={settlement}
                participants={mockBill.participants}
              />
            ))
          ) : (
            <Card className="p-6 text-center">
              <p className="text-muted-foreground">
                No se requieren transferencias
              </p>
            </Card>
          )}
        </div>

        <div className="pt-4">
          <Button
            variant="outline"
            className="w-full"
            onClick={() => setLocation('/')}
            data-testid="button-new-bill"
          >
            Nueva División
          </Button>
        </div>
      </main>
    </div>
  );
}
