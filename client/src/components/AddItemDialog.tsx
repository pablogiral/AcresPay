import { useState } from "react";
import { Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface AddItemDialogProps {
  onAdd: (description: string, quantity: number, unitPrice: number) => void;
}

export default function AddItemDialog({ onAdd }: AddItemDialogProps) {
  const [open, setOpen] = useState(false);
  const [description, setDescription] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [unitPrice, setUnitPrice] = useState("");

  const handleAdd = () => {
    const qty = parseInt(quantity);
    const price = parseFloat(unitPrice);
    
    if (description.trim() && qty > 0 && price > 0) {
      onAdd(description.trim(), qty, price);
      setDescription("");
      setQuantity("1");
      setUnitPrice("");
      setOpen(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full" data-testid="button-add-item">
          <Plus className="h-4 w-4 mr-1.5" />
          Añadir Línea
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Añadir Línea al Ticket</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="item-description">Descripción</Label>
            <Input
              id="item-description"
              placeholder="Ej: Paella Valenciana"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              data-testid="input-item-description"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="item-quantity">Cantidad</Label>
              <Input
                id="item-quantity"
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                data-testid="input-item-quantity"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="item-price">Precio (€)</Label>
              <Input
                id="item-price"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={unitPrice}
                onChange={(e) => setUnitPrice(e.target.value)}
                data-testid="input-item-price"
              />
            </div>
          </div>
          {quantity && unitPrice && (
            <div className="p-3 rounded-md bg-muted text-sm">
              <div className="flex justify-between">
                <span>Total línea:</span>
                <span className="font-semibold tabular-nums">
                  {(parseFloat(quantity) * parseFloat(unitPrice)).toFixed(2)}€
                </span>
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button 
            onClick={handleAdd} 
            disabled={!description.trim() || !quantity || !unitPrice}
            data-testid="button-confirm-add-item"
          >
            Añadir Línea
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
