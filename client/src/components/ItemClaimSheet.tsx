import { useState } from "react";
import { Minus, Plus } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import type { LineItem } from "@shared/schema";

interface ItemClaimSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: LineItem | null;
  participantName: string;
  onClaim: (quantity: number, isShared: boolean) => void;
}

export default function ItemClaimSheet({
  open,
  onOpenChange,
  item,
  participantName,
  onClaim,
}: ItemClaimSheetProps) {
  const [quantity, setQuantity] = useState(1);
  const [isShared, setIsShared] = useState(false);

  if (!item) return null;

  const totalClaimed = item.claims.reduce((sum, claim) => sum + claim.quantity, 0);
  const available = item.quantity - totalClaimed;

  const handleIncrement = () => {
    if (quantity < available) {
      setQuantity(q => q + 1);
    }
  };

  const handleDecrement = () => {
    if (quantity > 1) {
      setQuantity(q => q - 1);
    }
  };

  const handleClaim = () => {
    onClaim(quantity, isShared);
    setQuantity(1);
    setIsShared(false);
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-lg">
        <SheetHeader className="mb-6">
          <SheetTitle className="text-xl">{item.description}</SheetTitle>
          <div className="text-sm text-muted-foreground">
            {item.unitPrice.toFixed(2)}€ × unidad
          </div>
          <div className="text-sm font-medium">
            Disponibles: {available} de {item.quantity}
          </div>
        </SheetHeader>

        <div className="space-y-6">
          <div className="space-y-3">
            <Label className="text-sm font-medium">Cantidad para {participantName}</Label>
            <div className="flex items-center justify-center gap-4">
              <Button
                size="icon"
                variant="outline"
                onClick={handleDecrement}
                disabled={quantity <= 1}
                className="h-12 w-12"
                data-testid="button-decrement"
              >
                <Minus className="h-5 w-5" />
              </Button>
              <div className="text-3xl font-semibold tabular-nums w-16 text-center" data-testid="text-quantity">
                {quantity}
              </div>
              <Button
                size="icon"
                variant="outline"
                onClick={handleIncrement}
                disabled={quantity >= available}
                className="h-12 w-12"
                data-testid="button-increment"
              >
                <Plus className="h-5 w-5" />
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 rounded-md bg-muted/50">
            <div className="space-y-0.5">
              <Label htmlFor="shared-mode" className="text-sm font-medium">
                Consumición compartida
              </Label>
              <div className="text-xs text-muted-foreground">
                El coste se dividirá entre todos los participantes
              </div>
            </div>
            <Switch
              id="shared-mode"
              checked={isShared}
              onCheckedChange={setIsShared}
              data-testid="switch-shared"
            />
          </div>

          <div className="p-4 rounded-md bg-primary/10">
            <div className="flex justify-between items-baseline">
              <span className="text-sm">Tu parte:</span>
              <span className="text-xl font-bold tabular-nums" data-testid="text-cost">
                {isShared 
                  ? '(a dividir)' 
                  : `${(item.unitPrice * quantity).toFixed(2)}€`
                }
              </span>
            </div>
          </div>
        </div>

        <SheetFooter className="mt-6">
          <Button
            className="w-full h-12"
            onClick={handleClaim}
            disabled={available < quantity}
            data-testid="button-claim"
          >
            Confirmar Selección
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
