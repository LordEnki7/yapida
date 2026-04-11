import { useState } from "react";
import { Link } from "wouter";
import { useGetMe, getGetMeQueryKey } from "@workspace/api-client-react";
import { getStoredUser, clearStoredUser, formatDOP } from "@/lib/auth";
import { useLang } from "@/lib/lang";
import LangToggle from "@/components/LangToggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, User, Phone, Mail, MapPin, LogOut, Edit2, Check, X } from "lucide-react";

export default function CustomerProfile() {
  const { t } = useLang();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const storedUser = getStoredUser();

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);

  const { data: me, isLoading } = useGetMe({
    query: { queryKey: getGetMeQueryKey() }
  });

  const startEdit = () => {
    setName(me?.name ?? storedUser?.name ?? "");
    setPhone(me?.phone ?? "");
    setEditing(true);
  };

  const cancelEdit = () => setEditing(false);

  const saveProfile = async () => {
    if (!name.trim() || name.trim().length < 2) {
      toast({ title: "Error", description: "El nombre debe tener al menos 2 caracteres", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/auth/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name: name.trim(), phone: phone.trim() || undefined }),
      });
      if (!res.ok) throw new Error();
      const updated = await res.json();
      const current = getStoredUser();
      if (current) {
        const { setStoredUser } = await import("@/lib/auth");
        setStoredUser({ ...current, name: updated.name });
      }
      queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
      setEditing(false);
      toast({ title: "¡Listo!", description: "Perfil actualizado" });
    } catch {
      toast({ title: "Error", description: "No se pudo actualizar el perfil", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    clearStoredUser();
    window.location.href = "/";
  };

  const displayName = me?.name ?? storedUser?.name ?? "—";
  const displayEmail = me?.email ?? storedUser?.email ?? "—";
  const displayPhone = me?.phone ?? "—";

  return (
    <div className="min-h-screen bg-background text-white pb-24">
      <div className="bg-background border-b border-yellow-400/20 px-4 py-4 flex items-center gap-3 sticky top-0 z-10">
        <Link href="/customer">
          <button className="w-9 h-9 rounded-full bg-white/8 flex items-center justify-center hover:bg-white/10 transition">
            <ArrowLeft size={18} />
          </button>
        </Link>
        <h1 className="text-xl font-black text-yellow-400">Mi Perfil</h1>
        <div className="ml-auto">
          <LangToggle />
        </div>
      </div>

      <div className="px-4 py-6 space-y-4">

        {/* Avatar + Name */}
        <div className="flex flex-col items-center gap-3 pb-4">
          <div className="w-20 h-20 rounded-full bg-yellow-400/20 border-2 border-yellow-400/40 flex items-center justify-center text-4xl">
            👤
          </div>
          {isLoading ? (
            <Skeleton className="h-6 w-32 bg-white/8" />
          ) : (
            <p className="text-xl font-black text-white">{displayName}</p>
          )}
          <span className="text-xs text-yellow-400 bg-yellow-400/10 border border-yellow-400/20 px-3 py-1 rounded-full font-bold uppercase tracking-widest">
            {storedUser?.role ?? "cliente"}
          </span>
        </div>

        {/* Info Card */}
        <div className="bg-white/8 border border-white/10 rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-4 pt-4 pb-2">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Información</h2>
            {!editing ? (
              <button onClick={startEdit} className="flex items-center gap-1 text-yellow-400 text-xs font-bold hover:text-yellow-300 transition">
                <Edit2 size={12} /> Editar
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button onClick={cancelEdit} className="text-gray-400 hover:text-white transition">
                  <X size={16} />
                </button>
                <button
                  onClick={saveProfile}
                  disabled={saving}
                  className="flex items-center gap-1 text-green-400 text-xs font-bold hover:text-green-300 transition"
                >
                  <Check size={14} /> {saving ? "Guardando..." : "Guardar"}
                </button>
              </div>
            )}
          </div>

          <div className="px-4 pb-4 space-y-3">
            {editing ? (
              <>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Nombre</label>
                  <Input
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="bg-white/8 border-white/10 text-white focus:border-yellow-400 h-10"
                    placeholder="Tu nombre"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Teléfono</label>
                  <Input
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="bg-white/8 border-white/10 text-white focus:border-yellow-400 h-10"
                    placeholder="Ej: 809-555-1234"
                    type="tel"
                  />
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-white/8 flex items-center justify-center flex-shrink-0">
                    <User size={14} className="text-yellow-400" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Nombre</p>
                    <p className="text-sm font-bold text-white">{isLoading ? "—" : displayName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-white/8 flex items-center justify-center flex-shrink-0">
                    <Mail size={14} className="text-yellow-400" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Correo</p>
                    <p className="text-sm font-bold text-white">{isLoading ? "—" : displayEmail}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-white/8 flex items-center justify-center flex-shrink-0">
                    <Phone size={14} className="text-yellow-400" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Teléfono</p>
                    <p className="text-sm font-bold text-white">{isLoading ? "—" : displayPhone}</p>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Quick links */}
        <div className="bg-white/8 border border-white/10 rounded-2xl overflow-hidden divide-y divide-white/5">
          <Link href="/customer/orders">
            <div className="flex items-center justify-between px-4 py-3 hover:bg-white/5 transition cursor-pointer">
              <span className="text-sm font-bold text-white">📦 Mis pedidos</span>
              <span className="text-gray-500 text-xs">→</span>
            </div>
          </Link>
          <Link href="/customer/points">
            <div className="flex items-center justify-between px-4 py-3 hover:bg-white/5 transition cursor-pointer">
              <span className="text-sm font-bold text-white">⭐ Mis puntos</span>
              <span className="text-gray-500 text-xs">→</span>
            </div>
          </Link>
        </div>

        {/* Logout */}
        <Button
          variant="outline"
          className="w-full border-red-500/40 text-red-400 hover:bg-red-500/10 hover:text-red-300 font-bold gap-2 h-12"
          onClick={handleLogout}
        >
          <LogOut size={16} />
          Cerrar sesión
        </Button>
      </div>
    </div>
  );
}
