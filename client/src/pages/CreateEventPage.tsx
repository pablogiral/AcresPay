import { useState } from "react";
import { ArrowLeft, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Friend } from "@shared/schema";

export default function CreateEventPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [eventName, setEventName] = useState("");
  const [selectedFriends, setSelectedFriends] = useState<Set<string>>(new Set());

  const { data: friends = [], isLoading } = useQuery<Friend[]>({
    queryKey: ['/api/friends'],
  });

  const createEventMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', '/api/events', {
        name: eventName,
        friendIds: Array.from(selectedFriends),
      });
      return await res.json();
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['/api/events'] });
      toast({
        title: "Evento creado",
        description: "El evento se ha creado correctamente",
      });
      setLocation(`/events/${data.id}`);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo crear el evento",
        variant: "destructive",
      });
    },
  });

  const toggleFriend = (friendId: string) => {
    const newSelected = new Set(selectedFriends);
    if (newSelected.has(friendId)) {
      newSelected.delete(friendId);
    } else {
      newSelected.add(friendId);
    }
    setSelectedFriends(newSelected);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventName.trim()) {
      toast({
        title: "Error",
        description: "El nombre del evento es obligatorio",
        variant: "destructive",
      });
      return;
    }
    if (selectedFriends.size === 0) {
      toast({
        title: "Error",
        description: "Debes seleccionar al menos un participante",
        variant: "destructive",
      });
      return;
    }
    createEventMutation.mutate();
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 bg-card border-b">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation('/')}
            data-testid="button-back"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2 flex-1">
            <CalendarDays className="h-5 w-5" />
            <h1 className="text-xl font-semibold">Nuevo Evento</h1>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="p-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="event-name">Nombre del Evento</Label>
                <Input
                  id="event-name"
                  placeholder="Ej: Viaje a Barcelona, Noche en el centro..."
                  value={eventName}
                  onChange={(e) => setEventName(e.target.value)}
                  data-testid="input-event-name"
                />
                <p className="text-xs text-muted-foreground">
                  Agrupa varios tickets de un mismo viaje o evento
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="space-y-4">
              <div>
                <h2 className="font-semibold mb-1">Participantes</h2>
                <p className="text-sm text-muted-foreground">
                  Selecciona los amigos que participarán en este evento
                </p>
              </div>

              {isLoading ? (
                <p className="text-sm text-muted-foreground">Cargando amigos...</p>
              ) : friends.length === 0 ? (
                <Card className="p-6 text-center">
                  <p className="text-muted-foreground mb-4">
                    Aún no tienes amigos guardados
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setLocation('/friends')}
                    data-testid="button-go-to-friends"
                  >
                    Ir a Amigos
                  </Button>
                </Card>
              ) : (
                <div className="space-y-2">
                  {friends.map((friend) => (
                    <div
                      key={friend.id}
                      className="flex items-center gap-3 p-3 rounded-md hover-elevate active-elevate-2 cursor-pointer"
                      onClick={() => toggleFriend(friend.id)}
                      data-testid={`friend-${friend.id}`}
                    >
                      <Checkbox
                        checked={selectedFriends.has(friend.id)}
                        data-testid={`checkbox-friend-${friend.id}`}
                      />
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold"
                        style={{ backgroundColor: friend.color, color: '#fff' }}
                      >
                        {friend.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                      </div>
                      <span className="font-medium">{friend.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => setLocation('/')}
              data-testid="button-cancel"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={createEventMutation.isPending || !eventName.trim() || selectedFriends.size === 0}
              data-testid="button-create-event"
            >
              {createEventMutation.isPending ? 'Creando...' : 'Crear Evento'}
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}
