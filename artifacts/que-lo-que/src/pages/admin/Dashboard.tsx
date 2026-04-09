import { Link } from "wouter";
import { useGetPlatformStats, getGetPlatformStatsQueryKey, useAdminListUsers, getAdminListUsersQueryKey } from "@workspace/api-client-react";
import { formatDOP } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, ShoppingBag, Bike, Building2, TrendingUp, ShieldAlert } from "lucide-react";

export default function AdminDashboard() {
  const { data: stats, isLoading: statsLoading } = useGetPlatformStats({
    query: { queryKey: getGetPlatformStatsQueryKey() }
  });

  const { data: allUsers } = useAdminListUsers(
    undefined,
    { query: { queryKey: getAdminListUsersQueryKey() } }
  );
  const recentUsers = allUsers?.slice(0, 5);

  const ROLE_COLORS: Record<string, string> = {
    customer: "bg-blue-400/20 text-blue-400 border-blue-400/40",
    driver: "bg-green-400/20 text-green-400 border-green-400/40",
    business: "bg-purple-400/20 text-purple-400 border-purple-400/40",
    admin: "bg-yellow-400/20 text-yellow-400 border-yellow-400/40",
  };

  return (
    <div className="min-h-screen bg-black text-white pb-8">
      <div className="bg-black border-b border-yellow-400/20 px-4 py-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-yellow-400/70 uppercase tracking-widest font-bold">Admin</p>
            <h1 className="text-2xl font-black text-white">Control Panel 🔧</h1>
          </div>
          <div className="w-10 h-10 rounded-full bg-yellow-400/20 flex items-center justify-center">
            <ShieldAlert size={18} className="text-yellow-400" />
          </div>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        {statsLoading ? (
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24 bg-white/5 rounded-2xl" />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
              <Users size={16} className="text-blue-400 mb-2" />
              <p className="text-2xl font-black text-white">{stats?.totalUsers ?? 0}</p>
              <p className="text-xs text-gray-400">Usuarios totales</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
              <ShoppingBag size={16} className="text-yellow-400 mb-2" />
              <p className="text-2xl font-black text-yellow-400">{stats?.ordersToday ?? 0}</p>
              <p className="text-xs text-gray-400">Pedidos hoy</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
              <Bike size={16} className="text-green-400 mb-2" />
              <p className="text-2xl font-black text-green-400">{stats?.activeDrivers ?? 0}</p>
              <p className="text-xs text-gray-400">Drivers activos</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
              <TrendingUp size={16} className="text-purple-400 mb-2" />
              <p className="text-2xl font-black text-purple-400">{formatDOP(stats?.revenueToday ?? 0)}</p>
              <p className="text-xs text-gray-400">Facturado hoy</p>
            </div>
          </div>
        )}

        {stats && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-3">Esta semana</h3>
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center">
                <p className="text-xl font-black text-yellow-400">{stats.totalOrders ?? 0}</p>
                <p className="text-xs text-gray-400">Pedidos totales</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-black text-green-400">{formatDOP(stats.revenueWeek ?? 0)}</p>
                <p className="text-xs text-gray-400">Ingresos semana</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-black text-blue-400">{stats.totalBusinesses ?? 0}</p>
                <p className="text-xs text-gray-400">Negocios</p>
              </div>
            </div>
          </div>
        )}

        <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Gestión</h2>
        <div className="grid grid-cols-2 gap-3">
          <Link href="/admin/users">
            <div className="bg-yellow-400/10 border border-yellow-400/30 rounded-2xl p-4 text-center hover:bg-yellow-400/20 transition cursor-pointer">
              <Users size={24} className="text-yellow-400 mx-auto mb-2" />
              <p className="font-bold text-yellow-400 text-sm">Usuarios</p>
            </div>
          </Link>
          <Link href="/admin/businesses">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center hover:border-yellow-400/30 transition cursor-pointer">
              <Building2 size={24} className="text-gray-300 mx-auto mb-2" />
              <p className="font-bold text-gray-300 text-sm">Negocios</p>
            </div>
          </Link>
          <Link href="/admin/drivers">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center hover:border-yellow-400/30 transition cursor-pointer">
              <Bike size={24} className="text-gray-300 mx-auto mb-2" />
              <p className="font-bold text-gray-300 text-sm">Drivers</p>
            </div>
          </Link>
          <Link href="/admin/orders">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center hover:border-yellow-400/30 transition cursor-pointer">
              <ShoppingBag size={24} className="text-gray-300 mx-auto mb-2" />
              <p className="font-bold text-gray-300 text-sm">Pedidos</p>
            </div>
          </Link>
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Últimos usuarios</h2>
            <Link href="/admin/users">
              <span className="text-xs text-yellow-400 font-bold">Ver todos →</span>
            </Link>
          </div>
          <div className="space-y-2">
            {recentUsers?.map((u) => (
              <div key={u.id} data-testid={`user-${u.id}`} className="bg-white/5 border border-white/10 rounded-xl p-3 flex items-center justify-between">
                <div>
                  <p className="font-bold text-sm text-white">{u.name}</p>
                  <p className="text-xs text-gray-400">{u.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  {u.isBanned && <Badge className="bg-red-400/20 text-red-400 border-red-400/40 text-xs">Baneado</Badge>}
                  <Badge className={`border text-xs ${ROLE_COLORS[u.role] ?? "bg-gray-400/20 text-gray-400"}`}>{u.role}</Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
