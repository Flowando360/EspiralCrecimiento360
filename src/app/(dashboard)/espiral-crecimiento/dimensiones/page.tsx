import Link from 'next/link';
import { getPerfilActual } from '@/lib/supabase/get-perfil-actual';
import { FiltroTabla } from '@/components/ui/filtro-tabla';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { EmptyState } from '@/components/ui/empty-state';
import { SemaforoBadge } from '@/components/espiral-crecimiento/semaforo-badge';
import { LayoutGrid, Target } from 'lucide-react';
import type { SemaforoNivel } from '@/types/colaborador';
import { crearNormalizadorAreas } from '@/lib/areas';
import { obtenerUmbralAnonimato } from '@/lib/informes/anonimato';

// Mismos umbrales que ya usa el Informe de brechas por dimensión (ver
// informes/brechas/data.ts) — Saber y Ser no traen un semáforo propio
// calculado en la base de datos (a diferencia de Hacer/Deber, que sí lo
// traen listo en resultados_evaluacion), así que se deriva acá con el
// mismo criterio para que las cuatro columnas se lean de forma consistente.
function semaforo1a5(valor: number | null): SemaforoNivel | null {
  if (valor === null) return null;
  if (valor >= 4.0) return 'alto';
  if (valor >= 3.5) return 'medio';
  return 'bajo';
}

function semaforoPorcentaje(valor: number | null): SemaforoNivel | null {
  if (valor === null) return null;
  if (valor >= 90) return 'alto';
  if (valor >= 70) return 'medio';
  return 'bajo';
}

