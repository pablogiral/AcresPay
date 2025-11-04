import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import ParticipantChip from "./ParticipantChip";
import type { LineItem, Participant } from "@shared/schema";

interface ReceiptLineItemProps {
  item: LineItem;
  participants: Participant[];
  onClick?: () => void;
}

export default function ReceiptLineItem({ item, participants, onClick }: ReceiptLineItemProps) {
  const totalClaimed = item.claims.reduce((sum, claim) => sum + claim.quantity, 0);
  const isFullyClaimed = totalClaimed >= item.quantity;
  const isPartiallyClaimed = totalClaimed > 0 && totalClaimed < item.quantity;
  const remaining = item.quantity - totalClaimed;

  const claimsByParticipant = item.claims.reduce((acc, claim) => {
    if (!acc[claim.participantId]) {
      acc[claim.participantId] = { quantity: 0, isShared: claim.isShared };
    }
    acc[claim.participantId].quantity += claim.quantity;
    return acc;
  }, {} as Record<string, { quantity: number; isShared: boolean }>);

  return (
    <Card
      className={`p-4 hover-elevate active-elevate-2 cursor-pointer transition-opacity ${
        isFullyClaimed ? 'opacity-40' : ''
      }`}
      onClick={onClick}
      data-testid={`item-${item.id}`}
    >
      <div className="flex items-start justify-between gap-3 mb-2">
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
          {isPartiallyClaimed && (
            <div className="text-xs text-muted-foreground mt-0.5">
              {remaining} disponible{remaining !== 1 ? 's' : ''}
            </div>
          )}
        </div>
      </div>

      {Object.keys(claimsByParticipant).length > 0 && (
        <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t">
          {Object.entries(claimsByParticipant).map(([participantId, { quantity, isShared }]) => {
            const participant = participants.find(p => p.id === participantId);
            if (!participant) return null;
            return (
              <ParticipantChip
                key={participantId}
                name={isShared ? `${participant.name} (compartido)` : participant.name}
                color={participant.color}
                quantity={quantity > 1 ? quantity : undefined}
              />
            );
          })}
        </div>
      )}
    </Card>
  );
}
