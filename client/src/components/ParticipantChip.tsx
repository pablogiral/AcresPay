import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface ParticipantChipProps {
  name: string;
  color: string;
  quantity?: number;
  onRemove?: () => void;
  showRemove?: boolean;
}

export default function ParticipantChip({ 
  name, 
  color, 
  quantity,
  onRemove,
  showRemove = false
}: ParticipantChipProps) {
  const initials = name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <Badge 
      variant="secondary" 
      className="gap-1.5 pr-1.5"
      data-testid={`chip-participant-${name}`}
    >
      <div 
        className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-semibold"
        style={{ backgroundColor: color, color: '#fff' }}
      >
        {initials}
      </div>
      <span className="text-sm font-medium">
        {name}
        {quantity && quantity > 1 && ` (${quantity})`}
      </span>
      {showRemove && onRemove && (
        <Button
          size="icon"
          variant="ghost"
          className="h-4 w-4 hover:bg-transparent p-0"
          onClick={onRemove}
          data-testid={`button-remove-${name}`}
        >
          <X className="h-3 w-3" />
        </Button>
      )}
    </Badge>
  );
}
