import Link from 'next/link';
import { getPerfilActual } from '@/lib/supabase/get-perfil-actual';
import { createClient } from '@/lib/supabase/server';
import { EmptyState } from '@/components/ui/empty-state';
import { Target, X, ArrowLeft } from 'lucide-react';
import { PdiVista } from '@/components/espiral-crecimiento/pdi-vista';
import { FiltroEquipo } from '@/components/informes/filtro-equipo';
import { leerFiltrosEquipo, hayFiltrosEquipo, coincideEquipo, opcionesFiltroEquipo } from '@/lib/informes/filtros-equipo';

export default async function PdiPage({ searchParams }: { searchParams: { colaboradorId?: string; area?: string; liderId?: string } }) {
  const perfil = await getPerfilActual();
  if (!perfil) return null;

  const supabase = createClient();

  // colaboradorId en la URL (llega, por ejemplo, del botón "Ver PDI" de
  // /espiral-crecimiento/dimensiones) filtra el tablero a una sola persona
  // — su plan de desarrollo vigente completo, sin importar de qué Ciclo de
  // Crecimiento salió cada acción, porque planes_desarrollo no está atado a
  // un ciclo en particular.
  const colaboradorIdFiltro = perfil.rol === 'colaborador' ? null : (searchParams.colaboradorId ?? null);

  let query = supabase
    .from('planes_desarrollo')
    .select(
      'id, brecha_detectada, accion, origen, estado, fecha_compromiso, generado_automaticamente, colaborador:colaborador_id(nombre_completo)'
    )
    .order('fecha_compromiso', { ascending: true });

  if (perfil.rol === 'colaborador' && perfil.colaborador_id) {
    query = query.eq('colaborador_id', perfil.colaborador_id);
  } else if (colaboradorIdFiltro) {
    query = query.eq('colaborador_id', colaboradorIdFiltro);
  }

  // Filtro por área y líder directo (informe de Luisa 4.15): solo los planes de esa gente.
  const filtrosEquipo = leerFiltrosEquipo(searchParams);
  const opcionesEquipo = perfil.rol === 'colaborador' ? { areas: [] as string[], lideres: [] as { id: string; nombre: string }[] } : await opcionesFiltroEquipo(perfil);
  if (hayFiltrosEquipo(filtrosEquipo) && perfil.rol !== 'colaborador') {
    const { data: gente } = await supabase
      .from('colaboradores')
      .select('id, lider_id, cargo:cargo_id(proceso_area)')
      .eq('empresa_id', perfil.empresa_id)
      .eq('es_externo', false);
    const ids = ((gente ?? []) as any[]).filter((c) => coincideEquipo(c, filtrosEquipo)).map((c) => c.id as string);
    query = query.in('colaborador_id', ids.length ? ids : ['00000000-0000-0000-0000-000000000000']);
  }

  const [{ data: planes }, { data: colaboradorFiltrado }] = await Promise.all([
    query,
    colaboradorIdFiltro
      ? supabase.from('colaboradores').select('nombre_completo').eq('id', colaboradorIdFiltro).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);
  const puedeArrastrar = perfil.rol !== 'gerencia';
  const nombreFiltrado = colaboradorFiltrado?.nombre_completo ?? null;

  return (
    <div className="space-y-6">
      {colaboradorIdFiltro && (
        <Link href="/espiral-crecimiento/dimensiones" className="inline-flex items-center gap-1 text-xs text-marmol-400 hover:text-marmol-600">
          <ArrowLeft size={12} /> Volver a Dimensiones
        </Link>
      )}
      <div className="flex items-start justify-between flex-wrap gap-2">
        <div>
          <h1 className="font-display text-2xl font-semibold text-secundario">
            {perfil.rol === 'colaborador'
              ? 'Mi Plan de Desarrollo'
              : colaboradorIdFiltro
                ? `Plan de Desarrollo${nombreFiltrado ? ` — ${nombreFiltrado}` : ''}`
                : 'Planes de Desarrollo Individual'}
          </h1>
          <p className="text-sm text-marmol-500 mt-1">
            El entregable central del Encuentro de Crecimiento: distingue si la brecha es de actitud, de
            formación o de alineación de talento.
          </p>
        </div>
        {colaboradorIdFiltro && (
          <Link
            href="/espiral-crecimiento/pdi"
            className="inline-flex items-center gap-1.5 rounded-lg border border-marmol-200 hover:border-flow-300 text-marmol-600 text-xs font-medium px-2.5 py-1.5 transition"
          >
            <X size={12} /> Ver de todos
          </Link>
        )}
      </div>

      {perfil.rol !== 'colaborador' && !colaboradorIdFiltro && (
        <FiltroEquipo
          rutaBase="/espiral-crecimiento/pdi"
          areas={opcionesEquipo.areas}
          lideres={opcionesEquipo.lideres}
          actuales={filtrosEquipo}
          conservar={{}}
          mostrarLider={perfil.rol !== 'lider'}
        />
      )}

      {!planes || planes.length === 0 ? (
        <EmptyState
          icon={Target}
          titulo="Sin planes de desarrollo registrados"
          descripcion="Se generan de forma asistida al cerrar cada Ciclo de Crecimiento, cruzando brechas de Hacer/Deber con Saber y Ser."
        />
      ) : (
        <PdiVista planes={planes as any} puedeArrastrar={puedeArrastrar} />
      )}
    </div>
  );
}
