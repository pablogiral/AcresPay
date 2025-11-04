import { useState } from "react";
import { Receipt, Users, Calculator } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import AddParticipantDialog from "@/components/AddParticipantDialog";
import AddItemDialog from "@/components/AddItemDialog";
import ReceiptLineItem from "@/components/ReceiptLineItem";
import ParticipantChip from "@/components/ParticipantChip";
import type { Bill, Participant, LineItem, ItemClaim } from "@shared/schema";
import { useLocation } from "wouter";

const COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
  '#ec4899', '#14b8a6', '#f97316', '#06b6d4', '#84cc16'
];

export default function HomePage() {
  const [, setLocation] = useLocation();
  
  // todo: remove mock functionality - replace with real data
  const [bill, setBill] = useState<Bill>({
    id: '1',
    name: 'Restaurante El Mar',
    date: new Date().toISOString(),
    payerId: '',
    participants: [
      { id: '1', name: 'Ana García', color: COLORS[0] },
      { id: '2', name: 'Carlos López', color: COLORS[1] },
    ],
    items: [
      {
        id: '1',
        description: 'Paella Valenciana',
        quantity: 2,
        unitPrice: 15.50,
        totalPrice: 31.00,
        claims: [],
      },
      {
        id: '2',
        description: 'Cerveza',
        quantity: 4,
        unitPrice: 2.50,
        totalPrice: 10.00,
        claims: [],
      },
      {
        id: '3',
        description: 'Ensalada Mixta',
        quantity: 1,
        unitPrice: 8.00,
        totalPrice: 8.00,
        claims: [],
      },
    ],
    total: 49.00,
  });

  const handleAddParticipant = (name: string) => {
    const newParticipant: Participant = {
      id: Date.now().toString(),
      name,
      color: COLORS[bill.participants.length % COLORS.length],
    };
    setBill(prev => ({
      ...prev,
      participants: [...prev.participants, newParticipant],
    }));
  };

  const handleRemoveParticipant = (id: string) => {
    setBill(prev => ({
      ...prev,
      participants: prev.participants.filter(p => p.id !== id),
      payerId: prev.payerId === id ? '' : prev.payerId,
      items: prev.items.map(item => ({
        ...item,
        claims: item.claims.filter(c => c.participantId !== id),
      })),
    }));
  };

  const handleAddItem = (description: string, quantity: number, unitPrice: number) => {
    const newItem: LineItem = {
      id: Date.now().toString(),
      description,
      quantity,
      unitPrice,
      totalPrice: quantity * unitPrice,
      claims: [],
    };
    setBill(prev => ({
      ...prev,
      items: [...prev.items, newItem],
      total: prev.total + newItem.totalPrice,
    }));
  };

  const handleUpdateClaim = (itemId: string, participantId: string, quantity: number) => {
    setBill(prev => ({
      ...prev,
      items: prev.items.map(item => {
        if (item.id !== itemId) return item;
        
        const isShared = item.claims.length > 0 && item.claims[0]?.isShared;
        const newClaims = item.claims.filter(c => c.participantId !== participantId);
        
        if (quantity > 0) {
          newClaims.push({
            participantId,
            quantity,
            isShared,
          });
        }
        
        return { ...item, claims: newClaims };
      }),
    }));
  };

  const handleToggleShared = (itemId: string, isShared: boolean) => {
    setBill(prev => ({
      ...prev,
      items: prev.items.map(item => {
        if (item.id !== itemId) return item;
        
        return {
          ...item,
          claims: isShared ? [] : item.claims.map(c => ({ ...c, isShared: false })),
        };
      }),
    }));
  };

  const handleToggleSharedParticipant = (itemId: string, participantId: string, participating: boolean) => {
    setBill(prev => ({
      ...prev,
      items: prev.items.map(item => {
        if (item.id !== itemId) return item;
        
        const newClaims = item.claims.filter(c => c.participantId !== participantId);
        
        if (participating) {
          newClaims.push({
            participantId,
            quantity: 1,
            isShared: true,
          });
        }
        
        return { ...item, claims: newClaims };
      }),
    }));
  };

  const allItemsClaimed = bill.items.every(item => {
    const isShared = item.claims.length > 0 && item.claims[0]?.isShared;
    
    if (isShared) {
      return item.claims.length > 0;
    } else {
      const totalClaimed = item.claims.reduce((sum, claim) => sum + claim.quantity, 0);
      return totalClaimed >= item.quantity;
    }
  });

  const canCalculate = bill.payerId && allItemsClaimed && bill.items.length > 0;

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-10 bg-card border-b">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Receipt className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-semibold">Divvy</h1>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        <Card className="p-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="bill-name">Nombre del Ticket</Label>
            <Input
              id="bill-name"
              value={bill.name}
              onChange={(e) => setBill(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Ej: Restaurante El Mar"
              data-testid="input-bill-name"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>
                <Users className="h-4 w-4 inline mr-1.5" />
                Participantes ({bill.participants.length})
              </Label>
              <AddParticipantDialog onAdd={handleAddParticipant} />
            </div>
            <div className="flex flex-wrap gap-2">
              {bill.participants.map(participant => (
                <ParticipantChip
                  key={participant.id}
                  name={participant.name}
                  color={participant.color}
                  showRemove
                  onRemove={() => handleRemoveParticipant(participant.id)}
                />
              ))}
              {bill.participants.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Añade personas que participan en la cuenta
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="payer">¿Quién ha pagado el ticket?</Label>
            <Select value={bill.payerId} onValueChange={(value) => setBill(prev => ({ ...prev, payerId: value }))}>
              <SelectTrigger id="payer" data-testid="select-payer">
                <SelectValue placeholder="Selecciona quién pagó" />
              </SelectTrigger>
              <SelectContent>
                {bill.participants.map(participant => (
                  <SelectItem key={participant.id} value={participant.id}>
                    {participant.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </Card>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Líneas del Ticket</h2>
            <div className="text-lg font-bold tabular-nums" data-testid="text-total">
              Total: {bill.total.toFixed(2)}€
            </div>
          </div>

          {bill.items.map(item => (
            <ReceiptLineItem
              key={item.id}
              item={item}
              participants={bill.participants}
              onUpdateClaim={(participantId, quantity) => 
                handleUpdateClaim(item.id, participantId, quantity)
              }
              onToggleShared={(isShared) => handleToggleShared(item.id, isShared)}
              onToggleSharedParticipant={(participantId, participating) =>
                handleToggleSharedParticipant(item.id, participantId, participating)
              }
            />
          ))}

          {bill.items.length === 0 && (
            <Card className="p-8 text-center">
              <Receipt className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
              <p className="text-muted-foreground mb-4">
                No hay líneas en el ticket
              </p>
            </Card>
          )}

          <AddItemDialog onAdd={handleAddItem} />
        </div>

        {bill.items.length > 0 && (
          <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur border-t">
            <div className="max-w-2xl mx-auto">
              <Button
                className="w-full h-12 shadow-lg"
                size="lg"
                disabled={!canCalculate}
                onClick={() => setLocation('/settlement')}
                data-testid="button-calculate"
              >
                <Calculator className="h-5 w-5 mr-2" />
                Calcular División
              </Button>
              {!allItemsClaimed && bill.payerId && (
                <p className="text-xs text-center text-muted-foreground mt-2">
                  Asigna todas las consumiciones para calcular
                </p>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
