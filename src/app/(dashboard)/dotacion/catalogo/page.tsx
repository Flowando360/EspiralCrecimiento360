import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { getPerfilActual } from '@/lib/supabase/get-perfil-actual';
import { redirect } from 'next/navigation';
import { CatalogoDotacion } from '@/components/dotacion/catalogo-dotacion';
import { KitPorCargo } from '@/components/dotacion/kit-por-cargo';
import { ArrowLeft, Package } from 'lucide-react';

export default async function CatalogoDotacionPage() {
  const perfil = await getPerfilActual();
  if (!perfil) return null;
  if (perfil.rol !== 'admin_th') redirect('/dotacion');

  const supabase = createClient();
  const [{ data: articulos }, { data: cargos }, { data: kits }] = await Promise.all([
    supabase
      .from('dotacion_catalogo_articulos')
      .select('id, categoria, nombre, referencia, requiere_talla, activo, es_vestuario_calzado, tallas:dotacion_catalogo_tallas(id, talla, stock_disponible, stock_minimo)')
      .eq('empresa_id', perfil.empresa_id)
      .order('categoria')
      .order('nombre'),
    supabase.from('cargos').select('id, nombre').eq('empresa_id', perfil.empresa_id).eq('activo', true).order('nombre'),
    supabase.from('dotacion_kit_cargo').select('id, cargo_id, articulo_id, cantidad').eq('empresa_id', perfil.empresa_id),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <Link href="/administracion/dotaciones" className="inline-flex items-center gap-1 text-xs text-marmol-400 hover:text-marmol-600 mb-2">
          <ArrowLeft size={12} /> Volver a Dotaciones
        </Link>
        <h1 className="font-display text-2xl font-semibold text-secundario flex items-center gap-2">
          <Package size={22} className="text-flow-600" /> Catálogo de dotación
        </h1>
        <p className="text-sm text-marmol-500 mt-1">
          Artículos que la empresa maneja en bodega, con existencias por talla. Al registrar una entrega
          desde el catálogo, el stock baja solo; al recibir compra de proveedor, sube.
        </p>
      </div>

      <CatalogoDotacion articulosIniciales={(articulos ?? []) as any} />

      <KitPorCargo
        cargos={(cargos ?? []) as { id: string; nombre: string }[]}
        articulos={(articulos ?? []).map((a: any) => ({ id: a.id, nombre: a.nombre, categoria: a.categoria, referencia: a.referencia ?? null }))}
        kitsIniciales={(kits ?? []) as { id: string; cargo_id: string; articulo_id: string; cantidad: number }[]}
      />
    </div>
  );
}
