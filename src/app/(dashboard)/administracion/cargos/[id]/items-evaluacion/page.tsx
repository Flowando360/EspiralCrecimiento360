import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { getPerfilActual } from '@/lib/supabase/get-perfil-actual';
import { redirect, notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { SeleccionItemsEvaluacion, type GrupoItems } from '@/components/espiral-crecimiento/seleccion-items-evaluacion';

const ETIQUETA_BLOQUE: Record<string, string> = {
  competencias_organizacionales: 'Competencias Organizacionales',
  competencias_funcionales: 'Competencias Funcionales del Cargo',
  competencias_liderazgo: 'Competencias de Liderazgo',
  cultura: 'Cultura',
};

export default async function ItemsEvaluacionCargoPage({ params }: { params: { id: string } }) {
  const perfil = await getPerfilActual();
  if (!perfil) return null;
  if (perfil.rol !== 'admin_th') redirect('/inicio');

  const supabase = createClient();

  const { data: cargo } = await supabase.from('cargos').select('id, nombre, empresa_id, tiene_personal_a_cargo').eq('id', params.id).maybeSingle();
  if (!cargo || cargo.empresa_id !== perfil.empresa_id) notFound();

  const [{ data: competencias }, { data: funciones }, { data: excluidos }] = await Promise.all([
    supabase
      .from('competencias')
      .select('id, nombre, bloque, peso_relativo, solo_con_personal_a_cargo')
      .eq('empresa_id', perfil.empresa_id)
      .eq('activo', true)
      .not('bloque', 'is', null)
      .order('orden'),
    supabase.from('cargo_funciones_principales').select('id, funcion, resultado_esperado').eq('cargo_id', params.id).order('orden'),
    supabase.from('cargo_items_evaluacion_excluidos').select('competencia_id, cargo_funcion_id').eq('cargo_id', params.id),
  ]);

  const competenciasAplicables = (competencias ?? []).filter((c) => !c.solo_con_personal_a_cargo || cargo.tiene_personal_a_cargo);
  const idsExcluidosCompetencia = new Set((excluidos ?? []).map((e) => e.competencia_id).filter(Boolean));
  const idsExcluidosFuncion = new Set((excluidos ?? []).map((e) => e.cargo_funcion_id).filter(Boolean));

  const gruposCompetencias: GrupoItems[] = (['competencias_organizacionales', 'competencias_funcionales', 'competencias_liderazgo', 'cultura'] as const)
    .map((bloque) => ({
      bloque,
      titulo: ETIQUETA_BLOQUE[bloque] ?? bloque,
      items: competenciasAplicables
        .filter((c) => c.bloque === bloque)
        .map((c) => ({
          id: c.id,
          tipo: 'competencia' as const,
          nombre: c.nombre,
          detalle: c.peso_relativo && c.peso_relativo !== 1 ? `Peso ${c.peso_relativo}×` : null,
          incluido: !idsExcluidosCompetencia.has(c.id),
        })),
    }))
    .filter((g) => g.items.length > 0);

  const grupoFunciones: GrupoItems | null =
    funciones && funciones.length > 0
      ? {
          bloque: 'roles_y_funciones',
          titulo: 'Roles y Funciones (del perfil de cargo)',
          items: funciones.map((f) => ({
            id: f.id,
            tipo: 'funcion' as const,
            nombre: f.funcion,
            detalle: f.resultado_esperado,
            incluido: !idsExcluidosFuncion.has(f.id),
          })),
        }
      : null;

  const grupos = grupoFunciones ? [...gruposCompetencias, grupoFunciones] : gruposCompetencias;
  const totalItems = grupos.reduce((acc, g) => acc + g.items.length, 0);
  const totalIncluidos = grupos.reduce((acc, g) => acc + g.items.filter((i) => i.incluido).length, 0);

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <Link
          href={`/administracion/cargos/${params.id}`}
          className="inline-flex items-center gap-1 text-xs text-marmol-400 hover:text-marmol-600 mb-2"
        >
          <ArrowLeft size={12} /> Volver a {cargo.nombre}
        </Link>
        <h1 className="font-display text-2xl font-semibold text-secundario">Ítems a evaluar</h1>
        <p className="text-sm text-marmol-500 mt-1">
          Marca los ítems del perfil que se incluirán al generar los Encuentros de Crecimiento de este cargo. Si
          no cambias nada, se incluyen todos por defecto.
        </p>
      </div>

      <SeleccionItemsEvaluacion cargoId={params.id} grupos={grupos} totalItems={totalItems} totalIncluidos={totalIncluidos} />
    </div>
  );
}
