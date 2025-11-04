import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Minus, Plus, Users } from "lucide-react";
import type { LineItem, Participant } from "@shared/schema";

interface ReceiptLineItemProps {
  item: LineItem;
  participants: Participant[];
  onUpdateClaim: (participantId: string, quantity: number) => void;
  onToggleShared: (isShared: boolean) => void;
  onToggleSharedParticipant: (participantId: string, participating: boolean) => void;
}

export default function ReceiptLineItem({ 
  item, 
  participants,
  onUpdateClaim,
  onToggleShared,
  onToggleSharedParticipant,
}: ReceiptLineItemProps) {
  const totalClaimed = item.claims.reduce((sum, claim) => sum + claim.quantity, 0);
  const isFullyClaimed = totalClaimed >= item.quantity;
  const isShared = item.isShared;

  const getParticipantQuantity = (participantId: string) => {
    const claim = item.claims.find(c => c.participantId === participantId);
    return claim?.quantity || 0;
  };

  const isParticipantInShared = (participantId: string) => {
    return item.claims.some(c => c.participantId === participantId && c.isShared);
  };

  const handleIncrement = (participantId: string) => {
    const currentQty = getParticipantQuantity(participantId);
    const available = item.quantity - totalClaimed;
    if (available > 0 || currentQty > 0) {
      onUpdateClaim(participantId, currentQty + 1);
    }
  };

  const handleDecrement = (participantId: string) => {
    const currentQty = getParticipantQuantity(participantId);
    if (currentQty > 0) {
      onUpdateClaim(participantId, currentQty - 1);
    }
  };

  const sharedParticipantCount = item.claims.filter(c => c.isShared).length;

  return (
    <Card
      className={`p-4 transition-opacity ${isFullyClaimed ? 'opacity-40' : ''}`}
      data-testid={`item-${item.id}`}
    >
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="outline" className="shrink-0">
                {item.quantity}x
              </Badge>
              <h3 className="font-medium text-base truncate">{item.description}</h3>
            </div>
            <div className="flex items-baseline gap-2 text-sm text-muted-foreground">
              <span>{item.unitPrice.toFixed(2)}€</span>
              {item.quantity > 1 && (
                <span className="text-xs">× {item.quantity}</span>
              )}
            </div>
          </div>
          <div className="text-right">
            <div className="font-semibold text-base tabular-nums">
              {item.totalPrice.toFixed(2)}€
            </div>
            {!isShared && totalClaimed > 0 && totalClaimed < item.quantity && (
              <div className="text-xs text-muted-foreground mt-0.5">
                {item.quantity - totalClaimed} disponible{item.quantity - totalClaimed !== 1 ? 's' : ''}
              </div>
            )}
          </div>
        </div>

        {/* Shared Toggle */}
        <div className="flex items-center justify-between p-3 rounded-md bg-muted/30 border">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <Label htmlFor={`shared-${item.id}`} className="text-sm font-medium cursor-pointer">
              Consumición compartida
            </Label>
          </div>
          <Switch
            id={`shared-${item.id}`}
            checked={isShared}
            onCheckedChange={onToggleShared}
            data-testid={`switch-shared-${item.id}`}
          />
        </div>

        {/* Participants Section */}
        {participants.length > 0 && (
          <div className="space-y-2">
            <div className="text-sm font-medium text-muted-foreground">
              {isShared ? 'Participantes en esta consumición:' : 'Asignar consumiciones:'}
            </div>
            
            {isShared ? (
              /* Shared mode - checkboxes */
              <div className="space-y-2">
                {participants.map(participant => {
                  const isInShared = isParticipantInShared(participant.id);
                  return (
                    <div
                      key={participant.id}
                      className="flex items-center justify-between p-2 rounded-md hover-elevate"
                      data-testid={`participant-row-${participant.id}`}
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <Checkbox
                          id={`${item.id}-${participant.id}`}
                          checked={isInShared}
                          onCheckedChange={(checked) => 
                            onToggleSharedParticipant(participant.id, checked === true)
                          }
                          data-testid={`checkbox-participant-${participant.id}`}
                        />
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold"
                            style={{ backgroundColor: participant.color, color: '#fff' }}
                          >
                            {participant.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                          </div>
                          <Label 
                            htmlFor={`${item.id}-${participant.id}`} 
                            className="font-medium cursor-pointer"
                          >
                            {participant.name}
                          </Label>
                        </div>
                      </div>
                      {isInShared && sharedParticipantCount > 0 && (
                        <div className="text-sm text-muted-foreground tabular-nums">
                          {(item.totalPrice / sharedParticipantCount).toFixed(2)}€
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              /* Individual mode - +/- buttons */
              <div className="space-y-2">
                {participants.map(participant => {
                  const quantity = getParticipantQuantity(participant.id);
                  const available = item.quantity - totalClaimed;
                  
                  return (
                    <div
                      key={participant.id}
                      className="flex items-center justify-between p-2 rounded-md hover-elevate"
                      data-testid={`participant-row-${participant.id}`}
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <div 
                          className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold shrink-0"
                          style={{ backgroundColor: participant.color, color: '#fff' }}
                        >
                          {participant.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                        </div>
                        <span className="font-medium truncate">{participant.name}</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {quantity > 0 && (
                          <div className="text-sm text-muted-foreground tabular-nums mr-1">
                            {(item.unitPrice * quantity).toFixed(2)}€
                          </div>
                        )}
                        <Button
                          size="icon"
                          variant="outline"
                          className="h-8 w-8 shrink-0"
                          onClick={() => handleDecrement(participant.id)}
                          disabled={quantity === 0}
                          data-testid={`button-decrement-${participant.id}`}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <div className="w-8 text-center font-semibold tabular-nums" data-testid={`text-quantity-${participant.id}`}>
                          {quantity}
                        </div>
                        <Button
                          size="icon"
                          variant="outline"
                          className="h-8 w-8 shrink-0"
                          onClick={() => handleIncrement(participant.id)}
                          disabled={available === 0 && quantity === 0}
                          data-testid={`button-increment-${participant.id}`}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
