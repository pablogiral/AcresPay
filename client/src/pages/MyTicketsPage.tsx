import { ArrowLeft, Receipt, Calendar, DollarSign, MoreVertical, Edit, Trash2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import type { Bill } from "@shared/schema";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

export default function MyTicketsPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [billToDelete, setBillToDelete] = useState<string | null>(null);

  const { data: bills, isLoading } = useQuery<Array<Bill & { isFullyPaid: boolean }>>({
    queryKey: ["/api/my-bills"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (billId: string) => {
      await apiRequest("DELETE", `/api/bills/${billId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/my-bills"] });
      toast({
        title: "Ticket eliminado",
        description: "El ticket ha sido eliminado correctamente.",
      });
      setBillToDelete(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo eliminar el ticket.",
        variant: "destructive",
      });
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 bg-card border-b">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation("/")}
            data-testid="button-back"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-semibold flex-1">Mis Tickets</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {isLoading ? (
          <Card className="p-6 text-center text-muted-foreground">
            Cargando tickets...
          </Card>
        ) : bills && bills.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {bills.map((bill) => (
              <Card
                key={bill.id}
                className={`p-4 cursor-pointer hover-elevate active-elevate-2 transition-all ${bill.isFullyPaid ? 'opacity-50' : ''}`}
                onClick={() => setLocation(`/bill/${bill.id}?from=my-bills`)}
                data-testid={`bill-${bill.id}`}
              >
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Receipt className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold truncate flex-1">{bill.name}</h3>
                      {bill.isFullyPaid && (
                        <Badge className="bg-green-500 hover:bg-green-600 text-white shrink-0">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Pagado
                        </Badge>
                      )}
                    </div>
                    {bill.date && (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                        <Calendar className="h-3 w-3" />
                        <span>
                          {format(new Date(bill.date), "d 'de' MMMM, yyyy", { locale: es })}
                        </span>
                      </div>
                    )}
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0"
                        onClick={(e) => e.stopPropagation()}
                        data-testid={`button-menu-${bill.id}`}
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          setLocation(`/bill/${bill.id}?from=my-bills`);
                        }}
                        data-testid={`menu-edit-${bill.id}`}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          setBillToDelete(bill.id);
                        }}
                        data-testid={`menu-delete-${bill.id}`}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Eliminar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="flex items-center gap-1 text-lg font-bold text-primary">
                  <DollarSign className="h-4 w-4" />
                  <span>{(parseFloat(bill.total) || 0).toFixed(2)}€</span>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-8 text-center">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Receipt className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-semibold mb-2">No tienes tickets todavía</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Crea tu primer ticket para comenzar a dividir cuentas
            </p>
            <Button onClick={() => setLocation("/bill/new")} data-testid="button-create-first-bill">
              <Receipt className="h-4 w-4 mr-2" />
              Crear Ticket
            </Button>
          </Card>
        )}
      </main>

      <AlertDialog open={!!billToDelete} onOpenChange={(open) => !open && setBillToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar ticket?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará el ticket y todos sus datos asociados 
              (participantes, consumiciones y pagos).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => billToDelete && deleteMutation.mutate(billToDelete)}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete"
            >
              {deleteMutation.isPending ? "Eliminando..." : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
