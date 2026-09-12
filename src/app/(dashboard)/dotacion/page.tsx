import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { getPerfilActual } from '@/lib/supabase/get-perfil-actual';
import { ListaDotacion } from '@/components/dotacion/lista-dotacion';
import { FormularioEntrega } from '@/components/dotacion/formulario-entrega';
import { Shirt, Package, FileBarChart } from 'lucide-react';

export default async function DotacionPage({ searchParams }: { searchParams?: { colaborador_id?: string } }) {
  const perfil = await getPerfilActual();
  if (!perfil) return null;

  const supabase = createClient();

  let query = supabase
    .from('dotacion_entregas')
    .select(
      'id, categoria, nombre_elemento, talla, cantidad, fecha_entrega, fecha_vencimiento, estado, firma_confirmada, firmado_en, acta_firmada_url, colaborador:colaboradores(id, nombre_completo)'
    )
    .eq('empresa_id', perfil.empresa_id)
    .order('fecha_entrega', { ascending: false });

  if (searchParams?.colaborador_id) query = query.eq('colaborador_id', searchParams.colaborador_id);

  const { data: entregas } = await query;

  const colaboradorFiltrado = searchParams?.colaborador_id
    ? (await supabase.from('colaboradores').select('nombre_completo').eq('id', searchParams.colaborador_id).maybeSingle()).data
    : null;

  const [colaboradoresParaForm, articulosCatalogo] =
    perfil.rol === 'admin_th'
      ? await Promise.all([
          supabase
            .from('colaboradores')
            .select('id, nombre_completo')
            .eq('empresa_id', perfil.empresa_id)
            .eq('estado', 'activo')
            .order('nombre_completo')
            .then((r) => r.data ?? []),
          supabase
            .from('dotacion_catalogo_articulos')
            .select('id, categoria, nombre, requiere_talla, tallas:dotacion_catalogo_tallas(id, talla, stock_disponible)')
            .eq('empresa_id', perfil.empresa_id)
            .eq('activo', true)
            .order('categoria')
            .then((r) => (r.data ?? []) as any),
        ])
      : [[], []];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold text-secundario flex items-center gap-2">
            <Shirt size={22} className="text-flow-600" /> Gestión de Dotaciones
          </h1>
          <p className="text-sm text-marmol-500 mt-1">
            Elementos personales (uniformes, EPP) y equipos de trabajo entregados a cada colaborador, con
            constancia de entrega y alertas de vencimiento.
            {perfil.rol === 'colaborador' && ' Confirma aquí lo que ya recibiste.'}
          </p>
        </div>
        {perfil.rol === 'admin_th' && (
          <div className="flex gap-2 shrink-0">
            <Link href="/dotacion/catalogo" className="inline-flex items-center gap-1.5 rounded-lg border border-marmol-200 hover:bg-marmol-50 text-marmol-700 text-sm font-medium px-3 py-2 transition">
              <Package size={15} /> Catálogo e inventario
            </Link>
            <Link href="/dotacion/reporte" className="inline-flex items-center gap-1.5 rounded-lg border border-marmol-200 hover:bg-marmol-50 text-marmol-700 text-sm font-medium px-3 py-2 transition">
              <FileBarChart size={15} /> Reporte de consumo
            </Link>
          </div>
        )}
      </div>

      {perfil.rol === 'admin_th' && <FormularioEntrega colaboradores={colaboradoresParaForm} articulosCatalogo={articulosCatalogo} />}

      {colaboradorFiltrado && (
        <div className="flex items-center justify-between rounded-lg bg-flow-50 border border-flow-100 px-3 py-2 text-sm">
          <span className="text-flow-700">
            Historial de dotación de <strong>{colaboradorFiltrado.nombre_completo}</strong> ({entregas?.length ?? 0} entrega
            {(entregas?.length ?? 0) === 1 ? '' : 's'})
          </span>
          <Link href="/dotacion" className="text-xs text-flow-600 hover:underline">
            Ver todas
          </Link>
        </div>
      )}

      <ListaDotacion entregas={(entregas ?? []) as any} rol={perfil.rol} miColaboradorId={perfil.colaborador_id} />
    </div>
  );
}