export default async function DimensionesPage({ searchParams }: { searchParams?: { critico?: string } }) {
  const perfil = await getPerfilActual();
  if (!perfil) return null;
  if (!['admin_th', 'lider', 'gerencia'].includes(perfil.rol)) redirect('/inicio');

  const supabase = createClient();

  // Mismo alcance que /espiral-crecimiento/colaboradores: admin_th y
  // gerencia ven toda la empresa, líder solo su equipo (+ a sí mismo).
  let colaboradoresQuery = supabase
    .from('colaboradores')
    .select('id, nombre_completo, estado, cargo:cargos(nombre, proceso_area)')
    .eq('empresa_id', perfil.empresa_id)
    .eq('es_externo', false)
    .order('nombre_completo');

  if (perfil.rol === 'lider' && perfil.colaborador_id) {
    colaboradoresQuery = colaboradoresQuery.or(`lider_id.eq.${perfil.colaborador_id},id.eq.${perfil.colaborador_id}`);
  }

  const { data: colaboradoresRaw } = await colaboradoresQuery;
  const colaboradores = colaboradoresRaw ?? [];
  const ids = colaboradores.map((c) => c.id);

  // Cada fuente ya trae, por su cuenta, el dato más reciente por
  // colaborador sin importar de qué Ciclo de Crecimiento vino — por eso
  // esta pantalla no pide seleccionar un período: resultados_evaluacion se
  // reduce acá abajo al más reciente por colaborador (puede haber varios
  // ciclos); v_saber_cumplimiento y v_ser_promedio ya son un solo valor
  // vigente por colaborador (ver comentario de esa vista).
  const [{ data: resultadosRaw }, { data: saberRaw }, { data: serRaw }] =
    ids.length > 0
      ? await Promise.all([
          supabase
            .from('resultados_evaluacion')
            .select('indice_hacer, indice_deber, semaforo_hacer, semaforo_deber, actualizado_en, evaluacion:evaluaciones!inner(colaborador_evaluado_id)')
            .in('evaluacion.colaborador_evaluado_id', ids)
            .order('actualizado_en', { ascending: false }),
          supabase.from('v_saber_cumplimiento').select('colaborador_id, porcentaje_cumplimiento').in('colaborador_id', ids),
          supabase.from('v_ser_promedio').select('colaborador_id, promedio_ser').in('colaborador_id', ids),
        ])
      : [{ data: [] }, { data: [] }, { data: [] }];

  const hacerDeberPorColaborador = new Map<string, { hacer: SemaforoNivel | null; deber: SemaforoNivel | null; indiceHacer: number | null; indiceDeber: number | null }>();
  for (const r of (resultadosRaw ?? []) as any[]) {
    const colaboradorId = r.evaluacion?.colaborador_evaluado_id;
    if (!colaboradorId || hacerDeberPorColaborador.has(colaboradorId)) continue; // ya vienen ordenados desc: el primero es el más reciente
    hacerDeberPorColaborador.set(colaboradorId, { hacer: r.semaforo_hacer, deber: r.semaforo_deber, indiceHacer: r.indice_hacer ?? null, indiceDeber: r.indice_deber ?? null });
  }

  const saberPorColaborador = new Map(
    ((saberRaw ?? []) as any[]).map((s) => [s.colaborador_id, s.porcentaje_cumplimiento as number | null])
  );
  const serPorColaborador = new Map(
    ((serRaw ?? []) as any[]).map((s) => [s.colaborador_id, s.promedio_ser as number | null])
  );

  // Filtro por estado y resumen por área (informe de Luisa 4.14).
  const umbral = await obtenerUmbralAnonimato(perfil.empresa_id);
  const soloCriticos = searchParams?.critico === '1';
  const esCritico = (id: string) => {
    const hd = hacerDeberPorColaborador.get(id);
    return hd?.hacer === 'bajo' || hd?.deber === 'bajo' || semaforoPorcentaje(saberPorColaborador.get(id) ?? null) === 'bajo';
  };
  const visibles = soloCriticos ? colaboradores.filter((c) => esCritico(c.id)) : colaboradores;

  const normalizarArea = crearNormalizadorAreas(colaboradores.map((c: any) => c.cargo?.proceso_area));
  const porArea = new Map<string, string[]>();
  for (const c of colaboradores as any[]) {
    const area = normalizarArea(c.cargo?.proceso_area) ?? 'Sin área asignada';
    porArea.set(area, [...(porArea.get(area) ?? []), c.id]);
  }
  const promedio = (v: number[]) => (v.length >= umbral ? Math.round((v.reduce((a, b) => a + b, 0) / v.length) * 100) / 100 : null);
  const resumenAreas = Array.from(porArea.entries())
    .map(([area, idsArea]) => ({
      area,
      personas: idsArea.length,
      hacer: promedio(idsArea.map((i) => hacerDeberPorColaborador.get(i)?.indiceHacer).filter((v): v is number => v != null)),
      deber: promedio(idsArea.map((i) => hacerDeberPorColaborador.get(i)?.indiceDeber).filter((v): v is number => v != null)),
      saber: promedio(idsArea.map((i) => saberPorColaborador.get(i)).filter((v): v is number => v != null)),
      criticos: idsArea.filter(esCritico).length,
    }))
    .sort((a, b) => a.area.localeCompare(b.area, 'es'));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-secundario">Dimensiones por colaborador</h1>
        <p className="text-sm text-marmol-500 mt-1">
          Estado vigente de Ser, Saber, Hacer y Deber de cada persona — siempre el dato más reciente
          disponible, sin importar de qué Ciclo de Crecimiento vino ni si ya cerró.
        </p>
      </div>

      {colaboradores.length > 0 && (
        <div className="card overflow-hidden overflow-x-auto">
          <div className="px-4 py-3 border-b border-marmol-200">
            <h2 className="font-display font-semibold text-secundario">Resumen por área</h2>
            <p className="text-xs text-marmol-400">Promedio de cada dimensión por área (Hacer y Deber de 1 a 5, Saber en %). Los grupos con menos de {umbral} personas con dato no muestran promedio, para proteger el anonimato. El Ser es descriptivo y no se promedia.</p>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-marmol-200 text-left text-xs uppercase tracking-wide text-marmol-400">
                <th className="px-4 py-2 font-medium">Área</th>
                <th className="px-4 py-2 font-medium">Personas</th>
                <th className="px-4 py-2 font-medium text-saber">Saber</th>
                <th className="px-4 py-2 font-medium text-hacer">Hacer</th>
                <th className="px-4 py-2 font-medium text-deber">Deber</th>
                <th className="px-4 py-2 font-medium">Con una dimensión en rojo</th>
              </tr>
            </thead>
            <tbody>
              {resumenAreas.map((a) => (
                <tr key={a.area} className="border-b border-marmol-100 last:border-0">
                  <td className="px-4 py-2 font-medium text-marmol-900">{a.area}</td>
                  <td className="px-4 py-2 text-marmol-600">{a.personas}</td>
                  <td className="px-4 py-2 text-marmol-600">{a.saber != null ? `${a.saber}%` : '—'}</td>
                  <td className="px-4 py-2 text-marmol-600">{a.hacer ?? '—'}</td>
                  <td className="px-4 py-2 text-marmol-600">{a.deber ?? '—'}</td>
                  <td className="px-4 py-2 text-marmol-600">{a.criticos}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex gap-2 text-sm">
        <Link href="/espiral-crecimiento/dimensiones" className={`rounded-full border px-3 py-1 ${!soloCriticos ? 'bg-flow-500 border-flow-500 text-white' : 'border-marmol-200 text-marmol-600'}`}>
          Todas las personas ({colaboradores.length})
        </Link>
        <Link href="/espiral-crecimiento/dimensiones?critico=1" className={`rounded-full border px-3 py-1 ${soloCriticos ? 'bg-flow-500 border-flow-500 text-white' : 'border-marmol-200 text-marmol-600'}`}>
          Con alguna dimensión en rojo ({colaboradores.filter((c) => esCritico(c.id)).length})
        </Link>
      </div>

      {colaboradores.length === 0 ? (
        <EmptyState icon={LayoutGrid} titulo="Sin colaboradores" descripcion="Todavía no hay nadie cargado en tu empresa." />
      ) : (
        <FiltroTabla columnas={['Cargo']} plural="personas" placeholder="Buscar persona…">
          <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-marmol-200 text-left text-xs uppercase tracking-wide text-marmol-400">
                <th className="px-4 py-3 font-medium">Nombre</th>
                <th className="px-4 py-3 font-medium">Cargo</th>
                <th className="px-4 py-3 font-medium text-ser">Ser</th>
                <th className="px-4 py-3 font-medium text-saber">Saber</th>
                <th className="px-4 py-3 font-medium text-hacer">Hacer</th>
                <th className="px-4 py-3 font-medium text-deber">Deber</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {visibles.map((c) => {
                const hacerDeber = hacerDeberPorColaborador.get(c.id);
                const saberPct = saberPorColaborador.get(c.id) ?? null;
                const serProm = serPorColaborador.get(c.id) ?? null;
                const cargo = c.cargo as { nombre: string } | null;

                return (
                  <tr key={c.id} className="border-b border-marmol-100 last:border-0 hover:bg-marmol-50">
                    <td className="px-4 py-3">
                      <Link
                        href={`/espiral-crecimiento/colaboradores/${c.id}`}
                        className="font-medium text-marmol-900 hover:text-flow-600"
                      >
                        {c.nombre_completo}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-marmol-600">{cargo?.nombre ?? '—'}</td>
                    <td className="px-4 py-3">
                      {/* El Ser se describe, no se califica: solo se indica si ya tiene Guía del Flow. */}
                      <span className="text-xs text-marmol-500">{serProm != null ? 'Guía aplicada' : 'Pendiente'}</span>
                    </td>
                    <td className="px-4 py-3">
                      <SemaforoBadge nivel={semaforoPorcentaje(saberPct)} />
                    </td>
                    <td className="px-4 py-3">
                      <SemaforoBadge nivel={hacerDeber?.hacer ?? null} />
                    </td>
                    <td className="px-4 py-3">
                      <SemaforoBadge nivel={hacerDeber?.deber ?? null} />
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/espiral-crecimiento/pdi?colaboradorId=${c.id}`}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-marmol-200 hover:border-flow-300 text-marmol-600 text-xs font-medium px-2.5 py-1.5 transition whitespace-nowrap"
                      >
                        <Target size={12} /> Ver PDI
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        </FiltroTabla>
      )}
    </div>
  );
}
