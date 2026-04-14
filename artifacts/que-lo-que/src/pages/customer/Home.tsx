import { useState } from "react";
import { Link } from "wouter";
import { useListBusinesses, getListBusinessesQueryKey, useGetMyPoints, getGetMyPointsQueryKey } from "@workspace/api-client-react";
import { getStoredUser } from "@/lib/auth";
import { useLang } from "@/lib/lang";
import LangToggle from "@/components/LangToggle";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Star, Clock, ChevronLeft } from "lucide-react";
import NotificationBell from "@/components/NotificationBell";

const CATEGORIES = [
  {
    key: "food",
    label: "Restaurantes",
    labelEn: "Restaurants",
    emoji: "🍔",
    gradient: "from-orange-900/90 via-orange-800/70 to-transparent",
    bg: "bg-orange-950",
    accent: "#f97316",
  },
  {
    key: "supermarket",
    label: "Supermercado",
    labelEn: "Supermarket",
    emoji: "🛒",
    gradient: "from-green-900/90 via-green-800/70 to-transparent",
    bg: "bg-green-950",
    accent: "#22c55e",
  },
  {
    key: "pharmacy",
    label: "Farmacia",
    labelEn: "Pharmacy",
    emoji: "💊",
    gradient: "from-blue-900/90 via-blue-800/70 to-transparent",
    bg: "bg-blue-950",
    accent: "#3b82f6",
  },
  {
    key: "liquor",
    label: "Licorería",
    labelEn: "Liquor Store",
    emoji: "🍾",
    gradient: "from-purple-900/90 via-purple-800/70 to-transparent",
    bg: "bg-purple-950",
    accent: "#a855f7",
  },
];

