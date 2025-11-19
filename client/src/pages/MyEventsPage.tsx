import { ArrowLeft, CalendarDays, Users2, Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { EventWithDetails } from "@shared/schema";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";

export default function MyEventsPage() {
  const [, setLocation] = useLocation();

  const { data: events = [], isLoading } = useQuery<EventWithDetails[]>({
    queryKey: ['/api/events'],
  });

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
            <h1 className="text-xl font-semibold">Mis Eventos</h1>
          </div>
          <Button
            onClick={() => setLocation('/events/new')}
            data-testid="button-new-event"
          >
            Nuevo Evento
          </Button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        {isLoading ? (
          <div className="text-center text-muted-foreground">Cargando eventos...</div>
        ) : events.length === 0 ? (
          <Card className="p-12 text-center">
            <CalendarDays className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-lg font-semibold mb-2">No tienes eventos</h2>
            <p className="text-muted-foreground mb-6">
              Crea tu primer evento para agrupar tickets de un viaje o noche
            </p>
            <Button
              onClick={() => setLocation('/events/new')}
              data-testid="button-create-first-event"
            >
              Crear Evento
            </Button>
          </Card>
        ) : (
          <div className="space-y-4">
            {events.map((event) => (
              <Card
                key={event.id}
                className="p-6 cursor-pointer hover-elevate active-elevate-2"
                onClick={() => setLocation(`/events/${event.id}`)}
                data-testid={`event-${event.id}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-1">{event.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {new Date(event.createdAt).toLocaleDateString('es-ES', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Users2 className="h-4 w-4" />
                    <span>{event.participants.length} participantes</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Receipt className="h-4 w-4" />
                    <span>{event.billCount || 0} tickets</span>
                  </div>
                </div>

                {event.participants.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-4">
                    {event.participants.slice(0, 5).map(friend => (
                      <div
                        key={friend.id}
                        className="flex items-center gap-2 px-3 py-1 rounded-full border text-xs"
                      >
                        <div
                          className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-semibold"
                          style={{ backgroundColor: friend.color, color: '#fff' }}
                        >
                          {friend.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                        </div>
                        <span>{friend.name}</span>
                      </div>
                    ))}
                    {event.participants.length > 5 && (
                      <Badge variant="secondary" className="text-xs">
                        +{event.participants.length - 5} más
                      </Badge>
                    )}
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
