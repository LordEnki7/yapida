import { Link } from "wouter";
import { useGetMyDriver, getGetMyDriverQueryKey, useUpdateDriverStatus, useGetDriverStats, getGetDriverStatsQueryKey } from "@workspace/api-client-react";
import { getStoredUser, formatDOP } from "@/lib/auth";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Zap, Wallet, Package, TrendingUp, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const CASH_LIMIT = 10000;
const CASH_WARNING = 8000;

export default function DriverDashboard() {
  const user = getStoredUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: driver, isLoading: driverLoading } = useGetMyDriver({
    query: { queryKey: getGetMyDriverQueryKey() }
  });

  const { data: stats } = useGetDriverStats({
    query: { queryKey: getGetDriverStatsQueryKey() }
  });

  const updateStatus = useUpdateDriverStatus({
    mutation: {
      onSuccess: (d) => {
        queryClient.invalidateQueries({ queryKey: getGetMyDriverQueryKey() });
        toast({ title: d.isOnline ? "¡Estás en línea!" : "Estás offline" });
      },
      onError: (e: any) => {
        toast({ title: "Error", description: e?.message || "No se pudo actualizar", variant: "destructive" });
      }
    }
  });

  const toggleOnline = () => {
    if (!driver) return;
    updateStatus.mutate({ isOnline: !driver.isOnline });
  };

  if (driverLoading) return (
    <div className="min-h-screen bg-black p-4 space-y-4">
      <Skeleton className="h-32 bg-white/5 rounded-2xl" />
      <Skeleton className="h-24 bg-white/5 rounded-2xl" />
    </div>
  );

  const cashWarning = (driver?.cashBalance ?? 0) >= CASH_WARNING;
  const cashLocked = (driver?.cashBalance ?? 0) >= CASH_LIMIT;

  return (
    <div className="min-h-screen bg-black text-white pb-8">
      {/* Header */}
      <div className="bg-black border-b border-yellow-400/20 px-4 py-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-widest">Driver Panel</p>
            <h1 className="text-2xl font-black text-yellow-400">Que Lo Que 🛵</h1>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400">{user?.name}</p>
            <div className="flex items-center gap-1">
              <div className={`w-2 h-2 rounded-full ${driver?.isOnline ? "bg-green-400 animate-pulse" : "bg-gray-500"}`} />
              <span className="text-xs font-bold">{driver?.isOnline ? "Online" : "Offline"}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* Cash warning banner */}
        {cashWarning && (
          <div className={`flex items-center gap-3 p-4 rounded-2xl border ${cashLocked ? "bg-red-500/20 border-red-500/50" : "bg-yellow-400/10 border-yellow-400/40"}`}>
            <AlertTriangle size={20} className={cashLocked ? "text-red-400" : "text-yellow-400"} />
            <div>
              <p className={`font-black text-sm ${cashLocked ? "text-red-400" : "text-yellow-400"}`}>
                {cashLocked ? "CUENTA BLOQUEADA" : "Límite de efectivo"}
              </p>
              <p className="text-xs text-gray-400">
                {cashLocked ? "Llevas más de RD$ 10,000 en efectivo. Deposita para reactivarte." : `Llevas ${formatDOP(driver?.cashBalance ?? 0)} en efectivo. Deposita pronto.`}
              </p>
            </div>
          </div>
        )}

        {/* Online toggle */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center">
          <p className="text-gray-400 text-sm mb-4">
            {driver?.isOnline ? "Estás recibiendo pedidos" : "Actívate para recibir pedidos"}
          </p>
          <button
            onClick={toggleOnline}
            disabled={updateStatus.isPending || (cashLocked && !driver?.isOnline)}
            className={`w-32 h-32 rounded-full border-4 font-black text-lg transition-all shadow-[0_0_30px] ${
              driver?.isOnline
                ? "bg-green-400 border-green-300 text-black shadow-green-400/30 hover:bg-green-300"
                : "bg-white/5 border-yellow-400/40 text-yellow-400 shadow-transparent hover:border-yellow-400 hover:shadow-yellow-400/20"
            } disabled:opacity-50`}
          >
            {driver?.isOnline ? "ACTIVO" : "INACTIVO"}
          </button>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp size={16} className="text-yellow-400" />
              <span className="text-xs text-gray-400 font-bold uppercase">Hoy</span>
            </div>
            <p className="text-2xl font-black text-yellow-400">{formatDOP(stats?.earningsToday ?? 0)}</p>
            <p className="text-xs text-gray-400">{stats?.deliveriesToday ?? 0} entregas</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Wallet size={16} className="text-green-400" />
              <span className="text-xs text-gray-400 font-bold uppercase">Billetera</span>
            </div>
            <p className="text-2xl font-black text-green-400">{formatDOP(driver?.walletBalance ?? 0)}</p>
            <p className="text-xs text-gray-400">Balance disponible</p>
          </div>
        </div>

        {/* Gamification: delivery streak */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Zap size={16} className="text-yellow-400" />
              <span className="text-sm font-bold text-white">Streak de entregas</span>
            </div>
            <Badge className="bg-yellow-400/20 text-yellow-400 border-yellow-400/40 text-xs">
              {driver?.totalDeliveries ?? 0} total
            </Badge>
          </div>
          <Progress value={stats?.bonusProgress ?? 0} className="h-3 mb-2 bg-white/10" />
          <p className="text-xs text-gray-400">
            {stats?.currentStreak ?? 0}/10 entregas → próximo bono <span className="text-yellow-400 font-bold">+{formatDOP(500)}</span>
          </p>
        </div>

        {/* Quick links */}
        <div className="grid grid-cols-2 gap-3">
          <Link href="/driver/jobs">
            <div className="bg-yellow-400/10 border border-yellow-400/30 rounded-2xl p-4 text-center hover:bg-yellow-400/20 transition cursor-pointer">
              <Package size={24} className="text-yellow-400 mx-auto mb-2" />
              <p className="font-bold text-yellow-400 text-sm">Ver pedidos</p>
            </div>
          </Link>
          <Link href="/driver/wallet">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center hover:border-yellow-400/30 transition cursor-pointer">
              <Wallet size={24} className="text-gray-300 mx-auto mb-2" />
              <p className="font-bold text-gray-300 text-sm">Mi billetera</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
