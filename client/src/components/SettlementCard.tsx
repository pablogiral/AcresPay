import { ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import type { Settlement, Participant } from "@shared/schema";

interface SettlementCardProps {
  settlement: Settlement;
  participants: Participant[];
  isPaid?: boolean;
  onTogglePaid?: (isPaid: boolean) => void;
}

export default function SettlementCard({ settlement, participants, isPaid = false, onTogglePaid }: SettlementCardProps) {
  const fromParticipant = participants.find(p => p.id === settlement.from);
  const toParticipant = participants.find(p => p.id === settlement.to);

  if (!fromParticipant || !toParticipant) return null;

  return (
    <Card className="p-4" data-testid={`settlement-${settlement.from}-${settlement.to}`}>
      <div className="flex items-center gap-4">
        {onTogglePaid && (
          <Checkbox
            checked={isPaid}
            onCheckedChange={(checked) => onTogglePaid(checked === true)}
            data-testid={`checkbox-payment-${settlement.from}-${settlement.to}`}
            className="shrink-0"
          />
        )}
        <div className="flex items-center justify-between gap-4 flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div 
              className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold shrink-0"
              style={{ backgroundColor: fromParticipant.color, color: '#fff' }}
            >
              {fromParticipant.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
            </div>
            <div className="flex-1 min-w-0">
              <div className={`font-medium truncate ${isPaid ? 'line-through text-muted-foreground' : ''}`}>
                {fromParticipant.name}
              </div>
              <div className="text-xs text-muted-foreground">debe pagar</div>
            </div>
          </div>

          <ArrowRight className="h-5 w-5 text-muted-foreground shrink-0" />

          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="flex-1 min-w-0 text-right">
              <div className={`font-medium truncate ${isPaid ? 'line-through text-muted-foreground' : ''}`}>
                {toParticipant.name}
              </div>
              <div className={`text-xl font-bold tabular-nums ${isPaid ? 'text-muted-foreground line-through' : 'text-primary'}`} data-testid="text-amount">
                {settlement.amount.toFixed(2)}€
              </div>
            </div>
            <div 
              className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold shrink-0"
              style={{ backgroundColor: toParticipant.color, color: '#fff' }}
            >
              {toParticipant.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
