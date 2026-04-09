import { Link } from "wouter";
import { useAdminListBusinesses, getAdminListBusinessesQueryKey, useAdminToggleBusiness } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Star, ToggleLeft, ToggleRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function AdminBusinesses() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: businesses, isLoading } = useAdminListBusinesses({
    query: { queryKey: getAdminListBusinessesQueryKey() }
  });

  const toggleBusiness = useAdminToggleBusiness({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getAdminListBusinessesQueryKey() });
        toast({ title: "Estado actualizado" });
      },
    }
  });

  const CATEGORY_ICONS: Record<string, string> = {
    food: "🍔", supermarket: "🛒", pharmacy: "💊", liquor: "🍾"
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="bg-black border-b border-yellow-400/20 px-4 py-4 flex items-center gap-3 sticky top-0 z-10">
        <Link href="/admin">
          <button className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition">
            <ArrowLeft size={18} />
          </button>
        </Link>
        <h1 className="text-xl font-black text-yellow-400">Negocios</h1>
        {businesses && <Badge className="ml-auto bg-white/10 text-gray-300 border-0">{businesses.length}</Badge>}
      </div>

      <div className="px-4 py-4">
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 bg-white/5 rounded-xl" />)}
          </div>
        ) : (
          <div className="space-y-3">
            {businesses?.map((biz) => (
              <div key={biz.id} data-testid={`biz-${biz.id}`} className="bg-white/5 border border-white/10 rounded-2xl p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{CATEGORY_ICONS[biz.category] ?? "🏪"}</span>
                    <div>
                      <p className="font-black text-white">{biz.name}</p>
                      <p className="text-xs text-gray-400">{biz.address}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-yellow-400 text-sm">
                    <Star size={12} fill="currentColor" />
                    <span className="font-bold">{biz.rating?.toFixed(1)}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-3">
                  <Badge className={`text-xs border ${biz.isOpen ? "bg-green-400/20 text-green-400 border-green-400/40" : "bg-gray-400/20 text-gray-400 border-gray-400/30"}`}>
                    {biz.isOpen ? "Abierto" : "Cerrado"}
                  </Badge>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => toggleBusiness.mutate({ businessId: biz.id })}
                    disabled={toggleBusiness.isPending}
                    className="border-yellow-400/30 text-yellow-400 hover:bg-yellow-400/10 h-8 text-xs"
                  >
                    {biz.isOpen ? <ToggleRight size={14} className="mr-1" /> : <ToggleLeft size={14} className="mr-1" />}
                    {biz.isOpen ? "Cerrar" : "Abrir"}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
