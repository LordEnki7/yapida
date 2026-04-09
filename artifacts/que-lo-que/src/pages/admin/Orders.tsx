import { Link } from "wouter";
import { useAdminListOrders, getAdminListOrdersQueryKey } from "@workspace/api-client-react";
import { formatDOP } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Clock } from "lucide-react";

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

export default function AdminOrders() {
  const { data: orders, isLoading } = useAdminListOrders(
    undefined,
    { query: { queryKey: getAdminListOrdersQueryKey() } }
  );

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="bg-black border-b border-yellow-400/20 px-4 py-4 flex items-center gap-3 sticky top-0 z-10">
        <Link href="/admin">
          <button className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition">
            <ArrowLeft size={18} />
          </button>
        </Link>
        <h1 className="text-xl font-black text-yellow-400">Todos los pedidos</h1>
        {orders && <Badge className="ml-auto bg-white/10 text-gray-300 border-0">{orders.length}</Badge>}
      </div>

      <div className="px-4 py-4">
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 bg-white/5 rounded-xl" />)}
          </div>
        ) : orders?.length === 0 ? (
          <div className="text-center py-16 text-gray-400">No hay pedidos todavía</div>
        ) : (
          <div className="space-y-2">
            {orders?.map((order) => (
              <div key={order.id} data-testid={`order-row-${order.id}`} className="bg-white/5 border border-white/10 rounded-xl p-3">
                <div className="flex items-center justify-between mb-1">
                  <div>
                    <span className="font-black text-white">#{order.id}</span>
                    <span className="text-gray-400 text-xs ml-2">{order.business?.name}</span>
                  </div>
                  <Badge className={`border text-xs ${STATUS_COLORS[order.status] ?? STATUS_COLORS.pending}`}>
                    {STATUS_LABELS[order.status] ?? order.status}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-400 flex items-center gap-1">
                    <Clock size={10} />
                    {new Date(order.createdAt).toLocaleDateString("es-DO")} · {order.customer?.name ?? "Cliente"}
                    {order.driver?.user && ` · 🛵 ${order.driver.user.name}`}
                  </p>
                  <p className="font-black text-yellow-400 text-sm">{formatDOP(order.totalAmount)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