export default function CustomerHome() {
  const user = getStoredUser();
  const { t, lang } = useLang();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const { data: pointsData } = useGetMyPoints({
    query: { queryKey: getGetMyPointsQueryKey() }
  });

  const { data: businesses, isLoading } = useListBusinesses(
    { category: (selectedCategory ?? "all") as any, search: search || undefined },
    {
      query: {
        enabled: !!selectedCategory || !!search,
        queryKey: getListBusinessesQueryKey({ category: (selectedCategory ?? "all") as any, search: search || undefined })
      }
    }
  );

  const currentCat = CATEGORIES.find(c => c.key === selectedCategory);

  return (
    <div className="min-h-screen bg-background text-white">
      {/* Header */}
      <div className="bg-background border-b border-yellow-400/20 px-4 py-3 sticky top-0 z-10">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            {selectedCategory && (
              <button
                onClick={() => { setSelectedCategory(null); setSearch(""); }}
                className="w-8 h-8 rounded-full bg-white/8 flex items-center justify-center hover:bg-white/12 transition"
              >
                <ChevronLeft size={16} />
              </button>
            )}
            <img src="/logo.png" alt="Que Lo Que" className="h-9 w-auto object-contain" />
            {!selectedCategory && (
              <p className="text-sm font-black text-yellow-400 leading-tight">
                {t.greeting(user?.name?.split(" ")[0] || (lang === "es" ? "bicho" : "friend"))}
              </p>
            )}
            {selectedCategory && (
              <p className="text-base font-black text-white">
                {lang === "es" ? currentCat?.label : currentCat?.labelEn}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <NotificationBell />
            <LangToggle />
            <Link href="/customer/orders">
              <div className="w-9 h-9 rounded-full bg-yellow-400/10 border border-yellow-400/30 flex items-center justify-center cursor-pointer hover:bg-yellow-400/20 transition">
                <Clock size={16} className="text-yellow-400" />
              </div>
            </Link>
          </div>
        </div>

        {/* Search — always visible */}
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder={selectedCategory ? "Buscar en esta categoría..." : t.searchPlaceholder}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              if (e.target.value && !selectedCategory) setSelectedCategory("all");
            }}
            className="pl-9 bg-white/8 border-white/10 text-white placeholder:text-gray-500 focus:border-yellow-400 h-10 text-sm"
          />
        </div>
      </div>

      <div className="pb-8">
        {/* Points bar */}
        {!selectedCategory && !search && (pointsData?.points ?? 0) >= 0 && (
          <div className="px-4 pt-3">
            <Link href="/customer/points">
              <div className="flex items-center gap-3 bg-yellow-400/10 border border-yellow-400/30 rounded-2xl px-4 py-3 hover:bg-yellow-400/20 transition cursor-pointer">
                <div className="w-8 h-8 rounded-full bg-yellow-400/20 flex items-center justify-center flex-shrink-0">
                  <Star size={16} className="text-yellow-400" fill="currentColor" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-black text-yellow-400">{pointsData?.points ?? 0} {t.pointsTitle}</p>
                  <div className="h-1.5 bg-white/10 rounded-full mt-1 overflow-hidden">
                    <div
                      className="h-full bg-yellow-400 rounded-full transition-all"
                      style={{ width: `${Math.min(((pointsData?.progress ?? 0) / (pointsData?.nextRewardAt ?? 500)) * 100, 100)}%` }}
                    />
                  </div>
                </div>
                <p className="text-xs text-gray-400 flex-shrink-0">
                  {pointsData ? `${pointsData.progress}/${pointsData.nextRewardAt}` : "0/500"}
                </p>
              </div>
            </Link>
          </div>
        )}

        {/* ─── CATEGORY TILES ─── */}
        {!selectedCategory && !search && (
          <div className="px-4 pt-4 space-y-3">
            <p className="text-xs text-gray-400 uppercase tracking-widest font-bold mb-1">¿Qué tú quieres?</p>
            {CATEGORIES.map((cat) => (
              <button
                key={cat.key}
                onClick={() => setSelectedCategory(cat.key)}
                className={`w-full relative h-28 rounded-2xl overflow-hidden flex items-center justify-between px-6 active:scale-[0.98] transition-transform ${cat.bg}`}
              >
                <div className={`absolute inset-0 bg-gradient-to-r ${cat.gradient}`} />
                <div className="relative z-10 text-left">
                  <p className="text-2xl font-black text-white drop-shadow-lg">
                    {lang === "es" ? cat.label : cat.labelEn}
                  </p>
                  <p className="text-xs mt-1 font-bold" style={{ color: cat.accent }}>Ver negocios →</p>
                </div>
                <span className="relative z-10 text-6xl drop-shadow-2xl">{cat.emoji}</span>
              </button>
            ))}
          </div>
        )}

        {/* ─── BUSINESS LIST ─── */}
        {(selectedCategory || search) && (
          <div className="px-4 pt-4">
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-24 bg-white/8 rounded-2xl" />
                ))}
              </div>
            ) : businesses?.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-4xl mb-3">😤</p>
                <p className="text-gray-400">{t.emptyBusinesses}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {businesses?.map((biz) => (
                  <Link key={biz.id} href={`/customer/business/${biz.id}`}>
                    <div
                      data-testid={`business-card-${biz.id}`}
                      className="flex gap-4 bg-white/5 border border-white/10 rounded-2xl p-3 hover:border-yellow-400/30 hover:bg-white/8 transition-all cursor-pointer active:scale-[0.99]"
                    >
                      {/* Logo */}
                      <div className="w-20 h-20 rounded-xl overflow-hidden bg-yellow-400/10 flex-shrink-0 flex items-center justify-center">
                        {biz.imageUrl ? (
                          <img
                            src={biz.imageUrl}
                            alt={biz.name}
                            className={`w-full h-full object-cover ${biz.isOpen === false ? "grayscale opacity-50" : ""}`}
                          />
                        ) : (
                          <span className="text-3xl">🍽️</span>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0 py-0.5">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-black text-white text-base leading-tight line-clamp-1">{biz.name}</h3>
                          <div className="flex items-center gap-1 bg-yellow-400/15 border border-yellow-400/30 px-2 py-0.5 rounded-lg flex-shrink-0">
                            <Star size={10} className="text-yellow-400" fill="currentColor" />
                            <span className="text-xs font-black text-yellow-400">{biz.rating?.toFixed(1)}</span>
                          </div>
                        </div>
                        {biz.description && (
                          <p className="text-gray-500 text-xs mt-1 line-clamp-1">{biz.description}</p>
                        )}
                        <div className="flex items-center gap-3 mt-2">
                          <div className="flex items-center gap-1 text-gray-400">
                            <Clock size={11} />
                            <span className="text-xs">{biz.deliveryTime ?? 30}–{(biz.deliveryTime ?? 30) + 15} min</span>
                          </div>
                          {biz.isOpen === false ? (
                            <span className="text-[10px] font-black text-red-400 bg-red-400/10 px-2 py-0.5 rounded-full">CERRADO</span>
                          ) : (
                            <span className="text-[10px] font-black text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full">ABIERTO</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
