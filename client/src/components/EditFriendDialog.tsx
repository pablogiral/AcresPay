import { useState, useEffect } from "react";
import { Pencil } from "lucide-react";
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
import type { Friend } from "@shared/schema";

const COLORS = [
  "#3B82F6", "#EF4444", "#10B981", "#F59E0B", "#8B5CF6",
  "#EC4899", "#06B6D4", "#F97316", "#6366F1", "#14B8A6"
];

interface EditFriendDialogProps {
  friend: Friend;
  usedColors: string[];
  onSave: (id: string, name: string, color: string) => void;
  isPending?: boolean;
}

export default function EditFriendDialog({ friend, usedColors, onSave, isPending }: EditFriendDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(friend.name);
  const [selectedColor, setSelectedColor] = useState(friend.color);

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setName(friend.name);
      setSelectedColor(friend.color);
    }
  }, [open, friend]);

  const handleSave = () => {
    if (name.trim()) {
      onSave(friend.id, name.trim(), selectedColor);
      setOpen(false);
    }
  };

  // Available colors are those not used by other friends (excluding current friend's color)
  const availableColors = COLORS.filter(
    color => color === friend.color || !usedColors.includes(color)
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          data-testid={`button-edit-${friend.id}`}
        >
          <Pencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar Amigo</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="edit-name">Nombre</Label>
            <Input
              id="edit-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nombre del amigo"
              data-testid="input-edit-friend-name"
            />
          </div>
          <div className="space-y-2">
            <Label>Color</Label>
            <div className="flex gap-2 flex-wrap">
              {COLORS.map((color) => {
                const isAvailable = availableColors.includes(color);
                const isSelected = selectedColor === color;
                return (
                  <button
                    key={color}
                    type="button"
                    className={`w-10 h-10 rounded-full border-2 ${
                      isSelected ? 'border-foreground' : 'border-transparent'
                    } ${!isAvailable ? 'opacity-30 cursor-not-allowed' : ''}`}
                    style={{ backgroundColor: color }}
                    onClick={() => isAvailable && setSelectedColor(color)}
                    disabled={!isAvailable}
                    data-testid={`edit-color-${color}`}
                  />
                );
              })}
            </div>
            {availableColors.length < COLORS.length && (
              <p className="text-xs text-muted-foreground">
                Colores atenuados ya están en uso
              </p>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button
            onClick={handleSave}
            disabled={!name.trim() || isPending}
            data-testid="button-confirm-edit-friend"
          >
            {isPending ? "Guardando..." : "Guardar Cambios"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
