import { useState } from "react";
import { Link } from "wouter";
import { useGetMyBusiness, getGetMyBusinessQueryKey, useListProducts, getListProductsQueryKey, useCreateProduct, useUpdateProduct, useDeleteProduct } from "@workspace/api-client-react";
import { formatDOP } from "@/lib/auth";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Plus, Pencil, Trash2, Package } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ProductForm {
  name: string;
  description: string;
  price: string;
  category: string;
  imageUrl: string;
  isAvailable: boolean;
}

const EMPTY_FORM: ProductForm = { name: "", description: "", price: "", category: "", imageUrl: "", isAvailable: true };

export default function BusinessMenu() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [showDialog, setShowDialog] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<ProductForm>(EMPTY_FORM);

  const { data: business } = useGetMyBusiness({ query: { queryKey: getGetMyBusinessQueryKey() } });
  const { data: products, isLoading } = useListProducts(
    business?.id ?? 0,
    { query: { enabled: !!business?.id, queryKey: getListProductsQueryKey(business?.id ?? 0) } }
  );

  const createProduct = useCreateProduct({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListProductsQueryKey(business?.id ?? 0) });
        setShowDialog(false);
        setForm(EMPTY_FORM);
        toast({ title: "Producto creado" });
      },
    }
  });

  const updateProduct = useUpdateProduct({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListProductsQueryKey(business?.id ?? 0) });
        setShowDialog(false);
        setEditingId(null);
        setForm(EMPTY_FORM);
        toast({ title: "Producto actualizado" });
      },
    }
  });

  const deleteProduct = useDeleteProduct({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListProductsQueryKey(business?.id ?? 0) });
        toast({ title: "Producto eliminado" });
      },
    }
  });

  const handleSave = () => {
    const data = {
      name: form.name,
      description: form.description || undefined,
      price: parseFloat(form.price),
      category: form.category || undefined,
      imageUrl: form.imageUrl || undefined,
      isAvailable: form.isAvailable,
    };

    if (editingId) {
      updateProduct.mutate({ productId: editingId, data });
    } else {
      if (!business?.id) return;
      createProduct.mutate({ businessId: business.id, data });
    }
  };

  const openEdit = (product: any) => {
    setEditingId(product.id);
    setForm({
      name: product.name,
      description: product.description ?? "",
      price: product.price.toString(),
      category: product.category ?? "",
      imageUrl: product.imageUrl ?? "",
      isAvailable: product.isAvailable,
    });
    setShowDialog(true);
  };

  return (
    <div className="min-h-screen bg-black text-white pb-8">
      <div className="bg-black border-b border-yellow-400/20 px-4 py-4 flex items-center gap-3 sticky top-0 z-10">
        <Link href="/business">
          <button className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition">
            <ArrowLeft size={18} />
          </button>
        </Link>
        <h1 className="text-xl font-black text-yellow-400">Mi menú</h1>
        <Button
          size="sm"
          className="ml-auto bg-yellow-400 text-black font-bold hover:bg-yellow-300 gap-1"
          onClick={() => { setEditingId(null); setForm(EMPTY_FORM); setShowDialog(true); }}
          data-testid="button-add-product"
        >
          <Plus size={16} /> Agregar
        </Button>
      </div>

      <div className="px-4 py-4">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 bg-white/5 rounded-xl" />)}
          </div>
        ) : products?.length === 0 ? (
          <div className="text-center py-20">
            <Package size={40} className="mx-auto mb-3 text-gray-500" />
            <p className="text-gray-400 mb-4">No tienes productos todavía</p>
            <Button className="bg-yellow-400 text-black font-bold" onClick={() => setShowDialog(true)}>
              <Plus size={16} className="mr-2" /> Agregar primer producto
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {products?.map((p) => (
              <div key={p.id} data-testid={`product-item-${p.id}`} className="bg-white/5 border border-white/10 rounded-xl p-4 flex gap-3">
                {p.imageUrl && (
                  <img src={p.imageUrl} alt={p.name} className="w-16 h-16 object-cover rounded-lg flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-white">{p.name}</h3>
                    {!p.isAvailable && <Badge className="bg-red-400/20 text-red-400 border-red-400/40 text-xs">Inactivo</Badge>}
                  </div>
                  {p.category && <p className="text-xs text-gray-400">{p.category}</p>}
                  <p className="text-yellow-400 font-black mt-1">{formatDOP(p.price)}</p>
                </div>
                <div className="flex flex-col gap-2">
                  <button onClick={() => openEdit(p)} className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center hover:bg-white/10 transition">
                    <Pencil size={14} className="text-gray-300" />
                  </button>
                  <button
                    onClick={() => deleteProduct.mutate({ productId: p.id })}
                    className="w-8 h-8 rounded-lg bg-red-400/10 flex items-center justify-center hover:bg-red-400/20 transition"
                    disabled={deleteProduct.isPending}
                    data-testid={`delete-product-${p.id}`}
                  >
                    <Trash2 size={14} className="text-red-400" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="bg-black border border-yellow-400/20 text-white">
          <DialogHeader>
            <DialogTitle className="text-yellow-400 font-black">
              {editingId ? "Editar producto" : "Nuevo producto"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              placeholder="Nombre del producto"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-yellow-400"
              data-testid="input-product-name"
            />
            <Textarea
              placeholder="Descripción (opcional)"
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-yellow-400 resize-none"
              rows={2}
            />
            <Input
              placeholder="Precio (RD$)"
              type="number"
              value={form.price}
              onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
              className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-yellow-400"
              data-testid="input-product-price"
            />
            <Input
              placeholder="Categoría (ej: Bebidas)"
              value={form.category}
              onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
              className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-yellow-400"
            />
            <Input
              placeholder="URL de imagen (opcional)"
              value={form.imageUrl}
              onChange={e => setForm(f => ({ ...f, imageUrl: e.target.value }))}
              className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-yellow-400"
            />
            <div className="flex items-center justify-between py-1">
              <span className="text-sm text-gray-300">Disponible</span>
              <Switch
                checked={form.isAvailable}
                onCheckedChange={v => setForm(f => ({ ...f, isAvailable: v }))}
              />
            </div>
            <Button
              className="w-full bg-yellow-400 text-black font-black hover:bg-yellow-300"
              onClick={handleSave}
              disabled={createProduct.isPending || updateProduct.isPending || !form.name || !form.price}
              data-testid="button-save-product"
            >
              {editingId ? "Guardar cambios" : "Crear producto"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
