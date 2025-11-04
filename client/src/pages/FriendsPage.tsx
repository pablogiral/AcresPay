import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Friend } from "@shared/schema";
import EditFriendDialog from "@/components/EditFriendDialog";

const COLORS = [
  "#3B82F6", "#EF4444", "#10B981", "#F59E0B", "#8B5CF6",
  "#EC4899", "#06B6D4", "#F97316", "#6366F1", "#14B8A6"
];

export default function FriendsPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);

  const { data: friends, isLoading } = useQuery<Friend[]>({
    queryKey: ["/api/friends"],
  });

  const addFriendMutation = useMutation({
    mutationFn: async (data: { name: string; color: string }) => {
      await apiRequest("POST", "/api/friends", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/friends"] });
      setName("");
      setSelectedColor(COLORS[0]);
      toast({
        title: "Amigo añadido",
        description: "El amigo se ha añadido correctamente",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateFriendMutation = useMutation({
    mutationFn: async (data: { id: string; name: string; color: string }) => {
      await apiRequest("PATCH", `/api/friends/${data.id}`, { name: data.name, color: data.color });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/friends"] });
      toast({
        title: "Amigo actualizado",
        description: "Los cambios se han guardado correctamente",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteFriendMutation = useMutation({
    mutationFn: async (friendId: string) => {
      await apiRequest("DELETE", `/api/friends/${friendId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/friends"] });
      toast({
        title: "Amigo eliminado",
        description: "El amigo se ha eliminado correctamente",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleAddFriend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast({
        title: "Error",
        description: "El nombre no puede estar vacío",
        variant: "destructive",
      });
      return;
    }
    addFriendMutation.mutate({ name: name.trim(), color: selectedColor });
  };

  const handleUpdateFriend = (id: string, name: string, color: string) => {
    updateFriendMutation.mutate({ id, name, color });
  };

  // Get colors already in use by existing friends
  const usedColors = friends?.map(f => f.color) || [];
  
  // Available colors for adding new friends (not used by anyone)
  const availableColors = COLORS.filter(color => !usedColors.includes(color));

  return (
    <div className="min-h-screen bg-background">
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
          <h1 className="text-xl font-semibold flex-1">Mis Amigos</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        <Card className="p-4">
          <h2 className="font-semibold mb-4">Añadir Amigo</h2>
          <form onSubmit={handleAddFriend} className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Nombre</label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nombre del amigo"
                data-testid="input-friend-name"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Color</label>
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
                      data-testid={`color-${color}`}
                    />
                  );
                })}
              </div>
              {availableColors.length < COLORS.length && (
                <p className="text-xs text-muted-foreground mt-2">
                  Colores atenuados ya están en uso
                </p>
              )}
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={addFriendMutation.isPending}
              data-testid="button-add-friend"
            >
              <Plus className="h-4 w-4 mr-2" />
              {addFriendMutation.isPending ? "Añadiendo..." : "Añadir Amigo"}
            </Button>
          </form>
        </Card>

        <div className="space-y-3">
          <h2 className="font-semibold">
            Amigos Guardados ({friends?.length || 0})
          </h2>
          {isLoading ? (
            <Card className="p-6 text-center text-muted-foreground">
              Cargando...
            </Card>
          ) : friends && friends.length > 0 ? (
            friends.map((friend) => (
              <Card key={friend.id} className="p-4" data-testid={`friend-${friend.id}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold"
                      style={{ backgroundColor: friend.color }}
                    >
                      {friend.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                    </div>
                    <div>
                      <div className="font-medium">{friend.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {friend.createdAt && new Date(friend.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <EditFriendDialog
                      friend={friend}
                      usedColors={usedColors}
                      onSave={handleUpdateFriend}
                      isPending={updateFriendMutation.isPending}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteFriendMutation.mutate(friend.id)}
                      disabled={deleteFriendMutation.isPending}
                      data-testid={`button-delete-${friend.id}`}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          ) : (
            <Card className="p-6 text-center text-muted-foreground">
              No tienes amigos guardados todavía. Añade tu primer amigo arriba.
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
