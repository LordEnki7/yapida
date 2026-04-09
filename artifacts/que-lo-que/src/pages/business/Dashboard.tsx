import { Link } from "wouter";
import { useGetMyBusiness, getGetMyBusinessQueryKey, useGetBusinessStats, getGetBusinessStatsQueryKey, useUpdateBusiness, useListOrders, getListOrdersQueryKey } from "@workspace/api-client-react";
import { getStoredUser, formatDOP } from "@/lib/auth";
import { useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Package, TrendingUp, Star, ToggleLeft, ToggleRight, ShoppingBag, ChefHat } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function BusinessDashboard() {
  const user = getStoredUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: business, isLoading: bizLoading } = useGetMyBusiness({
    query: { queryKey: getGetMyBusinessQueryKey() }
  });

  const { data: stats, isLoading: statsLoading } = useGetBusinessStats({
    query: { queryKey: getGetBusinessStatsQueryKey() }
  });

  const { data: recentOrders } = useListOrders(
    { limit: 5 },
    { query: { queryKey: getListOrdersQueryKey({ limit: 5 }) } }
  );

  const updateStatus = useUpdateBusiness({
    mutation: {
      onSuccess: (b) => {
        queryClient.invalidateQueries({ queryKey: getGetMyBusinessQueryKey() });
        toast({ title: b.isOpen ? "¡Abierto!" : "Cerrado por hoy" });
      },
    }
  });

  const toggleOpen = () => {
    if (!business) return;
    updateStatus.mutate({ businessId: business.id, data: { isOpen: !business.isOpen } });
  };

  if (bizLoading) return (
    <div className="min-h-screen bg-black p-4 space-y-4">
      <Skeleton className="h-32 bg-white/5 rounded-2xl" />
      <div className="grid grid-cols-2 gap-3">
        <Skeleton className="h-24 bg-white/5 rounded-2xl" />
        <Skeleton className="h-24 bg-white/5 rounded-2xl" />
      </div>
    </div>
  );

  const STATUS_COLORS: Record<string, string> = {
    pending: "bg-yellow-400/20 text-yellow-400 border-yellow-400/40",
    accepted: "bg-blue-400/20 text-blue-400 border-blue-400/40",
    picked_up: "bg-purple-400/20 text-purple-400 border-purple-400/40",
    delivered: "bg-green-400/20 text-green-400 border-green-400/40",
    cancelled: "bg-red-400/20 text-red-400 border-red-400/40",
  };

  const STATUS_LABELS: Record<string, string> = {
    pending: "Pendiente",
    accepted: "Aceptado",
    picked_up: "Recogido",
    delivered: "Entregado",
    cancelled: "Cancelado",
  };

  return (
    <div className="min-h-screen bg-black text-white pb-8">
      {/* Header */}
      <div className="bg-black border-b border-yellow-400/20 px-4 py-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-widest">Panel de Negocio</p>
            <h1 className="text-xl font-black text-yellow-400">{business?.name}</h1>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400 mb-1">Estado</p>
            <button
              onClick={toggleOpen}
              disabled={updateStatus.isPending}
              className="flex items-center gap-2"
            >
              {business?.isOpen
                ? <ToggleRight size={28} className="text-green-400" />
                : <ToggleLeft size={28} className="text-gray-500" />}
              <span className={`text-xs font-bold ${business?.isOpen ? "text-green-400" : "text-gray-500"}`}>
                {business?.isOpen ? "Abierto" : "Cerrado"}
              </span>
            </button>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* Stats */}
        {statsLoading ? (
          <div className="grid grid-cols-2 gap-3">
            <Skeleton className="h-24 bg-white/5 rounded-2xl" />
            <Skeleton className="h-24 bg-white/5 rounded-2xl" />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
              <TrendingUp size={16} className="text-yellow-400 mb-2" />
              <p className="text-2xl font-black text-yellow-400">{formatDOP(stats?.totalSalesToday ?? 0)}</p>
              <p className="text-xs text-gray-400">ventas hoy</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
              <Package size={16} className="text-blue-400 mb-2" />
              <p className="text-2xl font-black text-blue-400">{stats?.ordersToday ?? 0}</p>
              <p className="text-xs text-gray-400">pedidos hoy</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
              <Star size={16} className="text-yellow-400 mb-2" />
              <p className="text-2xl font-black text-yellow-400">{business?.rating?.toFixed(1) ?? "—"}</p>
              <p className="text-xs text-gray-400">calificación</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
              <ShoppingBag size={16} className="text-green-400 mb-2" />
              <p className="text-2xl font-black text-green-400">{formatDOP(stats?.totalSalesWeek ?? 0)}</p>
              <p className="text-xs text-gray-400">esta semana</p>
            </div>
          </div>
        )}

        {/* Quick links */}
        <div className="grid grid-cols-2 gap-3">
          <Link href="/business/orders">
            <div className="bg-yellow-400/10 border border-yellow-400/30 rounded-2xl p-4 text-center hover:bg-yellow-400/20 transition cursor-pointer">
              <Package size={24} className="text-yellow-400 mx-auto mb-2" />
              <p className="font-bold text-yellow-400 text-sm">Pedidos</p>
              {stats?.pendingOrders && stats.pendingOrders > 0 && (
                <Badge className="bg-yellow-400 text-black font-black mt-1">{stats.pendingOrders} nuevos</Badge>
              )}
            </div>
          </Link>
          <Link href="/business/menu">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center hover:border-yellow-400/30 transition cursor-pointer">
              <ChefHat size={24} className="text-gray-300 mx-auto mb-2" />
              <p className="font-bold text-gray-300 text-sm">Mi menú</p>
            </div>
          </Link>
        </div>

        {/* Recent orders */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Pedidos recientes</h2>
            <Link href="/business/orders">
              <span className="text-xs text-yellow-400 font-bold">Ver todos →</span>
            </Link>
          </div>
          <div className="space-y-2">
            {recentOrders?.slice(0, 5).map((order) => (
              <div key={order.id} className="bg-white/5 border border-white/10 rounded-xl p-3 flex items-center justify-between">
                <div>
                  <p className="font-bold text-sm">Pedido #{order.id}</p>
                  <p className="text-xs text-gray-400">{order.customer?.name ?? "Cliente"}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-yellow-400">{formatDOP(order.totalAmount)}</span>
                  <Badge className={`border text-xs ${STATUS_COLORS[order.status] ?? STATUS_COLORS.pending}`}>
                    {STATUS_LABELS[order.status] ?? order.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
