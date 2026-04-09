import { Link } from "wouter";
import { useAdminListDrivers, getAdminListDriversQueryKey, useAdminLockDriver } from "@workspace/api-client-react";
import { formatDOP } from "@/lib/auth";
import { useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Star, Lock, Unlock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function AdminDrivers() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: drivers, isLoading } = useAdminListDrivers({
    query: { queryKey: getAdminListDriversQueryKey() }
  });

  const lockDriver = useAdminLockDriver({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getAdminListDriversQueryKey() });
        toast({ title: "Driver actualizado" });
      },
    }
  });

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="bg-black border-b border-yellow-400/20 px-4 py-4 flex items-center gap-3 sticky top-0 z-10">
        <Link href="/admin">
          <button className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition">
            <ArrowLeft size={18} />
          </button>
        </Link>
        <h1 className="text-xl font-black text-yellow-400">Drivers</h1>
        {drivers && <Badge className="ml-auto bg-white/10 text-gray-300 border-0">{drivers.length}</Badge>}
      </div>

      <div className="px-4 py-4">
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-28 bg-white/5 rounded-xl" />)}
          </div>
        ) : (
          <div className="space-y-3">
            {drivers?.map((driver) => (
              <div key={driver.id} data-testid={`driver-${driver.id}`} className="bg-white/5 border border-white/10 rounded-2xl p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-yellow-400/20 flex items-center justify-center text-xl">🛵</div>
                    <div>
                      <p className="font-black text-white">{driver.user?.name ?? "Driver"}</p>
                      <p className="text-xs text-gray-400">{driver.user?.email}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <div className={`w-2 h-2 rounded-full ${driver.isOnline ? "bg-green-400 animate-pulse" : "bg-gray-500"}`} />
                        <span className="text-xs text-gray-400">{driver.isOnline ? "Online" : "Offline"}</span>
                        {driver.isLocked && <Badge className="bg-red-400/20 text-red-400 border-red-400/40 text-xs ml-1">Bloqueado</Badge>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-yellow-400">
                    <Star size={12} fill="currentColor" />
                    <span className="text-sm font-bold">{driver.rating?.toFixed(1)}</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 mb-3">
                  <div className="text-center bg-white/5 rounded-lg p-2">
                    <p className="text-sm font-black text-white">{driver.totalDeliveries ?? 0}</p>
                    <p className="text-xs text-gray-400">Entregas</p>
                  </div>
                  <div className="text-center bg-white/5 rounded-lg p-2">
                    <p className="text-sm font-black text-yellow-400">{formatDOP(driver.cashBalance ?? 0)}</p>
                    <p className="text-xs text-gray-400">Efectivo</p>
                  </div>
                  <div className="text-center bg-white/5 rounded-lg p-2">
                    <p className="text-sm font-black text-green-400">{formatDOP(driver.walletBalance ?? 0)}</p>
                    <p className="text-xs text-gray-400">Billetera</p>
                  </div>
                </div>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => lockDriver.mutate({ driverId: driver.id, data: { isLocked: !driver.isLocked } })}
                  disabled={lockDriver.isPending}
                  className={`w-full h-8 text-xs font-bold gap-1 ${driver.isLocked ? "border-green-400/50 text-green-400 hover:bg-green-400/10" : "border-red-400/50 text-red-400 hover:bg-red-400/10"}`}
                >
                  {driver.isLocked ? <><Unlock size={12} /> Desbloquear</> : <><Lock size={12} /> Bloquear</>}
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
