import { Link } from "wouter";
import { useAdminListUsers, getAdminListUsersQueryKey, useAdminBanUser } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Search, Shield, ShieldOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

const ROLE_LABELS: Record<string, string> = { customer: "Cliente", driver: "Driver", business: "Negocio", admin: "Admin" };
const ROLE_COLORS: Record<string, string> = {
  customer: "bg-blue-400/20 text-blue-400 border-blue-400/40",
  driver: "bg-green-400/20 text-green-400 border-green-400/40",
  business: "bg-purple-400/20 text-purple-400 border-purple-400/40",
  admin: "bg-yellow-400/20 text-yellow-400 border-yellow-400/40",
};

export default function AdminUsers() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [search, setSearch] = useState("");

  const { data: allUsers, isLoading } = useAdminListUsers(
    undefined,
    { query: { queryKey: getAdminListUsersQueryKey() } }
  );

  const users = search
    ? allUsers?.filter(u => u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()))
    : allUsers;

  const banUser = useAdminBanUser({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getAdminListUsersQueryKey() });
        toast({ title: "Usuario baneado" });
      },
    }
  });

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="bg-black border-b border-yellow-400/20 px-4 py-4 sticky top-0 z-10">
        <div className="flex items-center gap-3 mb-3">
          <Link href="/admin">
            <button className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition">
              <ArrowLeft size={18} />
            </button>
          </Link>
          <h1 className="text-xl font-black text-yellow-400">Usuarios</h1>
          {users && <Badge className="ml-auto bg-white/10 text-gray-300 border-0">{users.length}</Badge>}
        </div>
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Buscar por nombre o email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-yellow-400 h-9"
          />
        </div>
      </div>

      <div className="px-4 py-4">
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-20 bg-white/5 rounded-xl" />)}
          </div>
        ) : (
          <div className="space-y-2">
            {users?.map((u) => (
              <div key={u.id} data-testid={`user-row-${u.id}`} className="bg-white/5 border border-white/10 rounded-xl p-3 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-lg flex-shrink-0">
                  {u.role === "driver" ? "🛵" : u.role === "business" ? "🏪" : u.role === "admin" ? "🔧" : "👤"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-sm text-white truncate">{u.name}</p>
                    {u.isBanned && <Badge className="bg-red-400/20 text-red-400 border-red-400/40 text-xs flex-shrink-0">Baneado</Badge>}
                  </div>
                  <p className="text-xs text-gray-400 truncate">{u.email}</p>
                  <Badge className={`border text-xs mt-1 ${ROLE_COLORS[u.role] ?? "bg-gray-400/20 text-gray-400"}`}>{ROLE_LABELS[u.role] ?? u.role}</Badge>
                </div>
                {u.role !== "admin" && !u.isBanned && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-red-400/50 text-red-400 hover:bg-red-400/10 flex-shrink-0 h-8 text-xs gap-1"
                    onClick={() => banUser.mutate({ userId: u.id, data: { isBanned: true } })}
                    disabled={banUser.isPending}
                    data-testid={`ban-${u.id}`}
                  >
                    <ShieldOff size={12} /> Banear
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
