import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { getPerfilActual } from '@/lib/supabase/get-perfil-actual';
import { redirect } from 'next/navigation';
import { CatalogoDotacion } from '@/components/dotacion/catalogo-dotacion';
import { ArrowLeft, Package } from 'lucide-react';

export default async function CatalogoDotacionPage() {
  const perfil = await getPerfilActual();
  if (!perfil) return null;
  if (perfil.rol !== 'admin_th') redirect('/dotacion');

  const supabase = createClient();
  const { data: articulos } = await supabase
    .from('dotacion_catalogo_articulos')
    .select('id, categoria, nombre, requiere_talla, activo, tallas:dotacion_catalogo_tallas(id, talla, stock_disponible, stock_minimo)')
    .eq('empresa_id', perfil.empresa_id)
    .order('categoria')
    .order('nombre');

  return (
    <div className="space-y-6">
      <div>
        <Link href="/dotacion" className="inline-flex items-center gap-1 text-xs text-marmol-400 hover:text-marmol-600 mb-2">
          <ArrowLeft size={12} /> Volver a Dotación
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
    </div>
  );
}
