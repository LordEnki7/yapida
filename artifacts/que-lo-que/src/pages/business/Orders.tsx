import { Link } from "wouter";
import { useListOrders, getListOrdersQueryKey, useUpdateOrderStatus } from "@workspace/api-client-react";
import { formatDOP } from "@/lib/auth";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Clock, CheckCircle2, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const STATUS_LABELS: Record<string, string> = {
  pending: "Pendiente",
  accepted: "Preparando",
  picked_up: "Recogido",
  delivered: "Entregado",
  cancelled: "Cancelado",
};

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-400/20 text-yellow-400 border-yellow-400/40",
  accepted: "bg-blue-400/20 text-blue-400 border-blue-400/40",
  picked_up: "bg-purple-400/20 text-purple-400 border-purple-400/40",
  delivered: "bg-green-400/20 text-green-400 border-green-400/40",
  cancelled: "bg-red-400/20 text-red-400 border-red-400/40",
};

export default function BusinessOrders() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: orders, isLoading } = useListOrders(
    {},
    { query: { queryKey: getListOrdersQueryKey({}) } }
  );

  const updateStatus = useUpdateOrderStatus({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListOrdersQueryKey({}) });
        toast({ title: "Pedido actualizado" });
      },
      onError: () => toast({ title: "Error", description: "No se pudo actualizar", variant: "destructive" }),
    }
  });

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="bg-black border-b border-yellow-400/20 px-4 py-4 flex items-center gap-3 sticky top-0 z-10">
        <Link href="/business">
          <button className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition">
            <ArrowLeft size={18} />
          </button>
        </Link>
        <h1 className="text-xl font-black text-yellow-400">Gestión de pedidos</h1>
      </div>

      <div className="px-4 py-4">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-36 bg-white/5 rounded-2xl" />)}
          </div>
        ) : orders?.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-4xl mb-3">📭</p>
            <p className="text-gray-400">No hay pedidos todavía</p>
          </div>
        ) : (
          <div className="space-y-3">
            {orders?.map((order) => (
              <div key={order.id} data-testid={`order-${order.id}`} className="bg-white/5 border border-white/10 rounded-2xl p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-black text-white">Pedido #{order.id}</p>
                    <p className="text-xs text-gray-400 flex items-center gap-1">
                      <Clock size={10} />
                      {new Date(order.createdAt).toLocaleTimeString("es-DO")} · {order.customer?.name ?? "Cliente"}
                    </p>
                  </div>
                  <Badge className={`border text-xs ${STATUS_COLORS[order.status] ?? STATUS_COLORS.pending}`}>
                    {STATUS_LABELS[order.status] ?? order.status}
                  </Badge>
                </div>

                <div className="space-y-1 mb-3">
                  {order.items?.slice(0, 3).map(item => (
                    <p key={item.id} className="text-xs text-gray-300">
                      {item.quantity}x {item.productName} — {formatDOP(item.price * item.quantity)}
                    </p>
                  ))}
                  {(order.items?.length ?? 0) > 3 && (
                    <p className="text-xs text-gray-500">+{(order.items?.length ?? 0) - 3} más</p>
                  )}
                </div>

                <div className="flex items-center justify-between border-t border-white/10 pt-2">
                  <span className="font-black text-yellow-400">{formatDOP(order.totalAmount)}</span>
                  <div className="flex gap-2">
                    {order.status === "pending" && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateStatus.mutate({ orderId: order.id, data: { status: "cancelled" } })}
                          className="border-red-400/50 text-red-400 hover:bg-red-400/10 h-8 text-xs gap-1"
                          disabled={updateStatus.isPending}
                        >
                          <XCircle size={12} /> Rechazar
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => updateStatus.mutate({ orderId: order.id, data: { status: "accepted" } })}
                          className="bg-green-500 hover:bg-green-400 text-white font-bold h-8 text-xs gap-1"
                          disabled={updateStatus.isPending}
                          data-testid={`accept-${order.id}`}
                        >
                          <CheckCircle2 size={12} /> Aceptar
                        </Button>
                      </>
                    )}
                    {order.status === "accepted" && (
                      <Badge className="bg-blue-400/10 text-blue-400 border-blue-400/30 text-xs">Preparando...</Badge>
                    )}
                    {order.status === "picked_up" && (
                      <Badge className="bg-purple-400/10 text-purple-400 border-purple-400/30 text-xs">Driver en camino</Badge>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
