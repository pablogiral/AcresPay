import { Receipt, Users, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      <div className="max-w-5xl mx-auto px-4 py-12">
        <header className="text-center mb-16">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center">
              <Receipt className="h-8 w-8 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-4xl font-bold mb-3">AcresPay</h1>
          <p className="text-xl text-muted-foreground mb-8">
            Divide cuentas de forma fácil y justa
          </p>
          <Button
            size="lg"
            onClick={() => window.location.href = "/api/login"}
            data-testid="button-login"
          >
            Iniciar Sesión
          </Button>
        </header>

        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <Card className="p-6">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
              <Receipt className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-semibold mb-2">Gestiona tus Tickets</h3>
            <p className="text-sm text-muted-foreground">
              Crea y organiza tickets de restaurantes, salidas y más
            </p>
          </Card>

          <Card className="p-6">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-semibold mb-2">Amigos Guardados</h3>
            <p className="text-sm text-muted-foreground">
              Guarda tu lista de amigos para añadirlos rápidamente
            </p>
          </Card>

          <Card className="p-6">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
              <Clock className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-semibold mb-2">Historial Completo</h3>
            <p className="text-sm text-muted-foreground">
              Accede a todos tus tickets anteriores en cualquier momento
            </p>
          </Card>
        </div>

        <div className="bg-card rounded-lg p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">¿Cómo funciona?</h2>
          <div className="grid md:grid-cols-3 gap-8 text-left">
            <div>
              <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center mb-3 font-bold">
                1
              </div>
              <h4 className="font-semibold mb-2">Crea un ticket</h4>
              <p className="text-sm text-muted-foreground">
                Añade participantes y las consumiciones del ticket
              </p>
            </div>
            <div>
              <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center mb-3 font-bold">
                2
              </div>
              <h4 className="font-semibold mb-2">Asigna consumiciones</h4>
              <p className="text-sm text-muted-foreground">
                Marca quién consumió qué, individual o compartido
              </p>
            </div>
            <div>
              <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center mb-3 font-bold">
                3
              </div>
              <h4 className="font-semibold mb-2">Calcula la división</h4>
              <p className="text-sm text-muted-foreground">
                Ve exactamente quién debe pagar a quién y cuánto
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
