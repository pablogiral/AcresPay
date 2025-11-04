import { useState } from "react";
import { UserPlus, Users } from "lucide-react";
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
import { useQuery } from "@tanstack/react-query";
import type { Friend } from "@shared/schema";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface AddParticipantDialogProps {
  onAdd: (name: string, color: string) => void;
}

export default function AddParticipantDialog({ onAdd }: AddParticipantDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");

  const { data: friends } = useQuery<Friend[]>({
    queryKey: ["/api/friends"],
    enabled: open,
  });

  const handleAdd = () => {
    if (name.trim()) {
      // Generate a random color for new participants (ensure 6 hex digits)
      const color = `#${Math.floor(Math.random()*16777215).toString(16).padStart(6, '0')}`;
      onAdd(name.trim(), color);
      setName("");
      setOpen(false);
    }
  };

  const handleAddFriend = (friend: Friend) => {
    onAdd(friend.name, friend.color);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" data-testid="button-add-participant">
          <UserPlus className="h-4 w-4 mr-1.5" />
          Añadir
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Añadir Participante</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="friends" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="friends" data-testid="tab-friends">
              <Users className="h-4 w-4 mr-1.5" />
              Amigos
            </TabsTrigger>
            <TabsTrigger value="new" data-testid="tab-new">
              <UserPlus className="h-4 w-4 mr-1.5" />
              Nuevo
            </TabsTrigger>
          </TabsList>
          <TabsContent value="friends" className="space-y-3 mt-4">
            {friends && friends.length > 0 ? (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {friends.map((friend) => (
                  <button
                    key={friend.id}
                    onClick={() => handleAddFriend(friend)}
                    className="w-full p-3 text-left rounded-lg border hover-elevate active-elevate-2 flex items-center gap-3"
                    data-testid={`friend-option-${friend.id}`}
                  >
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0"
                      style={{ backgroundColor: friend.color }}
                    >
                      {friend.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                    </div>
                    <span className="font-medium">{friend.name}</span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No tienes amigos guardados</p>
                <p className="text-xs mt-1">Ve a la sección Amigos para añadir</p>
              </div>
            )}
          </TabsContent>
          <TabsContent value="new" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="participant-name">Nombre</Label>
              <Input
                id="participant-name"
                placeholder="Ej: Ana García"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                data-testid="input-participant-name"
              />
            </div>
            <DialogFooter>
              <Button onClick={handleAdd} disabled={!name.trim()} data-testid="button-confirm-add">
                Añadir Participante
              </Button>
            </DialogFooter>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
