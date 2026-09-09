import Link from 'next/link';
import { getPerfilActual } from '@/lib/supabase/get-perfil-actual';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { EmptyState } from '@/components/ui/empty-state';
import { SemaforoBadge } from '@/components/espiral-crecimiento/semaforo-badge';
import { LayoutGrid, Target } from 'lucide-react';
import type { SemaforoNivel } from '@/types/colaborador';

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

export default async function DimensionesPage() {
  const perfil = await getPerfilActual();
  if (!perfil) return null;
  if (!['admin_th', 'lider', 'gerencia'].includes(perfil.rol)) redirect('/inicio');

  const supabase = createClient();

  // Mismo alcance que /espiral-crecimiento/colaboradores: admin_th y
  // gerencia ven toda la empresa, líder solo su equipo (+ a sí mismo).
  let colaboradoresQuery = supabase
    .from('colaboradores')
    .select('id, nombre_completo, estado, cargo:cargos(nombre)')
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
            .select('semaforo_hacer, semaforo_deber, actualizado_en, evaluacion:evaluaciones!inner(colaborador_evaluado_id)')
            .in('evaluacion.colaborador_evaluado_id', ids)
            .order('actualizado_en', { ascending: false }),
          supabase.from('v_saber_cumplimiento').select('colaborador_id, porcentaje_cumplimiento').in('colaborador_id', ids),
          supabase.from('v_ser_promedio').select('colaborador_id, promedio_ser').in('colaborador_id', ids),
        ])
      : [{ data: [] }, { data: [] }, { data: [] }];

  const hacerDeberPorColaborador = new Map<string, { hacer: SemaforoNivel | null; deber: SemaforoNivel | null }>();
  for (const r of (resultadosRaw ?? []) as any[]) {
    const colaboradorId = r.evaluacion?.colaborador_evaluado_id;
    if (!colaboradorId || hacerDeberPorColaborador.has(colaboradorId)) continue; // ya vienen ordenados desc: el primero es el más reciente
    hacerDeberPorColaborador.set(colaboradorId, { hacer: r.semaforo_hacer, deber: r.semaforo_deber });
  }

  const saberPorColaborador = new Map(
    ((saberRaw ?? []) as any[]).map((s) => [s.colaborador_id, s.porcentaje_cumplimiento as number | null])
  );
  const serPorColaborador = new Map(
    ((serRaw ?? []) as any[]).map((s) => [s.colaborador_id, s.promedio_ser as number | null])
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-secundario">Dimensiones por colaborador</h1>
        <p className="text-sm text-marmol-500 mt-1">
          Estado vigente de Ser, Saber, Hacer y Deber de cada persona — siempre el dato más reciente
          disponible, sin importar de qué Ciclo de Crecimiento vino ni si ya cerró.
        </p>
      </div>

      {colaboradores.length === 0 ? (
        <EmptyState icon={LayoutGrid} titulo="Sin colaboradores" descripcion="Todavía no hay nadie cargado en tu empresa." />
      ) : (
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
              {colaboradores.map((c) => {
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
                      <SemaforoBadge nivel={semaforo1a5(serProm)} />
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
      )}
    </div>
  );
}
