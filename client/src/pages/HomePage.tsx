import { useState, useEffect } from "react";
import { Receipt, Users, Calculator, ArrowLeft } from "lucide-react";
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
import type { BillWithDetails, ParticipantData, LineItemWithClaims } from "@shared/schema";
import { useLocation, useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function HomePage() {
  const [, setLocation] = useLocation();
  const params = useParams<{ billId: string }>();
  const billId = params.billId === 'new' ? null : params.billId;
  const [createdBillId, setCreatedBillId] = useState<string | null>(null);
  const actualBillId = billId || createdBillId;
  const [localBillName, setLocalBillName] = useState<string>("");
  
  // Create initial bill only if we're at /bill/new and haven't created one yet
  useEffect(() => {
    const createInitialBill = async () => {
      const res = await apiRequest('POST', '/api/bills', { name: 'Nuevo Ticket', total: 0 });
      const result = await res.json();
      setCreatedBillId(result.id);
      setLocation(`/bill/${result.id}`);
    };
    
    if (!billId && !createdBillId) {
      createInitialBill();
    }
  }, [billId, createdBillId, setLocation]);

  const { data: bill, isLoading } = useQuery<BillWithDetails>({
    queryKey: ['/api/bills', actualBillId],
    enabled: !!actualBillId,
  });

  // Sync local bill name with fetched bill
  useEffect(() => {
    if (bill && bill.name !== localBillName) {
      setLocalBillName(bill.name);
    }
  }, [bill?.name]);

  const updateBillMutation = useMutation({
    mutationFn: async (data: { name?: string; payerId?: string; total?: number }) => {
      await apiRequest('PATCH', `/api/bills/${actualBillId}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/bills', actualBillId] });
    },
  });

  const addParticipantMutation = useMutation({
    mutationFn: async (data: { name: string; color: string }) => {
      await apiRequest('POST', `/api/bills/${actualBillId}/participants`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/bills', actualBillId] });
    },
  });

  const removeParticipantMutation = useMutation({
    mutationFn: async (participantId: string) => {
      await apiRequest('DELETE', `/api/participants/${participantId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/bills', actualBillId] });
    },
  });

  const addItemMutation = useMutation({
    mutationFn: async (data: { description: string; quantity: number; unitPrice: number }) => {
      await apiRequest('POST', `/api/bills/${actualBillId}/items`, { ...data, isShared: false });
    },
    onSuccess: async () => {
      if (bill) {
        const newTotal = bill.items.reduce((sum, item) => sum + item.totalPrice, 0) + 
                        (addItemMutation.variables ? addItemMutation.variables.quantity * addItemMutation.variables.unitPrice : 0);
        await updateBillMutation.mutateAsync({ total: newTotal });
      }
      queryClient.invalidateQueries({ queryKey: ['/api/bills', actualBillId] });
    },
  });

  const updateClaimMutation = useMutation({
    mutationFn: async (data: { itemId: string; participantId: string; quantity: number; isShared: boolean }) => {
      if (data.quantity === 0) {
        await apiRequest('DELETE', `/api/items/${data.itemId}/claims/${data.participantId}`);
      } else {
        await apiRequest('PUT', `/api/items/${data.itemId}/claims/${data.participantId}`, 
          { quantity: data.quantity, isShared: data.isShared });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/bills', actualBillId] });
    },
  });

  const toggleSharedMutation = useMutation({
    mutationFn: async (data: { itemId: string; isShared: boolean }) => {
      await apiRequest('PATCH', `/api/items/${data.itemId}/shared`, { isShared: data.isShared });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/bills', actualBillId] });
    },
  });

  const handleAddParticipant = (name: string, color: string) => {
    addParticipantMutation.mutate({ name, color });
  };

  const handleRemoveParticipant = (id: string) => {
    removeParticipantMutation.mutate(id);
  };

  const handleAddItem = (description: string, quantity: number, unitPrice: number) => {
    addItemMutation.mutate({ description, quantity, unitPrice });
  };

  const handleUpdateClaim = (itemId: string, participantId: string, quantity: number) => {
    const item = bill?.items.find(i => i.id === itemId);
    if (!item) return;
    
    updateClaimMutation.mutate({
      itemId,
      participantId,
      quantity,
      isShared: item.isShared,
    });
  };

  const handleToggleShared = (itemId: string, isShared: boolean) => {
    const item = bill?.items.find(i => i.id === itemId);
    if (!item) return;
    
    // Remove all claims when toggling
    const removePromises = item.claims.map(claim =>
      apiRequest('DELETE', `/api/items/${itemId}/claims/${claim.participantId}`)
    );
    
    Promise.all(removePromises).then(() => {
      toggleSharedMutation.mutate({ itemId, isShared });
    });
  };

  const handleToggleSharedParticipant = (itemId: string, participantId: string, participating: boolean) => {
    updateClaimMutation.mutate({
      itemId,
      participantId,
      quantity: participating ? 1 : 0,
      isShared: true,
    });
  };

  const handleUpdateBillName = (name: string) => {
    updateBillMutation.mutate({ name });
  };

  const handleUpdatePayer = (payerId: string) => {
    updateBillMutation.mutate({ payerId });
  };

  if (isLoading || !bill) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Cargando...</div>
      </div>
    );
  }

  const allItemsClaimed = bill.items.every(item => {
    if (item.isShared) {
      return item.claims.length > 0;
    } else {
      const totalClaimed = item.claims.reduce((sum, claim) => sum + claim.quantity, 0);
      return totalClaimed >= item.quantity;
    }
  });

  const canCalculate = bill.payerId && allItemsClaimed && bill.items.length > 0;
  const total = parseFloat(bill.total);

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-10 bg-card border-b">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation("/")}
            data-testid="button-back"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2 flex-1">
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
              value={localBillName}
              onChange={(e) => setLocalBillName(e.target.value)}
              onBlur={(e) => {
                if (e.target.value !== bill.name) {
                  handleUpdateBillName(e.target.value);
                }
              }}
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
            <Select value={bill.payerId || ''} onValueChange={handleUpdatePayer}>
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
              Total: {total.toFixed(2)}€
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
                onClick={() => setLocation(`/settlement/${actualBillId}`)}
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
